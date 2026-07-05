// Persistent state, committed back to the repo by the GitHub Action.
// This is how the engine "remembers" across cron runs with no database.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");
export const STATE_DIR = join(ROOT, "state");
export const IMAGES_DIR = join(STATE_DIR, "images");
const STATE_FILE = join(STATE_DIR, "queue.json");

const DEFAULT_STATE = {
  rotationIndex: 0,     // next library item to use
  recentPillars: [],    // last few pillars used (variety guard)
  telegramOffset: 0,    // last processed Telegram update_id
  posts: [],            // post records (newest first)
};

function ensureDirs() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
}

export function loadState() {
  ensureDirs();
  if (!existsSync(STATE_FILE)) return { ...DEFAULT_STATE };
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(readFileSync(STATE_FILE, "utf8")) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  ensureDirs();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function imagePath(fileName) {
  ensureDirs();
  return join(IMAGES_DIR, fileName);
}

// Keep the repo small: drop image files older than the newest `keep` records.
export function pruneImages(state, keep = 24) {
  const alive = new Set();
  for (const p of state.posts.slice(0, keep)) {
    if (p.imageFile) alive.add(p.imageFile);
  }
  try {
    for (const f of readdirSync(IMAGES_DIR)) {
      if (f.endsWith(".png") && !alive.has(f)) unlinkSync(join(IMAGES_DIR, f));
    }
  } catch {
    /* ignore */
  }
}

export function shortId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
