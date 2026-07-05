// Callnomic content library — the zero-cost engine.
// The scheduler rotates through these so the feed keeps posting with NO API tokens.
// Each item:
//   pillar   - one of PILLARS (for variety tracking)
//   headline - short punchy line rendered ON the branded image (<= ~60 chars ideal)
//   caption  - the post body (works for both LinkedIn + Instagram)
//   tags     - hashtags appended to the caption
//
// Rules baked in: never imply the client "owns" the system; setup fee + monthly
// service; no fake stats/clients; GCC + Chennai audience.

/** @type {{pillar:string, headline:string, caption:string, tags:string[]}[]} */
export const LIBRARY = [
  // ---------- PAIN-POINT ----------
  {
    pillar: "pain-point",
    headline: "Your best lead just messaged at 1 AM.",
    caption:
      "Your best lead just messaged at 1 AM.\n\nBy 9 AM they've messaged three of your competitors too.\n\nIn the GCC, buyers expect an answer now — not next business day. An AI agent replies in seconds, in Arabic or English, captures the lead and books the call while you sleep.\n\nSpeed is the cheapest advantage you're not using yet.",
    tags: ["#GCCbusiness", "#AIautomation", "#customerexperience", "#UAE", "#SaudiArabia"],
  },
  {
    pillar: "pain-point",
    headline: "Missed calls are missed revenue.",
    caption:
      "A missed call isn't a missed call. It's a customer who just called someone else.\n\nMost small businesses miss 1 in 4 calls — lunch, prayer time, after hours, everyone's busy.\n\nAn AI phone agent answers every time, in Arabic and English, books the appointment, and texts you the details. No voicemail. No lost sale.",
    tags: ["#missedcalls", "#AIcaller", "#smallbusiness", "#GCC", "#automation"],
  },
  {
    pillar: "pain-point",
    headline: "Answering the same question 40 times a day?",
    caption:
      "\"What are your timings?\" \"Do you deliver?\" \"How much?\"\n\nYour team answers the same handful of questions all day — and still misses messages at night.\n\nAn AI support agent handles the repetitive 80% instantly, and only passes the real opportunities to a human. Your team stops typing and starts closing.",
    tags: ["#customersupport", "#AIagent", "#productivity", "#GCCbusiness", "#automation"],
  },
  {
    pillar: "pain-point",
    headline: "Hiring is slow. Demand isn't.",
    caption:
      "Every growing GCC business hits the same wall: you need more hands before you can afford more salaries.\n\nAn AI employee covers the repetitive front-desk work — chat, calls, follow-ups, data entry — from day one. No visa, no notice period, no sick days.\n\nYou scale the work without scaling the payroll.",
    tags: ["#hiring", "#AIemployee", "#scaling", "#GCC", "#smallbusiness"],
  },
  {
    pillar: "pain-point",
    headline: "Leads go cold in the group chat.",
    caption:
      "The enquiry comes in on WhatsApp. It gets forwarded. Someone will reply \"later.\" Later never comes.\n\nUncontacted leads are the most expensive thing in your business — you already paid to get them.\n\nAn AI agent catches every enquiry, replies instantly, and logs it in your CRM so nothing slips.",
    tags: ["#leadgeneration", "#WhatsApp", "#CRM", "#GCCbusiness", "#sales"],
  },

  // ---------- HOW-IT-WORKS ----------
  {
    pillar: "how-it-works",
    headline: "An AI employee, not just a chatbot.",
    caption:
      "A chatbot follows a script. An AI employee reasons.\n\nOurs reads your live business data, remembers the customer across visits, thinks before it speaks, and knows when to hand a hot lead to a human.\n\nThat's the difference between \"press 1 for sales\" and an assistant that actually helps.",
    tags: ["#AIemployee", "#conversationalAI", "#customerexperience", "#GCC"],
  },
  {
    pillar: "how-it-works",
    headline: "It speaks your customer's language. Literally.",
    caption:
      "Half your customers prefer Arabic. Half prefer English. Some switch mid-sentence.\n\nOur agents are bilingual by default — full Arabic with proper right-to-left support, and English — and they detect which one to use automatically.\n\nBuilt for how the GCC actually talks.",
    tags: ["#Arabic", "#bilingual", "#GCC", "#AIagent", "#UAE"],
  },
  {
    pillar: "how-it-works",
    headline: "Custom-built around YOUR business.",
    caption:
      "We don't hand you a generic bot and wish you luck.\n\nWe build the AI around your services, your prices, your process — then run it for you as a managed service. Setup fee to build it, monthly fee to host, support and keep improving it.\n\nYou get a system that fits, without hiring a tech team.",
    tags: ["#customAI", "#managedservice", "#GCCbusiness", "#automation"],
  },
  {
    pillar: "how-it-works",
    headline: "From enquiry to booking, without you.",
    caption:
      "Here's the flow, start to finish:\n\n1. Customer messages or calls.\n2. AI answers instantly, in their language.\n3. It answers questions from your real info.\n4. It books the appointment into your calendar.\n5. It logs the lead and pings you the details.\n\nYou wake up to a full calendar, not a full inbox.",
    tags: ["#automation", "#booking", "#AIagent", "#smallbusiness", "#GCC"],
  },
  {
    pillar: "how-it-works",
    headline: "One brain, many departments.",
    caption:
      "Support, sales follow-up, bookings, reminders, reporting — an AI workforce handles them as one connected system, sharing the same live data.\n\nThe support agent knows what the sales agent promised. Nothing falls through the cracks between tools.",
    tags: ["#AIworkforce", "#automation", "#operations", "#GCCbusiness"],
  },

  // ---------- OUTCOME ----------
  {
    pillar: "outcome",
    headline: "Reply time: hours → seconds.",
    caption:
      "The single biggest lever on conversion isn't a better pitch. It's answering first.\n\nWhen your reply time drops from hours to seconds, more leads stay warm, more calls get booked, more deals close — with the same marketing spend.\n\nYou're not getting more leads. You're finally keeping the ones you have.",
    tags: ["#conversion", "#sales", "#responsetime", "#GCC", "#automation"],
  },
  {
    pillar: "outcome",
    headline: "Open 24/7. Staffed by zero people.",
    caption:
      "Your customers don't only buy 9 to 6.\n\nWith an AI agent on the front line, your business answers, qualifies and books around the clock — weekends, holidays, 2 AM — without a single overtime hour.\n\nAlways-on, without burning out your team.",
    tags: ["#24x7", "#customerservice", "#AIagent", "#GCCbusiness"],
  },
  {
    pillar: "outcome",
    headline: "Your team, freed from the busywork.",
    caption:
      "The goal was never to replace your people. It's to stop wasting them.\n\nWhen AI handles the repetitive questions, data entry and first replies, your team spends its hours on the work only humans can do — closing, caring, creating.\n\nSame headcount. Far more output.",
    tags: ["#productivity", "#AIemployee", "#operations", "#GCC"],
  },
  {
    pillar: "outcome",
    headline: "Every lead, captured and followed up.",
    caption:
      "Leads don't leak when there's a system watching every channel.\n\nChat, calls, WhatsApp, the website form — all captured, all logged, all followed up automatically until they answer.\n\nThe deals you were losing quietly are the cheapest ones to win back.",
    tags: ["#leadgeneration", "#followup", "#CRM", "#sales", "#GCC"],
  },

  // ---------- MYTH-BUST ----------
  {
    pillar: "myth-bust",
    headline: "\"AI will sound robotic.\" Not anymore.",
    caption:
      "The old chatbots earned their bad reputation — rigid, scripted, useless past the second question.\n\nModern AI agents hold a real conversation, understand context, and switch languages naturally. Most customers can't tell until you tell them.\n\nJudge today's AI by today's AI, not the 2019 version.",
    tags: ["#AImyths", "#conversationalAI", "#customerexperience", "#GCC"],
  },
  {
    pillar: "myth-bust",
    headline: "\"AI is only for big companies.\"",
    caption:
      "Enterprise had AI first because they could afford custom builds. That's changed.\n\nA single-branch clinic, a boutique, a real-estate office — an AI agent that answers, qualifies and books is now within reach on a monthly service model.\n\nSmall teams feel the impact the most.",
    tags: ["#smallbusiness", "#AIforSMB", "#GCC", "#automation"],
  },
  {
    pillar: "myth-bust",
    headline: "\"We'll lose the personal touch.\"",
    caption:
      "The personal touch dies when a customer waits three hours for a reply — not when AI answers in three seconds.\n\nAI handles the routine so your people show up where it matters: the tricky question, the big client, the human moment.\n\nFaster and warmer aren't opposites.",
    tags: ["#customerexperience", "#AIagent", "#GCCbusiness"],
  },
  {
    pillar: "myth-bust",
    headline: "\"Setting it up will be a nightmare.\"",
    caption:
      "It won't — because you don't set it up. We do.\n\nWe build the AI around your business, connect it, test it, and run it as a managed service. You share your info once; we handle the rest and keep improving it monthly.\n\nNo tech team required on your side.",
    tags: ["#managedservice", "#automation", "#AIagent", "#GCC"],
  },

  // ---------- BEHIND-THE-BUILD ----------
  {
    pillar: "behind-the-build",
    headline: "We build the AI we'd want to hire.",
    caption:
      "Every agent we ship has to pass one test: would we put it in front of our own customers?\n\nThat's why ours think before they speak, remember returning customers, and hand off to a human at the right moment.\n\nWe're not shipping demos. We're shipping employees.",
    tags: ["#buildinpublic", "#AIemployee", "#Callnomic", "#GCC"],
  },
  {
    pillar: "behind-the-build",
    headline: "Made in the GCC, for the GCC.",
    caption:
      "Global tools treat Arabic as an afterthought. We don't.\n\nRight-to-left done properly, the local way people actually phrase things, GCC business hours and prayer-time awareness — these aren't features we bolt on. They're the starting point.\n\nBuilt where our customers are.",
    tags: ["#GCC", "#Arabic", "#madeinGCC", "#AIagent", "#UAE"],
  },
  {
    pillar: "behind-the-build",
    headline: "Boring reliability beats flashy demos.",
    caption:
      "A demo that dazzles once is easy. An agent that quietly handles 500 real conversations without embarrassing you is the hard part.\n\nWe obsess over the boring stuff — accuracy, handoffs, not making things up — because that's what earns your customers' trust every single day.",
    tags: ["#reliability", "#AIagent", "#Callnomic", "#GCCbusiness"],
  },

  // ---------- QUICK-TIP ----------
  {
    pillar: "quick-tip",
    headline: "Tip: answer within 5 minutes.",
    caption:
      "A lead contacted in the first 5 minutes is dramatically more likely to convert than one contacted an hour later.\n\nMost businesses can't hit that consistently with humans alone — lunch, calls, sleep get in the way.\n\nThe fix isn't \"try harder.\" It's a system that never has an off-hour.",
    tags: ["#salestip", "#leadresponse", "#conversion", "#GCC"],
  },
  {
    pillar: "quick-tip",
    headline: "Tip: log every enquiry in one place.",
    caption:
      "If your leads live across WhatsApp, Instagram DMs, phone notes and someone's memory — you're losing money you'll never see.\n\nPick one place. Send everything there automatically. Follow up from there.\n\nAn AI agent can do the capturing so your team just does the closing.",
    tags: ["#CRM", "#salestip", "#leadmanagement", "#GCCbusiness"],
  },
  {
    pillar: "quick-tip",
    headline: "Tip: measure your after-hours leads.",
    caption:
      "For one week, note every enquiry that arrives outside working hours.\n\nMost owners are shocked — it's often a third of all leads, going unanswered until morning.\n\nThat number is your case for an always-on agent, in your own data.",
    tags: ["#businesstip", "#leadgeneration", "#automation", "#GCC"],
  },

  // ---------- OFFER (soft CTA) ----------
  {
    pillar: "offer",
    headline: "See your AI employee in action.",
    caption:
      "Curious what an AI agent would sound like handling YOUR customers?\n\nWe'll show you a live demo built around your business — chat, calls, bookings — so you can judge it for real, not on a slide.\n\nDM us \"demo\" or visit callnomicsolutions.com.",
    tags: ["#AIagent", "#bookademo", "#GCCbusiness", "#Callnomic"],
  },
  {
    pillar: "offer",
    headline: "Let's build your AI front desk.",
    caption:
      "Answers every message. Picks up every call. Books every appointment. Speaks Arabic and English. Never off the clock.\n\nWe custom-build it around your business and run it for you — setup, then a simple monthly service.\n\nReady to see it? callnomicsolutions.com",
    tags: ["#AIfrontdesk", "#automation", "#GCC", "#Callnomic"],
  },
  {
    pillar: "offer",
    headline: "What would you automate first?",
    caption:
      "If you could hand one repetitive task to an AI employee tomorrow — the one that eats your team's day — what would it be?\n\nTell us in the comments. That's usually the perfect place to start.\n\nOr skip ahead: callnomicsolutions.com",
    tags: ["#automation", "#AIemployee", "#GCCbusiness", "#Callnomic"],
  },
];

// Sanity: keep the library non-trivial so rotation feels fresh.
export const LIBRARY_SIZE = LIBRARY.length;
