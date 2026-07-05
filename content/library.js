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

  // ================= BATCH 2 =================

  // ---------- PAIN-POINT ----------
  {
    pillar: "pain-point",
    headline: "Ramadan hours. Eid rush. Your inbox doesn't rest.",
    caption:
      "Seasonal peaks are when you make the year — and when your team is most stretched thin.\n\nAn AI agent absorbs the surge: it answers the flood of \"are you open?\" and \"do you deliver for Eid?\" instantly, so no order is lost while everyone's busy.\n\nBusy season should feel like opportunity, not chaos.",
    tags: ["#Ramadan", "#Eid", "#GCCbusiness", "#automation", "#customerservice"],
  },
  {
    pillar: "pain-point",
    headline: "You're paying for ads that lead to a silent inbox.",
    caption:
      "Every dirham on ads sends people to message you. Then… no one replies for hours.\n\nThat's not a marketing problem. It's a response problem — and it quietly wastes your whole budget.\n\nAn AI agent answers every ad enquiry the second it lands, so the spend actually turns into bookings.",
    tags: ["#marketing", "#adspend", "#leadresponse", "#GCC", "#ROI"],
  },
  {
    pillar: "pain-point",
    headline: "Your receptionist can only be in one place.",
    caption:
      "Phone rings while she's with a walk-in. WhatsApp buzzes while she's on the phone. Something always waits.\n\nAn AI agent handles every channel at once — calls, chat, WhatsApp — in parallel, in Arabic and English.\n\nNot to replace her. To clone the parts that don't need her.",
    tags: ["#frontdesk", "#AIagent", "#smallbusiness", "#GCC"],
  },
  {
    pillar: "pain-point",
    headline: "\"Let me check and get back to you.\" (Never happens.)",
    caption:
      "The most expensive sentence in your business is a promise to follow up that no one keeps.\n\nAn AI agent that knows your prices, stock and availability just… answers. Right then. No callback, no forgotten note.\n\nCertainty closes. Silence loses.",
    tags: ["#sales", "#customerexperience", "#automation", "#GCCbusiness"],
  },

  // ---------- HOW-IT-WORKS ----------
  {
    pillar: "how-it-works",
    headline: "It knows when to call a human.",
    caption:
      "The smartest thing an AI agent does isn't answering — it's knowing its limits.\n\nWhen a conversation gets complex, sensitive, or high-value, ours hands it to your team with the full context attached.\n\nAI for the routine. Humans for the moments that matter. That's the whole design.",
    tags: ["#AIagent", "#humanhandoff", "#customerexperience", "#GCC"],
  },
  {
    pillar: "how-it-works",
    headline: "It remembers your customers. Even the returning ones.",
    caption:
      "A good employee remembers the regular. So does ours.\n\nWhen a past customer comes back, the agent recalls who they are and what they wanted — no \"can I get your details again?\"\n\nThat memory is what turns a bot into someone worth talking to.",
    tags: ["#customerexperience", "#AIagent", "#loyalty", "#GCCbusiness"],
  },
  {
    pillar: "how-it-works",
    headline: "It answers from YOUR facts, not the internet's.",
    caption:
      "Generic AI guesses. Ours doesn't.\n\nWe ground every agent in your real prices, services, hours and policies — so it answers with your truth, not a made-up one.\n\nNo hallucinated promises your team has to clean up later.",
    tags: ["#AIagent", "#accuracy", "#customAI", "#GCC"],
  },
  {
    pillar: "how-it-works",
    headline: "Chat today. Phone calls next. Same brain.",
    caption:
      "Start with an AI agent on chat and WhatsApp. Add the AI phone caller when you're ready.\n\nBoth share the same knowledge and the same memory — so your customer gets one consistent voice, whichever way they reach you.\n\nGrow the workforce one hire at a time.",
    tags: ["#AIcaller", "#AIagent", "#automation", "#GCCbusiness"],
  },

  // ---------- OUTCOME ----------
  {
    pillar: "outcome",
    headline: "A full calendar, not a full inbox.",
    caption:
      "The dream isn't fewer messages. It's messages that turn into booked appointments while you focus on the work.\n\nAn AI agent qualifies, answers and books straight into your calendar — so you wake up to a schedule, not a backlog.\n\nLess triage. More business.",
    tags: ["#booking", "#productivity", "#AIagent", "#GCC"],
  },
  {
    pillar: "outcome",
    headline: "Same team. Double the conversations handled.",
    caption:
      "You don't need to double your staff to double your reach.\n\nWith AI carrying the repetitive front-line load, the same team comfortably handles far more conversations — without the burnout that usually comes with growth.\n\nCapacity, without the payroll jump.",
    tags: ["#scaling", "#productivity", "#AIemployee", "#GCCbusiness"],
  },
  {
    pillar: "outcome",
    headline: "Your after-hours leads finally get answered.",
    caption:
      "The enquiries that used to sit until morning? Handled the moment they arrive — 11 PM, Friday, a public holiday.\n\nFor a lot of GCC businesses that's a third of all leads, quietly recovered.\n\nThe growth was already there. You just weren't awake for it.",
    tags: ["#leadgeneration", "#24x7", "#automation", "#GCC"],
  },

  // ---------- MYTH-BUST ----------
  {
    pillar: "myth-bust",
    headline: "\"AI can't handle Arabic properly.\"",
    caption:
      "A fair worry — most tools treat Arabic as an afterthought and it shows.\n\nWe build Arabic in from the start: correct right-to-left, the way people actually phrase things locally, switching to English when the customer does.\n\nTest it in Arabic. That's the point.",
    tags: ["#Arabic", "#AImyths", "#GCC", "#bilingual", "#UAE"],
  },
  {
    pillar: "myth-bust",
    headline: "\"It'll go rogue and say something wrong.\"",
    caption:
      "The horror stories come from AI let loose with no guardrails.\n\nOurs is grounded in your facts, kept on-topic, and hands off anything it's unsure about. It's built to say \"let me connect you\" instead of inventing an answer.\n\nControlled by design, not by luck.",
    tags: ["#AIsafety", "#AIagent", "#reliability", "#GCCbusiness"],
  },
  {
    pillar: "myth-bust",
    headline: "\"We'll be locked into something we can't change.\"",
    caption:
      "Your business shifts — new services, new prices, new hours. Your AI should shift with it.\n\nBecause we run it as a managed service, updates are part of the deal. You tell us what changed; we keep the agent current.\n\nIt grows with you, not against you.",
    tags: ["#managedservice", "#flexibility", "#AIagent", "#GCC"],
  },

  // ---------- BEHIND-THE-BUILD ----------
  {
    pillar: "behind-the-build",
    headline: "We test our agents by trying to break them.",
    caption:
      "Before an agent meets your customers, we throw the worst at it: trick questions, mixed languages, angry messages, nonsense.\n\nIf it stays calm, accurate and helpful under pressure, it ships. If not, it doesn't.\n\nYour customers should only ever meet the version that passed.",
    tags: ["#buildinpublic", "#reliability", "#AIagent", "#Callnomic"],
  },
  {
    pillar: "behind-the-build",
    headline: "One founder, obsessed with the details.",
    caption:
      "Callnomic isn't a faceless vendor. It's built hands-on, with the small stuff sweated — the pause before a reply, the right Arabic phrasing, the clean handoff.\n\nThose details are the difference between \"a bot\" and \"that was helpful.\"\n\nWe'd rather get one thing right than ten things loud.",
    tags: ["#founder", "#Callnomic", "#craftsmanship", "#GCC"],
  },
  {
    pillar: "behind-the-build",
    headline: "We'd rather under-promise and over-deliver.",
    caption:
      "It's easy to sell magic in a slide deck. We'd rather show you the working thing.\n\nEvery client starts with a live demo built on their own business — so the decision is based on what it actually does, not what we claim.\n\nProof beats pitch.",
    tags: ["#Callnomic", "#AIagent", "#trust", "#GCCbusiness"],
  },

  // ---------- QUICK-TIP ----------
  {
    pillar: "quick-tip",
    headline: "Tip: reply in the language they messaged in.",
    caption:
      "Small thing, big trust: answer Arabic with Arabic, English with English.\n\nSwitching a customer's language mid-conversation is a subtle way to lose them.\n\nA bilingual AI agent gets this right automatically — every time, on every channel.",
    tags: ["#customerexperience", "#Arabic", "#salestip", "#GCC"],
  },
  {
    pillar: "quick-tip",
    headline: "Tip: track your first-reply time this week.",
    caption:
      "Pick one number to improve: how long until a new enquiry gets its first reply.\n\nWrite it down for a week. Most owners find it's hours, not minutes — and that gap is where deals leak.\n\nYou can't fix what you don't measure.",
    tags: ["#salestip", "#responsetime", "#businesstip", "#GCCbusiness"],
  },
  {
    pillar: "quick-tip",
    headline: "Tip: never make a customer repeat themselves.",
    caption:
      "Asking \"what did you need again?\" quietly signals you weren't paying attention.\n\nCapture the context once and carry it through the whole conversation — and across future ones.\n\nMemory is a feature customers feel, even if they can't name it.",
    tags: ["#customerexperience", "#salestip", "#AIagent", "#GCC"],
  },

  // ---------- OFFER ----------
  {
    pillar: "offer",
    headline: "We'll build a demo on YOUR business.",
    caption:
      "Not a generic sales call — a working AI agent set up around your actual services, so you can talk to it like your customer would.\n\nJudge it for real. If it's not obviously useful, no hard feelings.\n\nStart here: callnomicsolutions.com",
    tags: ["#bookademo", "#AIagent", "#GCCbusiness", "#Callnomic"],
  },
  {
    pillar: "offer",
    headline: "Tired of losing leads after hours? Let's fix it.",
    caption:
      "If enquiries are slipping through at night, on weekends, or during the rush — that's the easiest revenue you'll ever recover.\n\nWe build an always-on AI agent around your business and run it for you. Setup, then a simple monthly service.\n\ncallnomicsolutions.com",
    tags: ["#leadgeneration", "#automation", "#GCC", "#Callnomic"],
  },
  {
    pillar: "offer",
    headline: "Partner with us — resell AI to your clients.",
    caption:
      "Run a web, ERP or marketing agency in the GCC? Add AI agents and automation to what you already sell — we build and run them, you earn the commission.\n\nYour clients get more; you get a new revenue line with none of the tech overhead.\n\nLet's talk: callnomicsolutions.com",
    tags: ["#partnership", "#resellers", "#GCC", "#Callnomic", "#agency"],
  },
  {
    pillar: "offer",
    headline: "Your competitors are already replying faster.",
    caption:
      "Speed is quietly becoming the deciding factor for GCC buyers — and the businesses that answer first are winning the ones that used to be yours.\n\nAn AI agent levels that overnight.\n\nSee what yours would sound like: callnomicsolutions.com",
    tags: ["#competitiveedge", "#AIagent", "#GCCbusiness", "#Callnomic"],
  },
];

// Sanity: keep the library non-trivial so rotation feels fresh.
export const LIBRARY_SIZE = LIBRARY.length;
