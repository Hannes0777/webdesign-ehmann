// Baut eine einzelne "Übersicht"-Grafik aus einem Carousel-Post — zum Teilen
// außerhalb von Instagram (Facebook-Post, WhatsApp), nach dem Vorbild von
// Gepostet/Firmenvorstellung/firmenvorstellung-uebersicht.png.
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
function imgDataUri(relPath) {
  const data = fs.readFileSync(path.join(ROOT, relPath)).toString("base64");
  return `data:image/png;base64,${data}`;
}

const FONT_PLAYFAIR = b64("playfair-700.woff2");
const FONT_INTER_400 = b64("inter-400.woff2");
const FONT_INTER_600 = b64("inter-600.woff2");

const t = {
  bg: "#14171A",
  grid: "#22211E",
  border: "#6D5A37",
  kicker: "#D9AE5C",
  headline: "#F5F6F3",
  accent: "#D9AE5C",
  subtext: "#9AA39C",
  divider: "#D9AE5C",
  footer: "#8B9389",
  glow: "rgba(255,255,255,0.22)",
  mutedStrong: "rgba(154,163,156,0.55)",
};

function flyerCard(dataUri, { w, h, borderColor }) {
  return `
  <div style="width:${w}px; height:${h}px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.4); border:2px solid ${borderColor}; box-sizing:border-box;">
    <img src="${dataUri}" style="width:100%; height:100%; object-fit:cover; object-position:top center; display:block;">
  </div>`;
}

const html = `<!DOCTYPE html>
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
.col { position:absolute; left:90px; right:90px; top:80px; display:flex; flex-direction:column; align-items:center; text-align:center; }
.logo-we { font-family:'Playfair Display',serif; font-weight:700; font-size:74px; color:${t.accent}; text-shadow:0 0 30px ${t.glow}; line-height:1; }
.logo-name { font-family:'Playfair Display',serif; font-weight:700; font-size:34px; letter-spacing:6px; color:${t.headline}; margin-top:14px; }
.logo-tag { font-family:'Playfair Display',serif; font-style:italic; font-size:19px; color:${t.subtext}; margin-top:10px; }
.rule { width:100%; height:1px; background:${t.border}; margin:34px 0; }
.kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:16px; letter-spacing:4px; text-transform:uppercase; color:${t.kicker}; }
.headline { font-family:'Playfair Display',serif; font-weight:700; font-size:52px; line-height:1.14; color:${t.headline}; text-shadow:0 0 30px ${t.glow}; margin-top:16px; }
.headline .accent { color:${t.accent}; }
.divider { width:100px; height:2px; background:${t.divider}; margin:28px 0; }
.cards { display:flex; gap:24px; margin-top:8px; }
.card-label { font-family:'Inter',sans-serif; font-weight:600; font-size:14px; letter-spacing:3px; margin-bottom:12px; }
.caption { font-family:'Inter',sans-serif; font-weight:400; font-size:21px; line-height:1.5; color:${t.subtext}; max-width:760px; margin-top:30px; }
.cta-kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:15px; letter-spacing:4px; text-transform:uppercase; color:${t.kicker}; }
.cta-headline { font-family:'Playfair Display',serif; font-weight:700; font-size:36px; color:${t.headline}; margin-top:12px; max-width:720px; }
.contact-box { border:1px solid ${t.border}; padding:20px 34px; margin-top:26px; }
.contact-box a, .contact-box span { display:block; font-family:'Inter',sans-serif; font-weight:600; font-size:19px; text-align:center; }
.contact-email { color:${t.accent}; margin-bottom:6px; }
.contact-web { color:${t.headline}; font-weight:400; }
.footer { position:absolute; left:104px; right:104px; bottom:88px; display:flex; justify-content:space-between; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; text-transform:uppercase; color:${t.footer}; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="frame"></div>
    <div class="col">
      <div class="logo-we">WE</div>
      <div class="logo-name">WEBDESIGN.EHMANN</div>
      <div class="logo-tag">Handgebaut. Nicht aus dem Baukasten.</div>
      <div class="rule"></div>

      <div class="kicker">MAL EHRLICH</div>
      <h1 class="headline">Kostenlos erstellt.<br><span class="accent">Nichts gebracht.</span></h1>
      <div class="divider"></div>

      <div class="cards">
        <div>
          <div class="card-label" style="color:${t.mutedStrong};">ALT</div>
          ${flyerCard(imgDataUri("compare/alt-flyer.png"), { w: 300, h: 420, borderColor: t.mutedStrong })}
        </div>
        <div>
          <div class="card-label" style="color:${t.accent};">NEU</div>
          ${flyerCard(imgDataUri("compare/neu-flyer.png"), { w: 300, h: 420, borderColor: t.accent })}
        </div>
      </div>
      <p class="caption">Gleiche Botschaft, anderer Eindruck: Der gleiche KI-Tool-Look, den mittlerweile jeder benutzt — gegen einen Auftritt, den man sich merkt.</p>

      <div class="rule" style="margin-top:34px;"></div>
      <div class="cta-kicker">DEIN PROJEKT</div>
      <div class="cta-headline">Bereit für einen Flyer, der wirklich auffällt?</div>
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

fs.mkdirSync(TMP, { recursive: true });
const htmlPath = path.join(TMP, "uebersicht-ki-flyer-vergleich.html");
fs.writeFileSync(htmlPath, html, "utf8");

const outDir = path.join(OUT_ROOT, "KI Flyer Vergleich");
fs.mkdirSync(outDir, { recursive: true });
const pngPath = path.join(outDir, "ki-flyer-vergleich-uebersicht.png");

execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${pngPath}`,
    "file:///" + htmlPath.replace(/\\/g, "/"),
  ],
  { stdio: "ignore" }
);

console.log("OK", pngPath);
