#!/usr/bin/env node
// Prüft gesendete Gmail-Mails auf die Labels "Firmen-Anfragen" und
// "In_Kontakt" und gleicht das mit den Apple/iCloud-Reminders-Listen für die
// Akquise ab (per CalDAV):
//
//  - Mail trägt "Firmen-Anfragen" (Erstkontakt) -> neue Erinnerung in der
//    Liste "Anfrage" anlegen, falls die Firma noch nicht bekannt ist.
//  - Mail trägt zusätzlich "In_Kontakt" -> die Erinnerung von "Anfrage" nach
//    "In Kontakt" verschieben (bzw. direkt dort anlegen, falls noch nicht
//    bekannt).
//
// "Kunden Ablehnung" bleibt bewusst manuell, dafür gibt es kein Gmail-Label -
// eine Absage lässt sich aus einer E-Mail nicht zuverlässig automatisch
// erkennen. Wird per GitHub Actions regelmäßig aufgerufen, siehe
// .github/workflows/akquise-gmail-sync.yml.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { google } from "googleapis";
import { createDAVClient } from "tsdav";
import ical from "node-ical";

const STATE_FILE = path.join(process.cwd(), "content", "akquise-gmail-sync-state.json");

const GMAIL_CLIENT_ID = requireEnv("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = requireEnv("GMAIL_CLIENT_SECRET");
const GMAIL_REFRESH_TOKEN = requireEnv("GMAIL_REFRESH_TOKEN");

const ICLOUD_APPLE_ID = requireEnv("ICLOUD_APPLE_ID");
const ICLOUD_APP_PASSWORD = requireEnv("ICLOUD_APP_PASSWORD");

const LIST_ANFRAGE = process.env.ICLOUD_LIST_ANFRAGE || "Anfrage";
const LIST_IN_KONTAKT = process.env.ICLOUD_LIST_IN_KONTAKT || "In Kontakt";

const GMAIL_LABEL_ANFRAGE = process.env.GMAIL_LABEL_ANFRAGE || "Firmen-Anfragen";
// Gmail benennt ein Unterlabel intern als "Elternlabel/Kindlabel" - "In_Kontakt"
// hängt in Gmail unter "Firmen-Anfragen", heißt über die API also so.
const GMAIL_LABEL_IN_KONTAKT = process.env.GMAIL_LABEL_IN_KONTAKT || "Firmen-Anfragen/In_Kontakt";

// Private/Freemail-Domains, die nicht als "Firma" gezählt werden sollen
// (z.B. falls eine private Adresse versehentlich im To/Cc mit auftaucht).
const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "gmx.de", "gmx.net", "gmx.at", "gmx.ch",
  "web.de", "outlook.com", "outlook.de", "hotmail.com", "hotmail.de",
  "live.com", "yahoo.com", "yahoo.de", "icloud.com", "me.com", "mac.com",
  "t-online.de", "freenet.de", "aol.com", "posteo.de", "protonmail.com",
]);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt.`);
  return value;
}

async function loadState() {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { processed_message_ids: [] };
  }
}

async function saveState(state) {
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  // Nur die letzten 2000 IDs behalten, damit die Datei nicht unbegrenzt wächst.
  state.processed_message_ids = state.processed_message_ids.slice(-2000);
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function getGmailClient() {
  const oAuth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth: oAuth2Client });
}

function getHeader(headers, name) {
  const h = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

// Extrahiert Name+Adresse aus einem "To"-Header wie
// '"Firma Mustermann" <kontakt@firma.de>, andere@firma2.de'.
function parseRecipients(headerValue) {
  const parts = headerValue.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  const recipients = [];
  for (const part of parts) {
    const match = part.match(/^\s*"?([^"<]*)"?\s*<?([^\s<>]+@[^\s<>]+?)>?\s*$/);
    if (!match) continue;
    const [, name, email] = match;
    recipients.push({ name: name.trim(), email: email.trim().toLowerCase() });
  }
  return recipients;
}

function companyNameFor({ name, email }) {
  if (name) return name;
  const domain = email.split("@")[1] || email;
  const base = domain.split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function icsEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildReminderICS({ uid, summary, description }) {
  const now = formatICSDate(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Webdesign Ehmann//Akquise Gmail Sync//DE",
    "BEGIN:VTODO",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `CREATED:${now}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "STATUS:NEEDS-ACTION",
    "END:VTODO",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

async function getDAVClient() {
  return createDAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: { username: ICLOUD_APPLE_ID, password: ICLOUD_APP_PASSWORD },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
}

async function findList(client, displayName) {
  const calendars = await client.fetchCalendars();
  const list = calendars.find((c) => (c.displayName || "").trim() === displayName.trim());
  if (!list) {
    const available = calendars
      .map((c) => `"${c.displayName}" (components: ${JSON.stringify(c.components)})`)
      .join(", ");
    throw new Error(
      `Reminders-Liste "${displayName}" wurde in iCloud nicht gefunden. Verfügbare Listen: ${available || "(keine)"}`
    );
  }
  return list;
}

function extractEmail(description) {
  const match = (description || "").match(/E-Mail:\s*([^\s\\]+@[^\s\\]+)/i);
  return match ? match[1].toLowerCase() : null;
}

// Baut einen Index E-Mail-Adresse -> { list, url, etag, summary, description }
// über alle übergebenen Reminders-Listen, um Duplikate zu vermeiden und beim
// Verschieben das richtige Objekt zu finden.
async function buildEmailIndex(client, lists) {
  const index = new Map();
  for (const list of lists) {
    const objects = await client.fetchCalendarObjects({ calendar: list });
    for (const obj of objects) {
      try {
        const parsed = ical.parseICS(obj.data);
        for (const key in parsed) {
          const component = parsed[key];
          if (component.type !== "VTODO") continue;
          const email = extractEmail(component.description);
          if (!email) continue;
          index.set(email, {
            list,
            url: obj.url,
            etag: obj.etag,
            summary: component.summary,
            description: component.description,
          });
        }
      } catch (err) {
        console.log(`⚠ Konnte Erinnerung nicht parsen: ${err.message}`);
      }
    }
  }
  return index;
}

async function createReminder(client, list, { summary, description }) {
  const uid = crypto.randomUUID();
  await client.createCalendarObject({
    calendar: list,
    filename: `${uid}.ics`,
    iCalString: buildReminderICS({ uid, summary, description }),
  });
}

async function getLabelIdMap(gmail) {
  const res = await gmail.users.labels.list({ userId: "me" });
  const map = new Map();
  for (const label of res.data.labels || []) map.set(label.name, label.id);
  return map;
}

async function main() {
  console.log("Prüfe gesendete Gmail-Mails auf Akquise-Labels...");

  const state = await loadState();
  const processedIds = new Set(state.processed_message_ids);
  const gmail = getGmailClient();

  const profile = await gmail.users.getProfile({ userId: "me" });
  const ownEmail = profile.data.emailAddress.toLowerCase();

  const labelMap = await getLabelIdMap(gmail);
  const anfrageLabelId = labelMap.get(GMAIL_LABEL_ANFRAGE);
  const inKontaktLabelId = labelMap.get(GMAIL_LABEL_IN_KONTAKT);
  if (!anfrageLabelId) throw new Error(`Gmail-Label "${GMAIL_LABEL_ANFRAGE}" wurde nicht gefunden.`);
  if (!inKontaktLabelId) throw new Error(`Gmail-Label "${GMAIL_LABEL_IN_KONTAKT}" wurde nicht gefunden.`);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: `in:sent (label:"${GMAIL_LABEL_ANFRAGE}" OR label:"${GMAIL_LABEL_IN_KONTAKT}")`,
    maxResults: 30,
  });

  const messages = listRes.data.messages || [];
  const newMessages = messages.filter((m) => !processedIds.has(m.id));

  if (newMessages.length === 0) {
    console.log("Keine neuen gesendeten Mails mit Akquise-Label seit dem letzten Lauf.");
    await saveState(state);
    return;
  }

  const davClient = await getDAVClient();
  const anfrageList = await findList(davClient, LIST_ANFRAGE);
  const inKontaktList = await findList(davClient, LIST_IN_KONTAKT);
  const emailIndex = await buildEmailIndex(davClient, [anfrageList, inKontaktList]);

  let created = 0;
  let moved = 0;

  for (const m of newMessages) {
    processedIds.add(m.id);

    const full = await gmail.users.messages.get({
      userId: "me",
      id: m.id,
      format: "metadata",
      metadataHeaders: ["To", "From", "Date"],
    });
    const headers = full.data.payload.headers || [];
    const labelIds = full.data.labelIds || [];
    const hasAnfrageLabel = labelIds.includes(anfrageLabelId);
    const hasInKontaktLabel = labelIds.includes(inKontaktLabelId);

    const toHeader = getHeader(headers, "To");
    if (!toHeader) continue;

    const dateHeader = getHeader(headers, "Date");
    const eventDate = dateHeader ? new Date(dateHeader) : new Date();

    for (const recipient of parseRecipients(toHeader)) {
      const domain = recipient.email.split("@")[1];
      if (!domain || FREEMAIL_DOMAINS.has(domain)) continue;
      if (recipient.email === ownEmail) continue;

      const existing = emailIndex.get(recipient.email);

      if (hasInKontaktLabel) {
        if (existing && existing.list.displayName === LIST_IN_KONTAKT) continue; // schon dort

        const company = existing ? existing.summary : companyNameFor(recipient);
        const description = [
          `E-Mail: ${recipient.email}`,
          existing ? existing.description.replace(/\\n/g, "\n") : `Zuerst kontaktiert am ${eventDate.toLocaleDateString("de-DE")}`,
          `In Kontakt seit ${eventDate.toLocaleDateString("de-DE")} (automatisch per Gmail-Label "${GMAIL_LABEL_IN_KONTAKT}").`,
        ].join("\n");

        if (existing) {
          await davClient.deleteCalendarObject({ calendarObject: { url: existing.url, etag: existing.etag } });
        }
        await createReminder(davClient, inKontaktList, { summary: company, description });
        emailIndex.set(recipient.email, { list: inKontaktList, summary: company, description });
        moved++;
        console.log(`✓ Nach "${LIST_IN_KONTAKT}" verschoben: ${company} (${recipient.email})`);
        continue;
      }

      if (hasAnfrageLabel) {
        if (existing) continue; // schon irgendwo erfasst

        const company = companyNameFor(recipient);
        const description = [
          `E-Mail: ${recipient.email}`,
          `Zuerst kontaktiert am ${eventDate.toLocaleDateString("de-DE")}`,
          `Automatisch angelegt aus gesendeter Gmail-Mail (Label "${GMAIL_LABEL_ANFRAGE}").`,
        ].join("\n");

        await createReminder(davClient, anfrageList, { summary: company, description });
        emailIndex.set(recipient.email, { list: anfrageList, summary: company, description });
        created++;
        console.log(`✓ Neue Erinnerung angelegt: ${company} (${recipient.email})`);
      }
    }
  }

  state.processed_message_ids = Array.from(processedIds);
  await saveState(state);

  console.log(`Fertig. ${created} neue Erinnerung(en), ${moved} verschoben, ${newMessages.length} Mail(s) geprüft.`);
}

main().catch((err) => {
  console.error("Kritischer Fehler:", err.message);
  process.exit(1);
});
