// Picks the next post. Default = free rotation through the content library with a
// pillar-variety guard. Optional = a fresh AI-written post via Groq (only if AI_FRESH=1).
import { LIBRARY } from "../content/library.js";
import { REELS } from "../content/reels.js";
import { BRAND, PILLARS } from "../brand/brand.js";
import { CONFIG } from "./config.js";

// How long a headline is off-limits on a platform it already ran on. The library is
// finite, so the rotation wraps every couple of months and would otherwise re-post the
// same line — which is what put the same content on the feed more than once.
const REPEAT_AFTER_DAYS = Number(process.env.REPEAT_AFTER_DAYS || 45);

// Headlines already live on this platform inside the no-repeat window. Queued posts
// count too: two drafts carrying the same line must not both go out.
export function recentlyUsed(state, platform) {
  const cutoff = new Date(Date.now() - REPEAT_AFTER_DAYS * 864e5).toISOString();
  const used = new Set();
  for (const p of state.posts || []) {
    if (p.platform !== platform) continue;
    const live = p.status === "posted" && (p.postedAt || "") >= cutoff;
    const queued = p.status === "approved" || p.status === "pending" || p.status === "publishing";
    if (live || queued) used.add(p.headline);
  }
  return used;
}

// Choose the next library item: walk forward from rotationIndex, skip anything whose
// pillar was used in the last 2 posts so the feed doesn't repeat a theme back-to-back,
// and skip anything this platform has run recently.
export function pickFromLibrary(state, platform) {
  const n = LIBRARY.length;
  const recent = state.recentPillars.slice(-2);
  const used = platform ? recentlyUsed(state, platform) : new Set();
  let idx = state.rotationIndex % n;
  // First pass honours both guards; second drops the pillar guard rather than
  // re-posting a headline; only if the whole library is exhausted do we repeat.
  for (const strict of [true, false]) {
    for (let step = 0; step < n; step++) {
      const cand = LIBRARY[(idx + step) % n];
      if (used.has(cand.headline)) continue;
      if (strict && recent.includes(cand.pillar)) continue;
      return { item: cand, nextIndex: (idx + step + 1) % n };
    }
  }
  // fallback: everything has run recently on this platform — take the next one
  const item = LIBRARY[idx];
  return { item, nextIndex: (idx + 1) % n };
}

// Same variety-guarded rotation, but through the REELS script library.
export function pickReelScript(state) {
  const n = REELS.length;
  const recent = (state.recentReelPillars || []).slice(-3);
  const used = recentlyUsed(state, "instagram");
  let idx = (state.reelRotationIndex || 0) % n;
  for (const strict of [true, false]) {
    for (let step = 0; step < n; step++) {
      const cand = REELS[(idx + step) % n];
      if (used.has(cand.hook)) continue;
      if (strict && recent.includes(cand.pillar)) continue;
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

// A post written from what actually happened this week: notes Fadil sent the bot, and
// commits from the repos he works in.
//
// The hard rule in the prompt is the whole point. An engine that invents plausible
// founder content will produce the generic slop nobody reads, and sooner or later it
// will state something untrue about the business under his name. So: every claim must
// trace to the material below, and if the material is too thin it returns {skip:true}
// rather than filling the gap. Unlike generateFresh this is not gated behind AI_FRESH —
// asking for a digest IS the opt-in — but it still needs a Groq key.
export async function generateFromActivity(notes, commits) {
  if (!CONFIG.groq.key) return null;
  const material = [
    notes.length ? "NOTES Fadil sent (newest first):" : "NOTES: none.",
    ...notes.map((n) => `- [${n.at.slice(0, 10)}] ${n.text}`),
    "",
    commits.length ? "COMMITS (what he built):" : "COMMITS: none.",
    ...commits.map((c) => `- [${c.at.slice(0, 10)}] ${c.repo}: ${c.subject}`),
  ].join("\n");

  const sys = [
    `You write LinkedIn posts for ${BRAND.name}'s founder, Fadil Muhammad, in the first person.`,
    ``,
    `ABSOLUTE RULE: every concrete claim, number, name and event in the post must appear`,
    `in the MATERIAL below. Invent nothing. Do not estimate, round up, or add a statistic`,
    `that is not there. If the material is too thin for an honest post, return`,
    `{"skip": true, "reason": "<one line>"} and nothing else.`,
    ``,
    `Background facts you may rely on:`,
    ...BRAND.facts.map((f) => "- " + f),
    ``,
    `Voice DO: ${BRAND.voice.do.join("; ")}. Write like a person talking, not a brand.`,
    `Voice DON'T: ${BRAND.voice.dont.join("; ")}.`,
    `Also avoid: "excited to share", "thrilled", "journey", "learnings", "game-changer",`,
    `rhetorical questions as openers, and three-item lists. Vary sentence length.`,
    `Specifics beat adjectives. A real number is worth a paragraph of description.`,
    ``,
    `Structure: open with the most concrete thing that happened. Say what it cost or`,
    `taught. End with something useful to another operator, or a genuine question.`,
    `Do not pitch. No call to action asking for business.`,
    ``,
    `Return STRICT JSON: {"headline": string (max 60 chars, goes on the image),`,
    `"caption": string (120-280 words, short lines, blank line between paragraphs),`,
    `"tags": string[] (3-5 hashtags, no spaces)}. JSON only, no markdown.`,
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
        temperature: 0.6, // lower than generateFresh: this one must stay on the facts
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `MATERIAL\n\n${material}` },
        ],
      }),
    });
    if (!r.ok) {
      console.warn("[digest] groq failed", r.status);
      return null;
    }
    const data = await r.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (parsed.skip) {
      console.log(`[digest] model declined: ${parsed.reason || "thin material"}`);
      return { skip: true, reason: parsed.reason || "not enough to write about yet" };
    }
    if (!parsed.headline || !parsed.caption) return null;
    return {
      pillar: "activity",
      headline: String(parsed.headline).slice(0, 90),
      caption: String(parsed.caption),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch (e) {
    console.warn("[digest] groq error", e.message);
    return null;
  }
}
