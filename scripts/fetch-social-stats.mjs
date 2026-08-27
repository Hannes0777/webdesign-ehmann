#!/usr/bin/env node
// Ruft Facebook-/Instagram-Statistiken ab (Follower, Reichweite, Likes je
// Beitrag) und schreibt sie nach content/social-stats.json. Wird per
// GitHub Actions regelmäßig aufgerufen, siehe
// .github/workflows/social-stats-fetch.yml.
//
// Einzelne Metriken werden bewusst mit try/catch abgesichert: Meta ändert
// gelegentlich Metrik-Namen oder verlangt zusätzliche App-Freigaben dafür -
// ein einzelner Fehler soll nicht den gesamten Lauf abbrechen.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "content", "social-posts");
const STATS_FILE = path.join(process.cwd(), "content", "social-stats.json");
const HISTORY_FILE = path.join(process.cwd(), "content", "social-stats-history.json");
const POST_HISTORY_FILE = path.join(process.cwd(), "content", "social-post-stats-history.json");
const GRAPH_API = "https://graph.facebook.com/v21.0";
const IG_GRAPH_API = "https://graph.instagram.com/v21.0";

const PAGE_TOKEN = requireEnv("META_PAGE_ACCESS_TOKEN");
const PAGE_ID = requireEnv("META_PAGE_ID");
const IG_USER_ID = process.env.META_IG_USER_ID || "";
const IG_TOKEN = process.env.META_IG_ACCESS_TOKEN || "";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt.`);
  return value;
}

async function graphGet(base, pathSegment, params) {
  const res = await fetch(`${base}/${pathSegment}?${new URLSearchParams(params)}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

async function safely(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.log(`⚠ ${label}: ${err.message}`);
    return null;
  }
}

async function fetchFacebookAccountStats() {
  const info = await safely("Facebook-Seiteninfo", () =>
    graphGet(GRAPH_API, PAGE_ID, { fields: "fan_count,name", access_token: PAGE_TOKEN })
  );
  return { fan_count: info?.fan_count ?? null };
}

async function fetchInstagramAccountStats() {
  if (!IG_USER_ID || !IG_TOKEN) return null;
  const info = await safely("Instagram-Kontoinfo", () =>
    graphGet(IG_GRAPH_API, IG_USER_ID, {
      fields: "followers_count,media_count",
      access_token: IG_TOKEN,
    })
  );
  return {
    followers_count: info?.followers_count ?? null,
    media_count: info?.media_count ?? null,
  };
}

// Einzelne Metriken einzeln abfragen statt in einem Aufruf: Fragt die
// Insights-API mehrere Metriken auf einmal ab und ist eine davon für den
// jeweiligen Beitragstyp ungültig, schlägt der GESAMTE Aufruf fehl. So
// liefert eine ungültige Metrik nur eine fehlende Zahl statt gar keine.
async function fetchMetric(base, path, metric, token, extraParams) {
  const result = await safely(`Metrik ${metric} (${path})`, () =>
    graphGet(base, `${path}/insights`, { metric, access_token: token, ...extraParams })
  );
  const entry = result?.data?.[0];
  // total_value-Metriken (metric_type=total_value) liefern {total_value:{value}},
  // time_series-Metriken (klassisch, z.B. reach je Beitrag) liefern {values:[{value}]}.
  const value = entry?.total_value?.value ?? entry?.values?.[0]?.value ?? null;
  if (result && value == null) {
    // Kein Fehler, aber auch kein auswertbarer Wert - genau das Muster, mit
    // dem Meta abgeschaltete Metriken (z.B. profile_views/website_clicks,
    // seit 8.1.2025 entfernt) stillschweigend beantwortet: {"data":[]} statt
    // eines Fehlers. Sichtbar loggen statt wieder stillschweigend zu
    // verschlucken, damit ein künftiger API-Umbau sofort auffällt.
    console.log(`⚠ Metrik ${metric} (${path}): kein Wert in der Antwort - ${JSON.stringify(result)}`);
  }
  return value;
}

// Kontoweite Instagram-Aktivität (nicht pro Beitrag). profile_views/
// website_clicks wurden von Meta am 8.1.2025 ersatzlos aus der Graph API
// entfernt (liefern seither still {data:[]} statt eines Fehlers) - als
// inhaltlich nächstliegende noch verfügbare Account-Metriken werden
// stattdessen accounts_engaged (Konten mit Interaktion) und
// total_interactions (Interaktionen insgesamt) über 28 Tage abgefragt.
async function fetchInstagramActivityStats() {
  if (!IG_USER_ID || !IG_TOKEN) return null;
  const accountsEngaged = await fetchMetric(IG_GRAPH_API, IG_USER_ID, "accounts_engaged", IG_TOKEN, {
    period: "days_28",
    metric_type: "total_value",
  });
  const totalInteractions = await fetchMetric(IG_GRAPH_API, IG_USER_ID, "total_interactions", IG_TOKEN, {
    period: "days_28",
    metric_type: "total_value",
  });
  return { accounts_engaged: accountsEngaged, total_interactions: totalInteractions };
}

async function fetchFacebookPostStats(postId) {
  const data = await safely(`Facebook-Post-Statistik (${postId})`, () =>
    graphGet(GRAPH_API, postId, {
      fields: "likes.summary(true),comments.summary(true),shares",
      access_token: PAGE_TOKEN,
    })
  );
  if (!data) return null;
  const reach = await fetchMetric(GRAPH_API, postId, "post_impressions_unique", PAGE_TOKEN);
  return {
    likes: data.likes?.summary?.total_count ?? null,
    comments: data.comments?.summary?.total_count ?? null,
    shares: data.shares?.count ?? 0,
    reach,
  };
}

async function fetchInstagramMediaStats(mediaId) {
  const info = await safely(`Instagram-Media-Grunddaten (${mediaId})`, () =>
    graphGet(IG_GRAPH_API, mediaId, {
      fields: "like_count,comments_count",
      access_token: IG_TOKEN,
    })
  );
  const reach = await fetchMetric(IG_GRAPH_API, mediaId, "reach", IG_TOKEN);
  const views = await fetchMetric(IG_GRAPH_API, mediaId, "views", IG_TOKEN);
  const saved = await fetchMetric(IG_GRAPH_API, mediaId, "saved", IG_TOKEN);
  return {
    likes: info?.like_count ?? null,
    comments: info?.comments_count ?? null,
    reach: views ?? reach ?? null,
    saved: saved ?? null,
  };
}

// Für Beiträge, die vor Einführung der ID-Speicherung veröffentlicht
// wurden, fehlt facebook_post_id/instagram_media_id. Hier wird einmalig
// versucht, den passenden Beitrag anhand des Texts in der jeweiligen
// Beitragsliste zu finden und die ID nachträglich einzutragen.
async function backfillFacebookId(post) {
  return safely("Facebook-Beitrag nachträglich zuordnen", async () => {
    const list = await graphGet(GRAPH_API, `${PAGE_ID}/posts`, {
      fields: "id,message,created_time",
      limit: "50",
      access_token: PAGE_TOKEN,
    });
    const match = (list.data || []).find((p) => (p.message || "").trim() === (post.text || "").trim());
    return match ? match.id : null;
  });
}

async function backfillInstagramId(post) {
  return safely("Instagram-Beitrag nachträglich zuordnen", async () => {
    const list = await graphGet(IG_GRAPH_API, `${IG_USER_ID}/media`, {
      fields: "id,caption,timestamp",
      limit: "50",
      access_token: IG_TOKEN,
    });
    const match = (list.data || []).find((m) => (m.caption || "").trim() === (post.text || "").trim());
    return match ? match.id : null;
  });
}

// Beiträge, die direkt in der Instagram-/Facebook-App gepostet wurden
// (nicht über unser CMS), damit die Übersicht die komplette Historie
// zeigt statt nur die selbst geplanten Beiträge.
async function fetchOtherInstagramPosts(trackedIds) {
  if (!IG_USER_ID || !IG_TOKEN) return [];
  const list = await safely("Instagram-Beitragsliste", () =>
    graphGet(IG_GRAPH_API, `${IG_USER_ID}/media`, {
      fields: "id,caption,timestamp,media_url,thumbnail_url,permalink",
      limit: "50",
      access_token: IG_TOKEN,
    })
  );
  const others = [];
  for (const item of list?.data || []) {
    if (trackedIds.has(item.id)) continue;
    const statsData = await fetchInstagramMediaStats(item.id);
    others.push({
      platform: "instagram",
      id: item.id,
      text: item.caption || "",
      at: item.timestamp,
      permalink: item.permalink || null,
      thumbnail: item.thumbnail_url || item.media_url || null,
      likes: statsData?.likes ?? null,
      comments: statsData?.comments ?? null,
      reach: statsData?.reach ?? null,
    });
  }
  return others;
}

async function fetchOtherFacebookPosts(trackedIds) {
  const list = await safely("Facebook-Beitragsliste", () =>
    graphGet(GRAPH_API, `${PAGE_ID}/posts`, {
      fields: "id,message,created_time,full_picture,permalink_url",
      limit: "50",
      access_token: PAGE_TOKEN,
    })
  );
  const others = [];
  for (const item of list?.data || []) {
    if (trackedIds.has(item.id)) continue;
    const statsData = await fetchFacebookPostStats(item.id);
    others.push({
      platform: "facebook",
      id: item.id,
      text: item.message || "",
      at: item.created_time,
      permalink: item.permalink_url || null,
      thumbnail: item.full_picture || null,
      likes: statsData?.likes ?? null,
      comments: statsData?.comments ?? null,
      reach: statsData?.reach ?? null,
    });
  }
  return others;
}

async function main() {
  const stats = {
    updated_at: new Date().toISOString(),
    facebook: await fetchFacebookAccountStats(),
    instagram: await fetchInstagramAccountStats(),
    instagram_activity: await fetchInstagramActivityStats(),
    posts: {},
  };

  let files = [];
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    // kein Ordner - einfach ohne Post-Statistiken weitermachen
  }

  const trackedFacebookIds = new Set();
  const trackedInstagramIds = new Set();
  // Pro-Beitrag-Zeitverlauf (für Beitrags-Diagramme im Dashboard) - ein
  // Eintrag je Beitrag und Lauf, unabhängig von der kontoweiten Historie.
  const postHistoryPoints = {};

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const post = JSON.parse(await readFile(filePath, "utf8"));
    if (post.status !== "veroeffentlicht") continue;

    let idsChanged = false;
    if (post.facebook && !post.facebook_post_id) {
      const id = await backfillFacebookId(post);
      if (id) {
        post.facebook_post_id = id;
        idsChanged = true;
      }
    }
    if (post.instagram && !post.instagram_media_id && IG_USER_ID && IG_TOKEN) {
      const id = await backfillInstagramId(post);
      if (id) {
        post.instagram_media_id = id;
        idsChanged = true;
      }
    }
    if (idsChanged) {
      await writeFile(filePath, JSON.stringify(post, null, 2) + "\n", "utf8");
    }

    const entry = {};
    if (post.facebook_post_id) {
      entry.facebook = await fetchFacebookPostStats(post.facebook_post_id);
      trackedFacebookIds.add(post.facebook_post_id);
    }
    if (post.instagram_media_id) {
      entry.instagram = await fetchInstagramMediaStats(post.instagram_media_id);
      trackedInstagramIds.add(post.instagram_media_id);
    }
    if (Object.keys(entry).length > 0) {
      stats.posts[file] = entry;
      postHistoryPoints[file] = {
        at: stats.updated_at,
        facebook_likes: entry.facebook?.likes ?? null,
        facebook_comments: entry.facebook?.comments ?? null,
        facebook_reach: entry.facebook?.reach ?? null,
        instagram_likes: entry.instagram?.likes ?? null,
        instagram_comments: entry.instagram?.comments ?? null,
        instagram_reach: entry.instagram?.reach ?? null,
      };
    }
  }

  // Beiträge, die direkt in der App gepostet wurden (nicht über unser CMS).
  // Facebook-Beitragsdetails (Likes/Kommentare/Liste) sind ohne Meta-App-
  // Review nicht zugänglich ("Page Public Content Access" fehlt) - deshalb
  // hier bewusst nicht abgefragt, nur die Follower-Zahl (siehe
  // fetchFacebookAccountStats) funktioniert ohne Review. Sobald ein Review
  // gemacht wird, hier wieder fetchOtherFacebookPosts(trackedFacebookIds)
  // mit reinnehmen.
  stats.other_posts = await fetchOtherInstagramPosts(trackedInstagramIds);

  // Auch für direkt in der App geposteten Beiträge einen Verlaufspunkt
  // anlegen, damit sie im Dashboard genauso ein Beitrags-Diagramm bekommen
  // wie über das CMS geplante Beiträge. Schlüssel "ext:<plattform>:<id>",
  // da sie keine CMS-Datei haben.
  for (const p of stats.other_posts) {
    postHistoryPoints[`ext:${p.platform}:${p.id}`] = {
      at: stats.updated_at,
      facebook_likes: p.platform === "facebook" ? p.likes ?? null : null,
      facebook_comments: p.platform === "facebook" ? p.comments ?? null : null,
      facebook_reach: p.platform === "facebook" ? p.reach ?? null : null,
      instagram_likes: p.platform === "instagram" ? p.likes ?? null : null,
      instagram_comments: p.platform === "instagram" ? p.comments ?? null : null,
      instagram_reach: p.platform === "instagram" ? p.reach ?? null : null,
    };
  }

  await writeFile(STATS_FILE, JSON.stringify(stats, null, 2) + "\n", "utf8");

  // Pro-Beitrag-Historie schreiben (für die Beitrags-Diagramme im
  // Dashboard) - je Beitrag ein begrenztes Zeitfenster, damit die Datei bei
  // vielen Beiträgen nicht unbegrenzt wächst.
  let postHistory = {};
  try {
    postHistory = JSON.parse(await readFile(POST_HISTORY_FILE, "utf8"));
    if (!postHistory || typeof postHistory !== "object") postHistory = {};
  } catch {
    postHistory = {};
  }
  for (const [key, point] of Object.entries(postHistoryPoints)) {
    const arr = Array.isArray(postHistory[key]) ? postHistory[key] : [];
    arr.push(point);
    postHistory[key] = arr.length > 2000 ? arr.slice(-2000) : arr;
  }
  await writeFile(POST_HISTORY_FILE, JSON.stringify(postHistory, null, 2) + "\n", "utf8");

  // Verlaufs-Historie: bei jedem Lauf einen neuen Datenpunkt anhängen,
  // damit sich Follower/Reichweite/Likes/Kommentare als Diagramm über die
  // Zeit darstellen lassen.
  let fbLikes = 0, fbComments = 0, fbReach = 0;
  let igLikes = 0, igComments = 0, igReach = 0;
  for (const key of Object.keys(stats.posts)) {
    const p = stats.posts[key];
    if (p.facebook) {
      fbLikes += p.facebook.likes || 0;
      fbComments += p.facebook.comments || 0;
      fbReach += p.facebook.reach || 0;
    }
    if (p.instagram) {
      igLikes += p.instagram.likes || 0;
      igComments += p.instagram.comments || 0;
      igReach += p.instagram.reach || 0;
    }
  }
  for (const p of stats.other_posts) {
    if (p.platform === "facebook") {
      fbLikes += p.likes || 0;
      fbComments += p.comments || 0;
      fbReach += p.reach || 0;
    } else {
      igLikes += p.likes || 0;
      igComments += p.comments || 0;
      igReach += p.reach || 0;
    }
  }

  let history = [];
  try {
    history = JSON.parse(await readFile(HISTORY_FILE, "utf8"));
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
  history.push({
    at: stats.updated_at,
    facebook_followers: stats.facebook.fan_count,
    instagram_followers: stats.instagram?.followers_count ?? null,
    facebook_likes: fbLikes,
    facebook_comments: fbComments,
    facebook_reach: fbReach,
    instagram_likes: igLikes,
    instagram_comments: igComments,
    instagram_reach: igReach,
    instagram_accounts_engaged: stats.instagram_activity?.accounts_engaged ?? null,
    instagram_total_interactions: stats.instagram_activity?.total_interactions ?? null,
  });
  // Bei 5-Minuten-Takt sonst unbegrenztes Wachstum - 4000 Punkte
  // entsprechen ca. 2 Wochen Verlauf, das reicht für die Diagramme.
  if (history.length > 4000) history = history.slice(-4000);
  await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2) + "\n", "utf8");

  console.log(`Statistiken aktualisiert für ${Object.keys(stats.posts).length} Beitrag(e).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
