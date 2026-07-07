// Picks the next post. Default = free rotation through the content library with a
// pillar-variety guard. Optional = a fresh AI-written post via Groq (only if AI_FRESH=1).
import { LIBRARY } from "../content/library.js";
import { REELS } from "../content/reels.js";
import { BRAND, PILLARS } from "../brand/brand.js";
import { CONFIG } from "./config.js";

// Choose the next library item: walk forward from rotationIndex, skip anything whose
// pillar was used in the last 2 posts, so the feed doesn't repeat a theme back-to-back.
export function pickFromLibrary(state) {
  const n = LIBRARY.length;
  const recent = state.recentPillars.slice(-2);
  let idx = state.rotationIndex % n;
  for (let step = 0; step < n; step++) {
    const cand = LIBRARY[(idx + step) % n];
    if (!recent.includes(cand.pillar)) {
      return { item: cand, nextIndex: (idx + step + 1) % n };
    }
  }
  // fallback: just take the next one
  const item = LIBRARY[idx];
  return { item, nextIndex: (idx + 1) % n };
}

// Same variety-guarded rotation, but through the REELS script library.
export function pickReelScript(state) {
  const n = REELS.length;
  const recent = (state.recentReelPillars || []).slice(-3);
  let idx = (state.reelRotationIndex || 0) % n;
  for (let step = 0; step < n; step++) {
    const cand = REELS[(idx + step) % n];
    if (!recent.includes(cand.pillar)) {
      return { item: cand, nextIndex: (idx + step + 1) % n };
    }
  }
  const item = REELS[idx];
  return { item, nextIndex: (idx + 1) % n };
}

// OPTIONAL fresh AI post. Costs Groq tokens — only when CONFIG.groq.enabled.
export async function generateFresh(pillar) {
  if (!CONFIG.groq.enabled || !CONFIG.groq.key) return null;
  const chosenPillar = pillar || PILLARS[Math.floor(Math.random() * PILLARS.length)];
  const sys = [
    `You write social posts for ${BRAND.name} (${BRAND.site}).`,
    `Facts you MUST stay within:`,
    ...BRAND.facts.map((f) => "- " + f),
    `Voice DO: ${BRAND.voice.do.join("; ")}.`,
    `Voice DON'T: ${BRAND.voice.dont.join("; ")}.`,
    `Audience: GCC business owners/managers, and Chennai.`,
    `Write ONE post for the "${chosenPillar}" angle.`,
    `Return STRICT JSON: {"headline": string (max 60 chars, punchy, goes on the image),`,
    `"caption": string (2-5 short lines, may include the headline idea),`,
    `"tags": string[] (4-6 relevant hashtags, no spaces)}. No markdown, JSON only.`,
  ].join("\n");
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG.groq.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: sys }],
      }),
    });
    if (!r.ok) {
      console.warn("[generate] groq failed", r.status);
      return null;
    }
    const data = await r.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (!parsed.headline || !parsed.caption) return null;
    return {
      pillar: chosenPillar,
      headline: String(parsed.headline).slice(0, 90),
      caption: String(parsed.caption),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    };
  } catch (e) {
    console.warn("[generate] groq error", e.message);
    return null;
  }
}

// Full caption text (body + hashtags) for a platform.
export function composeCaption(item, platform) {
  const tags = (item.tags || []).join(" ");
  const foot = platform === "instagram" ? `\n\n🔗 ${BRAND.site}` : "";
  return `${item.caption}${foot}${tags ? "\n\n" + tags : ""}`.trim();
}

// Caption for a Reel: hook + body lines + cta + site link + hashtags.
export function composeReelCaption(item) {
  const body = [item.hook, ...item.lines, item.cta].join("\n");
  const tags = (item.tags || []).join(" ");
  return `${body}\n\n🔗 ${BRAND.site}${tags ? "\n\n" + tags : ""}`.trim();
}
