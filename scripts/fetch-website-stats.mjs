#!/usr/bin/env node
// Ruft Website-Statistiken aus Cloudflare Web Analytics ab und schreibt sie
// nach content/website-stats.json. Wird per GitHub Actions regelmäßig aufgerufen,
// siehe .github/workflows/website-stats-fetch.yml.
//
// webdesign-ehmann.de ist keine eigene Cloudflare-DNS-Zone, sondern läuft nur
// über ein Pages-Projekt. Web Analytics ist deshalb als eigenständige
// Beacon-Site eingerichtet (JS-Snippet in allen Hauptseiten, siehe
// data-cf-beacon-Token), nicht zonengebunden. Die GraphQL Analytics API
// fragt solche Sites über viewer.accounts(...).rumPageloadEventsAdaptiveGroups
// mit einem siteTag-Filter ab (nicht viewer.zones wie bei einer echten Zone).

import { writeFile } from "node:fs/promises";
import path from "node:path";

const STATS_FILE = path.join(process.cwd(), "content", "website-stats.json");
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4/graphql";

const API_TOKEN = requireEnv("CLOUDFLARE_API_TOKEN");
const ACCOUNT_ID = requireEnv("CLOUDFLARE_ACCOUNT_ID");
const SITE_TAG = requireEnv("CLOUDFLARE_SITE_TAG");

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

function isoDate(d) {
  return d.toISOString().split("T")[0];
}

async function fetchWebsiteStats() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 30);

  const query = `
    query {
      viewer {
        accounts(filter: { accountTag: "${ACCOUNT_ID}" }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 31
            filter: {
              siteTag: "${SITE_TAG}"
              date_geq: "${isoDate(start)}"
              date_leq: "${isoDate(today)}"
            }
            orderBy: [date_ASC]
          ) {
            count
            sum {
              visits
            }
            dimensions {
              date
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

  const account = json.data?.viewer?.accounts?.[0];
  if (!account) throw new Error("Account nicht in der Antwort.");

  const groups = account.rumPageloadEventsAdaptiveGroups || [];
  const daily = groups.map((g) => ({
    date: g.dimensions.date,
    visits: g.sum?.visits || 0,
    pageviews: g.count || 0,
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
