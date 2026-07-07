// Branded image renderer — ZERO tokens, zero external calls.
// Draws an on-brand card from post text using @napi-rs/canvas.
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { ROOT, imagePath } from "./state.js";
import { BRAND } from "../brand/brand.js";
import { ensureFonts } from "./fonts.js";

ensureFonts();

const SIZES = {
  instagram: { w: 1080, h: 1080 },
  linkedin: { w: 1200, h: 627 },
};

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Fit the headline: shrink font until it fits in the box in <= maxLines.
function fitHeadline(ctx, text, maxWidth, maxLines, startPx, minPx) {
  let px = startPx;
  while (px >= minPx) {
    ctx.font = `${px}px Outfit800`;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { px, lines };
    px -= 4;
  }
  ctx.font = `${minPx}px Outfit800`;
  return { px: minPx, lines: wrapText(ctx, text, maxWidth) };
}

/**
 * Render a branded card.
 * @param {{platform:'instagram'|'linkedin', headline:string, kicker?:string}} opts
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function renderCard({ platform, headline, kicker }) {
  const { w, h } = SIZES[platform] || SIZES.instagram;
  const c = BRAND.colors;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, c.bg1);
  bg.addColorStop(1, c.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Soft brand orbs (subtle depth)
  const orb = (x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, alpha));
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  orb(w * 0.85, h * 0.12, w * 0.5, c.violet, 0.28);
  orb(w * 0.1, h * 0.9, w * 0.45, c.cyan, 0.22);

  const pad = Math.round(w * 0.075);

  // Top accent bar
  ctx.fillStyle = c.cyan;
  ctx.fillRect(pad, pad, Math.round(w * 0.09), 8);

  // Logo + brand name (top-left)
  let brandX = pad;
  const logoY = pad + 34;
  try {
    const logo = await loadImage(join(ROOT, "brand", "logo.png"));
    const lh = platform === "linkedin" ? 46 : 56;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, pad, logoY, lw, lh);
    brandX = pad + lw + 18;
  } catch {
    /* logo optional */
  }
  ctx.fillStyle = c.ink;
  ctx.font = `${platform === "linkedin" ? 30 : 34}px Outfit600`;
  ctx.textBaseline = "middle";
  ctx.fillText(BRAND.name, brandX, logoY + (platform === "linkedin" ? 23 : 28));

  // Kicker (small eyebrow above headline)
  const contentTop = platform === "linkedin" ? h * 0.34 : h * 0.32;
  ctx.textBaseline = "alphabetic";
  if (kicker) {
    ctx.fillStyle = c.cyan;
    ctx.font = `${platform === "linkedin" ? 24 : 28}px Outfit600`;
    ctx.fillText(kicker.toUpperCase(), pad, contentTop);
  }

  // Headline (the star)
  const maxWidth = w - pad * 2;
  const startPx = platform === "linkedin" ? 62 : 88;
  const minPx = platform === "linkedin" ? 34 : 44;
  const maxLines = platform === "linkedin" ? 4 : 6;
  const { px, lines } = fitHeadline(ctx, headline, maxWidth, maxLines, startPx, minPx);
  ctx.fillStyle = c.ink;
  const lineH = px * 1.12;
  let y = contentTop + (kicker ? 40 : 8) + px;
  for (const line of lines) {
    // gradient fill on headline text for a premium look
    const tg = ctx.createLinearGradient(pad, 0, w - pad, 0);
    tg.addColorStop(0, c.ink);
    tg.addColorStop(1, "#DCE7FF");
    ctx.fillStyle = tg;
    ctx.font = `${px}px Outfit800`;
    ctx.fillText(line, pad, y);
    y += lineH;
  }

  // Footer: website + tagline
  ctx.fillStyle = c.ink2;
  ctx.font = `${platform === "linkedin" ? 24 : 28}px Outfit600`;
  ctx.textBaseline = "alphabetic";
  const footY = h - pad;
  ctx.fillText(BRAND.site, pad, footY);
  // small accent dot line above footer
  ctx.fillStyle = hexA(c.cyan, 0.5);
  ctx.fillRect(pad, footY - (platform === "linkedin" ? 40 : 52), Math.round(w * 0.16), 3);

  return canvas.toBuffer("image/png");
}

/** Render and write to state/images, returning the file name. */
export async function renderToFile({ platform, headline, kicker, fileName }) {
  const buf = await renderCard({ platform, headline, kicker });
  writeFileSync(imagePath(fileName), buf);
  return fileName;
}

// #RRGGBB + alpha(0..1) -> rgba()
function hexA(hex, a) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
