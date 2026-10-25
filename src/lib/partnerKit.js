/**
 * Partner marketing kit, generated in the browser: logo pack, banners and product visuals as real PNG/SVG files,
 * plus the copy pack. Everything carries the partner's own referral link where a link belongs.
 */
import { makeZip, saveBlob } from "@/lib/zipStore";
import { copyPackText, referralLink } from "@/lib/partnerCampaigns";

const C = {
  bg: "#0A0B0D",
  card: "#101215",
  line: "#1A1D22",
  line2: "#262A31",
  text: "#F2F4F5",
  muted: "#9AA1AB",
  dim: "#7D848E",
  lime: "#D5F879",
  blue: "#4DA3FF",
  green: "#3DDC84",
  red: "#FF5A4E",
};
const DOTS = [
  [9, 12.5, "#FF5A4E"],
  [16, 12.5, "#FF9F43"],
  [23, 12.5, "#FFC53D"],
  [9, 19.5, "#3DDC84"],
  [16, 19.5, "#2CC7C0"],
  [23, 19.5, "#4DA3FF"],
];
const HEAD = "'Bricolage Grotesque', Geist, 'Helvetica Neue', Arial, sans-serif";
const BODY = "Geist, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Geist Mono', ui-monospace, Menlo, monospace";

async function fontsReady() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`800 48px 'Bricolage Grotesque'`),
      document.fonts.load(`700 48px 'Bricolage Grotesque'`),
      document.fonts.load(`400 20px Geist`),
      document.fonts.load(`600 20px Geist`),
      document.fonts.load(`500 16px 'Geist Mono'`),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function toPng(c) {
  return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mark(ctx, x, y, size, light = false) {
  const s = size / 32;
  rr(ctx, x + 0.5 * s, y + 0.5 * s, 31 * s, 31 * s, 8.5 * s);
  ctx.fillStyle = light ? "#FFFFFF" : "#131519";
  ctx.fill();
  ctx.lineWidth = Math.max(1, s);
  ctx.strokeStyle = light ? "#E1E4E8" : "#2E333B";
  ctx.stroke();
  for (const [cx, cy, fill] of DOTS) {
    ctx.beginPath();
    ctx.arc(x + cx * s, y + cy * s, 2.9 * s, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function lockup(ctx, x, y, size, light = false) {
  mark(ctx, x, y, size, light);
  ctx.fillStyle = light ? "#0A0B0D" : C.text;
  ctx.font = `800 ${Math.round(size * 0.72)}px ${HEAD}`;
  ctx.textBaseline = "middle";
  ctx.fillText("searchify", x + size * 1.3, y + size / 2 + size * 0.02);
  ctx.textBaseline = "alphabetic";
}

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function text(ctx, str, x, y, { font, color = C.text, maxW = 9999, lh = 1.2, size = 20 }) {
  ctx.font = font;
  ctx.fillStyle = color;
  const lines = wrap(ctx, str, maxW);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * lh));
  return y + lines.length * size * lh;
}

function pill(ctx, label, x, y, { size = 22, bg = C.lime, color = C.bg, padX = 22, h = 54 } = {}) {
  ctx.font = `600 ${size}px ${BODY}`;
  const w = ctx.measureText(label).width + padX * 2;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + padX, y + h / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return w;
}

function backdrop(ctx, w, h) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, Math.max(w, h) * 0.8);
  g.addColorStop(0, "rgba(77,163,255,0.16)");
  g.addColorStop(0.5, "rgba(213,248,121,0.04)");
  g.addColorStop(1, "rgba(10,11,13,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function dotField(ctx, x, y, cols, rows, gap, r) {
  const colors = DOTS.map((d) => d[2]);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const lit = (i * 7 + j * 3) % 5 === 0;
      ctx.beginPath();
      ctx.arc(x + j * gap, y + i * gap, r, 0, Math.PI * 2);
      ctx.fillStyle = lit ? colors[(i + j) % colors.length] : "#1A1D22";
      ctx.globalAlpha = lit ? 0.9 : 1;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function partnerTag(ctx, x, y, size = 13) {
  ctx.font = `500 ${size}px ${MONO}`;
  ctx.fillStyle = C.dim;
  ctx.fillText("PARTNER LINK", x, y);
}

const HEADLINE = "Better SEO for your WordPress site.";
const SUB = "Titles, descriptions and keywords from real search data. You approve every change.";

/** Mini product card: the scan score and three fixes. */
function scanCard(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 22);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  const pad = w * 0.08;
  ctx.font = `500 ${Math.round(w * 0.04)}px ${MONO}`;
  ctx.fillStyle = C.dim;
  ctx.fillText("EXAMPLE SCAN", x + pad, y + pad + w * 0.03);
  ctx.font = `800 ${Math.round(w * 0.2)}px ${HEAD}`;
  ctx.fillStyle = C.lime;
  ctx.fillText("82", x + pad, y + pad + w * 0.24);
  ctx.font = `400 ${Math.round(w * 0.045)}px ${BODY}`;
  ctx.fillStyle = C.muted;
  ctx.fillText("SEO health, up from 64", x + pad + w * 0.27, y + pad + w * 0.215);
  const rows = [
    ["Title rewritten", "Services → Roof Repair in Calgary", C.green],
    ["Description added", "12 pages", C.blue],
    ["Broken link fixed", "/old-contact → /contact", "#FFC53D"],
  ];
  let ry = y + pad + w * 0.34;
  const rh = (h - (ry - y) - pad) / rows.length;
  for (const [a, b, col] of rows) {
    ctx.beginPath();
    ctx.arc(x + pad + 8, ry + rh * 0.38, Math.max(5, w * 0.014), 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.font = `600 ${Math.round(w * 0.045)}px ${BODY}`;
    ctx.fillStyle = C.text;
    ctx.fillText(a, x + pad + 26, ry + rh * 0.45);
    ctx.font = `400 ${Math.round(w * 0.036)}px ${BODY}`;
    ctx.fillStyle = C.dim;
    ctx.fillText(b, x + pad + 26, ry + rh * 0.45 + w * 0.05);
    ry += rh;
  }
}

async function banner(w, h, link) {
  const [c, ctx] = canvas(w, h);
  backdrop(ctx, w, h);
  const url = link;
  if (h <= 100) {
    // 728×90 leaderboard
    lockup(ctx, 18, (h - 34) / 2, 34);
    text(ctx, "Better SEO for WordPress sites", 220, h / 2 - 4, { font: `700 21px ${HEAD}`, size: 21 });
    ctx.font = `400 12px ${MONO}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(url, 220, h / 2 + 20);
    pill(ctx, "Try Searchify", w - 168, (h - 44) / 2, { size: 16, h: 44, padX: 18 });
    return toPng(c);
  }
  if (w <= 320) {
    // 300×250 medium rectangle
    lockup(ctx, 18, 18, 28);
    const end = text(ctx, "Better SEO for your WordPress site.", 18, 86, { font: `800 25px ${HEAD}`, size: 25, maxW: w - 36, lh: 1.1 });
    text(ctx, "You approve every change.", 18, end + 10, { font: `400 14px ${BODY}`, color: C.muted, size: 14 });
    pill(ctx, "Try Searchify", 18, h - 80, { size: 15, h: 40, padX: 16 });
    ctx.font = `400 10px ${MONO}`;
    ctx.fillStyle = C.dim;
    ctx.fillText(url, 18, h - 20);
    return toPng(c);
  }
  if (w === h) {
    // 1080×1080 square
    lockup(ctx, 80, 80, 64);
    dotField(ctx, w - 330, 110, 8, 3, 34, 9);
    let y = text(ctx, HEADLINE, 80, 300, { font: `800 92px ${HEAD}`, size: 92, maxW: w - 160, lh: 1.04 });
    y = text(ctx, SUB, 80, y + 40, { font: `400 36px ${BODY}`, color: C.muted, size: 36, maxW: w - 220, lh: 1.35 });
    // What it checks, as chips
    let cx = 80;
    let cy = y + 40;
    for (const [label, col] of [["Titles", C.blue], ["Descriptions", "#FFC53D"], ["Keywords", C.green], ["Broken links", C.red], ["Speed", "#2CC7C0"]]) {
      ctx.font = `600 28px ${BODY}`;
      const cw = ctx.measureText(label).width + 76;
      if (cx + cw > w - 80) {
        cx = 80;
        cy += 76;
      }
      rr(ctx, cx, cy, cw, 60, 30);
      ctx.fillStyle = C.card;
      ctx.fill();
      ctx.strokeStyle = C.line2;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 30, cy + 30, 8, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.fillStyle = C.text;
      ctx.fillText(label, cx + 50, cy + 40);
      cx += cw + 14;
    }
    pill(ctx, "Try Searchify →", 80, h - 230, { size: 34, h: 88, padX: 38 });
    ctx.font = `500 28px ${MONO}`;
    ctx.fillStyle = C.text;
    ctx.fillText(url, 80, h - 96);
    partnerTag(ctx, 80, h - 56, 20);
    return toPng(c);
  }
  // 1200×628 social / link preview
  lockup(ctx, 64, 60, 52);
  let y = text(ctx, HEADLINE, 64, 220, { font: `800 62px ${HEAD}`, size: 62, maxW: 600, lh: 1.05 });
  y = text(ctx, SUB, 64, y + 26, { font: `400 25px ${BODY}`, color: C.muted, size: 25, maxW: 560, lh: 1.35 });
  pill(ctx, "Try Searchify →", 64, h - 150, { size: 24, h: 62, padX: 26 });
  ctx.font = `500 20px ${MONO}`;
  ctx.fillStyle = C.text;
  ctx.fillText(url, 64, h - 50);
  scanCard(ctx, 760, 92, 380, 444);
  return toPng(c);
}

/** Product visual: the approval queue. */
async function queueVisual() {
  const w = 1600;
  const h = 1000;
  const [c, ctx] = canvas(w, h);
  backdrop(ctx, w, h);
  lockup(ctx, 80, 70, 48);
  text(ctx, "Every change waits for your OK.", 80, 220, { font: `800 64px ${HEAD}`, size: 64 });
  text(ctx, "The approval queue: review, approve, ship. Anything can be undone.", 80, 280, { font: `400 28px ${BODY}`, color: C.muted, size: 28 });
  const items = [
    ["Page title", "Home", "Roof Repair & Replacement in Calgary | Peak Roofing"],
    ["Meta description", "(missing)", "Same-week roof repairs across Calgary. Free inspection, written quote, 10-year workmanship warranty."],
    ["Image alt text", "IMG_2041.jpg", "Crew replacing asphalt shingles on a two-storey house"],
  ];
  let y = 340;
  for (const [kind, before, after] of items) {
    rr(ctx, 80, y, w - 160, 190, 24);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `500 20px ${MONO}`;
    ctx.fillStyle = C.dim;
    ctx.fillText(kind.toUpperCase(), 116, y + 46);
    ctx.font = `400 24px ${BODY}`;
    ctx.fillStyle = C.red;
    ctx.fillText(`Before  ${before}`, 116, y + 92);
    ctx.fillStyle = C.green;
    const lines = wrap(ctx, `After  ${after}`, w - 560);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 116, y + 134 + i * 32));
    pill(ctx, "Approve", w - 300, y + 64, { size: 22, h: 60, padX: 30 });
    y += 214;
  }
  return toPng(c);
}

/** Product visual: the scan. */
async function scanVisual() {
  const w = 1600;
  const h = 1000;
  const [c, ctx] = canvas(w, h);
  backdrop(ctx, w, h);
  lockup(ctx, 80, 70, 48);
  text(ctx, "Every page, scanned and scored.", 80, 220, { font: `800 64px ${HEAD}`, size: 64 });
  text(ctx, "Titles, descriptions, keywords, broken links, speed and images, checked page by page.", 80, 280, {
    font: `400 28px ${BODY}`,
    color: C.muted,
    size: 28,
    maxW: 1400,
  });
  scanCard(ctx, 80, 340, 620, 600);
  const checks = [
    ["Page titles", "14 of 18 can be stronger", C.blue],
    ["Meta descriptions", "9 missing", "#FFC53D"],
    ["Keywords", "32 found from real search data", C.green],
    ["Broken links", "3 found", C.red],
    ["Page speed", "Mobile 71 · Desktop 94", C.green],
    ["Images", "21 without alt text", "#FFC53D"],
  ];
  let y = 360;
  for (const [a, b, col] of checks) {
    rr(ctx, 760, y, 760, 80, 18);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(800, y + 40, 9, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.font = `600 26px ${BODY}`;
    ctx.fillStyle = C.text;
    ctx.fillText(a, 828, y + 49);
    ctx.font = `400 22px ${BODY}`;
    ctx.fillStyle = C.muted;
    const tw = ctx.measureText(b).width;
    ctx.fillText(b, 1490 - tw, y + 48);
    y += 96;
  }
  return toPng(c);
}

/** Product visual: before/after in search results. */
async function beforeAfterVisual() {
  const w = 1600;
  const h = 1000;
  const [c, ctx] = canvas(w, h);
  backdrop(ctx, w, h);
  lockup(ctx, 80, 70, 48);
  text(ctx, "How the page looks on Google.", 80, 220, { font: `800 64px ${HEAD}`, size: 64 });
  text(ctx, "Same page, before and after. Illustration.", 80, 280, { font: `400 28px ${BODY}`, color: C.muted, size: 28 });
  const card = (x, label, col, title, desc, verdict) => {
    rr(ctx, x, 340, 660, 560, 26);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.font = `600 22px ${MONO}`;
    ctx.fillStyle = col;
    ctx.fillText(label, x + 40, 400);
    ctx.font = `400 22px ${BODY}`;
    ctx.fillStyle = "#4D5156";
    ctx.fillText("peakroofing.ca › services", x + 40, 460);
    let yy = text(ctx, title, x + 40, 510, { font: `400 34px ${BODY}`, color: "#1A0DAB", size: 34, maxW: 580, lh: 1.25 });
    text(ctx, desc, x + 40, yy + 20, { font: `400 25px ${BODY}`, color: "#4D5156", size: 25, maxW: 580, lh: 1.45 });
    ctx.fillStyle = "#EEF0F3";
    ctx.fillRect(x + 40, 790, 580, 2);
    text(ctx, verdict, x + 40, 840, { font: `500 24px ${BODY}`, color: col, size: 24, maxW: 580, lh: 1.35 });
  };
  card(80, "BEFORE", C.red, "Services", "Home About Services Contact Copyright 2024 All rights reserved Powered by WordPress", "Vague title, no real description: easy to scroll past.");
  card(
    860,
    "AFTER",
    "#1E9E57",
    "Roof Repair & Replacement in Calgary | Peak Roofing",
    "Same-week roof repairs across Calgary. Free inspection, written quote and a 10-year workmanship warranty.",
    "Says the service and the city, and gives a reason to click.",
  );
  return toPng(c);
}

function markSvg(light = false) {
  const tile = light ? 'fill="#FFFFFF" stroke="#E1E4E8"' : 'fill="#131519" stroke="#2E333B"';
  const dots = DOTS.map(([cx, cy, f]) => `<circle cx="${cx}" cy="${cy}" r="2.9" fill="${f}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32"><rect x="0.5" y="0.5" width="31" height="31" rx="8.5" ${tile}/>${dots}</svg>`;
}

function lockupSvg(light = false) {
  const tile = light ? 'fill="#FFFFFF" stroke="#E1E4E8"' : 'fill="#131519" stroke="#2E333B"';
  const dots = DOTS.map(([cx, cy, f]) => `<circle cx="${cx}" cy="${cy}" r="2.9" fill="${f}"/>`).join("");
  const ink = light ? "#0A0B0D" : "#F2F4F5";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 150 40"><g transform="translate(4 4)"><rect x="0.5" y="0.5" width="31" height="31" rx="8.5" ${tile}/>${dots}</g><text x="45" y="28.5" font-family="'Bricolage Grotesque', Geist, Arial, sans-serif" font-weight="800" font-size="23" letter-spacing="-0.5" fill="${ink}">searchify</text></svg>`;
}

async function markPng(size, light) {
  const [c, ctx] = canvas(size, size);
  mark(ctx, 0, 0, size, light);
  return toPng(c);
}

async function lockupPng(light) {
  const [c, ctx] = canvas(1200, 320);
  if (light) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1200, 320);
  } else {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 1200, 320);
  }
  lockup(ctx, 80, 80, 160, light);
  return toPng(c);
}

const LOGO_RULES = `SEARCHIFY LOGO PACK

Files
- searchify-mark-dark.svg / .png    the six-dot mark on its dark tile (default)
- searchify-mark-light.svg / .png   the mark on a white tile, for light backgrounds
- searchify-logo-dark.png / .svg    mark + wordmark, for dark backgrounds
- searchify-logo-light.png / .svg   mark + wordmark, for light backgrounds
(The SVG wordmark uses the Bricolage Grotesque font; use the PNG if it is not installed.)

Spacing and size
- Keep clear space around the logo equal to the height of one dot row (about a quarter of the mark's height).
- Smallest size: mark 24 px, full logo 96 px wide.
- Always "searchify" in lower case.

Please don't
- Recolour, rotate, stretch or reorder the dots.
- Put the dark logo on a dark photo without the tile.
- Use the logo in a way that suggests you are Searchify, or in ads bidding on the Searchify name.

Questions: partners@searchify.io
`;

function slug(s) {
  return String(s || "partner").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

export async function downloadKit(kind, { handle, name } = {}) {
  await fontsReady();
  const link = referralLink(handle);
  const who = slug(handle);
  if (kind === "logos") {
    const files = [
      { name: "searchify-logo-pack/searchify-mark-dark.svg", data: markSvg(false) },
      { name: "searchify-logo-pack/searchify-mark-light.svg", data: markSvg(true) },
      { name: "searchify-logo-pack/searchify-logo-dark.svg", data: lockupSvg(false) },
      { name: "searchify-logo-pack/searchify-logo-light.svg", data: lockupSvg(true) },
      { name: "searchify-logo-pack/searchify-mark-dark.png", data: await markPng(1024, false) },
      { name: "searchify-logo-pack/searchify-mark-light.png", data: await markPng(1024, true) },
      { name: "searchify-logo-pack/searchify-logo-dark.png", data: await lockupPng(false) },
      { name: "searchify-logo-pack/searchify-logo-light.png", data: await lockupPng(true) },
      { name: "searchify-logo-pack/README.txt", data: LOGO_RULES },
    ];
    saveBlob(await makeZip(files), "searchify-logo-pack.zip");
    return files.length;
  }
  if (kind === "banners") {
    const sizes = [
      [1200, 628, "social-1200x628"],
      [1080, 1080, "square-1080x1080"],
      [728, 90, "leaderboard-728x90"],
      [300, 250, "rectangle-300x250"],
    ];
    const files = [];
    for (const [w, h, label] of sizes) files.push({ name: `searchify-banners-${who}/searchify-${label}.png`, data: await banner(w, h, link) });
    files.push({
      name: `searchify-banners-${who}/README.txt`,
      data: `Searchify banners with your link: https://${link}\n\nLink each banner to https://${link}\nPut a commission disclosure next to it, for example: "Partner link: I earn a commission if you sign up."\n`,
    });
    saveBlob(await makeZip(files), `searchify-banners-${who}.zip`);
    return files.length;
  }
  if (kind === "visuals") {
    const files = [
      { name: "searchify-product-visuals/searchify-site-scan.png", data: await scanVisual() },
      { name: "searchify-product-visuals/searchify-approval-queue.png", data: await queueVisual() },
      { name: "searchify-product-visuals/searchify-before-after.png", data: await beforeAfterVisual() },
      {
        name: "searchify-product-visuals/README.txt",
        data: "Illustrations of the Searchify scan, approval queue and a before/after search result. The example business and numbers are illustrative: don't present them as a real customer's results.\n",
      },
    ];
    saveBlob(await makeZip(files), "searchify-product-visuals.zip");
    return files.length;
  }
  if (kind === "copy") {
    saveBlob(new Blob([copyPackText(handle, name)], { type: "text/plain;charset=utf-8" }), `searchify-posts-and-emails-${who}.txt`);
    return 1;
  }
  throw new Error("Unknown kit item");
}

/** Preview image for the kit card (data URL), so partners see what they'll get. */
export async function previewBanner(handle) {
  await fontsReady();
  const blob = await banner(1200, 628, referralLink(handle));
  return URL.createObjectURL(blob);
}
