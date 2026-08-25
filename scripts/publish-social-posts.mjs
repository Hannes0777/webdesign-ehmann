#!/usr/bin/env node
// Veröffentlicht fällige Facebook-/Instagram-Beiträge aus content/social-posts/.
// Wird per GitHub Actions in regelmäßigen Abständen aufgerufen,
// siehe .github/workflows/social-posts-publish.yml.
//
// Bilder liegen NICHT auf der eigentlichen Website, sondern werden nur für
// Instagram (das zwingend eine öffentliche Bild-URL verlangt) kurz in ein
// separates Repo (SOCIAL_MEDIA_ASSETS_REPO) hochgeladen und danach wieder
// gelöscht. Facebook bekommt das Bild direkt als Datei-Upload, ganz ohne
// Hosting.

import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "content", "social-posts");
const GRAPH_API = "https://graph.facebook.com/v21.0";

const PAGE_TOKEN = requireEnv("META_PAGE_ACCESS_TOKEN");
const PAGE_ID = requireEnv("META_PAGE_ID");
const IG_USER_ID = process.env.META_IG_USER_ID || "";
const ASSETS_REPO = process.env.SOCIAL_MEDIA_ASSETS_REPO || "";
const ASSETS_TOKEN = process.env.SOCIAL_MEDIA_ASSETS_TOKEN || "";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt.`);
  return value;
}

function localImagePath(bild) {
  if (!bild) return null;
  return path.join(process.cwd(), bild.replace(/^\/+/, ""));
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

// --- Facebook: Bild als Datei hochladen, keine öffentliche URL nötig ---
async function publishToFacebook(post, imageBuffer, filename) {
  const form = new FormData();
  form.append("caption", post.text || "");
  form.append("access_token", PAGE_TOKEN);
  form.append("source", new Blob([imageBuffer]), filename);

  const res = await fetch(`${GRAPH_API}/${PAGE_ID}/photos`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
}

// --- Instagram verlangt zwingend eine öffentliche Bild-URL ---
// Bild wird dafür kurz in ein separates Repo gelegt und danach wieder gelöscht.
async function uploadAsset(imageBuffer, filename) {
  if (!ASSETS_REPO || !ASSETS_TOKEN) {
    throw new Error("SOCIAL_MEDIA_ASSETS_REPO/SOCIAL_MEDIA_ASSETS_TOKEN nicht gesetzt.");
  }
  const res = await fetch(`https://api.github.com/repos/${ASSETS_REPO}/contents/posts/${filename}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ASSETS_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Bild für Instagram-Post: ${filename}`,
      content: imageBuffer.toString("base64"),
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return { url: json.content.download_url, sha: json.content.sha };
}

async function deleteAsset(filename, sha) {
  await fetch(`https://api.github.com/repos/${ASSETS_REPO}/contents/posts/${filename}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${ASSETS_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: `Aufräumen nach Veröffentlichung: ${filename}`, sha }),
  });
}

async function publishToInstagram(post, imageBuffer, filename) {
  if (!IG_USER_ID) {
    throw new Error("META_IG_USER_ID ist nicht gesetzt.");
  }

  const asset = await uploadAsset(imageBuffer, filename);
  try {
    const container = await graphPost(`${IG_USER_ID}/media`, {
      image_url: asset.url,
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
  } finally {
    await deleteAsset(filename, asset.sha).catch(() => {});
  }
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
    const imgPath = localImagePath(post.bild);
    let imageBuffer = null;
    if (imgPath) {
      try {
        imageBuffer = await readFile(imgPath);
      } catch {
        imageBuffer = null;
      }
    }
    const filename = imgPath ? path.basename(imgPath) : null;
    const errors = [];

    if (post.facebook) {
      try {
        if (!imageBuffer) throw new Error("Kein Bild hinterlegt.");
        await publishToFacebook(post, imageBuffer, filename);
      } catch (err) {
        errors.push(`Facebook: ${err.message}`);
      }
    }

    if (post.instagram) {
      try {
        if (!imageBuffer) throw new Error("Kein Bild hinterlegt.");
        await publishToInstagram(post, imageBuffer, filename);
      } catch (err) {
        errors.push(`Instagram: ${err.message}`);
      }
    }

    if (errors.length === 0) {
      post.status = "veroeffentlicht";
      post.fehler_meldung = "";
      if (imgPath) {
        await unlink(imgPath).catch(() => {});
        post.bild = "";
      }
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
