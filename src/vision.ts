import { categories } from "./data";
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

const sectionMap = [
  {
    id: "executive-vision",
    title: "Executive Vision",
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
    id: "brand-story",
    title: "Brand Story",
    sourceQuestionIds: ["story-love", "story-inspired", "story-meaning", "story-feeling", "story-memory"],
    lines: [
      ["Why BBQ matters", "story-love"],
      ["Influences and roots", "story-inspired"],
      ["Personal meaning", "story-meaning"],
      ["Customer feeling to create", "story-feeling"],
      ["Memories or personal details", "story-memory"],
    ],
    strategicRead: "The strongest story material should become the About page, social content, and the emotional core of the brand.",
  },
  {
    id: "brand-identity-name-direction",
    title: "Brand Identity / Name Direction",
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
    title: "Visual Direction",
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
    title: "Food Positioning",
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
    title: "Business Model Path",
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
    id: "website-plan",
    title: "Website Plan",
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
    title: "Catering System Direction",
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
    title: "Content & YouTube Engine",
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
    title: "AI Tools / Personal App Roadmap",
    sourceQuestionIds: ["ai-help", "ai-app-interest", "ai-app-jobs", "ai-hardest", "ai-first"],
    lines: [
      ["Help wanted most", "ai-help"],
      ["Interest in a personal BBQ app", "ai-app-interest"],
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
    ["app to help", "A future personal BBQ app should help with"],
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
  categories.forEach((category) => {
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
  if (!hasUsefulAnswer(answers, "ai-app-jobs")) questions.push("What should a future personal BBQ app help with first?");
  if (!hasUsefulAnswer(answers, "food-plate")) questions.push("What is the signature plate that should lead the brand?");
  if (!hasUsefulAnswer(answers, "goals-paths")) questions.push("Which first business model path should lead: catering, plate drops, pop-ups, content, or something else?");

  return {
    id: "follow-up-questions",
    title: "Follow-Up Questions",
    sourceQuestionIds: [],
    body: [...new Set(questions)].slice(0, 18).length
      ? [...new Set(questions)].slice(0, 18)
      : ["No major missing questions from the guided session."],
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
      "Phase 3: Personal BBQ OS",
      `Suggested roadmap: AI concierge, prep checklist assistant, pricing/margin helper, content idea generator, weekly business coach, and personal dashboard for building while working full time.${aiNeed ? ` First AI signal: ${aiNeed}` : ""}`,
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

  return [...draft, buildThirtyDayMoves(answers), buildFutureRoadmap(answers), buildFollowUps(answers)];
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
    ...refined.filter((section) => section.id !== "follow-up-questions" && section.id !== "future-build-roadmap"),
    buildFutureRoadmap(answers),
    buildFollowUps(answers),
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

export function originalAnswersText(session: SessionState) {
  return categories
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

export function organizedAnswersText(session: SessionState) {
  return categories
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
    "Confirm business name direction",
    "Confirm strongest food identity",
    "Confirm first business model path",
    "Confirm website goal",
    "Confirm catering next step",
    "Confirm content direction",
    "Confirm whether future personal BBQ app is part of the vision",
    "Download full session backup",
    "Copy AI prompt for final vision document",
  ];
}

export function sessionBackup(session: SessionState) {
  return {
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastSavedAt: session.lastSavedAt,
    currentQuestionIndex: session.currentQuestionIndex,
    answers: session.answers,
    organizedAnswers: Object.fromEntries(
      Object.entries(session.answers).map(([questionId, answer]) => [questionId, answer.organizedAnswer]),
    ),
    generatedVisionDraft: session.generatedVisionDraft,
    generatedVisionDraftUpdatedAt: session.generatedVisionDraftUpdatedAt,
    reviewFeedback: session.reviewFeedback,
    finalizedVision: session.finalizedVision,
    finalizedAt: session.finalizedAt,
    stage: session.stage,
  };
}

export function finalVisionText(session: SessionState) {
  return sectionText(finalVisionSections(session), session.answers);
}

function promptFrame(session: SessionState, task: string) {
  return `Context: Neil is helping Octavian turn Oakfire by Octavian into a real barbecue company vision. Brand palette: Charred Black #0E0D0B, Crown Gold #D6A43A, Blackened Oak Green #1B2D24, Bone Cream #F0E4D0, Smoked Iron #34302B, Ember Glow #7A2418 used sparingly. The tone should feel premium, masculine, warm, elite, smokehouse-inspired, timeless, and refined.

Preserve Octavian's original answers as source material. Use the organized answers, collaborative feedback, and final vision to create the requested output. Do not invent facts; mark unclear items as follow-up questions.

${task}

ORIGINAL ANSWERS
${originalAnswersText(session)}

ORGANIZED ANSWERS
${organizedAnswersText(session)}

COLLABORATIVE REVIEW FEEDBACK
${reviewFeedbackText(session)}

FINAL COMPANY VISION
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
6. Catering System Plan
7. Content / YouTube Growth Plan
8. AI Tools / Personal BBQ App Vision
9. 30-Day Action Plan
10. Future Build Roadmap
11. Follow-Up Questions`,
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
    `Create a future personal BBQ app concept with:
- App purpose
- Core modules
- AI concierge capabilities
- Catering calculator
- Content coach
- Prep checklist
- Customer follow-up
- Weekly goals
- Simple UX for a non-technical user`,
  );
}

export { sectionText as visionSectionsText };
