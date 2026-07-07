// Kinetic-caption Reel renderer — ZERO tokens, zero external calls.
// Turns a {hook, lines[], cta} script into a branded vertical MP4: each beat is a
// full-bleed canvas frame (big bold text, on-brand background), stitched by ffmpeg
// (preinstalled on GitHub's ubuntu runners — no extra dependency, no cost).
//
// Audio is optional: if brand/audio/*.mp3 exist, one is picked (deterministically by
// post id) and mixed under the video with a fade-out. Otherwise the video is silent —
// a legitimate, common style for caption-first educational Reels. We never fetch or
// bundle "trending" audio ourselves: that's a licensing decision for a human to make,
// so it's opt-in by dropping files into brand/audio/.
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { ROOT, imagePath } from "./state.js";
import { BRAND } from "../brand/brand.js";
import { ensureFonts } from "./fonts.js";

ensureFonts();

const W = 1080;
const H = 1920;
const FPS = 30;
const AUDIO_DIR = join(ROOT, "brand", "audio");
const TMP_ROOT = join(ROOT, "state", "reel_tmp");

// Per-beat display time (seconds). Hook lingers a beat longer to land the pattern
// interrupt; CTA lingers longest so the site/handle is actually readable.
const HOOK_S = 2.6;
const LINE_S = 2.3;
const CTA_S = 3.4;

function hexA(hex, a) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

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

function fitText(ctx, text, maxWidth, maxLines, startPx, minPx, weight) {
  let px = startPx;
  while (px >= minPx) {
    ctx.font = `${px}px ${weight}`;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { px, lines };
    px -= 4;
  }
  ctx.font = `${minPx}px ${weight}`;
  return { px: minPx, lines: wrapText(ctx, text, maxWidth) };
}

// Draw one full-bleed frame for a beat. kind: 'hook' | 'line' | 'cta'.
async function drawFrame({ kind, text, beatIndex, totalBeats, pillar }) {
  const c = BRAND.colors;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, c.bg1);
  bg.addColorStop(1, c.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const orb = (x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, alpha));
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  orb(W * 0.85, H * 0.15, W * 0.65, kind === "cta" ? c.teal : c.violet, 0.25);
  orb(W * 0.12, H * 0.85, W * 0.55, c.cyan, 0.2);

  const pad = Math.round(W * 0.1);

  // Brand row (top) — kept consistent across every frame for recall.
  let brandX = pad;
  const logoY = pad + 30;
  try {
    const logo = await loadImage(join(ROOT, "brand", "logo.png"));
    const lh = 50;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, pad, logoY, lw, lh);
    brandX = pad + lw + 18;
  } catch {
    /* logo optional */
  }
  ctx.fillStyle = c.ink;
  ctx.textBaseline = "middle";
  ctx.font = "32px Outfit600";
  ctx.fillText(BRAND.name, brandX, logoY + 25);

  // Progress dots (top-right-ish, below brand row) so viewers sense pacing.
  const dotY = logoY + 70;
  const dotR = 6;
  const dotGap = 22;
  const dotsW = totalBeats * dotGap;
  let dotX = W - pad - dotsW + dotGap / 2;
  for (let i = 0; i < totalBeats; i++) {
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i <= beatIndex ? c.cyan : hexA(c.ink, 0.18);
    ctx.fill();
    dotX += dotGap;
  }

  // Centered kinetic text — the whole point of the frame.
  const maxWidth = W - pad * 2;
  const isHook = kind === "hook";
  const isCta = kind === "cta";
  const startPx = isHook ? 96 : isCta ? 76 : 84;
  const minPx = 44;
  const maxLines = isHook ? 5 : 6;
  const weight = "Outfit800";
  ctx.textBaseline = "alphabetic";
  const { px, lines } = fitText(ctx, text, maxWidth, maxLines, startPx, minPx, weight);
  const lineH = px * 1.16;
  const blockH = lines.length * lineH;
  let y = H / 2 - blockH / 2 + px * 0.8;

  for (const line of lines) {
    if (isHook) {
      const tg = ctx.createLinearGradient(pad, 0, W - pad, 0);
      tg.addColorStop(0, c.cyan);
      tg.addColorStop(1, c.ink);
      ctx.fillStyle = tg;
    } else if (isCta) {
      ctx.fillStyle = c.teal;
    } else {
      ctx.fillStyle = c.ink;
    }
    ctx.font = `${px}px ${weight}`;
    ctx.fillText(line, pad, y);
    y += lineH;
  }

  // Footer: pillar kicker (small, top of stack) + site on CTA frame.
  ctx.font = "26px Outfit600";
  ctx.fillStyle = hexA(c.ink, 0.55);
  ctx.fillText(pillar.replace(/-/g, " ").toUpperCase(), pad, H - pad - (isCta ? 60 : 0));

  if (isCta) {
    ctx.fillStyle = c.gold;
    ctx.font = "34px Outfit600";
    ctx.fillText(BRAND.site, pad, H - pad);
    ctx.fillStyle = hexA(c.cyan, 0.5);
    ctx.fillRect(pad, H - pad - 90, Math.round(W * 0.16), 3);
  }

  return canvas.toBuffer("image/png");
}

function pickAudio(seedId) {
  if (!existsSync(AUDIO_DIR)) return null;
  const files = readdirSync(AUDIO_DIR).filter((f) => /\.(mp3|m4a|aac|wav)$/i.test(f));
  if (!files.length) return null;
  let hash = 0;
  for (const ch of String(seedId)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return join(AUDIO_DIR, files[hash % files.length]);
}

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}

function beatsFor(script) {
  return [
    { kind: "hook", text: script.hook, dur: HOOK_S },
    ...script.lines.map((text) => ({ kind: "line", text, dur: LINE_S })),
    { kind: "cta", text: script.cta, dur: CTA_S },
  ];
}

// Render just the still frames (no ffmpeg needed) so the visual style can be eyeballed
// without a working ffmpeg install. Used by `npm run preview-reel`.
export async function previewReelFrames(script, outDir) {
  mkdirSync(outDir, { recursive: true });
  const beats = beatsFor(script);
  const files = [];
  for (let i = 0; i < beats.length; i++) {
    const buf = await drawFrame({
      kind: beats[i].kind,
      text: beats[i].text,
      beatIndex: i,
      totalBeats: beats.length,
      pillar: script.pillar,
    });
    const file = join(outDir, `preview-reel-${String(i).padStart(2, "0")}-${beats[i].kind}.png`);
    writeFileSync(file, buf);
    files.push(file);
  }
  return files;
}

/**
 * Render a reel script to an MP4 in state/images/, returning the file name.
 * @param {{id:string, script:{pillar:string, hook:string, lines:string[], cta:string}}} opts
 */
export async function renderReel({ id, script }) {
  const tmpDir = join(TMP_ROOT, id);
  mkdirSync(tmpDir, { recursive: true });

  const beats = beatsFor(script);

  const frameFiles = [];
  for (let i = 0; i < beats.length; i++) {
    const buf = await drawFrame({
      kind: beats[i].kind,
      text: beats[i].text,
      beatIndex: i,
      totalBeats: beats.length,
      pillar: script.pillar,
    });
    const file = join(tmpDir, `frame_${String(i).padStart(3, "0")}.png`);
    writeFileSync(file, buf);
    frameFiles.push({ file, dur: beats[i].dur });
  }

  // ffmpeg concat demuxer list. Quirk: the final duration is ignored unless the last
  // file is repeated once more without a duration line.
  const listPath = join(tmpDir, "list.txt");
  const listLines = [];
  for (const f of frameFiles) {
    listLines.push(`file '${f.file.replace(/\\/g, "/")}'`);
    listLines.push(`duration ${f.dur}`);
  }
  listLines.push(`file '${frameFiles[frameFiles.length - 1].file.replace(/\\/g, "/")}'`);
  writeFileSync(listPath, listLines.join("\n"));

  const totalDur = frameFiles.reduce((s, f) => s + f.dur, 0);
  const fileName = `${id}-instagram-reel.mp4`;
  const outPath = imagePath(fileName);
  const audioFile = pickAudio(id);

  if (audioFile) {
    const fadeStart = Math.max(0, totalDur - 1.5);
    ffmpeg([
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-i", audioFile,
      "-filter_complex", `[1:a]afade=t=out:st=${fadeStart}:d=1.5,volume=0.55[aout]`,
      "-map", "0:v", "-map", "[aout]",
      "-r", String(FPS), "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-shortest",
      outPath,
    ]);
  } else {
    ffmpeg([
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-r", String(FPS), "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-shortest",
      outPath,
    ]);
  }

  rmSync(tmpDir, { recursive: true, force: true });
  return fileName;
}

export function ffmpegAvailable() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch (e) {
    console.warn("[reel] ffmpeg check failed:", e.message);
    return false;
  }
}
