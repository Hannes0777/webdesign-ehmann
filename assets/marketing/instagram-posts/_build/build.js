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
    cardBg: "rgba(217,174,92,0.045)",
    cardBorder: "rgba(217,174,92,0.35)",
    muted: "rgba(154,163,156,0.35)",
    mutedStrong: "rgba(154,163,156,0.55)",
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
    cardBg: "rgba(185,143,63,0.06)",
    cardBorder: "rgba(185,143,63,0.4)",
    muted: "rgba(108,101,88,0.3)",
    mutedStrong: "rgba(108,101,88,0.5)",
  },
};

function iconSvg(name, color, size = 30) {
  const inner = ICONS[name] || ICONS.check;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function lineCount(headline) {
  if (Array.isArray(headline)) return headline.length;
  const brCount = (headline.match(/<br\s*\/?>/g) || []).length;
  return brCount + 1;
}

function headlineSize(headline) {
  const n = lineCount(headline);
  if (n <= 1) return 84;
  if (n === 2) return 72;
  return 60;
}

function browserCard(t, kind) {
  const messy = kind === "before";
  const barColor = messy ? t.mutedStrong : t.accent;
  const lineColor = messy ? t.muted : t.mutedStrong;
  const imgBlock = messy
    ? `<div style="position:absolute; top:56px; left:28px; width:120px; height:64px; border:1px solid ${t.muted};"></div>
       <div style="position:absolute; top:74px; left:96px; width:150px; height:40px; border:1px solid ${t.muted};"></div>`
    : `<div style="width:100%; height:92px; border:1px solid ${t.cardBorder}; margin-bottom:22px;"></div>`;
  const lines = messy
    ? `<div style="position:absolute; top:132px; left:26px; width:210px; height:8px; background:${lineColor};"></div>
       <div style="position:absolute; top:150px; left:56px; width:150px; height:8px; background:${lineColor};"></div>
       <div style="position:absolute; top:168px; left:26px; width:190px; height:8px; background:${lineColor};"></div>
       <div style="position:absolute; top:196px; left:70px; width:120px; height:8px; background:${lineColor};"></div>
       <div style="position:absolute; top:222px; left:26px; width:230px; height:8px; background:${lineColor};"></div>
       <div style="position:absolute; top:250px; left:40px; width:170px; height:8px; background:${lineColor};"></div>`
    : `<div style="width:70%; height:9px; background:${lineColor}; margin-bottom:16px;"></div>
       <div style="width:90%; height:9px; background:${lineColor}; margin-bottom:16px;"></div>
       <div style="width:50%; height:9px; background:${lineColor}; margin-bottom:28px;"></div>
       <div style="width:118px; height:30px; background:${barColor};"></div>`;
  return `
  <div style="width:326px; height:352px; border:1px solid ${t.cardBorder}; background:${t.cardBg}; position:relative; padding:22px; box-sizing:border-box;">
    <div style="display:flex; gap:6px; margin-bottom:${messy ? "0" : "18px"};">
      <div style="width:7px;height:7px;border-radius:50%;background:${t.muted};"></div>
      <div style="width:7px;height:7px;border-radius:50%;background:${t.muted};"></div>
      <div style="width:7px;height:7px;border-radius:50%;background:${t.muted};"></div>
    </div>
    ${messy ? `<div style="position:relative; height:270px;">${imgBlock}${lines}</div>` : `${imgBlock}${lines}`}
  </div>`;
}

function renderBody(slide, t) {
  if (slide.kind === "stat") {
    return `
    <div class="kicker center">${slide.kicker}</div>
    <div class="stat-number">${slide.number}</div>
    <div class="divider"></div>
    <p class="subtext center">${slide.label}</p>`;
  }

  if (slide.kind === "mockup-compare") {
    const size = headlineSize(slide.headline);
    const headlineHtml = Array.isArray(slide.headline) ? slide.headline.join("<br>") : slide.headline;
    return `
    <div class="kicker center">${slide.kicker}</div>
    <h1 class="headline center" style="font-size:${size}px;">${headlineHtml}</h1>
    <div class="divider" style="margin-top:30px; margin-bottom:36px;"></div>
    <div style="display:flex; gap:24px; justify-content:center; align-items:flex-start;">
      <div>
        <div style="text-align:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; color:${t.mutedStrong}; margin-bottom:14px;">${slide.beforeLabel}</div>
        ${browserCard(t, "before")}
      </div>
      <div>
        <div style="text-align:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; color:${t.accent}; margin-bottom:14px;">${slide.afterLabel}</div>
        ${browserCard(t, "after")}
      </div>
    </div>`;
  }

  if (slide.kind === "mockup-form") {
    const size = headlineSize(slide.headline);
    const headlineHtml = Array.isArray(slide.headline) ? slide.headline.join("<br>") : slide.headline;
    const field = (label, tall) => `
      <div style="text-align:left; margin-bottom:22px;">
        <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:2px; color:${t.mutedStrong}; margin-bottom:8px;">${label}</div>
        <div style="height:${tall ? "84px" : "44px"}; border:1px solid ${t.cardBorder};"></div>
      </div>`;
    return `
    <div class="kicker center">${slide.kicker}</div>
    <h1 class="headline center" style="font-size:${size}px;">${headlineHtml}</h1>
    <div class="divider" style="margin-top:30px; margin-bottom:40px;"></div>
    <div style="width:560px; margin:0 auto; background:${t.cardBg}; border:1px solid ${t.cardBorder}; padding:36px; box-sizing:border-box;">
      ${field("NAME")}
      ${field("E-MAIL")}
      ${field("NACHRICHT", true)}
      <div style="display:flex; justify-content:flex-end;">
        <div style="background:${t.accent}; color:${t.bg}; font-family:'Inter',sans-serif; font-weight:600; font-size:15px; letter-spacing:2px; padding:14px 28px;">SENDEN</div>
      </div>
    </div>`;
  }

  if (slide.kind === "checklist") {
    const size = headlineSize(slide.headline);
    const headlineHtml = Array.isArray(slide.headline) ? slide.headline.join("<br>") : slide.headline;
    const rows = slide.items
      .map(
        (item) => `
      <div style="display:flex; align-items:center; gap:18px; margin-bottom:22px;">
        <div style="width:36px; height:36px; border-radius:50%; border:1px solid ${t.accent}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          ${iconSvg("check", t.accent, 18)}
        </div>
        <div style="font-family:'Inter',sans-serif; font-weight:400; font-size:27px; color:${t.headline};">${item}</div>
      </div>`
      )
      .join("");
    return `
    <div class="kicker center">${slide.kicker}</div>
    <h1 class="headline center" style="font-size:${size}px;">${headlineHtml}</h1>
    <div class="divider" style="margin-top:30px; margin-bottom:40px;"></div>
    <div style="width:520px; margin:0 auto;">${rows}</div>`;
  }

  // default: hero
  const size = headlineSize(slide.headline);
  const headlineHtml = Array.isArray(slide.headline) ? slide.headline.join("<br>") : slide.headline;
  return `
    <div class="kicker center">${slide.kicker}</div>
    <h1 class="headline center" style="font-size:${size}px;">${headlineHtml}</h1>
    <div class="divider"></div>
    <p class="subtext center">${slide.subtext}</p>`;
}

function renderSlide({ theme, slideIndex, total, slide }) {
  const t = THEMES[theme];
  const counter = `${String(slideIndex).padStart(2, "0")} · ${String(total).padStart(2, "0")}`;
  const showArrow = slideIndex < total;

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
.content {
  position: absolute;
  left: 104px; right: 104px; top: 300px;
  text-align: center;
}
.kicker {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${t.kicker};
}
.kicker.center { text-align: center; }
.headline {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  line-height: 1.14;
  color: ${t.headline};
  text-shadow: 0 0 34px ${t.glow};
  margin-top: 22px;
}
.headline.center { text-align: center; }
.headline .accent { color: ${t.accent}; }
.divider {
  width: 116px;
  height: 2px;
  background: ${t.divider};
  margin: 40px auto 36px;
}
.subtext {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 28px;
  line-height: 1.55;
  color: ${t.subtext};
}
.subtext.center { text-align: center; max-width: 820px; margin: 0 auto; }
.stat-number {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 180px;
  line-height: 1;
  color: ${t.accent};
  text-align: center;
  margin-top: 30px;
  text-shadow: 0 0 44px ${t.glow};
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
    <div class="content">${renderBody(slide, t)}</div>
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
      const html = renderSlide({ theme, slideIndex, total, slide });
      const htmlPath = path.join(TMP, `slide-${slideIndex}-${theme}.html`);
      fs.writeFileSync(htmlPath, html, "utf8");
      const pngPath = path.join(outDir, `slide-${slideIndex}.png`);
      screenshot(htmlPath, pngPath);
      console.log("OK", post.folder, theme, slideIndex, slide.kind);
    });
  }
}

console.log("Fertig.");
