#!/usr/bin/env node
// Prüft gesendete Gmail-Mails auf neue Akquise-Anschreiben (Erstkontakt an
// eine noch nicht erfasste Firma) und legt dafür automatisch eine neue
// Erinnerung in der Apple/iCloud-Reminders-Liste "Angeschrieben" an (per
// CalDAV). Wird per GitHub Actions regelmäßig aufgerufen, siehe
// .github/workflows/akquise-gmail-sync.yml.
//
// Absichtlich nur "neu angeschrieben -> Erinnerung anlegen". Das Verschieben
// zwischen "Angeschrieben" / "In Kontakt" / "Abgelehnt" bleibt manuell in der
// Reminders-App, weil das zuverlässige Erkennen von Antworten/Absagen aus
// E-Mail-Inhalten nicht automatisch entschieden werden kann.

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

const LIST_ANGESCHRIEBEN = process.env.ICLOUD_LIST_ANGESCHRIEBEN || "Angeschrieben";
const LIST_IN_KONTAKT = process.env.ICLOUD_LIST_IN_KONTAKT || "In Kontakt";
const LIST_ABGELEHNT = process.env.ICLOUD_LIST_ABGELEHNT || "Abgelehnt";

// Private/Freemail-Domains, die nicht als "Firma" gezählt werden sollen.
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
    return { last_checked: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), processed_message_ids: [] };
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
  const list = calendars.find((c) => c.displayName === displayName);
  if (!list) {
    throw new Error(`Reminders-Liste "${displayName}" wurde in iCloud nicht gefunden.`);
  }
  return list;
}

// Sammelt alle bereits bekannten E-Mail-Adressen aus den Notizen der
// bestehenden Erinnerungen in allen drei Listen, um Duplikate zu vermeiden.
async function collectKnownEmails(client, lists) {
  const known = new Set();
  for (const list of lists) {
    const objects = await client.fetchCalendarObjects({ calendar: list });
    for (const obj of objects) {
      try {
        const parsed = ical.parseICS(obj.data);
        for (const key in parsed) {
          const component = parsed[key];
          if (component.type !== "VTODO") continue;
          const description = component.description || "";
          const match = description.match(/E-Mail:\s*([^\s\\]+@[^\s\\]+)/i);
          if (match) known.add(match[1].toLowerCase());
        }
      } catch (err) {
        console.log(`⚠ Konnte Erinnerung nicht parsen: ${err.message}`);
      }
    }
  }
  return known;
}

async function main() {
  console.log("Prüfe gesendete Gmail-Mails auf neue Akquise-Kontakte...");

  const state = await loadState();
  const processedIds = new Set(state.processed_message_ids);
  const gmail = getGmailClient();

  const profile = await gmail.users.getProfile({ userId: "me" });
  const ownEmail = profile.data.emailAddress.toLowerCase();

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: "in:sent",
    maxResults: 30,
  });

  const messages = listRes.data.messages || [];
  const newMessages = [];
  for (const m of messages) {
    if (!processedIds.has(m.id)) newMessages.push(m);
  }

  if (newMessages.length === 0) {
    console.log("Keine neuen gesendeten Mails seit dem letzten Lauf.");
    state.last_checked = new Date().toISOString();
    await saveState(state);
    return;
  }

  const davClient = await getDAVClient();
  const angeschriebenList = await findList(davClient, LIST_ANGESCHRIEBEN);
  const allLists = [
    angeschriebenList,
    await findList(davClient, LIST_IN_KONTAKT),
    await findList(davClient, LIST_ABGELEHNT),
  ];
  const knownEmails = await collectKnownEmails(davClient, allLists);

  let created = 0;
  for (const m of newMessages) {
    processedIds.add(m.id);

    const full = await gmail.users.messages.get({
      userId: "me",
      id: m.id,
      format: "metadata",
      metadataHeaders: ["To", "From", "Date", "In-Reply-To", "References"],
    });
    const headers = full.data.payload.headers || [];

    // Antworten innerhalb eines bestehenden Threads sind kein Erstkontakt.
    if (getHeader(headers, "In-Reply-To") || getHeader(headers, "References")) continue;

    const toHeader = getHeader(headers, "To");
    if (!toHeader) continue;

    for (const recipient of parseRecipients(toHeader)) {
      const domain = recipient.email.split("@")[1];
      if (!domain || FREEMAIL_DOMAINS.has(domain)) continue;
      if (recipient.email === ownEmail) continue;
      if (knownEmails.has(recipient.email)) continue;

      const company = companyNameFor(recipient);
      const dateHeader = getHeader(headers, "Date");
      const sentDate = dateHeader ? new Date(dateHeader) : new Date();
      const description = [
        `E-Mail: ${recipient.email}`,
        `Zuerst kontaktiert am ${sentDate.toLocaleDateString("de-DE")}`,
        "Automatisch angelegt aus gesendeter Gmail-Mail.",
      ].join("\n");

      const uid = crypto.randomUUID();
      await davClient.createCalendarObject({
        calendar: angeschriebenList,
        filename: `${uid}.ics`,
        iCalString: buildReminderICS({ uid, summary: company, description }),
      });

      knownEmails.add(recipient.email);
      created++;
      console.log(`✓ Neue Erinnerung angelegt: ${company} (${recipient.email})`);
    }
  }

  state.processed_message_ids = Array.from(processedIds);
  state.last_checked = new Date().toISOString();
  await saveState(state);

  console.log(`Fertig. ${created} neue Erinnerung(en) angelegt, ${newMessages.length} Mail(s) geprüft.`);
}

main().catch((err) => {
  console.error("Kritischer Fehler:", err.message);
  process.exit(1);
});
