// Rebaut NUR die Slide-1-Cover (Headline groß + vertikal mittig) der älteren
// Serien, die noch nicht auf den neuen content.js/build.js-Generator laufen
// (kein Quellcode vorhanden, nur PNGs). Andere Slides bleiben unangetastet.
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

const THEMES = {
  dunkel: {
    bg: "#14171A", grid: "#22211E", border: "#6D5A37",
    kicker: "#D9AE5C", headline: "#F5F6F3", accent: "#D9AE5C",
    subtext: "#9AA39C", divider: "#D9AE5C", footer: "#8B9389",
    glow: "rgba(255,255,255,0.22)",
  },
  hell: {
    bg: "#F7F2E7", grid: "#EDE2CC", border: "#D5BB95",
    kicker: "#B98F3F", headline: "#231F19", accent: "#B98F3F",
    subtext: "#6C6558", divider: "#B98F3F", footer: "#6C6558",
    glow: "rgba(35,31,25,0.18)",
  },
  blau: {
    bg: "#0D1526", grid: "#16213A", border: "#3D5A85",
    kicker: "#5B9BFF", headline: "#F4F6FB", accent: "#5B9BFF",
    subtext: "#A7B3D1", divider: "#5B9BFF", footer: "#8C9AC0",
    glow: "rgba(91,155,255,0.28)",
  },
};

function toHtml(headline) {
  return Array.isArray(headline) ? headline.join("<br>") : headline;
}
function lineCount(headline) {
  return Array.isArray(headline) ? headline.length : (headline.match(/<br\s*\/?>/g) || []).length + 1;
}
function headlineSize(headline) {
  const n = lineCount(headline);
  if (n <= 1) return 118;
  if (n === 2) return 98;
  return 80;
}

function renderSlide({ theme, kicker, headline, subtext, counter, showArrow }) {
  const t = THEMES[theme];
  const size = headlineSize(headline);
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
@font-face { font-family:'Playfair Display'; font-style:normal; font-weight:700; src:url(data:font/woff2;base64,${FONT_PLAYFAIR}) format('woff2'); }
@font-face { font-family:'Inter'; font-style:normal; font-weight:400; src:url(data:font/woff2;base64,${FONT_INTER_400}) format('woff2'); }
@font-face { font-family:'Inter'; font-style:normal; font-weight:600; src:url(data:font/woff2;base64,${FONT_INTER_600}) format('woff2'); }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:${t.bg}; font-family:'Inter',sans-serif; }
.canvas {
  position:relative; width:${WIDTH}px; height:${HEIGHT}px; background-color:${t.bg};
  background-image: linear-gradient(to right, ${t.grid} 1px, transparent 1px), linear-gradient(to bottom, ${t.grid} 1px, transparent 1px);
  background-size: 54px 54px;
}
.frame { position:absolute; top:56px; left:56px; right:56px; bottom:56px; border:1px solid ${t.border}; }
.content { position:absolute; left:104px; right:104px; top:150px; bottom:280px; display:flex; flex-direction:column; justify-content:center; text-align:center; }
.kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:16px; letter-spacing:4px; text-transform:uppercase; color:${t.kicker}; text-align:center; }
.headline { font-family:'Playfair Display',serif; font-weight:700; line-height:1.14; color:${t.headline}; text-shadow:0 0 34px ${t.glow}; margin-top:20px; text-align:center; }
.headline .accent { color:${t.accent}; }
.divider { width:116px; height:2px; background:${t.divider}; margin:40px auto 36px; }
.subtext { font-family:'Inter',sans-serif; font-weight:400; font-size:27px; line-height:1.5; color:${t.subtext}; text-align:center; max-width:820px; margin:0 auto; }
.arrow { position:absolute; right:104px; bottom:242px; }
.footer { position:absolute; left:104px; right:104px; bottom:88px; display:flex; justify-content:space-between; align-items:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; text-transform:uppercase; color:${t.footer}; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="frame"></div>
    <div class="content">
      <div class="kicker">${kicker}</div>
      <h1 class="headline" style="font-size:${size}px;">${toHtml(headline)}</h1>
      <div class="divider"></div>
      <p class="subtext">${subtext}</p>
    </div>
    ${showArrow ? `<div class="arrow"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${t.kicker}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15"/><path d="M13 6l6 6-6 6"/></svg></div>` : ""}
    <div class="footer">
      <span>Webdesign Ehmann</span>
      ${counter ? `<span>${counter}</span>` : ""}
    </div>
  </div>
</body>
</html>`;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function screenshot(htmlPath, pngPath) {
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${pngPath}`, "file:///" + htmlPath.replace(/\\/g, "/"),
  ], { stdio: "ignore" });
}

const SLIDES = [
  { out: "Ablauf/dunkel/slide-1.png", theme: "dunkel", total: 6,
    kicker: "ABLAUF", headline: ["So läuft ein", "<span class=\"accent\">Projekt</span>", "bei mir ab"],
    subtext: "Vom ersten Gespräch bis zur fertigen Website." },
  { out: "Ablauf/hell/slide-1.png", theme: "hell", total: 6,
    kicker: "ABLAUF", headline: ["So läuft ein", "<span class=\"accent\">Projekt</span>", "bei mir ab"],
    subtext: "Vom ersten Gespräch bis zur fertigen Website." },

  { out: "Checkliste 5 Dinge/dunkel/slide-1.png", theme: "dunkel", total: 7,
    kicker: "CHECKLISTE", headline: ["5 Dinge, die auf jeder", "<span class=\"accent\">Handwerker-Website</span>", "stehen müssen"],
    subtext: "Sonst verlierst du Kunden, bevor sie überhaupt anrufen." },
  { out: "Checkliste 5 Dinge/hell/slide-1.png", theme: "hell", total: 7,
    kicker: "CHECKLISTE", headline: ["5 Dinge, die auf jeder", "<span class=\"accent\">Handwerker-Website</span>", "stehen müssen"],
    subtext: "Sonst verlierst du Kunden, bevor sie überhaupt anrufen." },

  { out: "Cookie Banner Mythos/dunkel/slide-1.png", theme: "dunkel", total: 5,
    kicker: "DATENSCHUTZ-MYTHOS", headline: ["Deine Website braucht", "<span class=\"accent\">wahrscheinlich keinen</span>", "Cookie-Banner"],
    subtext: "Und das ist gut so — für dich und deine Besucher." },
  { out: "Cookie Banner Mythos/hell/slide-1.png", theme: "hell", total: 5,
    kicker: "DATENSCHUTZ-MYTHOS", headline: ["Deine Website braucht", "<span class=\"accent\">wahrscheinlich keinen</span>", "Cookie-Banner"],
    subtext: "Und das ist gut so — für dich und deine Besucher." },

  { out: "Google Business Profil/dunkel/slide-1.png", theme: "dunkel", total: 5,
    kicker: "HÄUFIGE FRAGE", headline: ["Google Business Profil", "oder eigene Website —", "<span class=\"accent\">brauchst du beides?</span>"],
    subtext: "Kurze Antwort: ja. Hier warum." },
  { out: "Google Business Profil/hell/slide-1.png", theme: "hell", total: 5,
    kicker: "HÄUFIGE FRAGE", headline: ["Google Business Profil", "oder eigene Website —", "<span class=\"accent\">brauchst du beides?</span>"],
    subtext: "Kurze Antwort: ja. Hier warum." },
  { out: "Google Business Profil/blau/slide-1.png", theme: "blau", total: 5,
    kicker: "HÄUFIGE FRAGE", headline: ["Google Business Profil", "oder eigene Website —", "<span class=\"accent\">brauchst du beides?</span>"],
    subtext: "Kurze Antwort: ja. Hier warum." },

  { out: "serie-marketing/dunkel/slide-1.png", theme: "dunkel", total: 6,
    kicker: "MARKETING · SERIE TEIL 3", headline: ["Ein Auftritt.", "<span class=\"accent\">Überall.</span>"],
    subtext: "Social Media, Flyer und Logo – auf Wunsch übernehme ich auch das, im selben Design wie deine Website." },
  { out: "serie-marketing/hell/slide-1.png", theme: "hell", total: 6,
    kicker: "MARKETING · SERIE TEIL 3", headline: ["Ein Auftritt.", "<span class=\"accent\">Überall.</span>"],
    subtext: "Social Media, Flyer und Logo – auf Wunsch übernehme ich auch das, im selben Design wie deine Website." },

  { out: "Cas-Study-Sonnenhof/case-study-sonnenhof-slide-1.png", theme: "dunkel", total: 5,
    kicker: "DESIGN-BEISPIEL · FIKTIVER BETRIEB", headline: ["Landmetzgerei", "Sonnenhof"],
    subtext: "So könnte ein Website-Relaunch aussehen" },

  { out: "Philosophie/philosophie.png", theme: "dunkel", total: null, noArrow: true,
    kicker: "PHILOSOPHIE", headline: ["Handgebaut.", "Nicht aus dem", "Baukasten."],
    subtext: "Websites für Handwerksbetriebe und Vereine in der Region — von Hand programmiert, nicht zusammengeklickt. Keine Templates, keine überflüssige Software, die die Seite langsam macht." },
];

ensureDir(TMP);
SLIDES.forEach((s, i) => {
  const html = renderSlide({
    theme: s.theme, kicker: s.kicker, headline: s.headline, subtext: s.subtext,
    counter: s.total ? `01 · ${String(s.total).padStart(2, "0")}` : null,
    showArrow: !s.noArrow,
  });
  const htmlPath = path.join(TMP, `legacy-${i}.html`);
  fs.writeFileSync(htmlPath, html, "utf8");
  const pngPath = path.join(OUT_ROOT, s.out);
  ensureDir(path.dirname(pngPath));
  screenshot(htmlPath, pngPath);
  console.log("OK", s.out);
});
console.log("Fertig.");
