#!/usr/bin/env node
// Ruft Kalender-Termine aus Google Calendar und Apple/iCloud-Kalender ab
// (über private iCal-Adressen) und schreibt sie nach content/calendar-events.json.
// Wird per GitHub Actions regelmäßig aufgerufen, siehe
// .github/workflows/calendar-fetch.yml.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import ical from "node-ical";

const EVENTS_FILE = path.join(process.cwd(), "content", "calendar-events.json");

const GOOGLE_ICS_URL = process.env.ICS_GOOGLE_URL || "";
const APPLE_ICS_URL = process.env.ICS_APPLE_URL || "";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt.`);
  return value;
}

async function safely(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.log(`⚠ ${label}: ${err.message}`);
    return null;
  }
}

async function fetchAndParseICS(source, url) {
  if (!url) {
    console.log(`⚠ ICS-Adresse für ${source} nicht gesetzt (umwandeln webcal:// zu https://)`);
    return [];
  }

  const icsUrl = url.replace(/^webcal:\/\//, "https://");

  const res = await fetch(icsUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  const data = ical.parseICS(text);

  const events = [];
  for (const key in data) {
    const component = data[key];
    if (component.type === "VEVENT") {
      const start = component.start;
      const end = component.end;
      const allDay = !component.start.getHours && !component.start.getMinutes;

      events.push({
        quelle: source,
        titel: component.summary || "(Keine Beschreibung)",
        start: start?.toISOString?.() || start,
        ende: end?.toISOString?.() || end,
        ganztags: allDay,
        ort: component.location || null,
      });
    }
  }

  return events;
}

async function main() {
  console.log("Hole Kalender-Termine...");

  const googleEvents = await safely("Google Calendar", () =>
    fetchAndParseICS("google", GOOGLE_ICS_URL)
  );
  const appleEvents = await safely("Apple Calendar", () =>
    fetchAndParseICS("apple", APPLE_ICS_URL)
  );

  const allEvents = [...(googleEvents || []), ...(appleEvents || [])];

  // Duplikate nach (titel, start) entfernen (für den Fall dass beide
  // Kalender denselben Termin haben)
  const seen = new Set();
  const unique = [];
  for (const evt of allEvents) {
    const key = `${evt.titel}|${evt.start}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(evt);
    }
  }

  // Nach Startdatum sortieren
  unique.sort((a, b) => new Date(a.start) - new Date(b.start));

  const result = {
    updated_at: new Date().toISOString(),
    events: unique,
  };

  await writeFile(EVENTS_FILE, JSON.stringify(result, null, 2));
  console.log(`✓ Kalender-Termine geschrieben: ${EVENTS_FILE} (${unique.length} Einträge)`);
}

main().catch((err) => {
  console.error("Kritischer Fehler:", err.message);
  process.exit(1);
});
