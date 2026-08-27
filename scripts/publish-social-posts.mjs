#!/usr/bin/env node
// Veröffentlicht fällige Facebook-/Instagram-Beiträge aus content/social-posts/.
// Wird per GitHub Actions in regelmäßigen Abständen aufgerufen,
// siehe .github/workflows/social-posts-publish.yml.
//
// Facebook und Instagram bekommen eigene Bilder (bild_facebook /
// bilder_instagram), teilen sich aber Text und Zeitpunkt in einem Beitrag.
// Bilder liegen NICHT auf der eigentlichen Website, sondern werden nur für
// Instagram (das zwingend eine öffentliche Bild-URL verlangt) kurz in ein
// separates Repo (SOCIAL_MEDIA_ASSETS_REPO) hochgeladen und danach wieder
// gelöscht. Facebook bekommt sein Bild direkt als Datei-Upload, ganz ohne
// Hosting.

import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
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

async function loadImage(bildPfad) {
  if (!bildPfad) return null;
  const filePath = localImagePath(bildPfad);
  try {
    const buffer = await readFile(filePath);
    return { path: filePath, filename: path.basename(filePath), buffer };
  } catch {
    return null;
  }
}

async function loadImages(bilder) {
  const list = Array.isArray(bilder) ? bilder : bilder ? [bilder] : [];
  const images = [];
  for (const bildPfad of list) {
    const image = await loadImage(bildPfad);
    if (image) images.push(image);
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

// --- Absicherung gegen Doppel-Posting ---
// Bevor ein Beitrag tatsächlich an Facebook/Instagram geschickt wird, wird
// der Status zuerst lokal auf "wird_veroeffentlicht" gesetzt und sofort
// committet + gepusht. Erst wenn dieser Push wirklich sicher im Remote-Repo
// angekommen ist, wird überhaupt gepostet. Stürzt der Job danach ab oder
// schlägt der *finale* Push (mit dem Ergebnis "veroeffentlicht"/"fehler")
// fehl, steht der Beitrag beim nächsten Lauf auf "wird_veroeffentlicht" statt
// auf "geplant" – und wird dann NICHT automatisch erneut gepostet, sondern
// nur als Warnung gemeldet, damit ein Mensch erst manuell auf Facebook/
// Instagram prüft, bevor der Status zurückgesetzt wird.
function runGit(args) {
  return execFileSync("git", args, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] }).toString();
}

function hasStagedChanges() {
  try {
    runGit(["diff", "--cached", "--quiet"]);
    return false;
  } catch {
    return true;
  }
}

let gitIdentityEnsured = false;
function ensureGitIdentity() {
  if (gitIdentityEnsured) return;
  runGit(["config", "user.name", "github-actions[bot]"]);
  runGit(["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
  gitIdentityEnsured = true;
}

async function commitAndPush(message) {
  ensureGitIdentity();
  runGit(["add", "content/social-posts"]);
  if (!hasStagedChanges()) return;
  runGit(["commit", "-m", message]);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      runGit(["push"]);
      return;
    } catch (err) {
      if (attempt === 5) {
        throw new Error(`git push endgültig fehlgeschlagen: ${err.message}`);
      }
      console.warn(`Push fehlgeschlagen (Versuch ${attempt}), hole Änderungen und versuche erneut...`);
      runGit(["fetch", "origin", "master"]);
      runGit(["rebase", "origin/master"]);
      await sleep(3000);
    }
  }
}

// --- Facebook: immer genau ein Bild, direkt als Datei hochgeladen ---
// Gibt die Post-ID zurück (fürs spätere Abrufen von Statistiken).
async function publishToFacebook(post, image) {
  const form = new FormData();
  form.append("caption", post.text || "");
  form.append("access_token", PAGE_TOKEN);
  form.append("source", new Blob([image.buffer]), image.filename);

  const res = await fetch(`${GRAPH_API}/${PAGE_ID}/photos`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json.post_id || json.id;
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

// Gibt die Media-ID zurück (fürs spätere Abrufen von Statistiken).
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
      const published = await igGraphPost(`${IG_USER_ID}/media_publish`, {
        creation_id: container.id,
        access_token: IG_TOKEN,
      });
      return published.id;
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
    const published = await igGraphPost(`${IG_USER_ID}/media_publish`, {
      creation_id: carousel.id,
      access_token: IG_TOKEN,
    });
    return published.id;
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

    if (post.status === "wird_veroeffentlicht") {
      console.error(
        `WARNUNG: ${file} steht auf "wird_veroeffentlicht" (vermutlich Abbruch bei einem früheren Lauf). ` +
          `Bitte manuell auf Facebook/Instagram prüfen, ob der Beitrag schon online ist, bevor der Status ` +
          `zurückgesetzt wird. Wird in diesem Lauf übersprungen, um kein Doppel-Posting zu riskieren.`
      );
      continue;
    }

    if (post.status !== "geplant") continue;
    if (!post.geplant_fuer || new Date(post.geplant_fuer) > now) continue;

    console.log(`Veröffentliche: ${file}`);

    // Sperre setzen und SOFORT committen/pushen, bevor überhaupt gepostet
    // wird. Klappt das nicht, wird auch nicht gepostet – lieber ein
    // verspäteter Beitrag als ein doppelt veröffentlichter.
    const lockedPost = { ...post, status: "wird_veroeffentlicht" };
    await writeFile(filePath, JSON.stringify(lockedPost, null, 2) + "\n", "utf8");
    try {
      await commitAndPush(`Social-Media-Beitrag ${file}: Sperre vor Veröffentlichung`);
    } catch (err) {
      console.error(`Konnte Sperre für ${file} nicht sichern, überspringe (kein Post ohne gesicherte Sperre): ${err.message}`);
      continue;
    }
    post.status = "wird_veroeffentlicht";

    const fbImage = await loadImage(post.bild_facebook);
    const igImages = await loadImages(post.bilder_instagram);
    const errors = [];

    if (post.facebook) {
      if (post.facebook_post_id) {
        console.log(`Facebook für ${file} bereits veröffentlicht (Post-ID vorhanden), überspringe.`);
      } else {
        try {
          if (!fbImage) throw new Error("Kein Bild für Facebook hinterlegt.");
          post.facebook_post_id = await publishToFacebook(post, fbImage);
        } catch (err) {
          errors.push(`Facebook: ${err.message}`);
        }
      }
    }

    if (post.instagram) {
      if (post.instagram_media_id) {
        console.log(`Instagram für ${file} bereits veröffentlicht (Media-ID vorhanden), überspringe.`);
      } else {
        try {
          if (igImages.length === 0) throw new Error("Kein Bild für Instagram hinterlegt.");
          post.instagram_media_id = await publishToInstagram(post, igImages);
        } catch (err) {
          errors.push(`Instagram: ${err.message}`);
        }
      }
    }

    if (errors.length === 0) {
      post.status = "veroeffentlicht";
      post.fehler_meldung = "";
      // Erstes Bild je Plattform bleibt als sichtbare Referenz erhalten,
      // nur zusätzliche Instagram-Bilder (Karussell) werden aufgeräumt.
      for (const image of igImages.slice(1)) {
        await unlink(image.path).catch(() => {});
      }
      if (Array.isArray(post.bilder_instagram)) {
        post.bilder_instagram = post.bilder_instagram.slice(0, 1);
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
