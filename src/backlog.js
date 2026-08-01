// Backlog recovery. Drafts that were never answered pile up as "pending" and then
// "expired" — content that was written and rendered but never published. This stages
// them back into the queue as "approved" and paced; the normal engine run publishes
// them one per bucket per day, in the morning window.
//
//   node src/backlog.js --pending                       everything unpublished, paced
//   node src/backlog.js --pending --expired             revive expired drafts too
//   node src/backlog.js --pending --daily-hour 5 --per-bucket 1 --skip-duplicates --dry-run
//
// Nothing is published here — this only edits state/queue.json, so a mistake is a
// revert away rather than a post on a live account.
import { existsSync } from "node:fs";
import { loadState, saveState, imagePath } from "./state.js";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
function opt(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const doPending = has("--pending");
const doExpired = has("--expired");
const dailyHour = Number(opt("--daily-hour", process.env.DAILY_HOUR_UTC || 5));
const perBucket = Number(opt("--per-bucket", process.env.DAILY_PER_BUCKET || 1));
const skipDuplicates = has("--skip-duplicates");
const dryRun = has("--dry-run");

if (!doPending && !doExpired) {
  console.error("nothing to do: pass --pending and/or --expired");
  process.exit(1);
}

const state = loadState();
// Keyed by platform: the same line running on LinkedIn and on Instagram is normal
// cross-posting, not a duplicate. Only re-running it on the platform that already
// carried it is.
const key = (p) => `${p.platform}::${p.headline}`;
const publishedKeys = new Set(state.posts.filter((p) => p.status === "posted").map(key));

// Oldest first, so the backlog goes out in the order it was written.
const byAgeAsc = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
const queue = [];

if (doPending) {
  // "Unpublished" is more than just pending: a post already approved (including one
  // parked because the platform was blocking) or failed is also content that hasn't
  // gone out, and re-pacing it here keeps the whole backlog on one schedule.
  queue.push(...state.posts.filter((p) => ["pending", "approved", "failed"].includes(p.status)));
}

if (doExpired) {
  // Only drafts whose rendered media still exists — re-rendering the rest would just
  // republish library items that are already back in the normal rotation.
  queue.push(
    ...state.posts.filter((p) => p.status === "expired" && p.imageFile && existsSync(imagePath(p.imageFile))),
  );
}

let staged = queue.sort(byAgeAsc);

if (skipDuplicates) {
  const before = staged.length;
  const seen = new Set();
  staged = staged.filter((p) => {
    if (publishedKeys.has(key(p)) || seen.has(key(p))) {
      // Actually take it out of the queue. A duplicate left sitting in "approved"
      // would publish anyway, unpaced — skipping it has to mean skipping it.
      if (p.status === "pending" || p.status === "approved") {
        p.status = "skipped";
        p.publishAfter = "";
        console.log(`  ✕ ${p.platform} ${p.id} — already published on ${p.platform}: "${p.headline}"`);
      }
      return false;
    }
    seen.add(key(p));
    return true;
  });
  console.log(`[backlog] skipped ${before - staged.length} draft(s) already published on that platform`);
}

// One slot per bucket per day, at the morning hour. Buckets are LinkedIn, Instagram
// feed and Instagram Reels, so a typical morning is one of each — they don't queue
// behind one another. The engine enforces the same caps at publish time; these dates
// just make the plan visible and fix the order.
const bucket = (p) => (p.type === "reel" ? "instagram-reel" : p.platform);
const DAY_MS = 86_400_000;

// The first morning slot still ahead of us; every later slot is a whole day past it.
// (Resolving "is it in the past?" per offset instead would put offsets 0 and 1 on the
// same morning.)
const firstMorning = (() => {
  const d = new Date();
  d.setUTCHours(dailyHour, 5, 0, 0);
  return d.getTime() <= Date.now() ? d.getTime() + DAY_MS : d.getTime();
})();

function morningOn(dayOffset) {
  return firstMorning + dayOffset * DAY_MS;
}

const dayIndex = new Map();
for (const p of staged) {
  const b = bucket(p);
  const i = dayIndex.get(b) || 0;
  p.status = "approved";
  p.attempts = 0;
  p.paced = true;
  p.publishStartedAt = "";
  p.publishAfter = new Date(morningOn(i)).toISOString();
  dayIndex.set(b, i + 1);
  console.log(`  • ${p.publishAfter.slice(0, 16).replace("T", " ")}Z  ${bucket(p).padEnd(15)} ${p.id} — "${p.headline}"`);
}

const days = Math.max(0, ...dayIndex.values());
console.log(`[backlog] staged ${staged.length} post(s) — ${perBucket}/bucket/day from ${dailyHour}:00 UTC, clearing in ~${days} day(s)`);

if (dryRun) {
  console.log("[backlog] dry run — state not written");
} else {
  saveState(state);
  console.log("[backlog] wrote state/queue.json");
}
