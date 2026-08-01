// Main tick — run once per GitHub Action invocation.
// Each run: (1) process your Telegram approvals, (2) publish approved posts,
// (3) if it's time, generate the next draft and send it for approval, then
// (4) stay alive for WATCH_MINUTES long-polling Telegram so taps are acted on in
// seconds rather than waiting for the next cron tick (GitHub throttles cron hard).
// All state is persisted to state/queue.json (+ images), committed by the workflow.
import { existsSync } from "node:fs";
import { CONFIG } from "./config.js";
import { loadState, saveState, commitState, pruneImages, shortId, imagePath } from "./state.js";
import { pickFromLibrary, generateFresh, composeCaption, pickReelScript, composeReelCaption } from "./generate.js";
import { REELS } from "../content/reels.js";
import { renderToFile } from "./image.js";
import { renderReel, ffmpegAvailable } from "./reel.js";
import {
  telegramReady, sendDraft, sendVideoDraft, getUpdates, answerCallback, markDecision, sendMessage,
  getWebhookInfo, getMe,
} from "./telegram.js";
import { postToLinkedIn, linkedinReady } from "./linkedin.js";
import { postToInstagram, postReelToInstagram, instagramReady } from "./instagram.js";

const HOURS = Number(process.env.POST_INTERVAL_HOURS || 12);
// A draft that quietly expires is content thrown away. A week gives you a real
// chance to answer; the old 48h default burned a whole weekend's worth of drafts.
const PENDING_TTL_H = Number(process.env.PENDING_TTL_HOURS || 168);
const MAX_PENDING = Number(process.env.MAX_PENDING || 6);
const MAX_PENDING_REELS = Number(process.env.MAX_PENDING_REELS || 2);
const REMIND_AFTER_H = Number(process.env.REMIND_AFTER_HOURS || 2);
const REMIND_REPEAT_H = Number(process.env.REMIND_REPEAT_HOURS || 6);
const MAX_PUBLISH_ATTEMPTS = Number(process.env.MAX_PUBLISH_ATTEMPTS || 3);
// How long to hold a post when the platform itself is blocking (expired token,
// restricted account), and how rarely to repeat that alert on Telegram.
const BLOCKED_RETRY_H = Number(process.env.BLOCKED_RETRY_HOURS || 3);
const BLOCKED_NOTIFY_H = Number(process.env.BLOCKED_NOTIFY_HOURS || 12);
// Publishing a backlog as one burst is what gets an account flagged in the first
// place. Cap how many go out per platform in a single run; the rest wait.
const MAX_PER_PLATFORM_PER_RUN = Number(process.env.MAX_PER_PLATFORM_PER_RUN || 2);
// Minimum spacing between two posts on the same platform, for backlog posts that were
// staged with pacing on (`paced`). Enforced against the real last-published time rather
// than only the scheduled slot, so a backlog that came due while a platform was blocked
// still goes out spread apart instead of all at once the moment the block lifts.
// Approvals you tap yourself are never delayed by this.
const MIN_GAP_H = Number(process.env.MIN_GAP_HOURS || 1);
const WATCH_MINUTES = Number(process.env.WATCH_MINUTES || 0);
// Daily morning publishing. Queued (paced) content goes out in one morning window
// rather than round the clock: default 05:00–09:00 UTC = 09:00–13:00 Gulf time, wide
// enough that GitHub's cron throttling can't make the engine miss the day entirely.
// Each bucket — LinkedIn, Instagram feed, Instagram Reels — gets DAILY_PER_BUCKET
// slots per day, so a normal morning is one LinkedIn post, one Instagram post and
// one Reel. Nothing you approve by hand is affected; this only paces the queue.
// An unset repo variable arrives as "" from the workflow, and Number("") is 0 — which
// would silently move the morning window to midnight. Fall back on empty, not just null.
const numEnv = (v, fallback) => (v === undefined || v === null || v === "" ? fallback : Number(v));
const DAILY_HOUR_UTC = numEnv(process.env.DAILY_HOUR_UTC, 5);
const DAILY_WINDOW_H = Number(process.env.DAILY_WINDOW_HOURS || 4);
const DAILY_PER_BUCKET = Number(process.env.DAILY_PER_BUCKET || 1);
const forceDraft = process.argv.includes("--draft-only") || process.env.FORCE_DRAFT === "1";
const forceReel = process.argv.includes("--reel-only") || process.env.FORCE_REEL === "1";

// Statuses a post can be brought back from. Expired/skipped drafts still hold their
// headline + caption, so a late tap on the Telegram message should still work.
const REVIVABLE = new Set(["pending", "expired", "skipped", "failed", "publishing"]);

function now() { return new Date().toISOString(); }
function hoursSince(iso) { return iso ? (Date.now() - new Date(iso).getTime()) / 3.6e6 : Infinity; }
function label(post) { return post.type === "reel" ? "Instagram Reel" : post.platform; }

// Reels are their own bucket: a Reel and a feed post on the same morning is a normal
// day's output, two feed posts is not.
function bucket(post) { return post.type === "reel" ? "instagram-reel" : post.platform; }

function inMorningWindow(d = new Date()) {
  const h = d.getUTCHours();
  return h >= DAILY_HOUR_UTC && h < DAILY_HOUR_UTC + DAILY_WINDOW_H;
}

function publishedTodayIn(state, b) {
  const today = new Date().toISOString().slice(0, 10);
  return state.posts.filter(
    (p) => p.status === "posted" && (p.postedAt || "").slice(0, 10) === today && bucket(p) === b,
  ).length;
}

// When something last actually went live on a platform, "" if never.
function lastPostedAt(state, platform) {
  let latest = "";
  for (const p of state.posts) {
    if (p.status !== "posted" || p.platform !== platform || !p.postedAt) continue;
    if (!latest || p.postedAt > latest) latest = p.postedAt;
  }
  return latest;
}

// Re-render media that pruning (or a lost run) removed, so an old draft is still
// publishable. Returns { ok, rendered } — `rendered` means the file is new on disk
// and therefore not yet on the raw CDN that Instagram fetches from.
async function ensureMedia(post) {
  if (post.imageFile && existsSync(imagePath(post.imageFile))) return { ok: true, rendered: false };
  if (post.type === "reel") {
    const script = REELS.find((r) => r.hook === post.headline);
    if (!script || !ffmpegAvailable()) return { ok: false, rendered: false };
    post.imageFile = await renderReel({ id: post.id, script });
    return { ok: true, rendered: true };
  }
  post.imageFile = post.imageFile || `${post.id}-${post.platform}.png`;
  await renderToFile({
    platform: post.platform,
    headline: post.headline,
    kicker: (post.pillar || "").replace(/-/g, " "),
    fileName: post.imageFile,
  });
  return { ok: true, rendered: true };
}

async function publish(post) {
  if (post.type === "reel") return postReelToInstagram(post);
  if (post.platform === "linkedin") return postToLinkedIn(post);
  if (post.platform === "instagram") return postToInstagram(post);
  return { ok: false, error: "unknown platform" };
}

async function doPublish(state, post) {
  const media = await ensureMedia(post);
  if (!media.ok) {
    post.status = "failed";
    post.error = "media missing and could not be re-rendered";
    saveState(state);
    if (telegramReady()) await sendMessage(`⚠️ Can't publish <b>${label(post)}</b> — media missing: "${post.headline}"`);
    return;
  }
  // Instagram pulls the media from raw.githubusercontent.com at the commit this run
  // checked out. A file rendered a moment ago isn't there yet, so hand it to the next
  // run — the workflow commits and pushes state/ when this one finishes.
  if (media.rendered && post.platform === "instagram") {
    post.status = "approved";
    post.awaitingCdn = CONFIG.sha || "local";
    saveState(state);
    console.log(`[run] re-rendered media for ${post.id}; publishing on the next run once it's on the CDN`);
    return;
  }

  // Claim the post BEFORE the irreversible part, and make that claim durable. If the
  // push fails we do not publish at all: a missed post is recoverable, a duplicate on
  // a live account is not.
  post.attempts = (post.attempts || 0) + 1;
  post.status = "publishing";
  post.publishStartedAt = now();
  saveState(state);
  if (!commitState(`social: publishing ${post.id}`)) {
    post.status = "approved";
    post.attempts -= 1;
    post.publishStartedAt = "";
    post.publishAfter = new Date(Date.now() + 15 * 60_000).toISOString();
    saveState(state);
    console.log(`[run] could not record intent for ${post.id} — not publishing, will retry`);
    return;
  }

  const res = await publish(post);
  if (res.ok) {
    post.status = "posted";
    post.postedAt = now();
    post.url = res.url || "";
    post.error = "";
    post.awaitingCdn = "";
    post.publishStartedAt = "";
    // Record the publish immediately. Everything after this point (Telegram messages,
    // later posts in the same run, the workflow's own commit step) can fail without
    // putting this post back in the queue.
    saveState(state);
    commitState(`social: posted ${post.id}`);
    if (telegramReady()) {
      if (post.telegramMessageId) await markDecision(post.telegramMessageId, "✅ Posted");
      await sendMessage(`✅ Posted to <b>${label(post)}</b>\n${post.url || ""}`);
    }
  } else if (res.ambiguous) {
    // The call failed in a way that doesn't tell us whether the platform accepted it.
    // Leave it claimed rather than guessing: an unpublished post you can release with
    // /retry beats a second copy on the account that nobody can take back.
    post.error = `${res.error} — unclear whether it went out; left on hold`;
    saveState(state);
    commitState(`social: uncertain publish ${post.id}`);
    console.log(`[run] ambiguous failure for ${post.id}, holding: ${res.error}`);
    if (telegramReady()) {
      await sendMessage(
        `❓ <b>${label(post)}</b> — the upload failed in a way that doesn't say whether it went out.\n\n` +
        `<code>${escapeish(res.error)}</code>\n\n` +
        `It's on hold so it can't post twice. Check the account: if it's <b>not</b> there, send ` +
        `<code>/retry</code>. If it is, send <code>/skip ${post.id}</code>.`,
      );
    }
  } else if (res.retryable === false) {
    // The platform is refusing for a reason retrying can't change — an expired token,
    // or Meta restricting the account. Park the post (it publishes itself once the
    // block clears) and say plainly what needs fixing, once, instead of silently
    // grinding through retries and marking good content as failed.
    post.attempts -= 1;
    post.error = res.error;
    post.status = "approved";
    post.publishStartedAt = "";
    post.publishAfter = new Date(Date.now() + BLOCKED_RETRY_H * 3600_000).toISOString();
    saveState(state);
    commitState(`social: parked ${post.id}`);
    console.log(`[run] ${post.platform} is blocking publication, parked ${post.id}: ${res.error}`);
    if (telegramReady() && hoursSince(state.blockedNotifiedAt) >= BLOCKED_NOTIFY_H) {
      state.blockedNotifiedAt = now();
      saveState(state);
      await sendMessage(
        `🚫 <b>${label(post)} is refusing to publish</b> — this one needs you, not a retry.\n\n` +
        `<code>${escapeish(res.error)}</code>\n\n` +
        `Queued posts are held and will publish themselves automatically once it's cleared. ` +
        `Send /status any time to see what's waiting.`,
      );
    }
  } else {
    post.error = res.error;
    const retriesLeft = MAX_PUBLISH_ATTEMPTS - post.attempts;
    if (retriesLeft > 0) {
      // Keep it queued: most failures here are transient (media still processing on
      // Instagram's side, a blip on LinkedIn). Give it a few minutes and try again.
      post.status = "approved";
      post.publishStartedAt = "";
      post.publishAfter = new Date(Date.now() + 10 * 60_000).toISOString();
      console.log(`[run] publish failed for ${post.id} (${retriesLeft} retries left): ${res.error}`);
    } else {
      post.status = "failed";
      post.publishStartedAt = "";
      if (telegramReady()) {
        await sendMessage(`⚠️ Failed to post to <b>${label(post)}</b> after ${post.attempts} tries\n${res.error}`);
      }
    }
  }
  saveState(state);
  commitState(`social: state after ${post.id}`);
}

// Publish everything approved whose hold time has passed and whose media is already
// on the CDN (media rendered during *this* run only lands there once the workflow
// commits, so it waits for the next run).
// Counted for the lifetime of the process, so the watch loop can't sneak past the cap
// by calling this repeatedly.
const publishedThisRun = new Map();

async function publishApproved(state) {
  const thisRun = CONFIG.sha || "local";
  const due = state.posts.filter(
    (p) =>
      p.status === "approved" &&
      p.awaitingCdn !== thisRun &&
      (!p.publishAfter || new Date(p.publishAfter).getTime() <= Date.now()),
  );
  // Oldest slot first, so a backlog drains in the order it was written rather than
  // newest-first (state.posts is newest-first).
  due.sort((a, b) => String(a.publishAfter || a.createdAt).localeCompare(String(b.publishAfter || b.createdAt)));

  let done = 0;
  for (const p of due) {
    const sent = publishedThisRun.get(p.platform) || 0;
    if (sent >= MAX_PER_PLATFORM_PER_RUN) {
      console.log(`[run] holding ${p.id}: already published ${sent} to ${p.platform} this run`);
      continue;
    }
    if (p.paced) {
      if (!inMorningWindow()) {
        console.log(`[run] holding ${p.id}: outside the ${DAILY_HOUR_UTC}:00–${DAILY_HOUR_UTC + DAILY_WINDOW_H}:00 UTC publishing window`);
        continue;
      }
      const todayCount = publishedTodayIn(state, bucket(p));
      if (todayCount >= DAILY_PER_BUCKET) {
        console.log(`[run] holding ${p.id}: already published ${todayCount} ${bucket(p)} today`);
        continue;
      }
      const gap = hoursSince(lastPostedAt(state, p.platform));
      if (gap < MIN_GAP_H) {
        console.log(`[run] holding ${p.id}: last ${p.platform} post was ${gap.toFixed(1)}h ago (min ${MIN_GAP_H}h)`);
        continue;
      }
    }
    await doPublish(state, p);
    // Only a real publish counts against the cap — a parked or retried post didn't
    // put anything on the account.
    if (p.status === "posted") publishedThisRun.set(p.platform, sent + 1);
    done += 1;
  }
  return done;
}

// Build one draft for a platform, render its image, send to Telegram.
async function makeDraft(state, platform) {
  let source;
  if (CONFIG.groq.enabled) {
    source = await generateFresh();
  }
  let nextIndex = state.rotationIndex;
  if (!source) {
    const picked = pickFromLibrary(state);
    source = picked.item;
    nextIndex = picked.nextIndex;
  }

  const id = shortId();
  const imageFile = `${id}-${platform}.png`;
  await renderToFile({
    platform,
    headline: source.headline,
    kicker: source.pillar.replace(/-/g, " "),
    fileName: imageFile,
  });

  const post = {
    id,
    platform,
    pillar: source.pillar,
    headline: source.headline,
    caption: composeCaption(source, platform),
    imageFile,
    status: "pending",
    createdAt: now(),
    telegramMessageId: null,
    url: "",
    error: "",
  };

  // rotation + variety bookkeeping
  state.rotationIndex = nextIndex;
  state.recentPillars = [...(state.recentPillars || []), source.pillar].slice(-4);
  state.slotCount = (state.slotCount || 0) + 1;
  state.lastDraftAt = now();
  state.posts.unshift(post);

  if (CONFIG.autoApprove) {
    saveState(state);
    await doPublish(state, post);
    return post;
  }

  if (telegramReady()) {
    post.telegramMessageId = await sendDraft(post);
  } else {
    console.log("[run] Telegram not configured — draft stored but not sent:", post.headline);
  }
  saveState(state);
  return post;
}

// Build one educational Reel: pick a hook script, render the kinetic-caption video,
// send it to Telegram. Instagram-only — always type "reel".
async function makeReelDraft(state) {
  const { item: script, nextIndex } = pickReelScript(state);
  const id = shortId();
  const imageFile = await renderReel({ id, script });

  const post = {
    id,
    type: "reel",
    platform: "instagram",
    pillar: script.pillar,
    headline: script.hook,
    caption: composeReelCaption(script),
    imageFile,
    status: "pending",
    createdAt: now(),
    telegramMessageId: null,
    url: "",
    error: "",
  };

  state.reelRotationIndex = nextIndex;
  state.recentReelPillars = [...(state.recentReelPillars || []), script.pillar].slice(-4);
  state.lastReelAt = now();
  state.posts.unshift(post);

  if (CONFIG.autoApprove) {
    saveState(state);
    await doPublish(state, post);
    return post;
  }

  if (telegramReady()) {
    post.telegramMessageId = await sendVideoDraft(post);
  } else {
    console.log("[run] Telegram not configured — reel draft stored but not sent:", script.hook);
  }
  saveState(state);
  return post;
}

async function approveAndPublish(state, post) {
  post.status = "approved";
  post.publishAfter = "";
  post.publishStartedAt = "";
  post.attempts = 0;
  saveState(state);
  await doPublish(state, post);
}

const HELP = [
  "<b>Callnomic Social — commands</b>",
  "/status — what's waiting, what failed",
  "/postall — approve &amp; publish everything pending",
  "/approve &lt;id&gt; — publish one (id from /status)",
  "/skip &lt;id&gt; — drop one",
  "/retry — retry anything that failed",
  "/help — this message",
  "",
  "The ✅ / ✏️ / ❌ buttons on a draft still work — including on old drafts.",
].join("\n");

function statusText(state) {
  const live = state.posts.filter((p) => ["pending", "approved", "publishing", "failed"].includes(p.status));
  if (!live.length) return "Nothing waiting. Next draft comes on schedule.";
  const lines = live.map((p) => {
    const age = Math.round(hoursSince(p.createdAt));
    const err = p.error ? `\n   ⚠️ ${escapeish(p.error).slice(0, 120)}` : "";
    return `• <code>${p.id}</code> · ${p.status} · ${label(p)} · ${age}h\n   "${escapeish(p.headline)}"${err}`;
  });
  const posted = state.posts.filter((p) => p.status === "posted").length;
  return `<b>Queue</b>\n${lines.join("\n")}\n\n${posted} published all-time.\nUse /postall to publish everything pending.`;
}

function escapeish(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Typed-command fallback. The inline buttons are the happy path, but when a tap
// doesn't land (phone-side delivery lag, an ancient message) you need a way in that
// doesn't depend on callback data.
async function handleCommand(state, text) {
  const [cmdRaw, ...rest] = text.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@.*$/, "");
  const arg = rest.join(" ").trim();

  if (cmd === "/help" || cmd === "/start") {
    await sendMessage(HELP);
  } else if (cmd === "/status") {
    await sendMessage(statusText(state));
  } else if (cmd === "/postall") {
    const pending = state.posts.filter((p) => p.status === "pending");
    if (!pending.length) return void (await sendMessage("Nothing pending."));
    await sendMessage(`⏳ Publishing ${pending.length} post(s)…`);
    for (const p of pending) await approveAndPublish(state, p);
  } else if (cmd === "/approve") {
    const post = state.posts.find((p) => p.id === arg && REVIVABLE.has(p.status));
    if (!post) return void (await sendMessage(`No publishable post with id <code>${escapeish(arg)}</code>. Try /status.`));
    await sendMessage(`⏳ Publishing "${escapeish(post.headline)}"…`);
    await approveAndPublish(state, post);
  } else if (cmd === "/skip") {
    const post = state.posts.find((p) => p.id === arg);
    if (!post) return void (await sendMessage(`No post with id <code>${escapeish(arg)}</code>.`));
    post.status = "skipped";
    saveState(state);
    await sendMessage("❌ Skipped.");
  } else if (cmd === "/retry") {
    // "publishing" means a run claimed it and we never learned the outcome. Only you
    // can confirm it isn't on the account, so /retry is the deliberate release.
    const stuck = state.posts.filter((p) => p.status === "failed" || p.status === "publishing");
    if (!stuck.length) return void (await sendMessage("Nothing failed or on hold."));
    for (const p of stuck) await approveAndPublish(state, p);
  } else if (cmd.startsWith("/")) {
    await sendMessage(`Unknown command.\n\n${HELP}`);
  }
}

// Returns how many updates were acted on, so the watch loop can log usefully.
async function processApprovals(state, timeout = 0) {
  if (!telegramReady()) return 0;
  const { updates, newOffset } = await getUpdates(state.telegramOffset || 0, timeout);
  if (updates.length) console.log(`[telegram] offset=${state.telegramOffset || 0} fetched=${updates.length} updates`);
  for (const u of updates) {
    if (u.message) {
      const m = u.message;
      // Only obey the configured chat — anyone else who finds the bot is ignored.
      if (String(m.chat?.id) !== String(CONFIG.telegram.chatId)) continue;
      if (typeof m.text === "string" && m.text.startsWith("/")) {
        console.log(`[telegram] command: ${m.text}`);
        await handleCommand(state, m.text);
      }
      continue;
    }
    const cq = u.callback_query;
    if (!cq) continue;
    const [action, id] = String(cq.data || "").split(":");
    console.log(`[telegram] update ${u.update_id}: callback data="${cq.data}" action=${action} id=${id}`);
    const post = state.posts.find((p) => p.id === id);
    if (!post) {
      await answerCallback(cq.id, "That draft is no longer in the queue.");
      continue;
    }
    if (post.status === "posted") {
      await answerCallback(cq.id, "Already published.");
      if (cq.message) await markDecision(cq.message.message_id, "✅ Posted");
      continue;
    }
    if (!REVIVABLE.has(post.status)) {
      await answerCallback(cq.id, "Already handled.");
      continue;
    }
    // A tap on an expired or skipped draft brings it back rather than doing nothing —
    // the content is still good, it just sat unanswered.
    const wasStale = post.status !== "pending";
    if (action === "approve") {
      await answerCallback(cq.id, wasStale ? "Reviving and uploading…" : "Uploading…");
      if (cq.message) await markDecision(cq.message.message_id, "⏳ Uploading…");
      if (cq.message) post.telegramMessageId = cq.message.message_id;
      await sendMessage(`⏳ Uploading to <b>${label(post)}</b> now…`);
      await approveAndPublish(state, post);
    } else if (action === "skip") {
      await answerCallback(cq.id, "Skipped.");
      if (cq.message) await markDecision(cq.message.message_id, "❌ Skipped");
      post.status = "skipped";
      saveState(state);
    } else if (action === "redo") {
      await answerCallback(cq.id, "New draft coming…");
      if (cq.message) await markDecision(cq.message.message_id, "✏️ Redone");
      post.status = "skipped";
      saveState(state);
      if (post.type === "reel") await makeReelDraft(state);
      else await makeDraft(state, post.platform); // fresh draft, same platform
    }
  }
  state.telegramOffset = newOffset || state.telegramOffset;
  saveState(state);
  return updates.length;
}

function expireStale(state) {
  let changed = false;
  for (const p of state.posts) {
    if (p.status === "pending" && hoursSince(p.createdAt) > PENDING_TTL_H) {
      p.status = "expired";
      changed = true;
    }
  }
  if (changed) saveState(state);
}

// Nudge you about drafts sitting pending for a while — catches the case where a
// Telegram tap silently never reached the bot (phone-side delivery delay/background
// throttling), so it doesn't just look like the system stopped working.
async function remindStale(state) {
  if (!telegramReady()) return;
  let changed = false;
  for (const p of state.posts) {
    if (p.status !== "pending") continue;
    const ageH = hoursSince(p.createdAt);
    if (ageH < REMIND_AFTER_H) continue;
    const sinceReminder = p.remindedAt ? hoursSince(p.remindedAt) : Infinity;
    if (sinceReminder < REMIND_REPEAT_H) continue;
    await sendMessage(
      `⏰ Still waiting on your approval — <b>${label(p)}</b>: "${escapeish(p.headline)}"\n` +
      `Pending ${Math.round(ageH)}h. If a button tap doesn't seem to do anything, just send ` +
      `<code>/postall</code> here and it will publish everything waiting.`,
    );
    p.remindedAt = now();
    changed = true;
  }
  if (changed) saveState(state);
}

// Hold the run open, long-polling Telegram, so a tap is acted on within seconds.
// GitHub throttles the 5-minute cron down to roughly one run an hour, so without this
// an approval sits unanswered long enough that it looks like the bot is dead.
async function watch(state, minutes) {
  const deadline = Date.now() + minutes * 60_000;
  console.log(`[run] watching Telegram for ${minutes} min…`);
  while (Date.now() < deadline) {
    const remainingS = Math.max(1, Math.floor((deadline - Date.now()) / 1000));
    try {
      await processApprovals(state, Math.min(25, remainingS));
      await publishApproved(state);
    } catch (e) {
      // A blip talking to Telegram must not kill the run — state so far is already
      // saved, and the workflow still needs to commit it.
      console.warn("[run] watch iteration failed:", e.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  console.log("[run] watch window over.");
}

async function main() {
  const state = loadState();
  console.log(`[run] tick @ ${now()} · platforms=${CONFIG.platforms.join(",")}`);
  console.log(`[run] telegram=${telegramReady()} linkedin=${linkedinReady()} instagram=${instagramReady()}`);

  if (telegramReady()) {
    const me = await getMe();
    console.log(`[telegram] bot: @${me.username} (id ${me.id})`);
    const wh = await getWebhookInfo();
    console.log(`[telegram] webhook: url="${wh.url || "(none)"}" pending_update_count=${wh.pending_update_count} last_error="${wh.last_error_message || ""}"`);
  }

  // 1) approvals from your taps since last run
  await processApprovals(state);

  // 2) expire drafts you never answered so they don't block forever
  expireStale(state);

  // 2b) nudge about drafts that have been sitting pending a while
  await remindStale(state);

  // 3) publish anything already approved but not yet posted (safety net)
  await publishApproved(state);

  // 4) generate the next draft if it's time — doesn't wait for prior drafts to be approved,
  // just caps how many can pile up unanswered so a long absence doesn't spam forever.
  const pendingCount = state.posts.filter((p) => p.status === "pending").length;
  const due = forceDraft || hoursSince(state.lastDraftAt) >= HOURS;
  if (pendingCount < MAX_PENDING && due && CONFIG.platforms.length) {
    // alternate platforms each slot so you get ~1 post per platform per cycle
    const platform = CONFIG.platforms[(state.slotCount || 0) % CONFIG.platforms.length];
    const post = await makeDraft(state, platform);
    console.log(`[run] new draft for ${platform}: "${post.headline}"`);
  } else {
    console.log(`[run] no draft this tick (pending=${pendingCount}, due=${due})`);
  }

  // 5) educational Reels run on their own, slower cadence — Instagram only.
  const pendingReelCount = state.posts.filter((p) => p.status === "pending" && p.type === "reel").length;
  const reelDue = forceReel || hoursSince(state.lastReelAt) >= CONFIG.reels.intervalHours;
  if (CONFIG.reels.enabled && instagramReady() && pendingReelCount < MAX_PENDING_REELS && reelDue) {
    if (!ffmpegAvailable()) {
      console.log("[run] ffmpeg not available on this runner — skipping reel draft");
    } else {
      const post = await makeReelDraft(state);
      console.log(`[run] new reel draft: "${post.headline}"`);
    }
  } else {
    console.log(`[run] no reel draft this tick (pendingReels=${pendingReelCount}, due=${reelDue}, enabled=${CONFIG.reels.enabled})`);
  }

  // 6) stay responsive until the next run is due
  if (WATCH_MINUTES > 0 && telegramReady()) await watch(state, WATCH_MINUTES);

  pruneImages(state);
  saveState(state);
  console.log("[run] done.");
}

main().catch((e) => {
  console.error("[run] fatal:", e);
  process.exit(1);
});
