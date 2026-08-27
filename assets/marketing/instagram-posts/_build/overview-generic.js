// Generische "Übersicht"-Grafik pro Post — zum Teilen außerhalb von Instagram
// (Facebook, WhatsApp), nach dem Vorbild von overview.js (KI Flyer Vergleich)
// und Gepostet/Firmenvorstellung/firmenvorstellung-uebersicht.png.
// Struktur: Marken-Header -> Hook (Slide 1) -> Kernpunkte -> Abschluss-CTA -> Kontakt.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const OUT_ROOT = path.join(ROOT, "..");
const TMP = path.join(ROOT, "tmp");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const WIDTH = 1080;
const HEIGHT = 1350;

function b64(file) {
  return fs.readFileSync(path.join(ROOT, "fonts", file)).toString("base64");
}
const FONT_PLAYFAIR = b64("playfair-700.woff2");
const FONT_INTER_400 = b64("inter-400.woff2");
const FONT_INTER_600 = b64("inter-600.woff2");

const t = {
  bg: "#14171A", grid: "#22211E", border: "#6D5A37",
  kicker: "#D9AE5C", headline: "#F5F6F3", accent: "#D9AE5C",
  subtext: "#9AA39C", divider: "#D9AE5C", footer: "#8B9389",
  glow: "rgba(255,255,255,0.22)",
};

function toHtml(headline) {
  return Array.isArray(headline) ? headline.join("<br>") : headline;
}
function lineCount(headline) {
  return Array.isArray(headline) ? headline.length : (headline.match(/<br\s*\/?>/g) || []).length + 1;
}
function hookSize(headline) {
  const n = lineCount(headline);
  if (n <= 1) return 84;
  if (n === 2) return 73;
  return 60;
}

function pointsColumns(points) {
  if (points.length <= 3) return [points, []];
  const half = Math.ceil(points.length / 2);
  return [points.slice(0, half), points.slice(half)];
}

function checkIcon() {
  return `<div style="width:34px; height:34px; border-radius:50%; background:${t.accent}; display:flex; align-items:center; justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${t.bg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>
  </div>`;
}

function pointsList(points) {
  const [colA, colB] = pointsColumns(points);
  const row = (item) => `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:34px;">
      <div style="flex-shrink:0;">${checkIcon()}</div>
      <div style="font-family:'Inter',sans-serif; font-weight:700; font-size:28px; line-height:1.28; color:${t.headline};">${item}</div>
    </div>`;
  if (!colB.length) {
    return `<div style="width:100%; max-width:820px; margin:0 auto;">${colA.map(row).join("")}</div>`;
  }
  return `
  <div style="display:flex; gap:44px; width:100%; max-width:960px; margin:0 auto;">
    <div style="flex:1;">${colA.map(row).join("")}</div>
    <div style="flex:1;">${colB.map(row).join("")}</div>
  </div>`;
}

function renderOverview(p) {
  const size = hookSize(p.headline);
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
@font-face { font-family:'Playfair Display'; font-weight:700; src:url(data:font/woff2;base64,${FONT_PLAYFAIR}) format('woff2'); }
@font-face { font-family:'Inter'; font-weight:400; src:url(data:font/woff2;base64,${FONT_INTER_400}) format('woff2'); }
@font-face { font-family:'Inter'; font-weight:600; src:url(data:font/woff2;base64,${FONT_INTER_600}) format('woff2'); }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:${t.bg}; font-family:'Inter',sans-serif; }
.canvas {
  position:relative; width:${WIDTH}px; height:${HEIGHT}px; background-color:${t.bg};
  background-image: linear-gradient(to right, ${t.grid} 1px, transparent 1px), linear-gradient(to bottom, ${t.grid} 1px, transparent 1px);
  background-size: 54px 54px;
}
.frame { position:absolute; top:56px; left:56px; right:56px; bottom:56px; border:1px solid ${t.border}; }
.col { position:absolute; left:90px; right:90px; top:60px; bottom:112px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; overflow:hidden; }
.logo-we { font-family:'Playfair Display',serif; font-weight:700; font-size:34px; color:${t.accent}; text-shadow:0 0 20px ${t.glow}; line-height:1; }
.rule { width:100%; height:1px; background:${t.border}; margin:22px 0; flex-shrink:0; }
.kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:18px; letter-spacing:4px; text-transform:uppercase; color:${t.kicker}; }
.headline { font-family:'Playfair Display',serif; font-weight:700; line-height:1.14; color:${t.headline}; text-shadow:0 0 26px ${t.glow}; margin-top:15px; }
.headline .accent { color:${t.accent}; }
.hook-subtext { font-family:'Inter',sans-serif; font-weight:400; font-size:22px; line-height:1.45; color:${t.subtext}; max-width:760px; margin:16px auto 0; }
.points-kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:17px; letter-spacing:3px; text-transform:uppercase; color:${t.kicker}; margin-top:68px; }
.points-headline { font-family:'Playfair Display',serif; font-weight:700; font-size:37px; color:${t.headline}; margin-top:12px; margin-bottom:30px; }
.cta-kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:17px; letter-spacing:4px; text-transform:uppercase; color:${t.kicker}; margin-top:92px; }
.cta-headline { font-family:'Playfair Display',serif; font-weight:700; font-size:34px; line-height:1.2; color:${t.headline}; margin-top:14px; max-width:800px; }
.contact-box { border:1px solid ${t.border}; padding:14px 32px; margin-top:38px; flex-shrink:0; }
.contact-box a, .contact-box span { display:block; font-family:'Inter',sans-serif; font-weight:600; font-size:18px; text-align:center; }
.contact-email { color:${t.accent}; margin-bottom:6px; text-decoration:none; }
.contact-web { color:${t.headline}; font-weight:400; }
.footer { position:absolute; left:104px; right:104px; bottom:76px; display:flex; justify-content:space-between; font-family:'Inter',sans-serif; font-weight:600; font-size:14px; letter-spacing:3px; text-transform:uppercase; color:${t.footer}; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="frame"></div>
    <div class="col">
      <div class="logo-we">WE</div>
      <div class="rule"></div>

      <div class="kicker">${p.kicker}</div>
      <h1 class="headline" style="font-size:${size}px;">${toHtml(p.headline)}</h1>
      <p class="hook-subtext">${p.subtext}</p>

      <div class="points-kicker">${p.pointsKicker}</div>
      <div class="points-headline">${p.pointsHeadline}</div>
      ${pointsList(p.points)}

      <div class="cta-kicker">DEIN PROJEKT</div>
      <div class="cta-headline">${p.ctaHeadline}</div>
      <div class="contact-box">
        <a class="contact-email" href="mailto:webdesignehmann@gmail.com">webdesignehmann@gmail.com</a>
        <span class="contact-web">www.webdesign-ehmann.de</span>
      </div>
    </div>
    <div class="footer">
      <span>Webdesign Ehmann</span>
      <span>Übersicht</span>
    </div>
  </div>
</body>
</html>`;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function screenshot(htmlPath, pngPath) {
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=2", `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${pngPath}`, "file:///" + htmlPath.replace(/\\/g, "/"),
  ], { stdio: "ignore" });
}

const OVERVIEWS = [
  {
    slug: "checkliste-5-dinge",
    folder: "Checkliste 5 Dinge",
    outFile: "checkliste-5-dinge-uebersicht.png",
    kicker: "CHECKLISTE",
    headline: ["5 Dinge, die auf jeder", "<span class=\"accent\">Handwerker-Website</span>", "stehen müssen"],
    subtext: "Sonst verlierst du Kunden, bevor sie überhaupt anrufen.",
    pointsKicker: "DIE CHECKLISTE",
    pointsHeadline: "Schon alle fünf auf deiner Seite?",
    points: [
      "Aktuelle Öffnungszeiten",
      "Klickbare Telefonnummer",
      "Adresse mit Karte",
      "Echte Fotos vom Betrieb",
      "Ein Kontaktweg ohne Umwege",
    ],
    ctaHeadline: "Ich schau mir deine aktuelle Website kurz an und sage dir ehrlich, was fehlt.",
  },
  {
    slug: "cookie-banner-mythos",
    folder: "Cookie Banner Mythos",
    outFile: "cookie-banner-mythos-uebersicht.png",
    kicker: "DATENSCHUTZ-MYTHOS",
    headline: ["Deine Website braucht", "<span class=\"accent\">wahrscheinlich keinen</span>", "Cookie-Banner"],
    subtext: "Und das ist gut so — für dich und deine Besucher.",
    pointsKicker: "SO MACHE ICH ES",
    pointsHeadline: "Ohne Banner, ohne Tricks",
    points: [
      "Banner nur nötig bei Tracking-Skripten",
      "Kein Google Analytics, keine Fremd-Cookies",
      "Cloudflare Web Analytics statt Cookie-Banner",
    ],
    ctaHeadline: "Ich schau's mir kurz an und sage dir ehrlich, wie es bei dir aussieht.",
  },
  {
    slug: "cookie-banner-mythos-2",
    folder: "Cookie Banner Mythos 2",
    outFile: "cookie-banner-mythos-2-uebersicht.png",
    kicker: "DATENSCHUTZ-MYTHOS · TEIL 2",
    headline: ["Warum ich auf", "Cookie-Banner <span class=\"accent\">verzichte</span>"],
    subtext: "Kein Trick, keine Ausnahme — bei jedem einzelnen Projekt.",
    pointsKicker: "MEINE BILANZ",
    pointsHeadline: "So arbeite ich — von Anfang an",
    points: [
      "Kein Tracking, kein Banner nötig",
      "0 Tracking- oder Analyse-Skripte auf jeder Website",
      "Keine Bannerfläche, die Besucher erst wegklicken müssen",
    ],
    ctaHeadline: "Fragen zum Datenschutz auf deiner Website? Schreib mir einfach.",
  },
  {
    slug: "mobile-realitaetscheck",
    folder: "Mobile Realitaetscheck",
    outFile: "mobile-realitaetscheck-uebersicht.png",
    kicker: "MOBILE-CHECK",
    headline: ["Über die Hälfte kommt", "vom <span class=\"accent\">Handy</span>"],
    subtext: "Hast du deine eigene Website schon mal selbst auf dem Smartphone getestet?",
    pointsKicker: "WORAUF ES ANKOMMT",
    pointsHeadline: "Mobil muss es einfach funktionieren",
    points: [
      "Telefonnummer klickbar, Menü nicht im Weg",
      "Sticky-Anruf-Button immer sichtbar",
      "70% nutzen den „Anrufen“-Button direkt in der Google-Suche",
    ],
    ctaHeadline: "Öffne deine Website mal auf dem Handy — oder lass mich das für dich prüfen.",
  },
  {
    slug: "nach-dem-livegang",
    folder: "Nach Dem Livegang",
    outFile: "nach-dem-livegang-uebersicht.png",
    kicker: "NACH DEM LIVEGANG",
    headline: ["Eine Website", "ist nie wirklich", "<span class=\"accent\">fertig</span>"],
    subtext: "Und das ist auch gut so.",
    pointsKicker: "WAS ICH ÜBERNEHME",
    pointsHeadline: "Läuft im Hintergrund mit",
    points: [
      "Updates & Sicherheit",
      "Neue Inhalte & Fotos",
      "Erweiterungen nach Bedarf",
    ],
    ctaHeadline: "Ein Begleiter, kein abgeschlossenes Projekt — lass uns über deine Website sprechen.",
  },
  {
    slug: "tipp-kontaktformular",
    folder: "Tipp Kontaktformular",
    outFile: "tipp-kontaktformular-uebersicht.png",
    kicker: "TIPP",
    headline: ["Warum ein „mailto:“-", "Link <span class=\"accent\">schadet</span>"],
    subtext: "Kleines Detail, großer Unterschied für deine Kunden.",
    pointsKicker: "SO LÖSE ICH ES",
    pointsHeadline: "Ein echtes Kontaktformular",
    points: [
      "Keine sichtbare E-Mail-Adresse im Code",
      "Funktioniert auch ohne Mail-App",
      "Name, Nachricht, E-Mail — direkt an dich",
    ],
    ctaHeadline: "Bei jedem meiner Projekte Standard — schreib mir, wenn du das auch für deine Website willst.",
  },
  {
    slug: "serie-marketing",
    folder: "serie-marketing",
    outFile: "serie-marketing-uebersicht.png",
    kicker: "MARKETING · SERIE TEIL 3",
    headline: ["Ein Auftritt.", "<span class=\"accent\">Überall.</span>"],
    subtext: "Social Media, Flyer und Logo — auf Wunsch übernehme ich auch das, im selben Design wie deine Website.",
    pointsKicker: "AUS EINER HAND",
    pointsHeadline: "Ein einheitlicher Auftritt",
    points: [
      "Social-Media-Beiträge im Website-Design",
      "Flyer für Aktionen & Veranstaltungen",
      "Logo als Basis für alles",
      "Kunden erkennen dich überall wieder",
    ],
    ctaHeadline: "Auch Social Media, Flyer oder Logo aus einer Hand? Schreib mir — wir besprechen gemeinsam, was zu deinem Betrieb passt.",
  },
];

ensureDir(TMP);
OVERVIEWS.forEach((p) => {
  const html = renderOverview(p);
  const htmlPath = path.join(TMP, `uebersicht-${p.slug}.html`);
  fs.writeFileSync(htmlPath, html, "utf8");
  const outDir = path.join(OUT_ROOT, p.folder);
  ensureDir(outDir);
  const pngPath = path.join(outDir, p.outFile);
  screenshot(htmlPath, pngPath);
  console.log("OK", p.outFile);
});
console.log("Fertig.");
