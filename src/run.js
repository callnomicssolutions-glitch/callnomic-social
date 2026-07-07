// Main tick — run once per GitHub Action invocation.
// Each run: (1) process your Telegram approvals, (2) publish approved posts,
// (3) if it's time, generate the next draft and send it for approval.
// All state is persisted to state/queue.json (+ images), committed by the workflow.
import { CONFIG } from "./config.js";
import { loadState, saveState, pruneImages, shortId } from "./state.js";
import { pickFromLibrary, generateFresh, composeCaption, pickReelScript, composeReelCaption } from "./generate.js";
import { renderToFile } from "./image.js";
import { renderReel, ffmpegAvailable } from "./reel.js";
import {
  telegramReady, sendDraft, sendVideoDraft, getUpdates, answerCallback, markDecision, sendMessage,
  getWebhookInfo, getMe,
} from "./telegram.js";
import { postToLinkedIn, linkedinReady } from "./linkedin.js";
import { postToInstagram, postReelToInstagram, instagramReady } from "./instagram.js";

const HOURS = Number(process.env.POST_INTERVAL_HOURS || 12);
const PENDING_TTL_H = Number(process.env.PENDING_TTL_HOURS || 48);
const MAX_PENDING = Number(process.env.MAX_PENDING || 6);
const MAX_PENDING_REELS = Number(process.env.MAX_PENDING_REELS || 2);
const REMIND_AFTER_H = Number(process.env.REMIND_AFTER_HOURS || 2);
const REMIND_REPEAT_H = Number(process.env.REMIND_REPEAT_HOURS || 6);
const forceDraft = process.argv.includes("--draft-only") || process.env.FORCE_DRAFT === "1";
const forceReel = process.argv.includes("--reel-only") || process.env.FORCE_REEL === "1";

function now() { return new Date().toISOString(); }
function hoursSince(iso) { return iso ? (Date.now() - new Date(iso).getTime()) / 3.6e6 : Infinity; }

async function publish(post) {
  if (post.type === "reel") return postReelToInstagram(post);
  if (post.platform === "linkedin") return postToLinkedIn(post);
  if (post.platform === "instagram") return postToInstagram(post);
  return { ok: false, error: "unknown platform" };
}

async function doPublish(state, post) {
  const res = await publish(post);
  if (res.ok) {
    post.status = "posted";
    post.postedAt = now();
    post.url = res.url || "";
    if (telegramReady()) await sendMessage(`✅ Posted to <b>${post.platform}</b>\n${post.url || ""}`);
  } else {
    post.status = "failed";
    post.error = res.error;
    if (telegramReady()) await sendMessage(`⚠️ Failed to post to <b>${post.platform}</b>\n${res.error}`);
  }
  saveState(state);
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

async function processApprovals(state) {
  if (!telegramReady()) return;
  const { updates, newOffset } = await getUpdates(state.telegramOffset || 0);
  console.log(`[telegram] offset=${state.telegramOffset || 0} fetched=${updates.length} updates`);
  for (const u of updates) {
    const cq = u.callback_query;
    if (!cq) {
      console.log(`[telegram] update ${u.update_id}: not a callback_query, keys=${Object.keys(u).join(",")}`);
      continue;
    }
    const [action, id] = String(cq.data || "").split(":");
    console.log(`[telegram] update ${u.update_id}: callback data="${cq.data}" action=${action} id=${id}`);
    const post = state.posts.find((p) => p.id === id);
    if (!post || post.status !== "pending") {
      console.log(`[telegram]   -> post ${id} not found or not pending (status=${post?.status})`);
      await answerCallback(cq.id, "Already handled.");
      continue;
    }
    if (action === "approve") {
      await answerCallback(cq.id, "Uploading…");
      if (cq.message) await markDecision(cq.message.message_id, "⏳ Uploading…");
      post.status = "approved";
      saveState(state);
      if (telegramReady()) await sendMessage(`⏳ Uploading to <b>${post.platform}</b> now…`);
      await doPublish(state, post);
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
    const label = p.type === "reel" ? "Reel" : p.platform;
    await sendMessage(
      `⏰ Still waiting on your approval — <b>${label}</b>: "${p.headline}"\n` +
      `Pending ${Math.round(ageH)}h. If you already tapped a button and nothing happened, ` +
      `reopen the Telegram app for a moment (background delivery can lag) — the tap should sync then.`,
    );
    p.remindedAt = now();
    changed = true;
  }
  if (changed) saveState(state);
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
  for (const p of state.posts.filter((p) => p.status === "approved")) {
    await doPublish(state, p);
  }

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

  pruneImages(state);
  saveState(state);
  console.log("[run] done.");
}

main().catch((e) => {
  console.error("[run] fatal:", e);
  process.exit(1);
});
