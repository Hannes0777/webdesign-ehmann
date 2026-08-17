const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { POSTS, ICONS } = require("./content.js");

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
    iconStroke: "#D9AE5C",
  },
  hell: {
    bg: "#F7F2E7",
    grid: "#EDE2CC",
    border: "#D5BB95",
    kicker: "#B98F3F",
    headline: "#231F19",
    accent: "#B98F3F",
    subtext: "#6C6558",
    divider: "#B98F3F",
    footer: "#6C6558",
    glow: "rgba(35,31,25,0.18)",
    iconStroke: "#B98F3F",
  },
};

function iconSvg(name, color) {
  const inner = ICONS[name] || ICONS.spark;
  return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function renderSlide({ theme, slideIndex, total, kicker, headline, subtext, icon, isCover }) {
  const t = THEMES[theme];
  const headlineHtml = Array.isArray(headline)
    ? headline.join("<br>")
    : headline;
  const counter = `${String(slideIndex).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;
  const showArrow = slideIndex < total;

  const bodyBlock = isCover
    ? `
    <div class="cover">
      <div class="kicker center">${kicker}</div>
      <h1 class="headline center">${headlineHtml}</h1>
      <div class="divider"></div>
      <p class="subtext center">${subtext}</p>
    </div>`
    : `
    <div class="content">
      ${icon ? `<div class="icon-badge">${iconSvg(icon, t.iconStroke)}</div>` : ""}
      <div class="kicker left">${kicker}</div>
      <h1 class="headline left">${headlineHtml}</h1>
      <p class="subtext left">${subtext}</p>
    </div>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-weight: 700;
  src: url(data:font/woff2;base64,${FONT_PLAYFAIR}) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url(data:font/woff2;base64,${FONT_INTER_400}) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  src: url(data:font/woff2;base64,${FONT_INTER_600}) format('woff2');
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  overflow: hidden;
  background: ${t.bg};
  font-family: 'Inter', sans-serif;
}
.canvas {
  position: relative;
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  background-color: ${t.bg};
  background-image:
    linear-gradient(to right, ${t.grid} 1px, transparent 1px),
    linear-gradient(to bottom, ${t.grid} 1px, transparent 1px);
  background-size: 54px 54px;
}
.frame {
  position: absolute;
  top: 56px; left: 56px; right: 56px; bottom: 56px;
  border: 1px solid ${t.border};
}
.cover {
  position: absolute;
  left: 104px; right: 104px; top: 340px;
  text-align: center;
}
.content {
  position: absolute;
  left: 104px; right: 104px; top: 396px;
}
.kicker {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${t.kicker};
}
.kicker.center { text-align: center; }
.kicker.left { margin-top: 24px; }
.headline {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 60px;
  line-height: 1.16;
  color: ${t.headline};
  text-shadow: 0 0 34px ${t.glow};
  margin-top: 18px;
}
.headline.center { text-align: center; }
.headline.left { text-align: left; font-size: 54px; }
.headline .accent { color: ${t.accent}; }
.divider {
  width: 108px;
  height: 2px;
  background: ${t.divider};
  margin: 38px auto 34px;
}
.subtext {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 27px;
  line-height: 1.55;
  color: ${t.subtext};
}
.subtext.center { text-align: center; max-width: 760px; margin: 0 auto; }
.subtext.left { text-align: left; max-width: 720px; margin-top: 26px; }
.icon-badge {
  width: 84px; height: 84px;
  border-radius: 50%;
  border: 1px solid ${t.kicker};
  display: flex; align-items: center; justify-content: center;
}
.arrow {
  position: absolute;
  right: 104px; bottom: 242px;
}
.footer {
  position: absolute;
  left: 104px; right: 104px; bottom: 88px;
  display: flex; justify-content: space-between; align-items: center;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: ${t.footer};
}
</style>
</head>
<body>
  <div class="canvas">
    <div class="frame"></div>
    ${bodyBlock}
    ${showArrow ? `<div class="arrow">${iconSvg("arrowRight", t.kicker)}</div>` : ""}
    <div class="footer">
      <span>Webdesign Ehmann</span>
      <span>${counter}</span>
    </div>
  </div>
</body>
</html>`;
}

ICONS.arrowRight = `<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>`;

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function screenshot(htmlPath, pngPath) {
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
}

ensureDir(TMP);

for (const post of POSTS) {
  const total = post.slides.length;
  for (const theme of ["dunkel", "hell"]) {
    const outDir = path.join(OUT_ROOT, post.folder, theme);
    ensureDir(outDir);
    post.slides.forEach((slide, i) => {
      const slideIndex = i + 1;
      const html = renderSlide({
        theme,
        slideIndex,
        total,
        kicker: slide.kicker,
        headline: slide.headline,
        subtext: slide.subtext,
        icon: slide.icon,
        isCover: i === 0,
      });
      const htmlPath = path.join(TMP, `slide-${slideIndex}-${theme}.html`);
      fs.writeFileSync(htmlPath, html, "utf8");
      const pngPath = path.join(outDir, `slide-${slideIndex}.png`);
      screenshot(htmlPath, pngPath);
      console.log("OK", post.folder, theme, slideIndex);
    });
  }
}

console.log("Fertig.");
