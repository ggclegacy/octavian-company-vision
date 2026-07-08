import { categories, personalOsCategories, type Category } from "./data";
import type { AnswerRecord, ReviewFeedback, SessionState } from "./storage";

const need = "Needs follow-up";

export type Completeness = "Strong foundation" | "Needs follow-up" | "Missing key details";

export type VisionSection = {
  id: string;
  title: string;
  body: string[];
  sourceQuestionIds: string[];
  strategicRead?: string;
};

const futurePersonalOSModules = [
  {
    name: "Personal Dashboard",
    description: "Daily focus, priorities, goals, reminders, and life/business balance.",
  },
  {
    name: "Oakfire Command",
    description: "Brand vision, business direction, website plan, catering path, Oakfire x Sanctum partnership planning, and company roadmap.",
  },
  {
    name: "Oakfire x Sanctum",
    description:
      "Event ideas, plate drop planning, tasting night checklists, partnership roadmap, catering lead tracking, content capture checklist, and 30-day test metrics for the Legacy Sanctum opportunity.",
  },
  {
    name: "Brand Builder",
    description: "Story, voice, visual identity, name direction, customer experience, and positioning.",
  },
  {
    name: "Catering System",
    description: "Event types, package ideas, prep checklists, quote support, and customer follow-up.",
  },
  {
    name: "Content Engine",
    description: "YouTube ideas, reels, captions, cook breakdowns, posting rhythm, and content planning.",
  },
  {
    name: "Growth Roadmap",
    description: "30-day, 90-day, and one-year path for building Oakfire while working full time.",
  },
  {
    name: "AI Concierge",
    description: "A simple assistant for planning, pricing, messaging, content ideas, learning, and decision-making.",
  },
  {
    name: "Strain Library / Cannabis Explorer",
    description:
      "A personal module for cannabis strain research, favorites, notes, effects, terpene learning, and personal tracking. Keep it mature and professional; the whole app should not feel cannabis-focused.",
  },
  {
    name: "Finance & Planning",
    description: "Personal and Oakfire money tracking, savings goals, expense notes, income planning, and catering profit estimates.",
  },
  {
    name: "Health / Lifestyle",
    description: "Lightweight goals and reminders for energy, sleep, workouts, food, hydration, recovery, and consistency.",
  },
  {
    name: "Real Estate / Realtor Support",
    description: "Optional work module for leads, follow-ups, task lists, client notes, and real estate support if still relevant.",
  },
  {
    name: "Notes & Favorites",
    description: "Personal notes, ideas, inspirations, favorite strains, favorite recipes, and business thoughts.",
  },
  {
    name: "Weekly Focus",
    description: "A simple weekly planning system to choose priorities and track progress.",
  },
];

const futureAppNamingIdeas = [
  {
    name: "Eighth Flame",
    meaning: "A mythic/personal name that suggests an eighth source of drive, craft, and identity.",
    fit: "Could feel premium, mysterious, and personal without being limited to barbecue.",
    downside: "May need explanation so it does not feel abstract.",
  },
  {
    name: "Aurelius",
    meaning: "A refined name with imperial/golden associations and a disciplined personal tone.",
    fit: "Could match Octavian's name energy and feel like a serious personal operating system.",
    downside: "May feel too classical or detached from Oakfire if not grounded visually.",
  },
  {
    name: "The Oakfire Codex",
    meaning: "A living book/system for Oakfire knowledge, decisions, plans, and operating notes.",
    fit: "Strong bridge between Oakfire brand identity and a planning/knowledge system.",
    downside: "May sound more like a document library than a daily-use app.",
  },
  {
    name: "The Fire Ledger",
    meaning: "A record of goals, business moves, recipes, notes, wins, and learning.",
    fit: "Feels grounded, useful, and business-friendly.",
    downside: "Could feel too accounting-focused if the UI is not warm and personal.",
  },
  {
    name: "Crown & Crucible",
    meaning: "A premium name about pressure, transformation, leadership, and craft.",
    fit: "Could support a masculine, elevated, growth-focused personal OS.",
    downside: "May feel too brand-like or intense for a simple everyday tool.",
  },
  {
    name: "Octavian OS",
    meaning: "A direct personal operating system built around Octavian's life and business.",
    fit: "Immediately clear and practical.",
    downside: "More functional than evocative; may feel generic software-like.",
  },
  {
    name: "Oakfire Command",
    meaning: "A command center for the Oakfire business and related operating systems.",
    fit: "Very clear for the business module and brand direction.",
    downside: "May be too Oakfire-specific if the future app also needs personal modules.",
  },
  {
    name: "Blackened Oak",
    meaning: "A darker, premium Oakfire-adjacent name rooted in smoke, craft, and resilience.",
    fit: "Strong visual/brand atmosphere and easy extension from the current identity.",
    downside: "May sound more like a brand or venue than a personal OS.",
  },
];

const questionsBeforeFutureApp = [
  "What should the app be called?",
  "Should the app feel more like Octavian's personal OS or Oakfire's business command center?",
  "What does Octavian need most first: brand guidance, catering systems, content help, or personal planning?",
  "What should be the first module he actually uses weekly?",
  "Should cannabis strain research be private/personal only?",
  "Should real estate / realtor support be included if Octavian still does that work?",
  "What should Neil build first so the app feels useful immediately?",
  "What should be saved/editable in the app long term?",
];

const sectionMap = [
  {
    id: "session-overview",
    title: "Session Overview",
    sourceQuestionIds: ["final-understand", "goals-six-months", "goals-two-years", "goals-real-business"],
    lines: [
      ["Most important vision signal", "final-understand"],
      ["Near-term session focus", "goals-six-months"],
      ["One-to-two-year direction", "goals-two-years"],
      ["What makes it feel real", "goals-real-business"],
    ],
    strategicRead:
      "This overview should help Neil understand the clearest planning signals before building any future app or business system.",
  },
  {
    id: "original-vision-themes",
    title: "Octavian's Original Vision Themes",
    sourceQuestionIds: ["story-love", "story-meaning", "story-feeling", "goals-dream", "final-understand"],
    lines: [
      ["Why barbecue matters", "story-love"],
      ["Personal meaning", "story-meaning"],
      ["Feeling to create", "story-feeling"],
      ["Long-term dream", "goals-dream"],
      ["Core message for Neil", "final-understand"],
    ],
    strategicRead:
      "This section preserves the emotional source material and should stay close to Octavian's own words.",
  },
  {
    id: "oakfire-brand-story-direction",
    title: "Oakfire Brand Story Direction",
    sourceQuestionIds: ["story-love", "story-inspired", "story-meaning", "story-feeling", "story-memory"],
    lines: [
      ["Brand story root", "story-love"],
      ["Influences and roots", "story-inspired"],
      ["Personal meaning", "story-meaning"],
      ["Customer feeling to create", "story-feeling"],
      ["Memories or personal details", "story-memory"],
    ],
    strategicRead:
      "The strongest story material should become future About-page copy, content prompts, customer language, and brand positioning.",
  },
  {
    id: "executive-vision",
    title: "Oakfire Draft Company Vision",
    sourceQuestionIds: ["final-understand", "goals-six-months", "goals-two-years", "goals-dream", "goals-real-business"],
    lines: [
      ["Company vision", "final-understand"],
      ["Near-term milestone", "goals-six-months"],
      ["1-2 year direction", "goals-two-years"],
      ["Long-term possibility", "goals-dream"],
      ["Success marker", "goals-real-business"],
    ],
    strategicRead: "This section shows what the company can become and what will make it feel real.",
  },
  {
    id: "brand-identity-name-direction",
    title: "Business Name / Identity Direction",
    sourceQuestionIds: ["name-current", "name-choice", "name-like", "name-dislike", "name-inspiration"],
    lines: [
      ["Current name", "name-current"],
      ["Keep, evolve, or explore", "name-choice"],
      ["What already works", "name-like"],
      ["What needs pressure-testing", "name-dislike"],
      ["Naming themes from real life", "name-inspiration"],
    ],
    strategicRead: "The name should be able to work across catering, content, merch, events, and a future restaurant or food truck.",
  },
  {
    id: "visual-direction",
    title: "Visual Brand Direction",
    sourceQuestionIds: ["brand-colors", "brand-clear-colors", "brand-colorblindness", "brand-feel", "brand-lead"],
    lines: [
      ["Color direction", "brand-colors"],
      ["Colorblind-conscious clarity notes", "brand-clear-colors"],
      ["Known colorblindness details", "brand-colorblindness"],
      ["Desired brand feel", "brand-feel"],
      ["Primary brand focus", "brand-lead"],
    ],
    strategicRead: "The visual system should be high-contrast and clear to Octavian first, then polished for customers.",
  },
  {
    id: "food-positioning",
    title: "Food Identity & Signature Offers",
    sourceQuestionIds: ["food-meats", "food-sides", "food-compliments", "food-plate", "food-different"],
    lines: [
      ["Best meats", "food-meats"],
      ["Best sides", "food-sides"],
      ["Most complimented items", "food-compliments"],
      ["Hero plate", "food-plate"],
      ["Local difference", "food-different"],
    ],
    strategicRead: "Food positioning should identify the plate, flavor, or experience people will remember and recommend.",
  },
  {
    id: "business-model-path",
    title: "Business Model Direction",
    sourceQuestionIds: ["goals-six-months", "goals-two-years", "goals-dream", "goals-paths", "goals-real-business"],
    lines: [
      ["6-month goal", "goals-six-months"],
      ["1-2 year goal", "goals-two-years"],
      ["Long-term dream", "goals-dream"],
      ["Paths that interest Octavian", "goals-paths"],
      ["What makes it feel real", "goals-real-business"],
    ],
    strategicRead: "The smartest path is the one that fits current capacity while building toward the bigger dream.",
  },
  {
    id: "oakfire-legacy-sanctum-opportunity",
    title: "Oakfire x Legacy Sanctum Opportunity",
    sourceQuestionIds: [
      "sanctum-exciting",
      "sanctum-unclear-before",
      "sanctum-imagine",
      "sanctum-starting-model",
      "sanctum-food-fit",
      "sanctum-premium",
      "sanctum-frequency",
      "sanctum-operation-model",
      "sanctum-needs",
      "sanctum-first-test",
      "sanctum-30-day-success",
      "sanctum-reputation",
    ],
    lines: [
      ["Why the idea excites Octavian", "sanctum-exciting"],
      ["Uncertainty this may solve", "sanctum-unclear-before"],
      ["Partnership picture", "sanctum-imagine"],
      ["Best first model", "sanctum-starting-model"],
      ["Food format ideas", "sanctum-food-fit"],
      ["Premium experience factors", "sanctum-premium"],
      ["Realistic event / plate drop rhythm", "sanctum-frequency"],
      ["Operating model", "sanctum-operation-model"],
      ["Equipment, prep, storage, or serving needs", "sanctum-needs"],
      ["First test event", "sanctum-first-test"],
      ["30-day success metrics", "sanctum-30-day-success"],
      ["Partnership reputation", "sanctum-reputation"],
    ],
    strategicRead:
      "Oakfire x Legacy Sanctum should be framed as a lower-risk path for Oakfire to test demand, create content, gather feedback, and build a physical brand presence as the food, hospitality, and community-experience layer inside Legacy Sanctum.",
  },
  {
    id: "website-plan",
    title: "Website Direction",
    sourceQuestionIds: ["web-job", "web-goal", "web-next-step", "web-social", "web-success"],
    lines: [
      ["Website job", "web-job"],
      ["Primary call-to-action", "web-goal"],
      ["Visitor next step", "web-next-step"],
      ["Current social or YouTube links", "web-social"],
      ["Website success criteria", "web-success"],
    ],
    strategicRead: "The website should give people trust quickly and point them toward one clear next action.",
  },
  {
    id: "catering-system-direction",
    title: "Catering Direction",
    sourceQuestionIds: ["cat-events", "cat-size", "cat-equipment", "cat-costs", "cat-stress"],
    lines: [
      ["Event types to serve", "cat-events"],
      ["Current capacity", "cat-size"],
      ["Equipment available", "cat-equipment"],
      ["Pricing and food cost clarity", "cat-costs"],
      ["Operational stress points", "cat-stress"],
    ],
    strategicRead: "Catering should start with simple packages, clear capacity, and repeatable follow-up before getting more complex.",
  },
  {
    id: "content-youtube-engine",
    title: "Content / YouTube Direction",
    sourceQuestionIds: ["content-start", "content-filming", "content-kind", "content-frequency", "content-help"],
    lines: [
      ["Why the channel started", "content-start"],
      ["Comfort filming cooks", "content-filming"],
      ["Content types to make", "content-kind"],
      ["Realistic posting rhythm", "content-frequency"],
      ["Support needed for content", "content-help"],
    ],
    strategicRead: "The best content system should turn real cooks into repeatable proof, stories, short clips, and customer trust.",
  },
  {
    id: "ai-personal-app-roadmap",
    title: "AI Tools & Future App Systems",
    sourceQuestionIds: ["ai-help", "ai-app-interest", "ai-app-jobs", "ai-hardest", "ai-first"],
    lines: [
      ["Help wanted most", "ai-help"],
      ["Interest in the future personal OS", "ai-app-interest"],
      ["App jobs to support", "ai-app-jobs"],
      ["Hardest part while working full time", "ai-hardest"],
      ["First AI use case", "ai-first"],
    ],
    strategicRead: "The first useful tool should reduce friction in the work Octavian already has to do, not add another system to babysit.",
  },
];

const weakSignals = [need.toLowerCase(), "skipped for now", "not sure", "don't know", "dont know", "n/a", "none", "maybe", "unclear"];

export function organizeAnswerText(questionText: string, originalAnswer: string) {
  const clean = originalAnswer.replace(/\s+/g, " ").trim();
  if (!clean) return need;
  if (clean.toLowerCase().includes("skipped for now")) return "Skipped for now - needs follow-up";

  const lowerQuestion = questionText.toLowerCase();
  const statement = clean.replace(/\bi\b/gi, "Octavian").replace(/\bmy\b/gi, "his").replace(/\bme\b/gi, "Octavian");
  const starts = [
    ["what made you fall in love", "Octavian's connection to barbecue is rooted in"],
    ["what does cooking bbq mean", "For Octavian, cooking barbecue means"],
    ["what do you want people to feel", "The Oakfire experience should make people feel"],
    ["what name are you using", "The current naming starting point is"],
    ["keep pit bull", "The name direction to evaluate is"],
    ["what colors", "The visual direction should consider"],
    ["brand feel", "The brand should feel"],
    ["what meats", "The strongest meat offerings appear to be"],
    ["what are your best sides", "The strongest side offerings appear to be"],
    ["what do people compliment", "Customer praise currently points toward"],
    ["one plate", "The hero plate candidate is"],
    ["different from other local", "The clearest local difference is"],
    ["next 6 months", "The near-term business milestone is"],
    ["next 1-2 years", "The one-to-two-year direction is"],
    ["long-term dream", "The long-term vision is"],
    ["which paths interest", "The business paths worth exploring are"],
    ["legacy sanctum", "The Oakfire x Legacy Sanctum opportunity signal is"],
    ["connected to legacy sanctum", "The Oakfire x Legacy Sanctum opportunity signal is"],
    ["inside or connected to legacy sanctum", "Octavian imagines Oakfire x Legacy Sanctum as"],
    ["starting model", "The most realistic Oakfire x Legacy Sanctum starting model is"],
    ["what kind of oakfire food", "The food format that may fit Legacy Sanctum best is"],
    ["feel premium and not random", "The partnership should feel premium by"],
    ["first test event", "The easiest first Oakfire x Legacy Sanctum test event is"],
    ["website help", "The website's job should be to"],
    ["main goal", "The primary website goal should be"],
    ["types of events", "The catering direction should focus on"],
    ["size event", "Current catering capacity appears to be"],
    ["equipment", "Current operating capacity is shaped by"],
    ["food costs", "Pricing and margin clarity currently stands at"],
    ["youtube channel", "The content engine is rooted in"],
    ["kind of content", "The content direction should include"],
    ["how often", "A realistic content rhythm is"],
    ["ai could help", "The first AI opportunity is"],
    ["app to help", "A future personal OS app should help with"],
    ["understand most", "The most important vision signal is"],
  ] as const;
  const match = starts.find(([needle]) => lowerQuestion.includes(needle));
  return match ? `${match[1]} ${statement}.` : `Brand-useful statement: ${statement}.`;
}

export function answerValue(answers: Record<string, AnswerRecord>, questionId: string) {
  const answer = answers[questionId];
  return answer?.organizedAnswer.trim() || answer?.originalAnswer.trim() || need;
}

function originalValue(answers: Record<string, AnswerRecord>, questionId: string) {
  return answers[questionId]?.originalAnswer.trim() || "";
}

function hasUsefulAnswer(answers: Record<string, AnswerRecord>, questionId: string) {
  const record = answers[questionId];
  if (record?.skippedAt || record?.followUpNeeded) return false;
  const value = originalValue(answers, questionId).toLowerCase();
  return value.length > 2 && !weakSignals.some((signal) => value === signal || value.includes(signal));
}

export function sectionCompleteness(section: VisionSection, answers: Record<string, AnswerRecord>): Completeness {
  if (!section.sourceQuestionIds.length) return "Strong foundation";
  const answered = section.sourceQuestionIds.filter((questionId) => hasUsefulAnswer(answers, questionId)).length;
  const ratio = answered / section.sourceQuestionIds.length;
  if (ratio >= 0.7) return "Strong foundation";
  if (ratio >= 0.3) return "Needs follow-up";
  return "Missing key details";
}

export function completenessSummary(sections: VisionSection[], answers: Record<string, AnswerRecord>) {
  return sections.reduce(
    (summary, section) => {
      summary[sectionCompleteness(section, answers)] += 1;
      return summary;
    },
    { "Strong foundation": 0, "Needs follow-up": 0, "Missing key details": 0 } as Record<Completeness, number>,
  );
}

export function categoriesComplete(answers: Record<string, AnswerRecord>) {
  return categories.filter((category) => category.questions.every((question) => hasUsefulAnswer(answers, question.id))).length;
}

function line(label: string, answers: Record<string, AnswerRecord>, questionId: string) {
  return `${label}: ${answerValue(answers, questionId)}`;
}

function needsNote(answers: Record<string, AnswerRecord>, questionId: string) {
  const answer = answers[questionId];
  if (answer?.skippedAt) return `${answer.questionText} - skipped for now; revisit before final external use.`;
  if (answer?.followUpNeeded) return `${answer.questionText} - marked needs follow-up.`;
  if (!answer?.originalAnswer.trim()) return `${flatQuestionText(questionId)} - not answered yet.`;
  return "";
}

function flatQuestionText(questionId: string) {
  return categories.flatMap((category) => category.questions).find((question) => question.id === questionId)?.text || questionId;
}

function firstMove(label: string, answer: string, recommendation: string) {
  return answer && answer !== need ? `${label}: use "${answer}" as the starting evidence.` : `${label}: ${recommendation}`;
}

function buildThirtyDayMoves(answers: Record<string, AnswerRecord>): VisionSection {
  return {
    id: "thirty-day-first-moves",
    title: "30-Day First Moves",
    sourceQuestionIds: ["name-choice", "food-plate", "web-goal", "cat-size", "content-frequency", "ai-first"],
    body: [
      firstMove(
        "Clarify brand/name direction",
        originalValue(answers, "name-choice"),
        "recommended starting point: decide whether Pit Bull Barbecue should stay, evolve, or be replaced.",
      ),
      firstMove(
        "Collect best photos/videos",
        originalValue(answers, "food-plate") || originalValue(answers, "food-compliments"),
        "recommended starting point: capture the best plate, strongest cook process, and customer reactions.",
      ),
      firstMove(
        "Define signature plate/menu",
        originalValue(answers, "food-plate"),
        "recommended starting point: choose one hero plate and a tight first menu.",
      ),
      firstMove(
        "Outline catering packages",
        originalValue(answers, "cat-size"),
        "recommended starting point: define packages around the event size Octavian can realistically handle now.",
      ),
      firstMove(
        "Decide primary website CTA",
        originalValue(answers, "web-goal") || originalValue(answers, "web-next-step"),
        "recommended starting point: choose one main action, likely catering inquiry or preorder request.",
      ),
      firstMove(
        "Create first content rhythm",
        originalValue(answers, "content-frequency"),
        "recommended starting point: pick a posting rhythm that can survive real life.",
      ),
      firstMove(
        "Identify first AI tool to build",
        originalValue(answers, "ai-first"),
        "recommended starting point: choose one tool that saves time immediately.",
      ),
    ],
  };
}

function buildFollowUps(answers: Record<string, AnswerRecord>): VisionSection {
  const questions: string[] = [];
  [...categories, ...personalOsCategories].forEach((category) => {
    category.questions.forEach((question) => {
      const answer = answers[question.id];
      if (answer?.skippedAt) questions.push(`${question.text} (skipped for now)`);
      else if (answer?.followUpNeeded) questions.push(`${question.text} (marked needs follow-up)`);
      else if (!answer?.originalAnswer.trim()) questions.push(`${question.text} (not answered yet)`);
    });
  });

  if (!hasUsefulAnswer(answers, "name-choice")) questions.push("Should Pit Bull Barbecue stay, evolve, or be replaced?");
  if (!hasUsefulAnswer(answers, "brand-colorblindness")) questions.push("What type of colorblindness does Octavian have, if he knows?");
  if (!hasUsefulAnswer(answers, "name-inspiration")) questions.push("What real words, places, nicknames, or family references could shape a stronger name?");
  if (!hasUsefulAnswer(answers, "cat-costs")) questions.push("What are the current food costs, target margins, and pricing assumptions?");
  if (!hasUsefulAnswer(answers, "web-goal")) questions.push("What should the website's primary call-to-action be?");
  if (!hasUsefulAnswer(answers, "cat-size")) questions.push("What event size can Octavian confidently handle right now?");
  if (!hasUsefulAnswer(answers, "content-frequency")) questions.push("What posting rhythm is realistic while working full time?");
  if (!hasUsefulAnswer(answers, "ai-app-jobs")) questions.push("What should a future personal OS app help with first?");
  if (!hasUsefulAnswer(answers, "food-plate")) questions.push("What is the signature plate that should lead the brand?");
  if (!hasUsefulAnswer(answers, "goals-paths")) questions.push("Which first business model path should lead: catering, plate drops, pop-ups, content, or something else?");
  if (!hasUsefulAnswer(answers, "os-purpose-weekly")) questions.push("What would make Octavian actually open the future personal OS every week?");
  if (!hasUsefulAnswer(answers, "os-orion-role")) questions.push("Should the AI concierge feel more like a business coach, personal assistant, strategist, or simple helper?");
  if (!hasUsefulAnswer(answers, "os-feel-three")) questions.push("If Neil could only build three future personal OS features first, what should they be?");
  if (!hasUsefulAnswer(answers, "os-cannabis-interest")) questions.push("Should the cannabis module be private/personal only, and should it be included in version one?");

  return {
    id: "follow-up-questions",
    title: "Follow-Up Questions",
    sourceQuestionIds: [],
    body: [...new Set(questions)].slice(0, 18).length
      ? [...new Set(questions)].slice(0, 18)
      : ["No major missing questions from the guided session."],
  };
}

function buildOpenDecisions(answers: Record<string, AnswerRecord>): VisionSection {
  const decisions = [
    hasUsefulAnswer(answers, "name-choice")
      ? `Business/name direction: use "${originalValue(answers, "name-choice")}" as the current decision signal, then confirm before external rollout.`
      : "Business/name direction: Needs follow-up.",
    hasUsefulAnswer(answers, "food-plate")
      ? `Signature offer: use "${originalValue(answers, "food-plate")}" as the starting evidence for the hero plate.`
      : "Signature offer / hero plate: Needs follow-up.",
    hasUsefulAnswer(answers, "goals-paths")
      ? `First business path: use "${originalValue(answers, "goals-paths")}" as the current path signal.`
      : "First business path: Needs follow-up.",
    hasUsefulAnswer(answers, "web-goal")
      ? `Website primary goal: use "${originalValue(answers, "web-goal")}" as the current website direction.`
      : "Website primary goal: Needs follow-up.",
    hasUsefulAnswer(answers, "ai-first")
      ? `First future app/AI value: use "${originalValue(answers, "ai-first")}" as the first opportunity signal.`
      : "First future app/AI value: Needs follow-up.",
    "Future app name direction: compare name options and confirm which one feels custom to Octavian.",
    "AI concierge direction: confirm its role, tone, and first useful jobs.",
    "First useful future app module: Needs follow-up if not clearly answered.",
    "Privacy boundary for personal modules: Needs follow-up, especially for Strain Library / Cannabis Explorer.",
  ];

  return {
    id: "open-decisions",
    title: "Open Decisions",
    sourceQuestionIds: ["name-choice", "food-plate", "goals-paths", "web-goal", "ai-first"],
    strategicRead: "These decisions should be confirmed before Neil starts the separate future app foundation.",
    body: decisions,
  };
}

export function buildQuestionsBeforeFutureApp(): VisionSection {
  return {
    id: "questions-before-future-app",
    title: "Questions to Ask Before Building the Future App",
    sourceQuestionIds: [],
    strategicRead: "These questions keep the next build focused and prevent the future app from becoming too broad too early.",
    body: questionsBeforeFutureApp,
  };
}

export function buildFutureRoadmap(answers: Record<string, AnswerRecord>): VisionSection {
  const aiNeed = originalValue(answers, "ai-first") || originalValue(answers, "ai-help");
  const contentNeed = originalValue(answers, "content-help") || originalValue(answers, "content-frequency");
  const cateringNeed = originalValue(answers, "cat-stress") || originalValue(answers, "cat-costs");

  return {
    id: "future-build-roadmap",
    title: "Future Build Roadmap",
    sourceQuestionIds: ["ai-first", "ai-help", "content-help", "cat-stress", "cat-costs"],
    body: [
      "Phase 1: Foundation",
      "Suggested roadmap: Brand/name direction, food identity, simple website plan, catering inquiry structure, and content basics.",
      "Phase 2: Growth Systems",
      `Suggested roadmap: Catering packages, quote calculator, customer follow-up, review/testimonial system, content calendar, and YouTube/Reels workflow.${cateringNeed ? ` Grounded need: ${cateringNeed}` : ""}${contentNeed ? ` Content signal: ${contentNeed}` : ""}`,
      "Phase 3: Future Personal OS",
      `Suggested roadmap: AI concierge, prep checklist assistant, pricing/margin helper, content idea generator, weekly business coach, and personal dashboard for building while working full time.${aiNeed ? ` First AI signal: ${aiNeed}` : ""}`,
    ],
  };
}

export function buildFuturePersonalOSBlueprint(): VisionSection {
  return {
    id: "future-personal-os-blueprint",
    title: "Future Personal OS Blueprint",
    sourceQuestionIds: ["ai-help", "ai-app-interest", "ai-app-jobs", "ai-hardest", "ai-first"],
    strategicRead:
      "This section defines source material for a separate future personal OS app. It is not the current intake app.",
    body: [
      "Framing: The future app is not just a vision page. It is Octavian's personal/business operating system, with Oakfire built into it as a major business module.",
      "Purpose: The future personal OS should be a separate app that helps Octavian manage Oakfire, content, goals, systems, learning, and personal operating rhythm from one simple command center.",
      "Positioning: Business-focused but personal, designed for a non-technical user, with future AI integration planned but not required in the first foundation build.",
      ...futurePersonalOSModules.map((module) => `${module.name}: ${module.description}`),
    ],
  };
}

function buildPersonalOsIntakeSections(answers: Record<string, AnswerRecord>): VisionSection[] {
  const sectionTitles: Record<string, string> = {
    "os-purpose": "Future Personal OS App Purpose",
    "os-daily": "Personal Dashboard",
    "os-business-work": "Business & Work Support",
    "os-oakfire-support": "Oakfire Command",
    "os-money": "Finance & Planning",
    "os-health": "Health / Lifestyle",
    "os-cannabis": "Strain Library / Cannabis Explorer",
    "os-learning": "Learning & Guidance",
    "os-orion": "AI Concierge",
    "os-feel": "First Version Priorities",
  };

  return personalOsCategories.map((category) => ({
    id: `eighth-flame-${category.id}`,
    title: sectionTitles[category.id] || category.name,
    sourceQuestionIds: category.questions.map((question) => question.id),
    strategicRead: `${category.purpose} Use this as source material for the separate future personal OS app.`,
    body: [
      `Draft content: ${sectionTitles[category.id] || category.name} translates Octavian's personal OS intake answers into future app build source material.`,
      ...category.questions.map((question) => `${question.text}: ${answerValue(answers, question.id)}`),
      ...category.questions
        .map((question) => needsNote(answers, question.id))
        .filter(Boolean)
        .map((note) => `Needs-follow-up note: ${note}`),
    ],
  }));
}

export function buildFutureAppNamingIdeas(): VisionSection {
  return {
    id: "future-app-naming-ideas",
    title: "Future App Name Decision",
    sourceQuestionIds: ["name-inspiration", "brand-feel", "ai-app-interest"],
    strategicRead: "These are placeholders for review, not a final name decision.",
    body: [
      "The final name should feel custom to Octavian, not like generic software.",
      ...futureAppNamingIdeas.map(
        (idea) => `${idea.name}: Meaning - ${idea.meaning} Why it could fit - ${idea.fit} Potential downside - ${idea.downside}`,
      ),
    ],
  };
}

export function generateFirstVisionDraft(answers: Record<string, AnswerRecord>): VisionSection[] {
  const draft = sectionMap.map((section) => ({
    id: section.id,
    title: section.title,
    sourceQuestionIds: section.sourceQuestionIds,
    strategicRead: section.strategicRead,
    body: [
      `Draft content: ${section.title} translates the saved answers into a working business blueprint for Oakfire by Octavian.`,
      ...section.lines.map(([label, questionId]) => line(label, answers, questionId)),
      `Strategic read: ${section.strategicRead} This read is based only on the saved answers above.`,
      ...section.sourceQuestionIds.map((questionId) => needsNote(answers, questionId)).filter(Boolean).map((note) => `Needs-follow-up note: ${note}`),
    ],
  }));

  return [
    ...draft,
    buildThirtyDayMoves(answers),
    buildFutureRoadmap(answers),
    buildFuturePersonalOSBlueprint(),
    ...buildPersonalOsIntakeSections(answers),
    buildFutureAppNamingIdeas(),
    buildQuestionsBeforeFutureApp(),
    buildFollowUps(answers),
    buildOpenDecisions(answers),
  ];
}

export function normalizeFeedback(value: unknown): ReviewFeedback {
  if (typeof value === "string") {
    return { feelsRight: value, needsChange: "", makeStronger: "" };
  }
  if (value && typeof value === "object") {
    const feedback = value as Partial<ReviewFeedback>;
    return {
      feelsRight: feedback.feelsRight || "",
      needsChange: feedback.needsChange || "",
      makeStronger: feedback.makeStronger || "",
    };
  }
  return { feelsRight: "", needsChange: "", makeStronger: "" };
}

export function buildFinalizedVision(
  draft: VisionSection[],
  feedback: Record<string, ReviewFeedback>,
  answers: Record<string, AnswerRecord>,
): VisionSection[] {
  const refined = draft.map((section) => {
    const note = normalizeFeedback(feedback[section.id]);
    const additions = [
      note.feelsRight.trim() ? `Collaborative refinement - what feels right: ${note.feelsRight.trim()}` : "",
      note.needsChange.trim() ? `Collaborative refinement - what needs to change: ${note.needsChange.trim()}` : "",
      note.makeStronger.trim() ? `Collaborative refinement - what should be stronger or clearer: ${note.makeStronger.trim()}` : "",
    ].filter(Boolean);

    return {
      ...section,
      body: additions.length ? [...section.body, ...additions] : section.body,
    };
  });

  return [
    ...refined.filter(
      (section) =>
        section.id !== "follow-up-questions" &&
        section.id !== "future-build-roadmap" &&
        section.id !== "future-personal-os-blueprint" &&
        section.id !== "future-app-naming-ideas" &&
        section.id !== "questions-before-future-app" &&
        section.id !== "open-decisions" &&
        !section.id.startsWith("eighth-flame-"),
    ),
    buildFutureRoadmap(answers),
    buildFuturePersonalOSBlueprint(),
    ...buildPersonalOsIntakeSections(answers),
    buildFutureAppNamingIdeas(),
    buildQuestionsBeforeFutureApp(),
    buildFollowUps(answers),
    buildOpenDecisions(answers),
  ];
}

function sectionText(sections: VisionSection[], answers?: Record<string, AnswerRecord>) {
  return sections
    .map((section) => {
      const marker = answers ? `Completeness: ${sectionCompleteness(section, answers)}\n` : "";
      return `${section.title}\n${marker}${section.body.map((item) => `- ${item}`).join("\n")}`;
    })
    .join("\n\n");
}

function originalAnswersForCategories(session: SessionState, categorySet: Category[]) {
  return categorySet
    .map((category) => {
      const responses = category.questions
        .map((question) => {
          const answer = session.answers[question.id];
          const status = [
            answer?.skippedAt ? `Skipped at: ${answer.skippedAt}` : "",
            answer?.followUpNeeded ? "Needs follow-up: yes" : "Needs follow-up: no",
            answer?.answeredAt ? `Answered at: ${answer.answeredAt}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          return `Q: ${question.text}\nA: ${answer?.originalAnswer.trim() || need}\n${status}`;
        })
        .join("\n\n");
      return `${category.name}\n${responses}`;
    })
    .join("\n\n");
}

function organizedAnswersForCategories(session: SessionState, categorySet: Category[]) {
  return categorySet
    .map((category) => {
      const responses = category.questions
        .map((question) => {
          const answer = session.answers[question.id];
          return `Q: ${question.text}\nA: ${answer?.organizedAnswer.trim() || answer?.originalAnswer.trim() || need}\nNeeds follow-up: ${
            answer?.followUpNeeded ? "yes" : "no"
          }${answer?.skippedAt ? `\nSkipped at: ${answer.skippedAt}` : ""}`;
        })
        .join("\n\n");
      return `${category.name}\n${responses}`;
    })
    .join("\n\n");
}

export function originalOakfireAnswersText(session: SessionState) {
  return originalAnswersForCategories(session, categories);
}

export function originalPersonalOsAnswersText(session: SessionState) {
  return originalAnswersForCategories(session, personalOsCategories);
}

export function originalAnswersText(session: SessionState) {
  return `OAKFIRE ORIGINAL ANSWERS\n${originalOakfireAnswersText(session)}\n\nEIGHTH FLAME ORIGINAL ANSWERS\n${originalPersonalOsAnswersText(session)}`;
}

export function organizedOakfireAnswersText(session: SessionState) {
  return organizedAnswersForCategories(session, categories);
}

export function organizedPersonalOsAnswersText(session: SessionState) {
  return organizedAnswersForCategories(session, personalOsCategories);
}

export function organizedAnswersText(session: SessionState) {
  return `OAKFIRE ORGANIZED ANSWERS\n${organizedOakfireAnswersText(session)}\n\nEIGHTH FLAME ORGANIZED ANSWERS\n${organizedPersonalOsAnswersText(session)}`;
}

export function reviewFeedbackText(session: SessionState) {
  const sections = session.generatedVisionDraft.length ? session.generatedVisionDraft : generateFirstVisionDraft(session.answers);
  return sections
    .map((section) => {
      const feedback = normalizeFeedback(session.reviewFeedback[section.id]);
      return `${section.title}\nWhat feels right: ${feedback.feelsRight || need}\nWhat needs to change: ${feedback.needsChange || need}\nWhat should be stronger or clearer: ${feedback.makeStronger || need}`;
    })
    .join("\n\n");
}

export function finalVisionSections(session: SessionState) {
  return session.finalizedVision.length
    ? session.finalizedVision
    : buildFinalizedVision(
        session.generatedVisionDraft.length ? session.generatedVisionDraft : generateFirstVisionDraft(session.answers),
        session.reviewFeedback,
        session.answers,
      );
}

export function sessionStatus(session: SessionState) {
  if (session.completedAt) return "Completed";
  if (session.stage) return session.stage;
  if (session.finalizedVision.length) return "Finalized";
  if (Object.values(session.reviewFeedback).some((feedback) => Object.values(normalizeFeedback(feedback)).some(Boolean))) {
    return "Review in progress";
  }
  if (session.generatedVisionDraft.length) return "Vision draft generated";
  return "In progress";
}

export function beforeOctavianLeavesChecklist() {
  return [
    "Confirm Oakfire name direction",
    "Confirm top food identity",
    "Confirm first business model path",
    "Confirm website goal",
    "Confirm catering next step",
    "Confirm future app name direction",
    "Confirm first useful future app module",
    "Download session backup",
    "Copy source material for future app",
  ];
}

export function sessionBackup(session: SessionState) {
  const oakfireAnswers = Object.fromEntries(Object.entries(session.answers).filter(([questionId]) => !questionId.startsWith("os-")));
  const personalOsAnswers = Object.fromEntries(Object.entries(session.answers).filter(([questionId]) => questionId.startsWith("os-")));
  const planningSections = finalVisionSections(session);
  const planningBriefText = sectionText(planningSections, session.answers);
  return {
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastSavedAt: session.lastSavedAt,
    currentQuestionIndex: session.currentQuestionIndex,
    answers: session.answers,
    oakfireAnswers,
    personalOsAnswers,
    organizedAnswers: Object.fromEntries(
      Object.entries(session.answers).map(([questionId, answer]) => [questionId, answer.organizedAnswer]),
    ),
    organizedOakfireAnswers: Object.fromEntries(
      Object.entries(oakfireAnswers).map(([questionId, answer]) => [questionId, answer.organizedAnswer]),
    ),
    organizedPersonalOsAnswers: Object.fromEntries(
      Object.entries(personalOsAnswers).map(([questionId, answer]) => [questionId, answer.organizedAnswer]),
    ),
    generatedVisionDraft: session.generatedVisionDraft,
    planningDraft: session.generatedVisionDraft,
    generatedVisionDraftUpdatedAt: session.generatedVisionDraftUpdatedAt,
    reviewFeedback: session.reviewFeedback,
    finalizedVision: session.finalizedVision,
    oakfirePlanningBrief: planningSections,
    oakfirePlanningBriefText: planningBriefText,
    finalPlanningBrief: planningSections,
    finalPlanningBriefText: planningBriefText,
    personalOsBlueprint: buildFuturePersonalOSBlueprint(),
    futureAppPrompts: {
      oakfireFinalVision: aiPromptText(session),
      oakfireWebsitePlan: websitePlanPromptText(session),
      oakfireBrandIdentity: brandIdentityPromptText(session),
      eighthFlameStrategy: personalOSStrategyPromptText(session),
      codexFoundation: codexPersonalOSFoundationPromptText(session),
    },
    finalizedAt: session.finalizedAt,
    completedAt: session.completedAt,
    stage: session.stage,
  };
}

export function finalVisionText(session: SessionState) {
  return sectionText(finalVisionSections(session), session.answers);
}

export function futurePersonalOSBlueprintText() {
  return `Future Personal OS Blueprint

This is source material for Octavian's separate future personal OS app, not the current intake/planning app.

The future app is not just a vision page. It is Octavian's personal/business operating system, with Oakfire built into it as a major business module and a future AI concierge.

${futurePersonalOSModules.map((module) => `- ${module.name}: ${module.description}`).join("\n")}
- First Version Priorities: Start with the smallest set Octavian would actually use weekly.
- Later Version Ideas: Add deeper AI, richer calculators, sync, dashboards, and advanced modules only after the foundation works.`;
}

export function futureAppNamingIdeasText() {
  return `Future App Name Decision

The final name should feel custom to Octavian, not like generic software.

${futureAppNamingIdeas
  .map((idea) => `- ${idea.name}\n  Meaning: ${idea.meaning}\n  Why it could fit: ${idea.fit}\n  Potential downside: ${idea.downside}`)
  .join("\n")}`;
}

export function questionsBeforeFutureAppText() {
  return `Questions to Ask Before Building the Future App

${questionsBeforeFutureApp.map((question) => `- ${question}`).join("\n")}`;
}

export function sourceMaterialForFuturePersonalOSText(session: SessionState) {
  const sections = finalVisionSections(session);
  const openDecisions = sections.find((section) => section.id === "open-decisions");
  return `Source Material for Future Personal OS

This package is for building the separate future Octavian personal OS. It combines the Oakfire Planning Brief, future personal OS blueprint, naming direction, collaborative feedback, and open decisions.

Important partnership concept: Oakfire x Legacy Sanctum should be treated as a possible business path where Oakfire becomes the food, hospitality, and community-experience layer inside Legacy Sanctum through private tastings, member BBQ nights, preorder plate drops, catering pickup, launch events, grooming + BBQ experiences, content creation, and phased demand testing.

OAKFIRE PLANNING BRIEF
${finalVisionText(session)}

FUTURE PERSONAL OS BLUEPRINT
${futurePersonalOSBlueprintText()}

FUTURE APP NAME DECISION
${futureAppNamingIdeasText()}

COLLABORATIVE REVIEW FEEDBACK
${reviewFeedbackText(session)}

KEY OPEN DECISIONS
${openDecisions ? openDecisions.body.map((item) => `- ${item}`).join("\n") : "- Needs follow-up."}

QUESTIONS TO ASK BEFORE BUILDING
${questionsBeforeFutureApp.map((question) => `- ${question}`).join("\n")}`;
}

function promptFrame(session: SessionState, task: string) {
  return `Context: Neil is helping Octavian turn Oakfire by Octavian into a clear barbecue business planning brief and source package for a separate future personal OS app. Brand palette: Charred Black #0E0D0B, Crown Gold #D6A43A, Blackened Oak Green #1B2D24, Bone Cream #F0E4D0, Smoked Iron #34302B, Ember Glow #7A2418 used sparingly. The tone should feel premium, masculine, warm, elite, smokehouse-inspired, timeless, and refined.

Important business concept: Oakfire x Legacy Sanctum is not BBQ randomly inside a barbershop. Frame it as Oakfire becoming the food, hospitality, and community-experience layer inside Legacy Sanctum, a future men's grooming, wellness, confidence, community, and private experience space. Include the event-based model, phased growth path, and why this partnership could help Oakfire find direction with lower risk than jumping straight into a food truck or restaurant.

Preserve Octavian's original answers as source material. Use the organized answers, collaborative feedback, and Oakfire Planning Brief to create the requested output. Do not invent facts; mark unclear items as follow-up questions.

${task}

ORIGINAL ANSWERS
${originalAnswersText(session)}

ORGANIZED ANSWERS
${organizedAnswersText(session)}

COLLABORATIVE REVIEW FEEDBACK
${reviewFeedbackText(session)}

OAKFIRE PLANNING BRIEF
${finalVisionText(session)}`;
}

export function aiPromptText(session: SessionState) {
  return promptFrame(
    session,
    `Create a polished business vision document with:
1. Executive Vision
2. Brand Story
3. Business Name Direction
4. Visual Brand Direction
5. Website Plan
6. Oakfire x Legacy Sanctum Partnership Opportunity
7. Catering System Plan
8. Content / YouTube Growth Plan
9. AI Tools / Future Personal OS Direction
10. 30-Day Action Plan
11. Future Build Roadmap
12. Follow-Up Questions

For the Oakfire x Legacy Sanctum section, explicitly include:
- Why the idea excites Octavian
- What uncertainty it solves
- The event-based starting model
- The phased growth path
- Why this partnership could help Oakfire find direction`,
  );
}

export function websitePlanPromptText(session: SessionState) {
  return promptFrame(
    session,
    `Create a practical first-version website plan with:
- Homepage structure
- Catering page structure
- About/story section
- Menu/package section
- Lead capture/catering request flow
- Suggested CTAs
- Photo/video asset list
- First version build plan`,
  );
}

export function brandIdentityPromptText(session: SessionState) {
  return promptFrame(
    session,
    `Create a brand naming and identity brief with:
- Name analysis
- Stronger name options
- Brand personality
- Colorblind-conscious visual direction
- Logo direction
- Voice/tone
- Tagline options`,
  );
}

export function bbqAppPromptText(session: SessionState) {
  return promptFrame(
    session,
    `Define Octavian's future personal/business OS using the Oakfire Planning Brief and Future Personal OS Intake answers as source material.

Please provide:
- Best app name options, including Eighth Flame, Aurelius, The Oakfire Codex, The Fire Ledger, Crown & Crucible, Octavian OS, Oakfire Command, and Blackened Oak.
- A recommendation for the AI concierge role/name if useful.
- A clear definition of what the future personal OS is and is not.
- Core modules, separated into Oakfire business modules and personal modules.
- Oakfire as the main business module.
- Strain Library / Cannabis Explorer as one mature personal module only, not the app's identity.
- The simplest first version Octavian would actually use.
- What to avoid so the app does not become overcomplicated.
- UX principles for Octavian as a non-technical user.
- Premium, personal, masculine, helpful, easy-to-use product direction.
- 30-day MVP plan and later-phase roadmap.`,
  );
}

export function codexPersonalOSFoundationPromptText(session: SessionState) {
  return promptFrame(
    session,
    `You are Codex. Build the foundation for a NEW separate app for Octavian's future personal OS. Do not modify the Oakfire Vision Intake & Planning app. Use the Oakfire Planning Brief as source material.

Project name: octavian-personal-os
App name: choose after reviewing the Future App Name Decision options
Subtitle: Octavian's Personal OS
AI Concierge: optional future module

Purpose:
Build a simple frontend-first personal/business operating system for Octavian. It should be mainly business-focused, but personal enough to feel built for him. Oakfire is the main business module, and the app should also support personal planning, weekly focus, notes, future AI help, and optional personal reference modules.

Oakfire brand identity:
- Charred Black: #0E0D0B
- Crown Gold: #D6A43A
- Blackened Oak Green: #1B2D24
- Bone Cream: #F0E4D0
- Smoked Iron: #34302B
- Ember Glow: #7A2418, used sparingly
Use the Oakfire logo direction and emblem feel as brand inspiration, but do not require this intake app's exact layout.

Required first-version routes/pages:
- Dashboard
- Personal Dashboard
- Oakfire Command
- Oakfire x Sanctum
- Brand Builder
- Catering System
- Content Engine
- Growth Roadmap
- AI Concierge
- Strain Library / Cannabis Explorer
- Finance & Planning
- Health / Lifestyle
- Notes & Favorites
- Weekly Focus
- Import Planning Brief
- Settings / Data Backup

Suggested modules:
- Personal Dashboard
- Oakfire Command
- Oakfire x Sanctum
- Brand Builder
- Catering System
- Content Engine
- AI Concierge
- Growth Roadmap
- Strain Library / Cannabis Explorer
- Notes & Favorites
- Weekly Focus

Requirements:
- Build only the foundation first.
- Do not overcomplicate the first version.
- Use a simple frontend-first foundation.
- Use localStorage or simple file storage for the first version.
- Design for a non-technical user.
- Make Oakfire the main business module, but keep the app broader than Oakfire.
- Include Oakfire x Sanctum as a business module or submodule inside Oakfire Command. It should support event ideas, plate drop planning, tasting night checklists, partnership roadmap, catering lead tracking, content capture checklist, and 30-day test metrics.
- Make it business-focused but personal.
- Future AI integration is planned but not required at the foundation stage unless an API key is present.
- Allow planning brief import/paste later so Neil can paste output from the intake app.
- Treat Strain Library / Cannabis Explorer as a mature private personal module for strain research, favorites, notes, effects, and terpene learning. Do not make cannabis the core identity.
- Create a clean, usable foundation with simple data structures, clear navigation, and polished Oakfire visual direction.

Testing requirements:
- App starts locally.
- Dashboard loads with no saved data.
- Each route/page renders without crashing.
- Planning brief can be pasted/imported and remains after refresh.
- Notes/favorites can be added, edited, and deleted.
- Weekly Focus can save priorities and progress.
- Backup/export works.
- Mobile width remains usable.
- No runtime errors remain.`,
  );
}

export function personalOSStrategyPromptText(session: SessionState) {
  return promptFrame(
    session,
    `Analyze Octavian's answers, the Oakfire Planning Brief, and the Future Personal OS Intake answers to define the best separate future app strategy.

Please provide:
- Best app name options, with reasoning and tradeoffs.
- AI concierge role/personality recommendations if the first version includes one later.
- App positioning: personal OS, Oakfire business command center, or a hybrid.
- Best module map for Oakfire business modules.
- How Oakfire x Sanctum should work as a business module or Oakfire Command submodule.
- Best module map for personal modules.
- Module priorities for the first version.
- What should be saved/editable long term.
- What Octavian should use weekly.
- How Oakfire business-building fits into Octavian's personal life and full-time work.
- A mature approach to Strain Library / Cannabis Explorer as one personal module.
- First MVP feature set.
- 30-day build roadmap.
- What should wait until later.
- Risks or unclear source material Neil should clarify with Octavian.`,
  );
}

export { sectionText as visionSectionsText };
