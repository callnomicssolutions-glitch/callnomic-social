// Instagram posting via the Instagram API with Instagram Login (Content Publishing).
// Requires: IG_USER_ID (your Instagram account id) + IG_ACCESS_TOKEN (Instagram user token
// from the app's "Instagram business login → Generate token").
// Instagram must FETCH the image from a public URL, so we point it at the committed
// image in this repo (raw.githubusercontent.com), built from PUBLIC_IMAGE_BASE.
// Override the host with IG_GRAPH_BASE if you ever switch to the Facebook-Page flow
// (https://graph.facebook.com/v21.0).
import { CONFIG, has } from "./config.js";

const GRAPH = process.env.IG_GRAPH_BASE || "https://graph.instagram.com/v21.0";

export function instagramReady() {
  return has(CONFIG.instagram.igUserId) && has(CONFIG.instagram.token);
}

// Public URL Instagram can fetch. PUBLIC_IMAGE_BASE is set by the workflow to the
// raw path of this repo's state/images folder.
export function publicImageUrl(imageFile) {
  if (CONFIG.publicImageBase) return `${CONFIG.publicImageBase.replace(/\/$/, "")}/${imageFile}`;
  if (CONFIG.repo) return `https://raw.githubusercontent.com/${CONFIG.repo}/${CONFIG.ref}/state/images/${imageFile}`;
  return "";
}

/**
 * Publish a single-image feed post.
 * @returns {Promise<{ok:boolean, url?:string, error?:string}>}
 */
export async function postToInstagram(post) {
  if (!instagramReady()) return { ok: false, error: "Instagram not configured" };
  const imageUrl = publicImageUrl(post.imageFile);
  if (!imageUrl) return { ok: false, error: "no public image URL (set PUBLIC_IMAGE_BASE)" };

  const uid = CONFIG.instagram.igUserId;
  const token = CONFIG.instagram.token;
  // IG caption limit ~2200 chars, max 30 hashtags.
  const caption = post.caption.slice(0, 2200);

  try {
    // 1) Create media container
    const createUrl = new URL(`${GRAPH}/${uid}/media`);
    createUrl.searchParams.set("image_url", imageUrl);
    createUrl.searchParams.set("caption", caption);
    createUrl.searchParams.set("access_token", token);
    const createRes = await fetch(createUrl, { method: "POST" });
    const createJson = await createRes.json().catch(() => ({}));
    if (!createRes.ok || !createJson.id) {
      return { ok: false, error: `container ${createRes.status}: ${JSON.stringify(createJson.error || createJson).slice(0, 200)}` };
    }
    const creationId = createJson.id;

    // 2) Publish it
    const pubUrl = new URL(`${GRAPH}/${uid}/media_publish`);
    pubUrl.searchParams.set("creation_id", creationId);
    pubUrl.searchParams.set("access_token", token);
    const pubRes = await fetch(pubUrl, { method: "POST" });
    const pubJson = await pubRes.json().catch(() => ({}));
    if (!pubRes.ok || !pubJson.id) {
      return { ok: false, error: `publish ${pubRes.status}: ${JSON.stringify(pubJson.error || pubJson).slice(0, 200)}` };
    }
    return { ok: true, url: `https://www.instagram.com/p/${pubJson.id}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
