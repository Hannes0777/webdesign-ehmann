#!/usr/bin/env node
// Prüft gesendete Gmail-Mails auf die Labels "Firmen-Anfragen" und
// "Firmen-Anfragen/In_Kontakt" und pflegt daraus automatisch Einträge in
// content/akquise/ (dieselbe Sammlung, die im CMS unter "🤝
// Akquise-Tracking" und im Business-Dashboard unter "Akquise" angezeigt
// wird, siehe admin/config.yml).
//
// Ursprünglich sollte das direkt in Apple/iCloud Reminders schreiben (per
// CalDAV) - iCloud liefert für den genutzten Account darüber aber keine
// Reminders-Inhalte zurück (0 Objekte trotz vorhandener Einträge, vermutlich
// wegen "Erweiterter Datenschutz"), daher dieser Weg über das ohnehin
// vorhandene Akquise-Tracking im Dashboard.
//
//  - Mail mit Label "Firmen-Anfragen" gesendet, Firma noch nicht erfasst
//    -> neuer Akquise-Eintrag mit Status "Kontaktiert"
//  - Mail zusätzlich mit Label "Firmen-Anfragen/In_Kontakt" gesendet
//    -> bestehender Eintrag bekommt "antwort_am" gesetzt + Notiz-Zeile
//       (bzw. wird neu angelegt, falls noch nicht erfasst)
//
// "Verworfen" (Absage) bleibt bewusst manuell - dafür gibt es kein
// Gmail-Label, und ob eine Antwort eine Absage ist, lässt sich aus dem
// Mailtext nicht zuverlässig automatisch entscheiden. Wird per GitHub
// Actions regelmäßig aufgerufen, siehe .github/workflows/akquise-gmail-sync.yml.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const STATE_FILE = path.join(process.cwd(), "content", "akquise-gmail-sync-state.json");
const AKQUISE_DIR = path.join(process.cwd(), "content", "akquise");

const GMAIL_CLIENT_ID = requireEnv("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = requireEnv("GMAIL_CLIENT_SECRET");
const GMAIL_REFRESH_TOKEN = requireEnv("GMAIL_REFRESH_TOKEN");

const GMAIL_LABEL_ANFRAGE = process.env.GMAIL_LABEL_ANFRAGE || "Firmen-Anfragen";
// Gmail benennt ein Unterlabel intern als "Elternlabel/Kindlabel".
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

// Entspricht dem Standard-Slugify von Sveltia CMS für das Feld "firma"
// (slug: "{{firma}}" in admin/config.yml), damit Dateinamen zusammenpassen.
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // Umlaute/Akzente entfernen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "firma";
}

async function loadAkquiseEntries() {
  await mkdir(AKQUISE_DIR, { recursive: true });
  const files = (await readdir(AKQUISE_DIR)).filter((f) => f.endsWith(".json"));
  const entries = new Map();
  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(path.join(AKQUISE_DIR, file), "utf8"));
      entries.set(file.replace(/\.json$/, ""), data);
    } catch (err) {
      console.log(`⚠ Konnte ${file} nicht lesen: ${err.message}`);
    }
  }
  return entries;
}

async function writeAkquiseEntry(slug, data) {
  await writeFile(path.join(AKQUISE_DIR, `${slug}.json`), JSON.stringify(data, null, 2) + "\n");
}

function isoDate(date) {
  return date.toISOString().split(".")[0] + "Z";
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

  const entries = await loadAkquiseEntries();
  let created = 0;
  let updated = 0;

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

      const company = companyNameFor(recipient);
      const slug = slugify(company);
      const existing = entries.get(slug);

      if (hasInKontaktLabel) {
        const entry = existing || {
          firma: company,
          status: "Kontaktiert",
          quelle: "Automatisch vorgeschlagen",
          angeschrieben_am: isoDate(eventDate),
          antwort_status: "—",
          notiz: `Automatisch angelegt aus gesendeter Gmail-Mail. E-Mail: ${recipient.email}`,
        };
        entry.antwort_am = isoDate(eventDate);
        entry.notiz = `${entry.notiz}\nIm Kontakt seit ${eventDate.toLocaleDateString("de-DE")} (automatisch per Gmail-Label "${GMAIL_LABEL_IN_KONTAKT}").`;
        await writeAkquiseEntry(slug, entry);
        entries.set(slug, entry);
        if (existing) updated++; else created++;
        console.log(`✓ In Kontakt: ${company} (${recipient.email})`);
        continue;
      }

      if (hasAnfrageLabel) {
        if (existing) continue; // schon erfasst

        const entry = {
          firma: company,
          status: "Kontaktiert",
          quelle: "Automatisch vorgeschlagen",
          angeschrieben_am: isoDate(eventDate),
          antwort_status: "—",
          notiz: `Automatisch angelegt aus gesendeter Gmail-Mail (Label "${GMAIL_LABEL_ANFRAGE}"). E-Mail: ${recipient.email}`,
        };
        await writeAkquiseEntry(slug, entry);
        entries.set(slug, entry);
        created++;
        console.log(`✓ Neuer Akquise-Eintrag: ${company} (${recipient.email})`);
      }
    }
  }

  state.processed_message_ids = Array.from(processedIds);
  await saveState(state);

  console.log(`Fertig. ${created} neue(r) Eintrag/Einträge, ${updated} aktualisiert, ${newMessages.length} Mail(s) geprüft.`);
}

main().catch((err) => {
  console.error("Kritischer Fehler:", err.message);
  process.exit(1);
});
