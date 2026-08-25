#!/usr/bin/env node
// Veröffentlicht fällige Facebook-/Instagram-Beiträge aus content/social-posts/.
// Wird per GitHub Actions in regelmäßigen Abständen aufgerufen,
// siehe .github/workflows/social-posts-publish.yml.
//
// Bilder liegen NICHT auf der eigentlichen Website, sondern werden nur für
// Instagram (das zwingend eine öffentliche Bild-URL verlangt) kurz in ein
// separates Repo (SOCIAL_MEDIA_ASSETS_REPO) hochgeladen und danach wieder
// gelöscht. Facebook bekommt die Bilder direkt als Datei-Upload, ganz ohne
// Hosting. Ein Beitrag kann mehrere Bilder haben (Album/Karussell).

import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "content", "social-posts");
const GRAPH_API = "https://graph.facebook.com/v21.0";
// Instagram läuft über einen eigenen API-Host mit einem eigenen Token
// (Instagram-Login-Flow), getrennt vom Facebook-Seiten-Token.
const IG_GRAPH_API = "https://graph.instagram.com/v21.0";

const PAGE_TOKEN = requireEnv("META_PAGE_ACCESS_TOKEN");
const PAGE_ID = requireEnv("META_PAGE_ID");
const IG_USER_ID = process.env.META_IG_USER_ID || "";
const IG_TOKEN = process.env.META_IG_ACCESS_TOKEN || "";
const ASSETS_REPO = process.env.SOCIAL_MEDIA_ASSETS_REPO || "";
const ASSETS_TOKEN = process.env.SOCIAL_MEDIA_ASSETS_TOKEN || "";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt.`);
  return value;
}

function localImagePath(bildPfad) {
  return path.join(process.cwd(), bildPfad.replace(/^\/+/, ""));
}

async function loadImages(bilder) {
  const list = Array.isArray(bilder) ? bilder : bilder ? [bilder] : [];
  const images = [];
  for (const bildPfad of list) {
    const filePath = localImagePath(bildPfad);
    try {
      const buffer = await readFile(filePath);
      images.push({ path: filePath, filename: path.basename(filePath), buffer });
    } catch {
      // Datei fehlt (z.B. schon gelöscht) - wird beim Aufrufer als Fehler behandelt.
    }
  }
  return images;
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

async function igGraphPost(pathSegment, params) {
  const res = await fetch(`${IG_GRAPH_API}/${pathSegment}`, {
    method: "POST",
    body: new URLSearchParams(params),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

async function igGraphGet(pathSegment, params) {
  const res = await fetch(`${IG_GRAPH_API}/${pathSegment}?${new URLSearchParams(params)}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadFacebookPhoto(imageBuffer, filename, published) {
  const form = new FormData();
  form.append("published", String(published));
  form.append("access_token", PAGE_TOKEN);
  form.append("source", new Blob([imageBuffer]), filename);

  const res = await fetch(`${GRAPH_API}/${PAGE_ID}/photos`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json.id;
}

// --- Facebook: Bilder als Datei hochladen, keine öffentliche URL nötig ---
async function publishToFacebook(post, images) {
  if (images.length === 1) {
    await uploadFacebookPhoto(images[0].buffer, images[0].filename, true);
    return;
  }

  // Mehrere Bilder: erst unveröffentlicht hochladen, dann als ein
  // gemeinsamer Beitrag mit mehreren Fotos veröffentlichen.
  const photoIds = [];
  for (const image of images) {
    photoIds.push(await uploadFacebookPhoto(image.buffer, image.filename, false));
  }

  const params = { message: post.text || "", access_token: PAGE_TOKEN };
  photoIds.forEach((id, index) => {
    params[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
  });
  await graphPost(`${PAGE_ID}/feed`, params);
}

// --- Instagram verlangt zwingend eine öffentliche Bild-URL ---
// Bilder werden dafür kurz in ein separates Repo gelegt und danach wieder gelöscht.
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

async function waitUntilFinished(igMediaId) {
  let status = "IN_PROGRESS";
  for (let attempt = 0; attempt < 6 && status === "IN_PROGRESS"; attempt++) {
    if (attempt > 0) await sleep(3000);
    const check = await igGraphGet(igMediaId, { fields: "status_code", access_token: IG_TOKEN });
    status = check.status_code;
  }
  if (status !== "FINISHED") {
    throw new Error(`Instagram-Medium wurde nicht rechtzeitig fertig (Status: ${status}).`);
  }
}

async function publishToInstagram(post, images) {
  if (!IG_USER_ID) throw new Error("META_IG_USER_ID ist nicht gesetzt.");
  if (!IG_TOKEN) throw new Error("META_IG_ACCESS_TOKEN ist nicht gesetzt.");
  if (images.length > 10) throw new Error("Instagram erlaubt maximal 10 Bilder pro Beitrag.");

  const assets = [];
  try {
    for (const image of images) {
      assets.push(await uploadAsset(image.buffer, image.filename));
    }

    if (images.length === 1) {
      const container = await igGraphPost(`${IG_USER_ID}/media`, {
        image_url: assets[0].url,
        caption: post.text || "",
        access_token: IG_TOKEN,
      });
      await waitUntilFinished(container.id);
      await igGraphPost(`${IG_USER_ID}/media_publish`, {
        creation_id: container.id,
        access_token: IG_TOKEN,
      });
      return;
    }

    // Mehrere Bilder: als Karussell (Album) in einem Beitrag veröffentlichen.
    const childIds = [];
    for (const asset of assets) {
      const child = await igGraphPost(`${IG_USER_ID}/media`, {
        image_url: asset.url,
        is_carousel_item: "true",
        access_token: IG_TOKEN,
      });
      childIds.push(child.id);
    }

    const carousel = await igGraphPost(`${IG_USER_ID}/media`, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: post.text || "",
      access_token: IG_TOKEN,
    });
    await waitUntilFinished(carousel.id);
    await igGraphPost(`${IG_USER_ID}/media_publish`, {
      creation_id: carousel.id,
      access_token: IG_TOKEN,
    });
  } finally {
    for (let i = 0; i < assets.length; i++) {
      await deleteAsset(images[i].filename, assets[i].sha).catch(() => {});
    }
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
    const images = await loadImages(post.bilder);
    const errors = [];

    if (post.facebook) {
      try {
        if (images.length === 0) throw new Error("Kein Bild hinterlegt.");
        await publishToFacebook(post, images);
      } catch (err) {
        errors.push(`Facebook: ${err.message}`);
      }
    }

    if (post.instagram) {
      try {
        if (images.length === 0) throw new Error("Kein Bild hinterlegt.");
        await publishToInstagram(post, images);
      } catch (err) {
        errors.push(`Instagram: ${err.message}`);
      }
    }

    if (errors.length === 0) {
      post.status = "veroeffentlicht";
      post.fehler_meldung = "";
      for (const image of images) {
        await unlink(image.path).catch(() => {});
      }
      post.bilder = [];
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
