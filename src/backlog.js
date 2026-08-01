// Backlog recovery. Drafts that were never answered pile up as "pending" and then
// "expired" — content that was written and rendered but never published. This stages
// them back into the queue as "approved"; the normal engine run publishes them.
//
//   node src/backlog.js --pending            approve everything still pending, now
//   node src/backlog.js --expired            revive expired drafts, dripped over time
//   node src/backlog.js --expired --per-day 2 --skip-duplicates
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
const perDay = Number(opt("--per-day", 2));
const skipDuplicates = has("--skip-duplicates");
const dryRun = has("--dry-run");

if (!doPending && !doExpired) {
  console.error("nothing to do: pass --pending and/or --expired");
  process.exit(1);
}

const state = loadState();
const publishedHeadlines = new Set(
  state.posts.filter((p) => p.status === "posted").map((p) => p.headline),
);
const staged = [];

function stage(post, publishAfter) {
  post.status = "approved";
  post.attempts = 0;
  post.error = "";
  post.publishAfter = publishAfter || "";
  staged.push({ id: post.id, platform: post.platform, type: post.type || "post", publishAfter: post.publishAfter, headline: post.headline });
}

// Oldest first, so the backlog goes out in the order it was written.
const byAgeAsc = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);

if (doPending) {
  const pending = state.posts.filter((p) => p.status === "pending").sort(byAgeAsc);
  for (const p of pending) stage(p, "");
  console.log(`[backlog] staged ${pending.length} pending post(s) for immediate publication`);
}

if (doExpired) {
  // Only drafts whose rendered media still exists — re-rendering the rest would just
  // republish library items that are already back in the normal rotation.
  let expired = state.posts
    .filter((p) => p.status === "expired" && p.imageFile && existsSync(imagePath(p.imageFile)))
    .sort(byAgeAsc);

  if (skipDuplicates) {
    const before = expired.length;
    const seen = new Set();
    expired = expired.filter((p) => {
      if (publishedHeadlines.has(p.headline) || seen.has(p.headline)) return false;
      seen.add(p.headline);
      return true;
    });
    console.log(`[backlog] skipped ${before - expired.length} expired draft(s) whose content is already published`);
  }

  // Drip them out instead of dumping the whole backlog at once: a burst of posts
  // buries its own reach and looks like spam to both platforms' automated checks.
  const spacingMs = (24 / Math.max(1, perDay)) * 3600_000;
  // Start after the immediate batch has cleared.
  let when = Date.now() + spacingMs;
  for (const p of expired) {
    stage(p, new Date(when).toISOString());
    when += spacingMs;
  }
  console.log(`[backlog] staged ${expired.length} expired draft(s), ~${perDay}/day`);
}

for (const s of staged) {
  console.log(`  • ${s.id} ${s.platform}${s.type === "reel" ? " (reel)" : ""} ${s.publishAfter || "now"} — "${s.headline}"`);
}

if (dryRun) {
  console.log("[backlog] dry run — state not written");
} else {
  saveState(state);
  console.log(`[backlog] wrote state/queue.json (${staged.length} post(s) approved)`);
}
