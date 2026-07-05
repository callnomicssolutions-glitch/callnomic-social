// LinkedIn organization posting (image + text) via the REST Posts API.
// Requires: LINKEDIN_ACCESS_TOKEN (with w_organization_social) + LINKEDIN_ORG_URN.
import { readFileSync } from "node:fs";
import { CONFIG, has } from "./config.js";
import { imagePath } from "./state.js";

const VERSION = process.env.LINKEDIN_VERSION || "202405";
const BASE = "https://api.linkedin.com/rest";

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${CONFIG.linkedin.token}`,
    "LinkedIn-Version": VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

export function linkedinReady() {
  return has(CONFIG.linkedin.token) && has(CONFIG.linkedin.authorUrn);
}

/**
 * Publish a post with a branded image. Author can be your personal profile
 * (urn:li:person:…) or a company page (urn:li:organization:…).
 * @returns {Promise<{ok:boolean, url?:string, error?:string}>}
 */
export async function postToLinkedIn(post) {
  if (!linkedinReady()) return { ok: false, error: "LinkedIn not configured" };
  const owner = CONFIG.linkedin.authorUrn;
  try {
    // 1) Initialize an image upload
    const initRes = await fetch(`${BASE}/images?action=initializeUpload`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ initializeUploadRequest: { owner } }),
    });
    const initJson = await initRes.json().catch(() => ({}));
    if (!initRes.ok) return { ok: false, error: `init upload ${initRes.status}: ${JSON.stringify(initJson).slice(0, 200)}` };
    const uploadUrl = initJson.value?.uploadUrl;
    const imageUrn = initJson.value?.image;
    if (!uploadUrl || !imageUrn) return { ok: false, error: "no upload url/urn" };

    // 2) Upload the image bytes
    const bytes = readFileSync(imagePath(post.imageFile));
    const upRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: headers({ "Content-Type": "image/png" }),
      body: bytes,
    });
    if (!upRes.ok) return { ok: false, error: `image PUT ${upRes.status}` };

    // 3) Create the post referencing the image
    const body = {
      author: owner,
      commentary: post.caption,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { media: { id: imageUrn, title: post.headline?.slice(0, 60) || "Callnomic" } },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    const postRes = await fetch(`${BASE}/posts`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!postRes.ok) {
      const t = await postRes.text();
      return { ok: false, error: `create post ${postRes.status}: ${t.slice(0, 200)}` };
    }
    const postId = postRes.headers.get("x-restli-id") || postRes.headers.get("x-linkedin-id") || "";
    const url = postId ? `https://www.linkedin.com/feed/update/${postId}` : "https://www.linkedin.com/company";
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
