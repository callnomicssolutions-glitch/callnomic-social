// One-shot flagship launch stager. Runs ON the GitHub Actions runner (ffmpeg + git
// auth present). Renders 3 hand-picked pieces (1 LinkedIn image, 1 Instagram image,
// 1 Reel), commits+pushes their media so Instagram can fetch it from the raw CDN, and
// adds them to the queue as "approved". A normal engine run a minute later publishes
// them via its existing approved-post path — no duplicate publishing logic, and the
// CDN has time to serve the media (same timing the proven draft→publish flow relies on).
import { execSync } from "node:child_process";
import { loadState, saveState, shortId } from "./state.js";
import { LIBRARY } from "../content/library.js";
import { REELS } from "../content/reels.js";
import { composeCaption, composeReelCaption } from "./generate.js";
import { renderToFile } from "./image.js";
import { renderReel } from "./reel.js";

// The three flagship pieces, matched by unique text so we always render the right ones.
const LI_HEADLINE = "One place. Chat, calls, CRM, campaigns.";
const IG_HEADLINE = "One inbox for every channel.";
const REEL_HOOK = "You're running your business from 4 different inboxes.";

function now() { return new Date().toISOString(); }

function findLib(headline) {
  const item = LIBRARY.find((i) => i.headline === headline);
  if (!item) throw new Error(`library item not found: ${headline}`);
  return item;
}
function findReel(hook) {
  const item = REELS.find((r) => r.hook === hook);
  if (!item) throw new Error(`reel not found: ${hook}`);
  return item;
}

async function makeImagePost(state, platform, item) {
  const id = shortId();
  const imageFile = `${id}-${platform}.png`;
  await renderToFile({
    platform,
    headline: item.headline,
    kicker: item.pillar.replace(/-/g, " "),
    fileName: imageFile,
  });
  const post = {
    id, platform, pillar: item.pillar, headline: item.headline,
    caption: composeCaption(item, platform), imageFile,
    status: "approved", createdAt: now(), telegramMessageId: null,
    url: "", error: "", flagship: true,
  };
  state.posts.unshift(post);
  return post;
}

async function makeReelPost(state, script) {
  const id = shortId();
  const imageFile = await renderReel({ id, script });
  const post = {
    id, type: "reel", platform: "instagram", pillar: script.pillar,
    headline: script.hook, caption: composeReelCaption(script), imageFile,
    status: "approved", createdAt: now(), telegramMessageId: null,
    url: "", error: "", flagship: true,
  };
  state.posts.unshift(post);
  return post;
}

async function main() {
  const state = loadState();

  const li = await makeImagePost(state, "linkedin", findLib(LI_HEADLINE));
  const ig = await makeImagePost(state, "instagram", findLib(IG_HEADLINE));
  const reel = await makeReelPost(state, findReel(REEL_HOOK));
  saveState(state);

  console.log("[flagship] staged:", [li, ig, reel].map((p) => `${p.type || "image"}:${p.platform}:${p.imageFile}`).join("  "));

  // Commit + push media and queue so the raw CDN can serve the images/video before
  // the publish run fetches them.
  execSync('git config user.name "callnomic-bot"');
  execSync('git config user.email "bot@callnomicsolutions.com"');
  execSync("git add state/");
  execSync('git commit -m "flagship: stage portal launch set (approved) [skip ci]"');
  execSync("git push");
  console.log("[flagship] media + queue committed and pushed. Trigger a normal run to publish.");
}

main().catch((e) => { console.error("[flagship] fatal:", e); process.exit(1); });
