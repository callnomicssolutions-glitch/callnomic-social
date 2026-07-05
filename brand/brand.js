// Single source of brand truth for Callnomic Solutions.
// Used by the image renderer and (optionally) the AI generator.
// IMPORTANT business-model rule: we CUSTOM-BUILD AI systems, charge a setup fee +
// monthly service fee. Clients NEVER "own" the system and it is NOT rent-free SaaS.
// Never write copy that implies ownership or "no monthly cost".

export const BRAND = {
  name: "Callnomic Solutions",
  handle: "@callnomic",
  site: "callnomicsolutions.com",
  tagline: "AI employees for GCC businesses.",

  // Colours (match the website theme)
  colors: {
    bg1: "#0B1220",      // deep navy
    bg2: "#13233A",      // navy
    ink: "#F5F8FF",      // near-white text
    ink2: "#A9B7CE",     // muted text
    cyan: "#38C6F4",
    violet: "#8B5CF6",
    teal: "#16B8A6",
    gold: "#E9B872",
  },

  // What we actually do — grounding for AI-written posts so it never hallucinates.
  facts: [
    "Callnomic builds custom AI systems for GCC businesses: AI chat agents, AI phone callers, AI dashboards, CRMs and workflow automation.",
    "Business model: a one-time setup fee to build it, then a monthly service fee for hosting, support and improvements. Clients do not buy or own the software; they subscribe to a managed service.",
    "Bilingual by default — English and Arabic, with full RTL support.",
    "Serves the GCC (UAE, Saudi, Oman, Qatar, Bahrain, Kuwait) and Chennai, India.",
    "Products include Callnomic Assist (AI support + lead capture + booking agent) and an AI phone caller that answers and books over the phone.",
    "Founder: Fadil Muhammad.",
  ],

  // Voice
  voice: {
    do: [
      "confident, plain-spoken, useful",
      "speak to GCC business owners and managers",
      "lead with the customer's pain or a concrete outcome",
      "short sentences, one idea per line",
    ],
    dont: [
      "no hype words like 'revolutionary', 'game-changer', 'unlock'",
      "never imply the client 'owns' the system or that there is no monthly cost",
      "no fake stats or made-up client names",
      "no emoji spam — at most one or two, purposeful",
    ],
  },
};

// Rotating content pillars keep the feed varied and 'organic'.
export const PILLARS = [
  "pain-point",       // a real problem GCC SMBs feel
  "how-it-works",     // demystify how an AI employee works
  "outcome",          // the result/benefit, concretely
  "myth-bust",        // correct a misconception about AI
  "behind-the-build", // founder/build story, human angle
  "quick-tip",        // a useful tip they can use today
  "offer",            // soft CTA to book a demo
];
