// Main tick — run once per GitHub Action invocation.
// Each run: (1) process your Telegram approvals, (2) publish approved posts,
// (3) if it's time, generate the next draft and send it for approval.
// All state is persisted to state/queue.json (+ images), committed by the workflow.
import { CONFIG } from "./config.js";
import { loadState, saveState, pruneImages, shortId } from "./state.js";
import { pickFromLibrary, generateFresh, composeCaption } from "./generate.js";
import { renderToFile } from "./image.js";
import {
  telegramReady, sendDraft, getUpdates, answerCallback, markDecision, sendMessage,
} from "./telegram.js";
import { postToLinkedIn, linkedinReady } from "./linkedin.js";
import { postToInstagram, instagramReady } from "./instagram.js";

const HOURS = Number(process.env.POST_INTERVAL_HOURS || 12);
const PENDING_TTL_H = Number(process.env.PENDING_TTL_HOURS || 48);
const forceDraft = process.argv.includes("--draft-only") || process.env.FORCE_DRAFT === "1";

function now() { return new Date().toISOString(); }
function hoursSince(iso) { return iso ? (Date.now() - new Date(iso).getTime()) / 3.6e6 : Infinity; }

async function publish(post) {
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
      await makeDraft(state, post.platform); // fresh draft, same platform
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

async function main() {
  const state = loadState();
  console.log(`[run] tick @ ${now()} · platforms=${CONFIG.platforms.join(",")}`);
  console.log(`[run] telegram=${telegramReady()} linkedin=${linkedinReady()} instagram=${instagramReady()}`);

  // 1) approvals from your taps since last run
  await processApprovals(state);

  // 2) expire drafts you never answered so they don't block forever
  expireStale(state);

  // 3) publish anything already approved but not yet posted (safety net)
  for (const p of state.posts.filter((p) => p.status === "approved")) {
    await doPublish(state, p);
  }

  // 4) generate the next draft if it's time and nothing is waiting on you
  const pendingCount = state.posts.filter((p) => p.status === "pending").length;
  const due = forceDraft || hoursSince(state.lastDraftAt) >= HOURS;
  if (pendingCount === 0 && due && CONFIG.platforms.length) {
    // alternate platforms each slot so you get ~1 post per platform per cycle
    const platform = CONFIG.platforms[(state.slotCount || 0) % CONFIG.platforms.length];
    const post = await makeDraft(state, platform);
    console.log(`[run] new draft for ${platform}: "${post.headline}"`);
  } else {
    console.log(`[run] no draft this tick (pending=${pendingCount}, due=${due})`);
  }

  pruneImages(state);
  saveState(state);
  console.log("[run] done.");
}

main().catch((e) => {
  console.error("[run] fatal:", e);
  process.exit(1);
});
