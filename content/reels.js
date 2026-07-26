// Educational "hook" scripts for Reels — separate from the formal post LIBRARY.
// Goal: teach the GCC/Chennai business community WHY they need AI in their business,
// not just promote Callnomic. Reach + conversion, not brand-formal.
//
// Each script becomes a kinetic-caption video: hook (pattern interrupt) -> 2-4 punchy
// lines -> a soft CTA. Same brand-voice rules as the post library apply: no fake
// stats/clients, no hype words, never imply ownership (setup fee + monthly service),
// no "revolutionary/game-changer" language.
//
// pillar is used for variety tracking (don't repeat the same angle back-to-back).

/** @type {{pillar:string, hook:string, lines:string[], cta:string, tags:string[]}[]} */
export const REELS = [
  {
    pillar: "urgency",
    hook: "Your customer messaged you 3 minutes ago.",
    lines: [
      "They also messaged 2 of your competitors.",
      "Whoever replies first usually wins the sale.",
      "Most businesses reply in hours. Customers now expect seconds.",
    ],
    cta: "An AI agent replies the instant they message — day or night.",
    tags: ["#AIforbusiness", "#GCCbusiness", "#customerexperience", "#smallbusiness"],
  },
  {
    pillar: "myth-bust",
    hook: "\"AI is only for big companies.\"",
    lines: [
      "That was true 5 years ago.",
      "Today a single AI agent can answer, qualify and book customers all day —",
      "at a fraction of what a full-time hire costs.",
    ],
    cta: "You don't need a tech team. You need the right AI employee.",
    tags: ["#AImyths", "#smallbusiness", "#GCCbusiness", "#automation"],
  },
  {
    pillar: "cost-of-inaction",
    hook: "Every missed call is a customer calling someone else.",
    lines: [
      "Lunch break. Prayer time. After hours.",
      "Your phone doesn't stop ringing just because your team is busy.",
      "Every unanswered call is revenue walking to a competitor.",
    ],
    cta: "An AI phone agent never misses a call — ever.",
    tags: ["#missedcalls", "#AIcaller", "#GCC", "#revenue"],
  },
  {
    pillar: "what-customers-expect",
    hook: "Customers don't compare you to your competitor anymore.",
    lines: [
      "They compare you to the fastest business they dealt with today.",
      "Instant replies. Clear answers. No waiting.",
      "That's the new bar — set by AI-first businesses.",
    ],
    cta: "Meet that bar, or lose the customer to whoever does.",
    tags: ["#customerexperience", "#AIforbusiness", "#GCCbusiness"],
  },
  {
    pillar: "signs-you-need-ai",
    hook: "3 signs your business needs an AI employee.",
    lines: [
      "1. Your team answers the same questions all day.",
      "2. Leads sit in WhatsApp for hours before anyone replies.",
      "3. You've lost count of the calls you missed this week.",
    ],
    cta: "If even one of these is true, you're already losing customers to speed.",
    tags: ["#AIemployee", "#businesstips", "#GCCbusiness", "#leadgeneration"],
  },
  {
    pillar: "how-it-works",
    hook: "An AI employee isn't a chatbot with a script.",
    lines: [
      "It reads your real business data.",
      "It remembers the customer across conversations.",
      "It knows when to close the loop — and when to hand off to a human.",
    ],
    cta: "That's the difference between \"press 1 for sales\" and something that actually helps.",
    tags: ["#AIemployee", "#conversationalAI", "#GCCbusiness"],
  },
  {
    pillar: "competitor-fear",
    hook: "Somewhere in your market, a competitor already replies in seconds.",
    lines: [
      "Not because they work harder.",
      "Because an AI agent is doing it for them, around the clock.",
      "Speed is quietly becoming the deciding factor in who wins the customer.",
    ],
    cta: "The businesses adopting AI first aren't smarter — they're just earlier.",
    tags: ["#AIforbusiness", "#GCCbusiness", "#competition"],
  },
  {
    pillar: "myth-bust",
    hook: "\"Customers won't want to talk to AI.\"",
    lines: [
      "Most customers don't care WHO answers.",
      "They care that someone answers now, in their language, correctly.",
      "A slow human reply loses to a fast, accurate AI reply — every time.",
    ],
    cta: "Speed and accuracy win. Not who's on the other end.",
    tags: ["#AImyths", "#customerexperience", "#GCCbusiness"],
  },
  {
    pillar: "cost-of-inaction",
    hook: "Hiring is slow. Customer demand isn't.",
    lines: [
      "Every growing business hits the same wall:",
      "you need more hands before you can afford more salaries.",
      "That gap is exactly where leads go cold.",
    ],
    cta: "An AI employee covers the front-desk work from day one — no notice period, no sick days.",
    tags: ["#hiring", "#AIemployee", "#scaling", "#GCCbusiness"],
  },
  {
    pillar: "quick-tip",
    hook: "One question to ask before you lose another lead:",
    lines: [
      "\"What happens to a message that comes in at 11 PM?\"",
      "If the honest answer is \"it waits until morning\" —",
      "that's a gap your competitor's AI agent doesn't have.",
    ],
    cta: "Close that gap. Every hour it's open, someone else is answering your customer.",
    tags: ["#businesstips", "#AIforbusiness", "#GCCbusiness"],
  },
  {
    pillar: "myth-bust",
    hook: "\"We're not big enough to need bilingual support.\"",
    lines: [
      "If your customers speak Arabic and English,",
      "your business already needs to answer in both — instantly.",
      "Hiring for that around the clock is expensive. Automating it isn't.",
    ],
    cta: "One AI agent handles both languages, every hour, without extra headcount.",
    tags: ["#bilingual", "#GCCbusiness", "#AIforbusiness", "#UAE"],
  },
  {
    pillar: "how-it-works",
    hook: "Here's what actually happens when a lead messages your AI agent.",
    lines: [
      "It answers instantly, in their language.",
      "It asks the right qualifying questions.",
      "It books the call or hands a hot lead straight to your team.",
    ],
    cta: "No manual follow-up. No lead falling through the cracks.",
    tags: ["#AIagent", "#leadgeneration", "#GCCbusiness", "#automation"],
  },
  {
    pillar: "cost-of-inaction",
    hook: "The most expensive thing in your business isn't ads.",
    lines: [
      "It's the lead you already paid for — and never followed up with.",
      "A message sitting unanswered in a group chat.",
      "You paid to get that customer's attention. Don't lose them to silence.",
    ],
    cta: "An AI agent replies the moment they message, every time.",
    tags: ["#leadgeneration", "#marketing", "#GCCbusiness", "#ROI"],
  },
  {
    pillar: "urgency",
    hook: "The businesses that win the next 5 years won't be the biggest.",
    lines: [
      "They'll be the fastest to respond.",
      "AI is what makes \"instant\" possible without hiring an army.",
      "This shift is already happening in the GCC — quietly, business by business.",
    ],
    cta: "The only question is whether you adopt it now, or after your competitor does.",
    tags: ["#futureofbusiness", "#AIforbusiness", "#GCCbusiness"],
  },
  {
    pillar: "signs-you-need-ai",
    hook: "If your team dreads checking messages on Monday morning —",
    lines: [
      "that backlog built up over the weekend.",
      "Every one of those messages was a customer waiting.",
      "Some of them already found someone else by Monday.",
    ],
    cta: "An AI agent clears that backlog in real time, all weekend, every weekend.",
    tags: ["#businesstips", "#customerexperience", "#GCCbusiness"],
  },
  {
    pillar: "quick-tip",
    hook: "Quick gut-check for business owners:",
    lines: [
      "Count how many times today you or your team typed the same answer twice.",
      "Opening hours. Pricing. \"Do you deliver?\"",
      "That repetition is exactly what an AI agent should be handling instead.",
    ],
    cta: "Free your team for the conversations that actually need a human.",
    tags: ["#productivity", "#AIforbusiness", "#GCCbusiness", "#businesstips"],
  },

  // ========== PORTAL / PLATFORM (the flagship product) ==========
  // Grounded in the real Callnomics portal: one omnichannel place with a selling
  // AI concierge, CRM, campaigns, commerce, content studio, analytics — fully
  // managed. Never imply the client "owns" it. Don't name specific clients.
  {
    pillar: "portal-omnichannel",
    hook: "You're running your business from 4 different inboxes.",
    lines: [
      "WhatsApp on one phone. Instagram DMs on another.",
      "Messenger somewhere. Website chat nobody's watching.",
      "Messages slip through every crack between them.",
    ],
    cta: "One portal. Every channel. One AI concierge answering all of it.",
    tags: ["#omnichannel", "#WhatsApp", "#GCCbusiness", "#AIforbusiness"],
  },
  {
    pillar: "portal-concierge",
    hook: "A chatbot deflects customers. This one closes them.",
    lines: [
      "It's trained on your real catalogue — not a canned FAQ.",
      "It recommends the right product and answers \"where's my order?\" live.",
      "Then it hands the hot lead to your team at the right moment.",
    ],
    cta: "That's a concierge that sells — not a bot that stalls.",
    tags: ["#AIconcierge", "#conversationalcommerce", "#sales", "#GCCbusiness"],
  },
  {
    pillar: "portal-grounded",
    hook: "The real reason business owners don't trust AI:",
    lines: [
      "They've seen it confidently make up a wrong answer.",
      "Ours reads your actual catalogue and policies before it replies.",
      "And it says \"let me get a person\" when it should.",
    ],
    cta: "Grounded answers, in Arabic or English, every single time.",
    tags: ["#AIforbusiness", "#trust", "#customersupport", "#GCC"],
  },
  {
    pillar: "portal-doneforyou",
    hook: "\"We don't have a tech team to set this up.\"",
    lines: [
      "You don't need one.",
      "We build it, deploy it, and run it for you.",
      "Your only job: tweak the greeting and upload what you already know.",
    ],
    cta: "Done-for-you AI. You stay in sales — we handle the wiring.",
    tags: ["#doneforyou", "#AIforbusiness", "#smallbusiness", "#GCCbusiness"],
  },
  {
    pillar: "portal-analytics",
    hook: "\"We sent the campaign\" is not a result.",
    lines: [
      "127 read it. 41 replied. 9 bought.",
      "THAT'S a result you can act on.",
      "The portal shows the real funnel behind every broadcast.",
    ],
    cta: "Stop guessing which message worked. Start seeing it.",
    tags: ["#marketinganalytics", "#WhatsAppmarketing", "#ROI", "#GCCbusiness"],
  },
  {
    pillar: "portal-voice",
    hook: "It's not just chat. It answers the phone too.",
    lines: [
      "Every missed call is a customer calling a competitor.",
      "The portal's AI voice agent picks up every time,",
      "books the appointment, and logs it — in Arabic or English.",
    ],
    cta: "Chat, calls, CRM, campaigns — one portal, fully managed.",
    tags: ["#AIcaller", "#missedcalls", "#GCCbusiness", "#automation"],
  },
];
