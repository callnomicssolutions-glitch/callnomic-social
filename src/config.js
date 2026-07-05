// Central config. All secrets come from environment variables (GitHub Actions Secrets).
// Nothing sensitive is ever committed.

export const CONFIG = {
  // Telegram approval bot
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "", // your personal chat id (where drafts are sent)
  },

  // LinkedIn posting. authorUrn can be a PERSON urn (post to your profile) OR an
  // ORGANIZATION urn (post to a company page). Personal profile is the default here.
  //   person: "urn:li:person:xxxx"        (needs scope w_member_social)
  //   org:    "urn:li:organization:12345" (needs scope w_organization_social)
  linkedin: {
    token: process.env.LINKEDIN_ACCESS_TOKEN || "",
    authorUrn: process.env.LINKEDIN_AUTHOR_URN || process.env.LINKEDIN_ORG_URN || "",
  },

  // Instagram (via Facebook Graph API content publishing)
  instagram: {
    igUserId: process.env.IG_USER_ID || "",       // Instagram Business account id
    token: process.env.IG_ACCESS_TOKEN || "",     // long-lived page access token
  },

  // Optional Groq for FRESH AI posts. Off by default = zero token cost.
  groq: {
    key: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    // Only use AI when explicitly asked (env AI_FRESH=1) — default library is free.
    enabled: process.env.AI_FRESH === "1",
  },

  // Behaviour
  platforms: (process.env.PLATFORMS || "linkedin,instagram")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  // If PUBLIC_IMAGE_BASE is set (e.g. GitHub raw URL), Instagram will fetch images
  // from there. Filled automatically by the workflow.
  publicImageBase: process.env.PUBLIC_IMAGE_BASE || "",

  // Safety: never post automatically without an approval unless AUTO_APPROVE=1 (not recommended).
  autoApprove: process.env.AUTO_APPROVE === "1",

  // Set by the workflow so we know how to build raw image URLs.
  repo: process.env.GITHUB_REPOSITORY || "", // "owner/name"
  ref: process.env.GITHUB_REF_NAME || "main",
};

export function has(v) {
  return typeof v === "string" && v.trim().length > 0;
}
