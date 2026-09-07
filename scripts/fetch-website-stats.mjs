#!/usr/bin/env node
// Ruft Website-Statistiken aus Cloudflare Web Analytics ab und schreibt sie
// nach content/website-stats.json. Wird per GitHub Actions regelmäßig aufgerufen,
// siehe .github/workflows/website-stats-fetch.yml.
//
// Cloudflare GraphQL Analytics API wird abgefragt für Seiten-Aufrufe (pageviews)
// und Besucher (unique visits) über die letzten 30 Tage.

import { writeFile } from "node:fs/promises";
import path from "node:path";

const STATS_FILE = path.join(process.cwd(), "content", "website-stats.json");
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4/graphql";

const API_TOKEN = requireEnv("CLOUDFLARE_API_TOKEN");
const ZONE_ID = requireEnv("CLOUDFLARE_ZONE_ID");

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

async function fetchWebsiteStats() {
  const query = `
    query {
      viewer {
        zones(filter: { zoneTag: "${ZONE_ID}" }) {
          httpRequestsAdaptiveGroups(
            limit: 30
            filter: { date_geq: "2026-08-08", date_leq: "2026-09-07" }
          ) {
            dimensions {
              date
            }
            sum {
              pageViews
              visits
            }
          }
        }
      }
    }
  `;

  const res = await fetch(CLOUDFLARE_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || `HTTP ${res.status}`);
  }

  const zone = json.data?.viewer?.zones?.[0];
  if (!zone) throw new Error("Zone nicht in der Antwort.");

  const groups = zone.httpRequestsAdaptiveGroups || [];
  const daily = groups.map((g) => ({
    date: g.dimensions.date,
    visits: g.sum.visits || 0,
    pageviews: g.sum.pageViews || 0,
  }));

  const totals = daily.reduce(
    (acc, d) => ({
      visits: acc.visits + (d.visits || 0),
      pageviews: acc.pageviews + (d.pageviews || 0),
    }),
    { visits: 0, pageviews: 0 }
  );

  return {
    updated_at: new Date().toISOString(),
    last_30_days: totals,
    daily,
  };
}

async function main() {
  console.log("Rufe Website-Statistiken ab...");
  const stats = await safely("Website-Statistiken", fetchWebsiteStats);
  if (!stats) {
    console.log("Fehler beim Abrufen der Website-Statistiken. Breche ab.");
    process.exit(1);
  }

  await writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
  console.log(`✓ Website-Statistiken geschrieben: ${STATS_FILE}`);
}

main().catch((err) => {
  console.error("Kritischer Fehler:", err.message);
  process.exit(1);
});
