// Baut die blaue Rahmen-Grafik (1080x1350) fuer die Video-Slide von
// "Dachwerk Lindenhof Showcase" - identische Optik wie die anderen
// blauen Carousel-Slides (Frame, Grid, Kicker/Headline, Footer), mit
// einem chroma-key-gruenen Fenster an der Stelle, wo das echte
// Scroll-Video per ffmpeg eingeblendet wird (siehe compose-video.sh).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WIDTH = 1080;
const HEIGHT = 1350;
const CHROMA = "#00FF00";

function b64(file) {
  return fs.readFileSync(path.join(ROOT, "fonts", file)).toString("base64");
}
const FONT_PLAYFAIR = b64("playfair-700.woff2");
const FONT_INTER_400 = b64("inter-400.woff2");
const FONT_INTER_600 = b64("inter-600.woff2");

const t = {
  bg: "#0D1526",
  grid: "#16213A",
  border: "#3D5A85",
  kicker: "#5B9BFF",
  headline: "#F4F6FB",
  accent: "#5B9BFF",
  subtext: "#A7B3D1",
  divider: "#5B9BFF",
  footer: "#8C9AC0",
  glow: "rgba(91,155,255,0.28)",
  cardBg: "rgba(91,155,255,0.045)",
  cardBorder: "rgba(91,155,255,0.35)",
  mutedStrong: "rgba(167,179,209,0.55)",
};

// Video-Fenster-Geometrie - muss exakt zum ffmpeg-Compose-Befehl passen.
// Quellvideo (Screen-Recording des Kunden) ist 1902x910 (~2.09:1) - auf
// 1650 Breite beschnitten (aspect 1.813) fuer die Karte, damit nicht zu
// stark seitlich beschnitten werden muss.
const CARD = { x: 104, y: 420, w: 872 };
const CHROMEBAR_H = 44;
const VIDEO_ASPECT = 1650 / 910;
const VIDEO_W = CARD.w - 2;
const VIDEO_H = Math.round(VIDEO_W / VIDEO_ASPECT);
const VIDEO = { x: CARD.x + 1, y: CARD.y + CHROMEBAR_H + 1, w: VIDEO_W, h: VIDEO_H };
const CARD_H = CHROMEBAR_H + VIDEO.h + 2;

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
.content { position:absolute; left:104px; right:104px; top:100px; text-align:center; }
.kicker { font-family:'Inter',sans-serif; font-weight:600; font-size:16px; letter-spacing:3px; text-transform:uppercase; color:${t.kicker}; }
.headline { font-family:'Playfair Display',serif; font-weight:700; font-size:82px; line-height:1.14; color:${t.headline}; text-shadow:0 0 34px ${t.glow}; margin-top:20px; }
.headline .accent { color:${t.accent}; }
.divider { width:116px; height:2px; background:${t.divider}; margin:32px auto 26px; }
.subtext { font-family:'Inter',sans-serif; font-weight:400; font-size:22px; line-height:1.5; color:${t.subtext}; max-width:760px; margin:0 auto; }
.card {
  position:absolute; left:${CARD.x}px; top:${CARD.y}px; width:${CARD.w}px; height:${CARD_H}px;
  border:1px solid ${t.cardBorder}; background:${t.cardBg};
}
.chromebar { position:absolute; left:1px; top:1px; width:${CARD.w - 2}px; height:${CHROMEBAR_H}px; display:flex; align-items:center; padding:0 18px; border-bottom:1px solid ${t.cardBorder}; }
.dot { width:9px; height:9px; border-radius:50%; background:${t.mutedStrong}; margin-right:7px; }
.urlbar { margin-left:14px; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:1px; color:${t.mutedStrong}; }
.chromakey { position:absolute; left:${VIDEO.x - CARD.x}px; top:${VIDEO.y - CARD.y}px; width:${VIDEO.w}px; height:${VIDEO.h}px; background:${CHROMA}; }
.footer { position:absolute; left:104px; right:104px; bottom:88px; display:flex; justify-content:space-between; align-items:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; text-transform:uppercase; color:${t.footer}; }
.arrow { position:absolute; right:104px; bottom:242px; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="frame"></div>
    <div class="content">
      <div class="kicker">LIVE-DEMO FÜR KUNDEN · FIKTIVER BETRIEB</div>
      <h1 class="headline">Dachwerk<br><span class="accent">Lindenhof</span></h1>
      <div class="divider"></div>
      <p class="subtext">Website, Logo, Flyer und Social Media im selben Design.</p>
    </div>
    <div class="card">
      <div class="chromebar">
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        <div class="urlbar">dachwerk-lindenhof.de</div>
      </div>
      <div class="chromakey"></div>
    </div>
    <div style="position:absolute; left:104px; right:104px; top:${CARD.y + CARD_H + 16}px; text-align:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:2px; color:${t.mutedStrong};">ECHTE AUFNAHME · DACHWERK LINDENHOF</div>
    <div class="arrow"></div>
    <div class="footer">
      <span>Webdesign Ehmann</span>
      <span>01 · 06</span>
    </div>
  </div>
</body>
</html>`;

const tmpDir = path.join(ROOT, "tmp");
fs.mkdirSync(tmpDir, { recursive: true });
const htmlPath = path.join(tmpDir, "video-frame.html");
fs.writeFileSync(htmlPath, html, "utf8");

const outDir = path.join(ROOT, "video");
fs.mkdirSync(outDir, { recursive: true });
const pngPath = path.join(outDir, "frame-overlay.png");

execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${pngPath}`,
    "file:///" + htmlPath.replace(/\\/g, "/"),
  ],
  { stdio: "ignore" }
);

console.log("OK", pngPath, JSON.stringify({ CARD, VIDEO, CARD_H }));
