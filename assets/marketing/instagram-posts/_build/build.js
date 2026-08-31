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

function imgDataUri(relPath) {
  const b64img = fs.readFileSync(path.join(ROOT, relPath)).toString("base64");
  const ext = path.extname(relPath).slice(1).toLowerCase();
  const mime = ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${b64img}`;
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
    faded: "rgba(154,163,156,0.55)",
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
    faded: "rgba(108,101,88,0.55)",
    cardBg: "rgba(185,143,63,0.06)",
    cardBorder: "rgba(185,143,63,0.4)",
    muted: "rgba(108,101,88,0.3)",
    mutedStrong: "rgba(108,101,88,0.5)",
  },
  blau: {
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
    faded: "rgba(167,179,209,0.55)",
    cardBg: "rgba(91,155,255,0.045)",
    cardBorder: "rgba(91,155,255,0.35)",
    muted: "rgba(167,179,209,0.35)",
    mutedStrong: "rgba(167,179,209,0.55)",
  },
  // Navy-Hintergrund wie "blau", aber Gold statt Blau als Akzentfarbe.
  gold: {
    bg: "#0D1526",
    grid: "#16213A",
    border: "#6D5A37",
    kicker: "#D9AE5C",
    headline: "#F4F6FB",
    accent: "#D9AE5C",
    subtext: "#A7B3D1",
    divider: "#D9AE5C",
    footer: "#8C9AC0",
    glow: "rgba(217,174,92,0.28)",
    faded: "rgba(167,179,209,0.55)",
    cardBg: "rgba(217,174,92,0.045)",
    cardBorder: "rgba(217,174,92,0.35)",
    muted: "rgba(167,179,209,0.35)",
    mutedStrong: "rgba(167,179,209,0.55)",
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

function toHtml(headline) {
  return Array.isArray(headline) ? headline.join("<br>") : headline;
}

function iconBadge(t, icon) {
  if (!icon) return "";
  return `<div class="icon-badge">${iconSvg(icon, t.kicker)}</div>`;
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

const BAD_PALETTE = {
  pink: "#FF3D8F",
  cyan: "#22D3EE",
  yellow: "#FFD23D",
  photoBg: "#3a3226",
  photoBg2: "#4a3d2c",
};

function badge(text, color, top, left, rotate) {
  return `<div style="position:absolute; top:${top}px; left:${left}px; width:52px; height:52px; border-radius:50%; background:${color}; display:flex; align-items:center; justify-content:center; transform:rotate(${rotate}deg); box-shadow:0 3px 10px rgba(0,0,0,0.35);">
    <span style="font-family:'Inter',sans-serif; font-weight:800; font-size:10px; color:#1a1408; letter-spacing:0.5px;">${text}</span>
  </div>`;
}

function bunting(width) {
  const colors = [BAD_PALETTE.pink, BAD_PALETTE.cyan, BAD_PALETTE.yellow];
  let out = `<div style="position:absolute; top:0; left:0; width:${width}px; height:0; display:flex;">`;
  const n = Math.floor(width / 22);
  for (let i = 0; i < n; i++) {
    out += `<div style="width:0; height:0; border-left:11px solid transparent; border-right:11px solid transparent; border-top:16px solid ${colors[i % 3]};"></div>`;
  }
  out += `</div>`;
  return out;
}

function flyerCardBad() {
  const W = 300;
  const H = 420;
  return `
  <div style="width:${W}px; height:${H}px; position:relative; overflow:hidden; background:linear-gradient(160deg, ${BAD_PALETTE.photoBg}, ${BAD_PALETTE.photoBg2}); box-shadow:0 8px 26px rgba(0,0,0,0.4);">
    ${bunting(W)}
    <div style="position:absolute; top:34px; left:18px; width:${W - 36}px;">
      <div style="font-family:'Inter',sans-serif; font-weight:800; font-size:44px; line-height:0.95; color:#fff; text-shadow:2px 2px 0 #000, -1px -1px 0 #000; transform:rotate(-4deg); letter-spacing:-1px;">SOMMER<br>FEST</div>
      <div style="font-family:'Playfair Display',serif; font-weight:700; font-size:26px; color:${BAD_PALETTE.pink}; text-shadow:0 0 14px rgba(255,61,143,0.8); transform:rotate(3deg) translateX(10px); margin-top:6px;">Live Musik!</div>
    </div>
    <div style="position:absolute; top:170px; left:14px; width:${W - 28}px; height:118px; border:2px dashed rgba(255,255,255,0.35); display:flex; align-items:center; justify-content:center;">
      <span style="font-family:'Inter',sans-serif; font-size:11px; letter-spacing:2px; color:rgba(255,255,255,0.4);">FOTO · FOTO · FOTO</span>
    </div>
    ${badge("NEU!", BAD_PALETTE.yellow, 296, 20, -8)}
    ${badge("TOP", BAD_PALETTE.cyan, 300, 226, 10)}
    <div style="position:absolute; bottom:0; left:0; width:100%; display:flex;">
      <div style="flex:1.3; background:${BAD_PALETTE.pink}; padding:12px 10px; box-sizing:border-box;">
        <div style="font-family:'Inter',sans-serif; font-weight:800; font-size:15px; color:#fff;">14. JUNI</div>
        <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:9px; color:#fff;">AB 17 UHR!!</div>
      </div>
      <div style="flex:1; background:${BAD_PALETTE.cyan}; padding:12px 10px; box-sizing:border-box; display:flex; align-items:center; justify-content:center;">
        <div style="font-family:'Inter',sans-serif; font-weight:800; font-size:13px; color:#1a1408;">GRATIS!</div>
      </div>
    </div>
  </div>`;
}

function flyerCardImage(dataUri, { w = 300, h = 420, borderColor = null, rotate = 0 } = {}) {
  const border = borderColor ? `border:2px solid ${borderColor}; box-sizing:border-box;` : "";
  const transform = rotate ? `transform:rotate(${rotate}deg);` : "";
  return `
  <div style="width:${w}px; height:${h}px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.4); ${border} ${transform}">
    <img src="${dataUri}" style="width:100%; height:100%; object-fit:cover; object-position:top center; display:block;">
  </div>`;
}

function flyerCardGood(t) {
  const W = 300;
  const H = 420;
  return `
  <div style="width:${W}px; height:${H}px; position:relative; background:${t.cardBg}; border:1px solid ${t.cardBorder}; box-sizing:border-box; padding:26px 24px; display:flex; flex-direction:column;">
    <div style="height:150px; border:1px solid ${t.cardBorder}; margin-bottom:24px;"></div>
    <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:12px; letter-spacing:3px; color:${t.kicker};">SOMMERFEST</div>
    <div style="font-family:'Playfair Display',serif; font-weight:700; font-size:30px; line-height:1.15; color:${t.headline}; margin-top:8px;">Gasthaus<br>Lindenhof</div>
    <div style="width:44px; height:2px; background:${t.divider}; margin:18px 0;"></div>
    <div style="font-family:'Inter',sans-serif; font-weight:400; font-size:14px; color:${t.subtext};">14. Juni · Ab 17 Uhr</div>
    <div style="margin-top:auto; align-self:flex-start; border:1px solid ${t.kicker}; color:${t.kicker}; font-family:'Inter',sans-serif; font-weight:600; font-size:11px; letter-spacing:1.5px; padding:9px 16px;">MEHR ERFAHREN</div>
  </div>`;
}

function renderBody(slide, t) {
  if (slide.kind === "cover") {
    const size = headlineSize(slide.headline, true, slide.big);
    const cls = slide.big ? "content content-center content-center-hero" : "content content-center";
    return `
    <div class="${cls}">
      <div class="kicker center">${slide.kicker}</div>
      <h1 class="headline center" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <div class="divider"></div>
      <p class="subtext center">${slide.subtext}</p>
    </div>`;
  }

  if (slide.kind === "cover-photo") {
    const n = lineCount(slide.headline);
    const size = n <= 1 ? 84 : n === 2 ? 70 : 58;
    const photo = flyerCardImage(imgDataUri(slide.photo), { w: 340, h: 476, borderColor: t.cardBorder, rotate: -3 });
    return `
    <div class="content content-center content-center-photo">
      <div class="kicker center">${slide.kicker}</div>
      <div class="photo-prop">${photo}</div>
      <h1 class="headline center" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <div class="divider"></div>
      <p class="subtext center">${slide.subtext}</p>
    </div>`;
  }

  if (slide.kind === "reason") {
    return `
    <div class="content content-left">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <div class="subheadline">${slide.subheadline}</div>
      <div class="stat-number">${slide.number}</div>
      <p class="bold-line">${slide.bold}</p>
      ${slide.regular ? `<p class="subtext left" style="margin-top:14px;">${slide.regular}</p>` : ""}
      ${slide.source ? `<p class="source">${slide.source}</p>` : ""}
    </div>`;
  }

  if (slide.kind === "mockup-compare") {
    const size = headlineSize(slide.headline, false);
    return `
    <div class="content content-left">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <div class="divider" style="margin:32px 0 34px;"></div>
      <div style="display:flex; gap:24px;">
        <div>
          <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; color:${t.mutedStrong}; margin-bottom:14px;">${slide.beforeLabel}</div>
          ${browserCard(t, "before")}
        </div>
        <div>
          <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; color:${t.accent}; margin-bottom:14px;">${slide.afterLabel}</div>
          ${browserCard(t, "after")}
        </div>
      </div>
    </div>`;
  }

  if (slide.kind === "flyer-compare") {
    const size = headlineSize(slide.headline, false);
    const beforeCard = slide.beforeImage
      ? flyerCardImage(imgDataUri(slide.beforeImage), { w: 420, h: 580, borderColor: t.mutedStrong })
      : flyerCardBad();
    const afterCard = slide.afterImage
      ? flyerCardImage(imgDataUri(slide.afterImage), { w: 420, h: 580, borderColor: t.accent })
      : flyerCardGood(t);
    return `
    <div class="content content-left" style="top:210px;">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <div class="divider" style="margin:24px 0 26px;"></div>
      <div style="display:flex; gap:20px;">
        <div>
          <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; color:${t.mutedStrong}; margin-bottom:14px;">${slide.beforeLabel}</div>
          ${beforeCard}
        </div>
        <div>
          <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:3px; color:${t.accent}; margin-bottom:14px;">${slide.afterLabel}</div>
          ${afterCard}
        </div>
      </div>
    </div>`;
  }

  if (slide.kind === "mockup-form") {
    const size = headlineSize(slide.headline, false);
    const field = (label, tall) => `
      <div style="margin-bottom:24px;">
        <div style="font-family:'Inter',sans-serif; font-weight:600; font-size:14px; letter-spacing:2px; color:${t.mutedStrong}; margin-bottom:9px;">${label}</div>
        <div style="height:${tall ? "96px" : "50px"}; border:1px solid ${t.cardBorder}; background:${t.cardBg};"></div>
      </div>`;
    return `
    <div class="content content-left">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      ${slide.subtext ? `<p class="subtext left">${slide.subtext}</p>` : `<div class="divider" style="margin:32px 0 34px;"></div>`}
      <div style="display:flex; justify-content:center;">
        <div style="width:100%; max-width:700px; margin-top:30px; background:${t.cardBg}; border:1px solid ${t.cardBorder}; padding:36px; box-sizing:border-box;">
          ${field("NAME")}
          ${field("E-MAIL")}
          ${field("NACHRICHT", true)}
          <div style="display:flex; justify-content:flex-end;">
            <div style="background:${t.accent}; color:${t.bg}; font-family:'Inter',sans-serif; font-weight:600; font-size:15px; letter-spacing:2px; padding:14px 28px;">SENDEN</div>
          </div>
        </div>
      </div>
      ${slide.caption ? `<div style="margin-top:16px; text-align:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:2px; color:${t.mutedStrong};">${slide.caption}</div>` : ""}
    </div>`;
  }

  if (slide.kind === "mockup-site") {
    const size = headlineSize(slide.headline, false);
    const barColor = t.mutedStrong;
    const lineColor = t.mutedStrong;
    const w = slide.photoW || 460;
    const h = slide.photoH || 580;
    const navH = 56;
    const heroH = Math.round(h * 0.42);
    const mock = `
    <div style="width:${w}px; height:${h}px; border:1px solid ${t.cardBorder}; background:${t.cardBg}; box-sizing:border-box; overflow:hidden;">
      <div style="height:${navH}px; display:flex; align-items:center; justify-content:space-between; padding:0 20px; border-bottom:1px solid ${t.cardBorder};">
        <div style="width:70px; height:12px; background:${t.accent};"></div>
        <div style="display:flex; gap:14px;">
          <div style="width:34px; height:8px; background:${lineColor};"></div>
          <div style="width:34px; height:8px; background:${lineColor};"></div>
          <div style="width:34px; height:8px; background:${lineColor};"></div>
        </div>
      </div>
      <div style="height:${heroH}px; background:linear-gradient(135deg, ${t.cardBg}, ${t.cardBorder}22); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:0 30px;">
        <div style="width:${Math.round(w * 0.5)}px; height:14px; background:${t.headline}; opacity:0.85;"></div>
        <div style="width:${Math.round(w * 0.32)}px; height:14px; background:${t.accent};"></div>
        <div style="width:130px; height:34px; margin-top:10px; border:1px solid ${t.accent};"></div>
      </div>
      <div style="padding:26px 24px;">
        <div style="width:60%; height:9px; background:${lineColor}; margin-bottom:16px;"></div>
        <div style="width:85%; height:9px; background:${lineColor}; margin-bottom:16px;"></div>
        <div style="width:45%; height:9px; background:${lineColor}; margin-bottom:28px;"></div>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; height:${Math.round((h - navH - heroH - 130) / 2)}px; border:1px solid ${t.cardBorder};"></div>
          <div style="flex:1; height:${Math.round((h - navH - heroH - 130) / 2)}px; border:1px solid ${t.cardBorder};"></div>
        </div>
      </div>
    </div>`;
    return `
    <div class="content content-left">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <p class="subtext left">${slide.subtext}</p>
      <div style="margin-top:34px; display:flex; justify-content:center;">${mock}</div>
      ${slide.caption ? `<div style="margin-top:16px; text-align:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:2px; color:${t.mutedStrong};">${slide.caption}</div>` : ""}
    </div>`;
  }

  if (slide.kind === "checklist") {
    const size = headlineSize(slide.headline, false);
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
    <div class="content content-left">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <div class="divider" style="margin:32px 0 34px;"></div>
      <div>${rows}</div>
    </div>`;
  }

  if (slide.kind === "showcase-photo") {
    const size = headlineSize(slide.headline, false);
    const w = slide.photoW || 760;
    const h = slide.photoH || 480;
    const photo = flyerCardImage(imgDataUri(slide.photo), {
      w,
      h,
      borderColor: t.cardBorder,
      rotate: 0,
    });
    const topStyle = slide.contentTop ? ` style="top:${slide.contentTop}px;"` : "";
    return `
    <div class="content content-left"${topStyle}>
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <p class="subtext left">${slide.subtext}</p>
      <div style="margin-top:34px; display:flex; justify-content:center;">${photo}</div>
      ${slide.caption ? `<div style="margin-top:16px; text-align:center; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:2px; color:${t.mutedStrong};">${slide.caption}</div>` : ""}
    </div>`;
  }

  if (slide.kind === "cta") {
    const size = headlineSize(slide.headline, false);
    return `
    <div class="content content-left">
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <p class="subtext left" style="margin-top:22px;">${slide.subtext}</p>
      <div class="button">${slide.button}</div>
    </div>`;
  }

  // hero-left (default)
  const size = headlineSize(slide.headline, false);
  return `
    <div class="content content-left">
      ${iconBadge(t, slide.icon)}
      <div class="kicker left">${slide.kicker}</div>
      <h1 class="headline left" style="font-size:${size}px;">${toHtml(slide.headline)}</h1>
      <p class="subtext left">${slide.subtext}</p>
      ${slide.visual ? slide.visual(t, iconSvg) : ""}
    </div>`;
}

function headlineSize(headline, isCover, big) {
  const n = lineCount(headline);
  if (isCover) {
    if (big) {
      if (n <= 1) return 118;
      if (n === 2) return 98;
      return 80;
    }
    if (n <= 1) return 92;
    if (n === 2) return 76;
    return 62;
  }
  if (n <= 1) return 58;
  if (n === 2) return 52;
  return 44;
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
.content { position: absolute; left: 104px; right: 104px; }
.content-center { top: 310px; text-align: center; }
.content-center-hero {
  top: 150px; bottom: 280px;
  display: flex; flex-direction: column; justify-content: center;
}
.content-center-photo {
  top: 110px; bottom: 210px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.photo-prop { margin: 20px 0 30px; }
.content-left { top: 340px; text-align: left; }
.kicker {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${t.kicker};
}
.kicker.center { text-align: center; }
.kicker.left { margin-top: 22px; }
.headline {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  line-height: 1.14;
  color: ${t.headline};
  text-shadow: 0 0 34px ${t.glow};
  margin-top: 20px;
}
.headline.center { text-align: center; }
.headline.left { text-align: left; }
.headline .accent { color: ${t.accent}; }
.divider {
  width: 116px;
  height: 2px;
  background: ${t.divider};
  margin: 40px auto 36px;
}
.content-left .divider { margin: 32px 0 0; }
.subtext {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 27px;
  line-height: 1.5;
  color: ${t.subtext};
}
.subtext.center { text-align: center; max-width: 820px; margin: 0 auto; }
.subtext.left { text-align: left; max-width: 760px; margin-top: 26px; }
.icon-badge {
  width: 80px; height: 80px;
  border-radius: 50%;
  border: 1px solid ${t.kicker};
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
}
.subheadline {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 32px;
  color: ${t.subtext};
  margin-top: 8px;
}
.stat-number {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 148px;
  line-height: 1;
  color: ${t.accent};
  margin-top: 12px;
  text-shadow: 0 0 40px ${t.glow};
}
.bold-line {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 29px;
  line-height: 1.4;
  color: ${t.headline};
  max-width: 780px;
  margin-top: 14px;
}
.source {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 15px;
  color: ${t.faded};
  margin-top: 18px;
}
.button {
  display: inline-block;
  border: 1px solid ${t.kicker};
  color: ${t.kicker};
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 2px;
  padding: 18px 30px;
  margin-top: 34px;
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
    ${renderBody(slide, t)}
    ${showArrow ? `<div class="arrow">${iconSvg("arrowRight", t.kicker)}</div>` : ""}
    <div class="footer">
      <span>Webdesign Ehmann</span>
      <span>${counter}</span>
    </div>
  </div>
</body>
</html>`;
}

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

const filter = process.argv[2];
const postsToBuild = filter
  ? POSTS.filter((p) => p.folder.toLowerCase().includes(filter.toLowerCase()))
  : POSTS;

for (const post of postsToBuild) {
  const total = post.slides.length;
  const themesForPost = post.themes || ["dunkel", "hell"];
  for (const theme of themesForPost) {
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
