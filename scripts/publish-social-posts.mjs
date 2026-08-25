#!/usr/bin/env node
// Veröffentlicht fällige Facebook-/Instagram-Beiträge aus content/social-posts/.
// Wird per GitHub Actions in regelmäßigen Abständen aufgerufen,
// siehe .github/workflows/social-posts-publish.yml.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "content", "social-posts");
const GRAPH_API = "https://graph.facebook.com/v21.0";

const PAGE_TOKEN = requireEnv("META_PAGE_ACCESS_TOKEN");
const PAGE_ID = requireEnv("META_PAGE_ID");
const IG_USER_ID = process.env.META_IG_USER_ID || "";
const SITE_BASE_URL = (process.env.SITE_BASE_URL || "https://www.webdesign-ehmann.de").replace(/\/+$/, "");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt.`);
  return value;
}

function toPublicImageUrl(bild) {
  if (!bild) return null;
  if (/^https?:\/\//i.test(bild)) return bild;
  return `${SITE_BASE_URL}/${bild.replace(/^\/+/, "")}`;
}

async function graphPost(pathSegment, params) {
  const res = await fetch(`${GRAPH_API}/${pathSegment}`, {
    method: "POST",
    body: new URLSearchParams(params),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

async function graphGet(pathSegment, params) {
  const res = await fetch(`${GRAPH_API}/${pathSegment}?${new URLSearchParams(params)}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function publishToFacebook(post, imageUrl) {
  await graphPost(`${PAGE_ID}/photos`, {
    url: imageUrl,
    caption: post.text || "",
    access_token: PAGE_TOKEN,
  });
}

async function publishToInstagram(post, imageUrl) {
  if (!IG_USER_ID) {
    throw new Error("META_IG_USER_ID ist nicht gesetzt.");
  }
  const container = await graphPost(`${IG_USER_ID}/media`, {
    image_url: imageUrl,
    caption: post.text || "",
    access_token: PAGE_TOKEN,
  });

  let status = "IN_PROGRESS";
  for (let attempt = 0; attempt < 6 && status === "IN_PROGRESS"; attempt++) {
    if (attempt > 0) await sleep(3000);
    const check = await graphGet(container.id, {
      fields: "status_code",
      access_token: PAGE_TOKEN,
    });
    status = check.status_code;
  }
  if (status !== "FINISHED") {
    throw new Error(`Instagram-Medium wurde nicht rechtzeitig fertig (Status: ${status}).`);
  }

  await graphPost(`${IG_USER_ID}/media_publish`, {
    creation_id: container.id,
    access_token: PAGE_TOKEN,
  });
}

async function main() {
  let files;
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    console.log("Kein Ordner content/social-posts gefunden, nichts zu tun.");
    return;
  }

  const now = new Date();
  let processed = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const post = JSON.parse(await readFile(filePath, "utf8"));

    if (post.status !== "geplant") continue;
    if (!post.geplant_fuer || new Date(post.geplant_fuer) > now) continue;

    console.log(`Veröffentliche: ${file}`);
    const imageUrl = toPublicImageUrl(post.bild);
    const errors = [];

    if (post.facebook) {
      try {
        if (!imageUrl) throw new Error("Kein Bild hinterlegt.");
        await publishToFacebook(post, imageUrl);
      } catch (err) {
        errors.push(`Facebook: ${err.message}`);
      }
    }

    if (post.instagram) {
      try {
        if (!imageUrl) throw new Error("Kein Bild hinterlegt.");
        await publishToInstagram(post, imageUrl);
      } catch (err) {
        errors.push(`Instagram: ${err.message}`);
      }
    }

    if (errors.length === 0) {
      post.status = "veroeffentlicht";
      post.fehler_meldung = "";
    } else {
      post.status = "fehler";
      post.fehler_meldung = errors.join(" | ");
    }

    await writeFile(filePath, JSON.stringify(post, null, 2) + "\n", "utf8");
    processed++;
  }

  console.log(processed > 0 ? `${processed} Beitrag(e) verarbeitet.` : "Keine fälligen Beiträge.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
