#!/usr/bin/env node
// Prüft gesendete Gmail-Mails auf die Labels "Firmen-Anfragen",
// "Firmen-Anfragen/In_Kontakt" und "Firmen-Anfragen/Abgelehnt" und pflegt
// daraus automatisch Einträge in content/akquise/ (dieselbe Sammlung, die
// im CMS unter "🤝 Akquise-Tracking" und im Business-Dashboard unter
// "Akquise" angezeigt wird, siehe admin/config.yml).
//
// Ursprünglich sollte das direkt in Apple/iCloud Reminders schreiben (per
// CalDAV) - iCloud liefert für den genutzten Account darüber aber keine
// Reminders-Inhalte zurück (0 Objekte trotz vorhandener Einträge, wegen
// aktiviertem "Erweiterter Datenschutz"), daher dieser Weg über das ohnehin
// vorhandene Akquise-Tracking im Dashboard.
//
//  - Mail mit Label "Firmen-Anfragen" gesendet, Firma noch nicht erfasst
//    -> neuer Akquise-Eintrag mit Status "Kontaktiert"
//  - Mail zusätzlich mit Label "Firmen-Anfragen/In_Kontakt" gesendet
//    -> bestehender Eintrag bekommt antwort_status "Positiv" + antwort_am
//       gesetzt + Notiz-Zeile (bzw. wird neu angelegt, falls noch nicht
//       erfasst)
//  - Mail mit Label "Firmen-Anfragen/Abgelehnt" gesendet
//    -> Eintrag bekommt Status "Verworfen" + antwort_status "Absage"
//
// Wird per GitHub Actions regelmäßig aufgerufen, siehe
// .github/workflows/akquise-gmail-sync.yml.

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
const GMAIL_LABEL_ABGELEHNT = process.env.GMAIL_LABEL_ABGELEHNT || "Firmen-Anfragen/Abgelehnt";

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
    const parsed = JSON.parse(raw);
    return { message_actions: parsed.message_actions || {} };
  } catch {
    return { message_actions: {} };
  }
}

async function saveState(state) {
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  // Abgeschlossene ("terminal", siehe main()) Einträge nicht unbegrenzt
  // anhäufen lassen - nur die letzten 2000 behalten.
  const ids = Object.keys(state.message_actions);
  if (ids.length > 2000) {
    const toDrop = ids.slice(0, ids.length - 2000);
    for (const id of toDrop) delete state.message_actions[id];
  }
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
// '"Firma Mustermann" <kontakt@firma.de>, andere@firma2.de'. Eine einzige
// "alles frisst"-RegEx für beide Fälle (mit/ohne Anzeigename) ist hier
// bewusst vermieden: bei einer nackten Adresse ohne "<...>" führt ein
// gieriges Namens-Capture-Group sonst dazu, dass fast der komplette
// Adress-Anfang fälschlich als "Name" verschluckt wird und nur noch das
// letzte Zeichen vor dem "@" als E-Mail übrig bleibt.
function parseRecipients(headerValue) {
  const parts = headerValue.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  const recipients = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;

    const withName = part.match(/^"?([^"<]*)"?\s*<([^<>]+)>$/);
    if (withName) {
      const [, name, email] = withName;
      if (email.includes("@")) {
        recipients.push({ name: name.trim(), email: email.trim().toLowerCase() });
      }
      continue;
    }

    // Keine spitzen Klammern -> nackte Adresse ohne Anzeigename.
    const bare = part.replace(/^"|"$/g, "").trim();
    if (bare.includes("@")) {
      recipients.push({ name: "", email: bare.toLowerCase() });
    }
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
  const gmail = getGmailClient();

  const profile = await gmail.users.getProfile({ userId: "me" });
  const ownEmail = profile.data.emailAddress.toLowerCase();

  const labelMap = await getLabelIdMap(gmail);
  const anfrageLabelId = labelMap.get(GMAIL_LABEL_ANFRAGE);
  const inKontaktLabelId = labelMap.get(GMAIL_LABEL_IN_KONTAKT);
  const abgelehntLabelId = labelMap.get(GMAIL_LABEL_ABGELEHNT);
  if (!anfrageLabelId) throw new Error(`Gmail-Label "${GMAIL_LABEL_ANFRAGE}" wurde nicht gefunden.`);
  if (!inKontaktLabelId) throw new Error(`Gmail-Label "${GMAIL_LABEL_IN_KONTAKT}" wurde nicht gefunden.`);
  if (!abgelehntLabelId) throw new Error(`Gmail-Label "${GMAIL_LABEL_ABGELEHNT}" wurde nicht gefunden.`);

  // Alle Seiten abholen statt nur die neuesten - sonst werden ältere
  // gelabelte Mails nie erreicht, weil sie hinter neueren "verschwinden".
  const messages = [];
  let pageToken;
  do {
    // Kein "in:sent"-Filter: "Firmen-Anfragen" markierst du an einer
    // gesendeten Mail, "Abgelehnt" aber typischerweise an der eingehenden
    // Absage-Antwort der Firma - beide Richtungen müssen erfasst werden.
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: `(label:"${GMAIL_LABEL_ANFRAGE}" OR label:"${GMAIL_LABEL_IN_KONTAKT}" OR label:"${GMAIL_LABEL_ABGELEHNT}")`,
      maxResults: 100,
      pageToken,
    });
    messages.push(...(listRes.data.messages || []));
    pageToken = listRes.data.nextPageToken;
  } while (pageToken);

  // "Terminal" = Abgelehnt-Aktion schon ausgeführt - eine Absage wird
  // erfahrungsgemäß nicht zurückgenommen, daher muss diese Mail nicht mehr
  // erneut abgefragt werden. Alle anderen Mails werden JEDES Mal neu
  // geprüft (nicht nur beim ersten Mal), weil ein Label wie "In_Kontakt"
  // oder "Abgelehnt" oft nachträglich auf eine bereits bekannte Mail
  // gesetzt wird, statt in einer neuen Mail zu erscheinen.
  const toCheck = messages.filter((m) => !state.message_actions[m.id]?.abgelehnt);

  if (toCheck.length === 0) {
    console.log("Keine offenen Mails mit Akquise-Label zu prüfen.");
    await saveState(state);
    return;
  }

  const entries = await loadAkquiseEntries();
  let created = 0;
  let updated = 0;

  for (const m of toCheck) {
    const done = state.message_actions[m.id] || { anfrage: false, in_kontakt: false, abgelehnt: false };

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
    const hasAbgelehntLabel = labelIds.includes(abgelehntLabelId);

    // Bei einer gesendeten Mail zählt die Empfänger-Adresse (To) als Firma,
    // bei einer eingegangenen Mail (z.B. die Absage der Firma) die
    // Absender-Adresse (From).
    const isSent = labelIds.includes("SENT");
    const relevantHeader = getHeader(headers, isSent ? "To" : "From");
    if (!relevantHeader) {
      state.message_actions[m.id] = done;
      continue;
    }

    const dateHeader = getHeader(headers, "Date");
    const eventDate = dateHeader ? new Date(dateHeader) : new Date();

    for (const recipient of parseRecipients(relevantHeader)) {
      const domain = recipient.email.split("@")[1];
      if (!domain || FREEMAIL_DOMAINS.has(domain)) continue;
      if (recipient.email === ownEmail) continue;

      const company = companyNameFor(recipient);
      const slug = slugify(company);
      const existing = entries.get(slug);

      const blankEntry = () => ({
        firma: company,
        status: "Kontaktiert",
        quelle: "Automatisch vorgeschlagen",
        angeschrieben_am: isoDate(eventDate),
        antwort_status: "—",
        notiz: `Automatisch angelegt aus gesendeter Gmail-Mail. E-Mail: ${recipient.email}`,
      });

      if (hasAbgelehntLabel && !done.abgelehnt) {
        const entry = existing || blankEntry();
        entry.status = "Verworfen";
        entry.antwort_status = "Absage";
        entry.antwort_am = isoDate(eventDate);
        entry.notiz = `${entry.notiz}\nAbgelehnt am ${eventDate.toLocaleDateString("de-DE")} (automatisch per Gmail-Label "${GMAIL_LABEL_ABGELEHNT}").`;
        await writeAkquiseEntry(slug, entry);
        entries.set(slug, entry);
        if (existing) updated++; else created++;
        done.abgelehnt = true;
        console.log(`✓ Abgelehnt: ${company} (${recipient.email})`);
        continue;
      }

      if (hasInKontaktLabel && !done.in_kontakt) {
        const entry = existing || blankEntry();
        entry.antwort_status = "Positiv";
        entry.antwort_am = isoDate(eventDate);
        entry.notiz = `${entry.notiz}\nIm Kontakt seit ${eventDate.toLocaleDateString("de-DE")} (automatisch per Gmail-Label "${GMAIL_LABEL_IN_KONTAKT}").`;
        await writeAkquiseEntry(slug, entry);
        entries.set(slug, entry);
        if (existing) updated++; else created++;
        done.in_kontakt = true;
        console.log(`✓ In Kontakt: ${company} (${recipient.email})`);
        continue;
      }

      if (hasAnfrageLabel && !done.anfrage) {
        done.anfrage = true;
        if (existing) continue; // schon erfasst

        const entry = blankEntry();
        entry.notiz = `Automatisch angelegt aus gesendeter Gmail-Mail (Label "${GMAIL_LABEL_ANFRAGE}"). E-Mail: ${recipient.email}`;
        await writeAkquiseEntry(slug, entry);
        entries.set(slug, entry);
        created++;
        console.log(`✓ Neuer Akquise-Eintrag: ${company} (${recipient.email})`);
      }
    }

    state.message_actions[m.id] = done;
  }

  await saveState(state);

  console.log(`Fertig. ${created} neue(r) Eintrag/Einträge, ${updated} aktualisiert, ${toCheck.length} Mail(s) geprüft.`);
}

main().catch((err) => {
  console.error("Kritischer Fehler:", err.message);
  process.exit(1);
});
