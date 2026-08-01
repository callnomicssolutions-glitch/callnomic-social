// Persistent state, committed back to the repo by the GitHub Action.
// This is how the engine "remembers" across cron runs with no database.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

// A post that hasn't been published yet still needs its media: deleting it strands
// the draft (nothing left to upload) even though the queue still lists it.
const LIVE = new Set(["pending", "approved", "failed"]);

// Keep the repo small: drop image/video files older than the newest `keep` records.
// Videos are much bigger than PNGs, so keep fewer of them around. Media belonging to
// a post that is still awaiting publication is never dropped, whatever its age.
export function pruneImages(state, keep = 24, keepVideos = 6) {
  const aliveImages = new Set();
  for (const p of state.posts.slice(0, keep)) {
    if (p.imageFile) aliveImages.add(p.imageFile);
  }
  const aliveVideos = new Set();
  for (const p of state.posts.filter((p) => p.type === "reel").slice(0, keepVideos)) {
    if (p.imageFile) aliveVideos.add(p.imageFile);
  }
  for (const p of state.posts) {
    if (!p.imageFile || !LIVE.has(p.status)) continue;
    if (p.type === "reel") aliveVideos.add(p.imageFile);
    else aliveImages.add(p.imageFile);
  }
  try {
    for (const f of readdirSync(IMAGES_DIR)) {
      if (f.endsWith(".mp4")) {
        if (!aliveVideos.has(f)) unlinkSync(join(IMAGES_DIR, f));
      } else if (f.endsWith(".png") && !f.startsWith("preview-") && !aliveImages.has(f)) {
        unlinkSync(join(IMAGES_DIR, f));
      }
    }
  } catch {
    /* ignore */
  }
}

export function shortId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Commit and push state/ right now, mid-run, instead of waiting for the workflow's
// final step. Publishing is not undoable: if a run posts to Instagram and then loses
// its state (rejected push, cancelled job, crashed runner), the next run sees the post
// as still-approved and posts it AGAIN. That is exactly how the same Reel went out
// three times. So the record of "about to publish" / "published" has to be durable
// before and after the irreversible part, not only at the end of the job.
// Returns true only if the push actually landed.
export function commitState(message) {
  if (process.env.GITHUB_ACTIONS !== "true") return true; // local runs: nothing to push to
  const ref = process.env.GITHUB_REF_NAME || "main";
  try {
    execFileSync("git", ["config", "user.name", "callnomic-bot"], { cwd: ROOT });
    execFileSync("git", ["config", "user.email", "bot@callnomicsolutions.com"], { cwd: ROOT });
    execFileSync("git", ["add", "state/"], { cwd: ROOT });
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8" });
    if (!staged.trim()) return true; // nothing changed — already durable
    execFileSync("git", ["commit", "-m", `${message} [skip ci]`], { cwd: ROOT });
    // Detached HEAD is normal after actions/checkout, so always name the target ref.
    execFileSync("git", ["push", "origin", `HEAD:${ref}`], { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch (e) {
    console.warn(`[state] could not push state (${message}):`, String(e.stderr || e.message).slice(0, 300));
    return false;
  }
}
