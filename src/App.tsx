import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, flatPersonalOsQuestions, flatQuestions, personalOsCategories, type Category } from "./data";
import { formatLastSaved, type ReviewFeedback, SessionState, useSession } from "./storage";
import {
  aiPromptText,
  beforeOctavianLeavesChecklist,
  brandIdentityPromptText,
  categoriesComplete,
  completenessSummary,
  codexPersonalOSFoundationPromptText,
  finalVisionSections,
  finalVisionText,
  futureAppNamingIdeasText,
  futurePersonalOSBlueprintText,
  generateFirstVisionDraft,
  normalizeFeedback,
  organizedAnswersText,
  organizedOakfireAnswersText,
  organizedPersonalOsAnswersText,
  originalAnswersText,
  originalOakfireAnswersText,
  originalPersonalOsAnswersText,
  personalOSStrategyPromptText,
  reviewFeedbackText,
  sectionCompleteness,
  sessionBackup,
  sessionStatus,
  sourceMaterialForFuturePersonalOSText,
  questionsBeforeFutureAppText,
  websitePlanPromptText,
  type VisionSection,
} from "./vision";

const oakfireLogoSrc = "/oakfirelogo.png";

type SessionProps = ReturnType<typeof useSession>;
type PlanningOutputs = ReturnType<typeof buildPlanningOutputs>;
type SubmissionSummary = {
  id: string;
  submissionType?: "TEST" | "REAL" | string;
  submitterName: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  answeredCount: number;
  oakfireAnswerCount?: number;
  personalOsAnswerCount?: number;
  hasPlanningOutputs?: boolean;
  isTest?: boolean;
};
type StoredSubmission = SubmissionSummary & {
  session?: SessionState;
  rawSessionBackup?: SessionState;
  oakfireAnswers?: SessionState["answers"];
  personalOsAnswers?: SessionState["answers"];
  planningOutputs?: PlanningOutputs;
  skippedQuestions?: Array<{ questionId: string; questionText: string; skippedAt?: string }>;
  needsFollowUpQuestions?: Array<{ questionId: string; questionText: string }>;
};

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

function buildPlanningOutputs(session: SessionState) {
  const sections = finalVisionSections(session);
  const sanctumSection = sections.find((section) => section.id === "oakfire-legacy-sanctum-opportunity");
  return {
    generatedAt: new Date().toISOString(),
    originalAnswers: originalAnswersText(session),
    originalOakfireAnswers: originalOakfireAnswersText(session),
    originalPersonalOsAnswers: originalPersonalOsAnswersText(session),
    organizedAnswers: organizedAnswersText(session),
    organizedOakfireAnswers: organizedOakfireAnswersText(session),
    organizedPersonalOsAnswers: organizedPersonalOsAnswersText(session),
    skippedAndFollowUp: [
      "SKIPPED QUESTIONS",
      ...Object.values(session.answers)
        .filter((answer) => answer.skippedAt)
        .map((answer) => `- ${answer.questionText}: skipped at ${answer.skippedAt}`),
      "",
      "NEEDS FOLLOW-UP",
      ...Object.values(session.answers)
        .filter((answer) => answer.followUpNeeded)
        .map((answer) => `- ${answer.questionText}`),
    ].join("\n") || "Needs follow-up.",
    oakfirePlanningBrief: finalVisionText(session),
    eighthFlameBlueprint: futurePersonalOSBlueprintText(),
    oakfireLegacySanctumOpportunity: sanctumSection
      ? `${sanctumSection.title}\n${sanctumSection.body.map((line) => `- ${line}`).join("\n")}`
      : "Oakfire x Legacy Sanctum Opportunity\n- Needs follow-up.",
    sourceMaterialForFutureEighthFlameApp: sourceMaterialForFuturePersonalOSText(session),
    prompts: {
      oakfireFinalVision: aiPromptText(session),
      oakfireWebsitePlan: websitePlanPromptText(session),
      oakfireBrandIdentity: brandIdentityPromptText(session),
      eighthFlameStrategy: personalOSStrategyPromptText(session),
      codexFoundation: codexPersonalOSFoundationPromptText(session),
    },
    fullSubmissionJson: "",
  };
}

function fallbackSubmissionSession(submission: StoredSubmission): SessionState {
  const timestamp = submission.completedAt || submission.updatedAt || submission.createdAt || new Date().toISOString();
  return {
    sessionId: submission.id || `submission-${Date.now()}`,
    createdAt: submission.createdAt || timestamp,
    updatedAt: submission.updatedAt || timestamp,
    stage: "Completed",
    currentQuestionIndex: 0,
    currentPart: "oakfire",
    publicStep: "review",
    answers: {
      ...(submission.oakfireAnswers || {}),
      ...(submission.personalOsAnswers || {}),
    },
    generatedVisionDraft: [],
    generatedVisionDraftUpdatedAt: null,
    reviewFeedback: {},
    finalizedVision: [],
    finalizedAt: null,
    completedAt: submission.completedAt || timestamp,
    lastSavedAt: submission.updatedAt || timestamp,
    submittedAt: submission.completedAt || timestamp,
    submissionId: submission.id || null,
  };
}

function storedSubmissionSession(submission: StoredSubmission | null) {
  if (!submission) return null;
  return submission.session || submission.rawSessionBackup || fallbackSubmissionSession(submission);
}

function planningOutputsForSubmission(submission: StoredSubmission, session: SessionState) {
  const computed = buildPlanningOutputs(session);
  const saved = submission.planningOutputs;
  return {
    ...computed,
    ...(saved || {}),
    prompts: {
      ...computed.prompts,
      ...(saved?.prompts || {}),
    },
  };
}

function firstAnswer(session: SessionState, questionIds: string[]) {
  for (const questionId of questionIds) {
    const value = session.answers[questionId]?.originalAnswer.trim();
    if (value) return value;
  }
  return "Needs follow-up.";
}

function shortValue(value: string, maxLength = 320) {
  if (!value || value === "Needs follow-up.") return "Needs follow-up.";
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function buildExecutiveSummary(session: SessionState, outputs: PlanningOutputs) {
  const followUps = Object.values(session.answers)
    .filter((answer) => answer.followUpNeeded || answer.skippedAt || !answer.originalAnswer.trim())
    .slice(0, 6)
    .map((answer) => answer.questionText);
  return [
    "WHAT OCTAVIAN WANTS",
    shortValue(firstAnswer(session, ["goals-six-months", "goals-two-years", "goals-dream", "final-understand"])),
    "",
    "WHAT OAKFIRE COULD BECOME",
    shortValue(firstAnswer(session, ["goals-dream", "goals-two-years", "brand-feel", "food-plate"])),
    "",
    "BEST FIRST BUSINESS PATH",
    shortValue(firstAnswer(session, ["goals-paths", "cat-events", "sanctum-starting-model", "sanctum-first-test"])),
    "",
    "OAKFIRE X LEGACY SANCTUM FIT",
    shortValue(firstAnswer(session, ["sanctum-exciting", "sanctum-imagine", "sanctum-premium", "sanctum-reputation"])),
    "",
    "FUTURE EIGHTH FLAME APP DIRECTION",
    shortValue(firstAnswer(session, ["os-purpose-help", "os-oakfire-first", "os-feel-three", "os-orion-role"])),
    "",
    "KEY FOLLOW-UP QUESTIONS",
    followUps.length ? followUps.map((question) => `- ${question}`).join("\n") : "Needs follow-up.",
    "",
    "RECOMMENDED NEXT MOVE",
    "Build the Oakfire Planning Brief and Oakfire x Legacy Sanctum first-test plan from this submission, then clarify pricing, capacity, food costs, and the first Eighth Flame module priorities.",
    "",
    "PLANNING OUTPUT STATUS",
    outputs.generatedAt ? `Generated ${formatLastSaved(outputs.generatedAt)}.` : "Needs follow-up.",
  ].join("\n");
}

function buildNeilShouldBuildNext(session: SessionState) {
  return [
    "WHAT NEIL SHOULD BUILD FIRST FOR OAKFIRE",
    "- A clear Oakfire Planning Brief with brand direction, first offer, catering path, and website structure.",
    "- An Oakfire x Legacy Sanctum first-test event plan with menu, capacity, pricing assumptions, and success metrics.",
    "",
    "WHAT NEIL SHOULD CLARIFY WITH OCTAVIAN",
    "- Pricing confidence, food costs, current equipment capacity, available cook frequency, and first event readiness.",
    "- Whether the first public offer should be catering, plate drops, private tasting nights, or a Legacy Sanctum member night.",
    "",
    "WHAT BELONGS IN THE FUTURE EIGHTH FLAME APP",
    "- Oakfire command tools, lead tracking, catering quotes, prep checklists, content planning, simple finance tracking, and Orion guidance.",
    "",
    "WHAT TO IGNORE OR POSTPONE",
    "- Full restaurant planning, advanced CRM features, complicated dashboards, real estate tools, and anything that does not help Oakfire validate demand first.",
    "",
    "RECOMMENDED NEXT MOVES",
    "1. Build Oakfire Planning Brief from this submission.",
    "2. Create Oakfire x Legacy Sanctum first-test event plan.",
    "3. Define the first Oakfire website structure.",
    "4. Build Eighth Flame app foundation later using the generated Codex prompt.",
    "5. Ask follow-up questions around pricing, capacity, food costs, and first module priorities.",
    "",
    "MOST RELEVANT SOURCE SIGNAL",
    shortValue(firstAnswer(session, ["final-understand", "goals-real-business", "os-oakfire-useful"])),
  ].join("\n");
}

function buildCopyReadyMasterPrompt(outputs: PlanningOutputs, executiveSummary: string, buildNext: string) {
  return [
    "Using the source material below, help Neil build the complete Oakfire by Octavian vision plan and implementation strategy.",
    "",
    "Create a polished strategic plan that includes brand direction, Oakfire x Legacy Sanctum partnership model, website plan, catering path, content strategy, future Eighth Flame app strategy, follow-up questions, and a step-by-step build roadmap.",
    "",
    "Do not invent missing details. If information is missing, mark it as Needs follow-up.",
    "",
    "EXECUTIVE SUMMARY",
    executiveSummary,
    "",
    "OAKFIRE PLANNING BRIEF",
    outputs.oakfirePlanningBrief || "Needs follow-up.",
    "",
    "OAKFIRE X LEGACY SANCTUM OPPORTUNITY",
    outputs.oakfireLegacySanctumOpportunity || "Needs follow-up.",
    "",
    "EIGHTH FLAME PERSONAL OS BLUEPRINT",
    outputs.eighthFlameBlueprint || "Needs follow-up.",
    "",
    "WHAT NEIL SHOULD BUILD NEXT",
    buildNext,
    "",
    "SKIPPED / NEEDS FOLLOW-UP / OPEN DECISIONS",
    outputs.skippedAndFollowUp || "Needs follow-up.",
    "",
    "SOURCE MATERIAL FOR FUTURE EIGHTH FLAME APP",
    outputs.sourceMaterialForFutureEighthFlameApp || "Needs follow-up.",
  ].join("\n");
}

function submissionLabel(submission: Pick<SubmissionSummary, "submissionType" | "isTest">) {
  return submission.submissionType === "TEST" || submission.isTest ? "TEST" : "REAL";
}

function markerClass(value: string) {
  if (value.includes("Strong")) return "border-gold/55 bg-gold/15 text-bone";
  if (value.includes("Missing") || value.includes("follow-up")) return "border-ember/55 bg-ember/20 text-bone";
  return "border-gold/35 bg-soot/70 text-bone";
}

function completionScore(answeredCount: number) {
  return Math.round((answeredCount / totalQuestionCount()) * 100);
}

function totalQuestionCount() {
  return flatQuestions.length + flatPersonalOsQuestions.length;
}

function hasUnfinishedDraft(session: SessionState) {
  if (session.completedAt || session.stage === "Completed") return false;
  return Object.values(session.answers).some((answer) => answer.originalAnswer.trim() || answer.skippedAt || answer.followUpNeeded);
}

function currentPartLabel(session: SessionState) {
  return session.currentPart === "eighth-flame" ? "Part 2: Eighth Flame OS" : "Part 1: Oakfire Vision";
}

function resumeHref(session: SessionState) {
  if (session.publicStep === "review") return "/review-answers";
  const part = session.currentPart || "oakfire";
  const total = part === "eighth-flame" ? flatPersonalOsQuestions.length : flatQuestions.length;
  const index = Math.max(0, Math.min(total - 1, session.currentQuestionIndex || 0));
  return `/session?part=${part}&q=${index}`;
}

function nextRecommendedAction(session: SessionState, answeredCount: number) {
  if (session.finalizedVision.length) return "Export the planning brief and future app prompts.";
  if (session.generatedVisionDraft.length) return "Review the planning draft together.";
  if (answeredCount >= Math.max(8, Math.round(totalQuestionCount() * 0.28))) return "Generate the first vision planning draft.";
  return "Continue answering session questions.";
}

function answeredInQuestions(questionIds: string[], session: SessionState) {
  return questionIds.filter((questionId) => session.answers[questionId]?.originalAnswer.trim()).length;
}

function followUpInQuestions(questionIds: string[], session: SessionState) {
  return questionIds.filter((questionId) => session.answers[questionId]?.followUpNeeded).length;
}

function skippedInQuestions(questionIds: string[], session: SessionState) {
  return questionIds.filter((questionId) => session.answers[questionId]?.skippedAt).length;
}

function categoriesWithAnyAnswer(categorySet: Category[], session: SessionState) {
  return categorySet.filter((category) => category.questions.some((question) => session.answers[question.id]?.originalAnswer.trim())).length;
}

function categoriesCompleteFor(categorySet: Category[], session: SessionState) {
  return categorySet.filter((category) =>
    category.questions.every((question) => {
      const answer = session.answers[question.id];
      return Boolean(answer?.originalAnswer.trim()) && !answer?.followUpNeeded && !answer?.skippedAt;
    }),
  ).length;
}

function isEighthFlameSection(section: VisionSection) {
  return section.id === "future-personal-os-blueprint" || section.id.startsWith("eighth-flame-");
}

const sanctumWhyPoints = [
  "Shared audience: men who care about confidence, lifestyle, food, culture, and community.",
  "Physical brand presence: Oakfire gets a place to be discovered without needing its own restaurant immediately.",
  "Lower-risk testing: test menus, pricing, demand, and customer feedback before investing heavily.",
  "Content engine: every tasting, cook, event, and plate drop creates content.",
  "Premium experience: BBQ becomes part of the Legacy Sanctum atmosphere, not just food on the side.",
  "Partnership leverage: Neil brings brand, systems, website, AI tools, marketing, and space vision; Octavian brings food, craft, story, and the Oakfire product.",
];

const sanctumGrowthPhases = [
  {
    title: "Phase 1: Private Oakfire Tasting Night",
    body: "Small invite-only tasting to test food, presentation, feedback, and content.",
  },
  {
    title: "Phase 2: Monthly Oakfire Night",
    body: "Recurring BBQ/grooming/community event connected to Legacy Sanctum.",
  },
  {
    title: "Phase 3: Preorder Plate Drops",
    body: "Limited plate drops by preorder only, using demand before cooking.",
  },
  {
    title: "Phase 4: Catering & Pickup Hub",
    body: "Legacy Sanctum helps Oakfire collect catering leads and serve as a polished brand touchpoint.",
  },
  {
    title: "Phase 5: Permanent Oakfire Presence",
    body: "Only after demand is proven, explore a stronger onsite food setup, food truck connection, or dedicated Oakfire space.",
  },
];

const introSlides = [
  {
    label: "Private Vision Experience",
    headline: "Oakfire by Octavian",
    subheadline: "This is where the vision starts.",
    copy: [
      "A private experience built to help you see what Oakfire can become - and what your next chapter could look like if you decide to go after it.",
    ],
    button: "Begin",
  },
  {
    headline: "You have already built more than you think.",
    copy: [
      "You've done hard things.",
      "You've worked hard labor.",
      "You've sold houses.",
      "You've flipped property.",
      "You've operated rentals.",
      "You know what it means to work, solve problems, and serve people well.",
      "That is not random. That is proof.",
      "You are more capable of building something real than you probably give yourself credit for.",
    ],
  },
  {
    headline: "Oakfire is not just food.",
    copy: [
      "Some people cook. Some people feed people. Some people create an experience that brings people together.",
      "That's what you do.",
      "Your food has presence. People remember it. People enjoy being around it. And you genuinely love doing it.",
      "Oakfire is not a random side idea. It has the foundation of something real.",
    ],
  },
  {
    headline: "The way you serve people matters.",
    copy: [
      "You are good with people because you are genuine with people.",
      "That matters in business. That matters in food. That matters in hospitality.",
      "The same thing that makes people trust you is the same thing that can make Oakfire feel different.",
    ],
  },
  {
    headline: "You deserve to bet on yourself.",
    copy: [
      "There comes a point where what you love doing needs a real path.",
      "Not just \"maybe one day.\" Not just random cooks here and there.",
      "A real direction. A real brand. A real opportunity to build something that is yours.",
    ],
  },
  {
    headline: "Here's what this could become.",
    copy: [
      "This intake helps create the blueprint for the business, the offer, the customer experience, and the next steps.",
    ],
    cards: ["A real BBQ brand", "Catering and private events", "Plate drops and community nights", "Content, YouTube, and customer demand"],
  },
  {
    headline: "Oakfire could become part of something bigger.",
    copy: [
      "Legacy Sanctum is being built as more than a grooming space.",
      "It is a place for culture, confidence, community, and experiences.",
      "Oakfire could become the food and hospitality layer inside that world: private tastings, member nights, plate drops, event food, catering leads, and a real starting place to grow.",
      "This gives Oakfire a path without forcing you to jump straight into a truck or full restaurant.",
    ],
  },
  {
    headline: "This is bigger than a business form.",
    copy: [
      "This intake also helps shape Eighth Flame - the future personal OS Neil may build for you.",
      "A system built around your business, your goals, your life, your money, your health, your ideas, your content, and the way you actually operate.",
      "Not generic software. Something built around you.",
      "AI Concierge: Orion",
    ],
  },
  {
    headline: "Why I built this for you.",
    copy: [
      "You were one of the first people who believed in Groomed Gent Co. before it was anything more than an idea.",
      "Now I want to use what I've learned from building my own brand, systems, websites, AI tools, and business vision - and put that toward helping you shape Oakfire into something real.",
      "I built this because I believe you are built for this path more than you may realize.",
    ],
  },
  {
    headline: "Let's build the vision the right way.",
    copy: [
      "Take your time.",
      "Answer in your own words.",
      "Don't worry about perfect wording.",
      "The better your answers are, the better the plan can be built around you.",
    ],
    note: "Your draft saves on this device while you work. When you submit, Neil will be able to review it.",
    button: "Start Intake",
  },
];

function categoryProgress(category: Category, session: SessionState) {
  const answered = category.questions.filter((question) => session.answers[question.id]?.originalAnswer.trim()).length;
  const flagged = category.questions.some((question) => {
    const answer = session.answers[question.id];
    return answer?.followUpNeeded || answer?.skippedAt;
  });
  const status = flagged
    ? "Needs follow-up"
    : answered === 0
      ? "Not started"
      : answered === category.questions.length
        ? "Complete"
        : "In progress";
  return { answered, total: category.questions.length, status };
}

function App() {
  const sessionApi = useSession();

  return (
    <div className="min-h-screen bg-coal text-bone">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(38,63,51,0.46),transparent_32%),radial-gradient(circle_at_82%_14%,rgba(214,164,58,0.09),transparent_22%),radial-gradient(circle_at_50%_108%,rgba(122,36,24,0.12),transparent_30%),linear-gradient(180deg,#070706_0%,#0A0908_42%,#070706_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.58)_78%),linear-gradient(90deg,rgba(240,228,208,0.012)_1px,transparent_1px),linear-gradient(180deg,rgba(240,228,208,0.008)_1px,transparent_1px)] bg-[length:auto,96px_96px,96px_96px]" />
      <SideSwitcher />
      <Routes>
        <Route path="/" element={<StartPage {...sessionApi} />} />
        <Route path="/test" element={<TestGatewayPage />} />
        <Route path="/session" element={<SessionPage {...sessionApi} />} />
        <Route path="/review-answers" element={<ReviewAnswersPage {...sessionApi} />} />
        <Route path="/complete" element={<CompletePage {...sessionApi} />} />
        <Route path="/generate" element={<Navigate to="/admin/generate" replace />} />
        <Route path="/review" element={<Navigate to="/admin/review" replace />} />
        <Route path="/vision" element={<Navigate to="/admin/vision" replace />} />
        <Route path="/present" element={<Navigate to="/admin/present" replace />} />
        <Route path="/export" element={<Navigate to="/admin/export" replace />} />
        <Route path="/import" element={<Navigate to="/admin/import" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/submissions/:id" element={<AdminSubmissionPage />} />
        <Route path="/admin/generate" element={<GeneratePage {...sessionApi} />} />
        <Route path="/admin/review" element={<ReviewPage {...sessionApi} />} />
        <Route path="/admin/vision" element={<VisionPage {...sessionApi} />} />
        <Route path="/admin/present" element={<PresentPage {...sessionApi} />} />
        <Route path="/admin/export" element={<ExportPage {...sessionApi} />} />
        <Route path="/admin/import" element={<ImportPage {...sessionApi} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function SideSwitcher() {
  const location = useLocation();
  const isAdminSide = location.pathname.startsWith("/admin");
  const currentSide = isAdminSide ? "Neil Admin Side" : "Octavian Side";

  return (
    <aside className="side-switcher" aria-label="Side switcher">
      <div className="side-switcher-status">
        <span>Viewing</span>
        <strong>{currentSide}</strong>
      </div>
      <div className="side-switcher-actions" aria-label="Switch side">
        <Link className={!isAdminSide ? "side-switcher-option active" : "side-switcher-option"} to="/">
          Octavian Side
        </Link>
        <Link className={isAdminSide ? "side-switcher-option active" : "side-switcher-option"} to="/admin">
          Neil Admin Side
        </Link>
      </div>
    </aside>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-8 lg:px-10">
      <header className="mb-5 flex items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-gold sm:text-sm">
          <img className="h-10 w-auto shrink-0 object-contain sm:h-11" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <span className="truncate">Oakfire by Octavian</span>
        </Link>
        <p className="shrink-0 text-right text-xs font-bold text-ash">Draft autosaves</p>
      </header>
      {children}
    </main>
  );
}

function Shell({
  children,
  session,
  clearSession,
  showPlanningTools = false,
}: {
  children: React.ReactNode;
  session: SessionState;
  clearSession: () => void;
  showPlanningTools?: boolean;
}) {
  const handleClear = () => {
    if (window.confirm("This will erase the saved vision session from this device. Continue?")) {
      clearSession();
    }
  };

  return (
    <main className="app-frame">
      <header className="app-header flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          <img className="h-11 w-auto object-contain" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <span>Oakfire by Octavian</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="nav-link" to="/">
            Start
          </Link>
          <Link className="nav-link" to="/session">
            Intake
          </Link>
          <Link className="nav-link" to="/review-answers">
            Review Answers
          </Link>
          {showPlanningTools && (
            <>
              <Link className="nav-link" to="/complete">
                Complete
              </Link>
              <span className="mx-1 hidden h-8 border-l border-gold/20 sm:block" />
              <span className="status-pill">
                Neil Planning Tools
              </span>
              <Link className="nav-link" to="/admin/generate">
                Generate
              </Link>
              <Link className="nav-link" to="/admin/review">
                Draft Review
              </Link>
              <Link className="nav-link" to="/admin/vision">
                Planning Brief
              </Link>
              <Link className="nav-link" to="/admin/export">
                Export
              </Link>
              <Link className="nav-link" to="/admin">
                Admin
              </Link>
            </>
          )}
          <span className="status-pill">
            Planning status: {sessionStatus(session)}
          </span>
          <span className="status-pill text-ash">
            Last saved: {formatLastSaved(session.lastSavedAt)}
          </span>
          <span className="status-pill text-ash">
            Saved on this device
          </span>
          <button className="quiet-button" onClick={handleClear}>
            Reset Planning Draft
          </button>
        </nav>
      </header>
      {children}
    </main>
  );
}

function HeroLogoEmblem() {
  return (
    <div className="hero-emblem mx-auto mb-10">
      <div className="hero-emblem-core">
        <img className="hero-emblem-logo" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
      </div>
    </div>
  );
}

function StartPage({ session, answeredCount, clearSession }: SessionProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = introSlides[slideIndex];
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex === introSlides.length - 1;
  const draftAvailable = hasUnfinishedDraft(session);
  const goBack = () => setSlideIndex((current) => Math.max(0, current - 1));
  const goNext = () => setSlideIndex((current) => Math.min(introSlides.length - 1, current + 1));
  const startOver = () => {
    if (window.confirm("This will erase the saved draft on this device. Continue?")) {
      clearSession();
      setSlideIndex(0);
    }
  };

  return (
    <PublicShell>
      <section className="intro-stage relative -mx-4 -mt-4 flex min-h-[calc(100vh-5.5rem)] items-center overflow-hidden px-4 py-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="hidden lg:block">
            <HeroLogoEmblem />
          </div>

          <article className="intro-card mx-auto w-full max-w-3xl p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img className="h-14 w-auto object-contain sm:h-16" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Octavian Side</p>
                  <p className="mt-1 text-sm font-bold text-ash">Oakfire Vision Intake & Planning</p>
                </div>
              </div>
              <p className="status-pill self-start sm:self-auto">
                Slide {slideIndex + 1} of {introSlides.length}
              </p>
            </div>

            {draftAvailable && (
              <section className="mt-6 rounded-lg border border-gold/25 bg-coal/55 p-4 shadow-oak sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">Saved Draft Found</p>
                <h2 className="mt-2 text-2xl font-black text-bone">Saved Draft Found</h2>
                <p className="mt-3 text-sm leading-6 text-ash">
                  You have a saved intake draft on this device. You can continue where you left off or start over.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Questions answered" value={`${answeredCount}/${totalQuestionCount()}`} />
                  <Metric label="Current part" value={currentPartLabel(session)} />
                  <Metric label="Last saved" value={formatLastSaved(session.lastSavedAt)} />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link className="primary-button" to={resumeHref(session)}>
                    Continue Draft
                  </Link>
                  <button className="danger-button" onClick={startOver}>
                    Start Over
                  </button>
                </div>
              </section>
            )}

            <div key={slideIndex} className="intro-slide-content mt-8">
              {slide.label && <p className="text-sm font-black uppercase tracking-[0.18em] text-gold">{slide.label}</p>}
              <h1 className="mt-3 text-4xl font-black leading-tight text-bone sm:text-5xl lg:text-6xl">{slide.headline}</h1>
              {slide.subheadline && <p className="mt-4 text-xl font-bold leading-8 text-gold sm:text-2xl">{slide.subheadline}</p>}
              <div className="mt-6 gold-divider" />

              <div className="mt-6 space-y-4 text-base leading-7 text-ash sm:text-lg sm:leading-8">
                {slide.copy.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {isFirstSlide && (
                  <p>
                    This is a longer intake, so you do not have to finish it all at once. Your draft saves on this
                    device, and you can come back later before submitting.
                  </p>
                )}
              </div>

              {slide.cards && (
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {slide.cards.map((card) => (
                    <div key={card} className="rounded-lg border border-gold/20 bg-coal/45 p-4">
                      <p className="text-base font-black text-bone">{card}</p>
                    </div>
                  ))}
                </div>
              )}

              {slide.note && (
                <p className="mt-7 rounded-lg border border-gold/25 bg-gold/10 p-4 text-sm font-bold leading-6 text-bone">
                  {slide.note}
                </p>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2" aria-label="Intro progress">
              {introSlides.map((item, index) => (
                <button
                  key={item.headline}
                  className={`h-2.5 rounded-full transition-all duration-200 ${index === slideIndex ? "w-9 bg-gold" : "w-2.5 bg-bone/25 hover:bg-gold/60"}`}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setSlideIndex(index)}
                />
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
              <button className="secondary-button w-full" onClick={goBack} disabled={isFirstSlide}>
                Back
              </button>
              {isLastSlide ? (
                <Link className="primary-button w-full" to="/session">
                  Start Intake
                </Link>
              ) : (
                <button className="primary-button w-full" onClick={goNext}>
                  {slide.button || "Next"}
                </button>
              )}
            </div>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}

function TestGatewayPage() {
  const [message, setMessage] = useState("");
  const [createdSubmission, setCreatedSubmission] = useState<StoredSubmission | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createTestSubmission = async () => {
    setIsCreating(true);
    setMessage("Creating full test submission...");
    setCreatedSubmission(null);
    try {
      const saved = await apiJson<StoredSubmission>("/api/submissions/test", { method: "POST" });
      setCreatedSubmission(saved);
      setMessage("Test submission created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create test submission.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="app-frame">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          <img className="h-11 w-auto object-contain" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <span>Oakfire Test Gateway</span>
        </Link>
        <Link className="secondary-button" to="/">
          Public Intake
        </Link>
      </header>

      <section className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Neil-only testing gateway</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Choose which side to test</h1>
        <p className="mt-3 max-w-3xl text-ash">
          Use this page to test Octavian's clean intake, then confirm the saved answers in Neil's admin workflow.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="premium-card p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">Octavian Side</p>
          <h2 className="mt-3 text-3xl font-black text-bone">Test Octavian Side</h2>
          <p className="mt-4 text-base leading-7 text-ash">Open the same intake Octavian will complete.</p>
          <Link className="primary-button mt-6" to="/">
            Open Public Intake
          </Link>
        </article>

        <article className="premium-card p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">Neil Side</p>
          <h2 className="mt-3 text-3xl font-black text-bone">Open Neil Admin Side</h2>
          <p className="mt-4 text-base leading-7 text-ash">
            View submitted answers, generate planning outputs, and test backend saving.
          </p>
          <Link className="primary-button mt-6" to="/admin">
            Open Admin Dashboard
          </Link>
        </article>
      </section>

      <section className="mt-5 rounded-lg oak-card p-5 shadow-oak">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">Fast backend check</p>
            <h2 className="mt-2 text-2xl font-black text-bone">Create Full Test Submission</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ash">
              Instantly creates a realistic Octavian test submission so Neil can verify the admin workflow without answering every question.
            </p>
          </div>
          <button className="secondary-button shrink-0" onClick={createTestSubmission} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Full Test Submission"}
          </button>
        </div>
        {message && <p className="mt-4 rounded-lg oak-panel p-4 text-sm font-semibold text-bone">{message}</p>}
        {createdSubmission && (
          <Link className="primary-button mt-4" to={`/admin/submissions/${createdSubmission.id}`}>
            Open Test Submission
          </Link>
        )}
      </section>
    </main>
  );
}

function SessionPage({
  session,
  saveOriginalAnswer,
  setCurrentQuestionIndex,
  skipQuestion,
  setFollowUpNeeded,
  saveResumePosition,
}: SessionProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPart = searchParams.get("part") === "eighth-flame" ? "eighth-flame" : session.currentPart || "oakfire";
  const [activeIntake, setActiveIntake] = useState<"oakfire" | "eighth-flame">(initialPart);
  const [showPartIntro, setShowPartIntro] = useState(() => !searchParams.get("q"));
  const [saveLaterShown, setSaveLaterShown] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const savingTimer = useRef<number | null>(null);
  const activeQuestions = activeIntake === "oakfire" ? flatQuestions : flatPersonalOsQuestions;
  const activePartNumber = activeIntake === "oakfire" ? 1 : 2;
  const activeIntro =
    activeIntake === "oakfire"
      ? {
          eyebrow: "Part 1",
          title: "Part 1: Oakfire Vision",
          body: "This section is about the barbecue company - the story, food, brand, Legacy Sanctum opportunity, website, catering, content, and where Oakfire could go.",
          button: "Begin Part 1",
        }
      : {
          eyebrow: "Part 2",
          title: "Part 2: Eighth Flame OS",
          body: "This section is about the future personal OS Neil may build for you - business, lifestyle, goals, finances, health, content, cannabis strain notes, real estate work if relevant, and Orion.",
          button: "Begin Part 2",
        };
  const total = activeQuestions.length;
  const requestedIndex = Number(searchParams.get("q"));
  const index = Number.isFinite(requestedIndex)
    ? Math.max(0, Math.min(total - 1, requestedIndex))
    : Math.min(session.currentQuestionIndex, total - 1);
  const item = activeQuestions[index];
  const answer = session.answers[item.id];
  const [draft, setDraft] = useState(answer?.originalAnswer ?? "");
  const [followUpChecked, setFollowUpChecked] = useState(Boolean(answer?.followUpNeeded));
  const progress = Math.round(((index + 1) / total) * 100);

  useEffect(() => {
    setDraft(session.answers[item.id]?.originalAnswer ?? "");
    setFollowUpChecked(Boolean(session.answers[item.id]?.followUpNeeded));
  }, [item.id, session.answers]);

  useEffect(() => {
    saveResumePosition(activeIntake, index, "session");
  }, [activeIntake, index, saveResumePosition]);

  useEffect(() => {
    return () => {
      if (savingTimer.current) window.clearTimeout(savingTimer.current);
    };
  }, []);

  const flashSaving = () => {
    setIsSavingDraft(true);
    if (savingTimer.current) window.clearTimeout(savingTimer.current);
    savingTimer.current = window.setTimeout(() => setIsSavingDraft(false), 650);
  };
  const save = () => saveOriginalAnswer(item.id, draft);
  const switchIntake = (nextIntake: "oakfire" | "eighth-flame", intro = true) => {
    setActiveIntake(nextIntake);
    setShowPartIntro(intro);
    setCurrentQuestionIndex(0);
    saveResumePosition(nextIntake, 0, "session");
    setSearchParams({ part: nextIntake });
  };
  const goTo = (nextIndex: number) => {
    save();
    const safeIndex = Math.max(0, Math.min(total - 1, nextIndex));
    setCurrentQuestionIndex(safeIndex);
    saveResumePosition(activeIntake, safeIndex, "session");
    setShowPartIntro(false);
    setSearchParams({ part: activeIntake, q: String(safeIndex) });
  };
  const continueFlow = () => {
    if (index < total - 1) {
      goTo(index + 1);
      return;
    }
    save();
    if (activeIntake === "oakfire") switchIntake("eighth-flame", true);
    else {
      saveResumePosition(activeIntake, index, "review");
      navigate("/review-answers");
    }
  };
  const backFlow = () => {
    if (index > 0) {
      goTo(index - 1);
      return;
    }
    if (activeIntake === "eighth-flame") {
      save();
      setActiveIntake("oakfire");
      setShowPartIntro(false);
      const previousIndex = flatQuestions.length - 1;
      setCurrentQuestionIndex(previousIndex);
      saveResumePosition("oakfire", previousIndex, "session");
      setSearchParams({ part: "oakfire", q: String(previousIndex) });
    }
  };
  const skip = () => {
    save();
    skipQuestion(item.id);
    if (index < total - 1) {
      const nextIndex = Math.max(0, Math.min(total - 1, index + 1));
      setCurrentQuestionIndex(nextIndex);
      saveResumePosition(activeIntake, nextIndex, "session");
      setSearchParams({ part: activeIntake, q: String(nextIndex) });
    } else if (activeIntake === "oakfire") {
      switchIntake("eighth-flame", true);
    } else {
      saveResumePosition(activeIntake, index, "review");
      navigate("/review-answers");
    }
  };
  const saveForLater = () => {
    save();
    saveResumePosition(activeIntake, index, "session");
    setSaveLaterShown(true);
  };

  return (
    <PublicShell>
      <section className="mx-auto w-full max-w-3xl">
        {saveLaterShown ? (
          <article className="premium-card p-7 text-center shadow-ember sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gold">Draft saved</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-bone sm:text-5xl">Your progress is saved.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ash">
              Your progress is saved on this device. You can come back to this same link later and continue where you
              left off.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button className="primary-button w-full" onClick={() => setSaveLaterShown(false)}>
                Return to Intake
              </button>
              <Link className="secondary-button w-full" to="/">
                Back to Start
              </Link>
            </div>
          </article>
        ) : showPartIntro ? (
          <article className="premium-card p-7 text-center shadow-ember sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gold">{activeIntro.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-bone sm:text-5xl">{activeIntro.title}</h1>
            <p className="mt-5 text-lg leading-8 text-ash">{activeIntro.body}</p>
            <button
              className="primary-button mt-8 w-full sm:w-auto"
              onClick={() => {
                setShowPartIntro(false);
                saveResumePosition(activeIntake, index, "session");
                setSearchParams({ part: activeIntake, q: String(index) });
              }}
            >
              {activeIntro.button}
            </button>
          </article>
        ) : (
          <article className="oak-card p-5 shadow-ember sm:p-8">
            <div className="mb-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-ash">
                  Part {activePartNumber} of 2 &bull; Question {index + 1} of {total}
                </p>
                <p className="status-pill self-start sm:self-auto">
                  {isSavingDraft ? "Saving..." : session.lastSavedAt ? `Last saved: ${formatLastSaved(session.lastSavedAt)}` : "Draft saved"}
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10" aria-label={`${progress}% complete`}>
                <div className="h-2 rounded-full bg-gradient-to-r from-gold to-[#E8C56D]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ash">You can save and continue later anytime.</p>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">{item.category.name}</p>
            <p className="mt-3 text-sm font-semibold text-ash">Question {index + 1}</p>
            <h1 className="mt-2 text-2xl font-black leading-snug text-bone sm:text-4xl">{item.text}</h1>

            {item.category.id === "sanctum" && (
              <p className="mt-4 rounded-lg border border-gold/25 bg-gold/10 p-4 text-sm font-semibold leading-6 text-bone">
                Oakfire x Legacy Sanctum is the food, hospitality, and community opportunity inside Neil's future space.
              </p>
            )}

            <div className="mt-5 rounded-lg border border-gold/30 bg-gold/10 p-4">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-gold">Why this matters</p>
              <p className="mt-2 text-base leading-7 text-bone">{item.why}</p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-bone" htmlFor="original-answer">
                Your answer
              </label>
              <textarea
                id="original-answer"
                className="answer-surface mt-2 min-h-[18rem] w-full p-4 text-lg leading-8 text-bone outline-none placeholder:text-iron"
                value={draft}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft(value);
                  saveOriginalAnswer(item.id, value);
                  saveResumePosition(activeIntake, index, "session");
                  flashSaving();
                }}
                placeholder="Answer in your own words..."
              />
              <p className="mt-2 text-sm font-semibold text-ash">
                {isSavingDraft ? "Saving..." : "Draft saved on this device."}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button className="ghost-button px-3 py-2 text-xs" onClick={skip}>
                  Skip for now
                </button>
                <button
                  className={followUpChecked ? "quiet-button px-3 py-2 text-xs" : "ghost-button px-3 py-2 text-xs"}
                  onClick={() => {
                    const next = !followUpChecked;
                    setFollowUpChecked(next);
                    setFollowUpNeeded(item.id, next);
                    saveResumePosition(activeIntake, index, "session");
                    flashSaving();
                  }}
                >
                  {followUpChecked ? "Needs follow-up marked" : "Needs follow-up"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
              <button className="secondary-button w-full" onClick={backFlow} disabled={index === 0 && activeIntake === "oakfire"}>
                Back
              </button>
              <button className="primary-button w-full" onClick={continueFlow}>
                Save & Continue
              </button>
            </div>
            <button className="secondary-button mt-3 w-full" onClick={saveForLater}>
              Save & Continue Later
            </button>
          </article>
        )}
      </section>
    </PublicShell>
  );
}

function ReviewAnswersPage({ session, completeIntake, saveResumePosition }: SessionProps) {
  const navigate = useNavigate();
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    saveResumePosition(session.currentPart || "eighth-flame", session.currentQuestionIndex || 0, "review");
  }, [saveResumePosition, session.currentPart, session.currentQuestionIndex]);

  const submit = async () => {
    setIsSubmitting(true);
    setSubmitMessage("Saving your completed intake...");
    const timestamp = new Date().toISOString();
    const completedSession: SessionState = {
      ...session,
      stage: "Completed",
      completedAt: session.completedAt || timestamp,
      updatedAt: timestamp,
      lastSavedAt: timestamp,
    };
    try {
      const saved = await apiJson<StoredSubmission>("/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          submitterName: "Octavian",
          session: completedSession,
          planningOutputs: buildPlanningOutputs(completedSession),
        }),
      });
      localStorage.setItem("octavian-company-vision-submission-id", saved.id);
      completeIntake(saved.id);
      navigate("/complete");
    } catch (error) {
      const details = error instanceof Error ? ` ${error.message}` : "";
      setSubmitMessage(`Something went wrong while saving your intake. Please do not close this page yet. Try submitting again or let Neil know.${details}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <section className="mb-7 rounded-lg oak-card p-6 shadow-ember">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Review</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Review Your Answers</h1>
        <p className="mt-3 max-w-3xl text-ash">
          You can leave blanks if you're unsure. Neil can follow up later.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="secondary-button" to={resumeHref(session)}>
            Continue Intake
          </Link>
          <button className="primary-button" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Intake"}
          </button>
        </div>
        {submitMessage && <p className="mt-4 rounded-lg border border-gold/20 bg-coal/35 p-3 text-sm font-semibold text-bone">{submitMessage}</p>}
      </section>

      <AnswerReviewGroup title="Oakfire Vision" part="oakfire" categoriesToShow={categories} session={session} />
      <AnswerReviewGroup title="Eighth Flame OS" part="eighth-flame" categoriesToShow={personalOsCategories} session={session} />
    </PublicShell>
  );
}

function SanctumTeachingCards() {
  return (
    <section className="mb-7 grid gap-4">
      <div className="vision-opportunity rounded-lg p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">Partnership Opportunity</p>
        <h2 className="mt-2 text-2xl font-black text-bone">Oakfire x Legacy Sanctum</h2>
        <p className="mt-2 text-base font-semibold leading-7 text-bone">
          Food, hospitality, and community built into the Legacy Sanctum experience.
        </p>
        <div className="mt-4 space-y-3 text-sm leading-6 text-bone">
          <p>
            Legacy Sanctum is being built as more than a grooming space. It is a future home for men's grooming,
            wellness, confidence, community, events, and elevated experiences.
          </p>
          <p>Oakfire could become the food and hospitality layer inside that world.</p>
          <p>
            Instead of trying to jump straight into a food truck, restaurant, or full-time BBQ operation, Oakfire could
            start with controlled experiences inside Legacy Sanctum: private tastings, member BBQ nights, preorder plate
            drops, catering pickups, and event food.
          </p>
          <p>
            That gives Oakfire a real place to start, a way to test demand, a content engine, a professional brand
            presence, and a partnership path with a business Neil is already building.
          </p>
          <p className="rounded-md border border-gold/20 bg-coal/35 p-3 font-semibold text-gold">
            The goal is partnership, not random BBQ inside a barbershop.
          </p>
        </div>
      </div>

      <div className="rounded-lg oak-panel p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Why this could work</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sanctumWhyPoints.map((point) => (
            <p key={point} className="rounded-md border border-gold/15 bg-coal/35 p-3 text-sm leading-6 text-ash">
              {point}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-lg oak-panel p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Possible growth path</h3>
        <div className="mt-4 grid gap-3">
          {sanctumGrowthPhases.map((phase) => (
            <div key={phase.title} className="phase-card rounded-md border border-gold/15 bg-coal/35 p-4">
              <p className="font-bold text-bone">{phase.title}</p>
              <p className="mt-1 text-sm leading-6 text-ash">{phase.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gold/20 bg-coal/45 p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Why this gives Oakfire a clearer starting point</h3>
        <p className="mt-3 text-sm leading-6 text-ash">
          This path lets Oakfire test demand, collect customer feedback, create content, build catering leads, and show
          up with a real brand presence before taking on the risk of a full food truck or restaurant.
        </p>
      </div>
    </section>
  );
}

function AnswerReviewGroup({
  title,
  part,
  categoriesToShow,
  session,
}: {
  title: string;
  part: "oakfire" | "eighth-flame";
  categoriesToShow: Category[];
  session: SessionState;
}) {
  const partQuestions = part === "oakfire" ? flatQuestions : flatPersonalOsQuestions;

  return (
    <section className="mb-7">
      <h2 className="mb-4 text-2xl font-black text-bone">{title}</h2>
      <div className="grid gap-4">
        {categoriesToShow.map((category) => (
          <div key={category.id} className="rounded-lg oak-card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-bone">{category.name}</h3>
              </div>
              <Link className="secondary-button" to={`/session?part=${part}&q=${partQuestions.findIndex((item) => item.category.id === category.id)}`}>
                Edit Section
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {category.questions.map((question) => {
                const answer = session.answers[question.id];
                const questionIndex = partQuestions.findIndex((item) => item.id === question.id);
                return (
                  <div key={question.id} className="rounded-md border border-gold/15 bg-coal/35 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-bone">{question.text}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ash">
                          {answer?.originalAnswer.trim() || "No answer saved yet."}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link className="secondary-button" to={`/session?part=${part}&q=${questionIndex}`}>
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompletePage({ session }: SessionProps) {
  const [message, setMessage] = useState("");
  const answerDownload = useMemo(() => originalAnswersText(session), [session]);

  const downloadAnswers = () => {
    const blob = new Blob([answerDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "octavian-intake-answers.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Downloaded your answers.");
  };

  return (
    <PublicShell>
      <section className="success-card mx-auto max-w-4xl rounded-lg oak-card p-6 text-center shadow-ember sm:p-8">
        <img className="mx-auto mb-5 w-28 object-contain sm:w-36" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Intake complete</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Your intake is complete.</h1>
        <div className="mx-auto mt-5 max-w-3xl space-y-4 text-lg leading-8 text-ash">
          <p>Appreciate you taking the time to fill this out.</p>
          <p>
            Your answers have been saved so Neil can review them and build your Oakfire Planning Brief, the Oakfire x
            Legacy Sanctum opportunity plan, and the source material for Eighth Flame.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="premium-card p-4">
            <h2 className="text-lg font-black text-bone">Oakfire Vision saved</h2>
            <p className="mt-2 text-sm leading-6 text-ash">The brand, business, and food direction are ready for Neil to review.</p>
          </div>
          <div className="premium-card p-4">
            <h2 className="text-lg font-black text-bone">Eighth Flame intake saved</h2>
            <p className="mt-2 text-sm leading-6 text-ash">The future personal OS direction is captured as source material.</p>
          </div>
          <div className="premium-card p-4">
            <h2 className="text-lg font-black text-bone">Neil can review your answers</h2>
            <p className="mt-2 text-sm leading-6 text-ash">Your answers are saved for the Oakfire Planning Brief.</p>
          </div>
        </div>
        {message && <p className="mt-4 rounded-lg oak-panel p-3 text-sm font-semibold text-bone">{message}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link className="primary-button" to="/review-answers">
            Review My Answers
          </Link>
          <button className="secondary-button" onClick={downloadAnswers}>
            Download My Answers
          </button>
        </div>
      </section>
    </PublicShell>
  );
}

function GeneratePage({ session, generateDraft, clearSession, answeredCount, skippedCount, followUpCount, organizedCount }: SessionProps) {
  const navigate = useNavigate();
  const oakfireQuestionIds = flatQuestions.map((question) => question.id);
  const personalQuestionIds = flatPersonalOsQuestions.map((question) => question.id);
  const oakfireAnswered = answeredInQuestions(oakfireQuestionIds, session);
  const personalAnswered = answeredInQuestions(personalQuestionIds, session);
  const oakfireSkipped = skippedInQuestions(oakfireQuestionIds, session);
  const personalSkipped = skippedInQuestions(personalQuestionIds, session);
  const oakfireFollowUp = followUpInQuestions(oakfireQuestionIds, session);
  const personalFollowUp = followUpInQuestions(personalQuestionIds, session);
  const missing = flatQuestions.filter((question) => {
    const answer = session.answers[question.id];
    return !answer?.originalAnswer.trim() || answer.skippedAt || answer.followUpNeeded;
  });
  const personalMissing = flatPersonalOsQuestions.filter((question) => {
    const answer = session.answers[question.id];
    return !answer?.originalAnswer.trim() || answer.skippedAt || answer.followUpNeeded;
  });
  const previewSections = session.generatedVisionDraft.length ? session.generatedVisionDraft : generateFirstVisionDraft(session.answers);
  const summary = completenessSummary(previewSections, session.answers);
  const completeCategories = categoriesComplete(session.answers);
  const categoriesWithAnswers = categories.filter((category) =>
    category.questions.some((question) => session.answers[question.id]?.originalAnswer.trim()),
  );
  const personalCategoriesWithAnswers = personalOsCategories.filter((category) =>
    category.questions.some((question) => session.answers[question.id]?.originalAnswer.trim()),
  );
  const strongestAreas = categories
    .map((category) => ({ category, progress: categoryProgress(category, session) }))
    .filter(({ progress }) => progress.answered > 0)
    .sort((a, b) => b.progress.answered / b.progress.total - a.progress.answered / a.progress.total)
    .slice(0, 4);
  const weakAreas = categories
    .map((category) => ({ category, progress: categoryProgress(category, session) }))
    .filter(({ progress }) => progress.status !== "Complete")
    .slice(0, 5);

  const handleGenerate = () => {
    if (session.generatedVisionDraft.length) {
      const hasFeedback = Object.values(session.reviewFeedback).some((feedback) =>
        Object.values(normalizeFeedback(feedback)).some(Boolean),
      );
      const message = hasFeedback
        ? "This will update the draft using the latest saved answers. Your original answers will stay saved. Existing review feedback will remain, but some draft text may change."
        : "This will update the draft using the latest saved answers. Your original answers will stay saved.";
      if (!window.confirm(message)) return;
    }
    generateDraft();
    navigate("/admin/review");
  };

  return (
    <Shell session={session} clearSession={clearSession} showPlanningTools>
      <NeilToolLabel />
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg oak-card p-6 shadow-ember">
          <img className="mb-5 w-24 object-contain" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Generate planning draft</p>
          <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Ready for the first vision planning draft</h1>
          <p className="mt-5 text-lg leading-8 text-ash">
            This draft uses Octavian's answers to create the first structured version of the Oakfire brand direction,
            business path, website needs, content strategy, catering systems, and future personal OS opportunities.
          </p>
          <p className="mt-4 rounded-lg border border-gold/20 bg-coal/35 p-4 text-sm font-semibold leading-6 text-bone">
            This creates source material for the planning brief. It is not the final app.
          </p>
          {!answeredCount && (
            <div className="mt-5 rounded-lg oak-panel p-4">
              <p className="font-semibold text-bone">No answers are saved yet.</p>
              <p className="mt-2 text-sm leading-6 text-ash">
                Start with the answer session, save a few responses, then come back here to build the planning draft.
              </p>
              <Link className="secondary-button mt-4" to="/session">
                Open Public Intake
              </Link>
            </div>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Completion score" value={`${completionScore(answeredCount)}%`} />
            <Metric label="Oakfire answered" value={`${oakfireAnswered}/${flatQuestions.length}`} />
            <Metric label="Future OS answered" value={`${personalAnswered}/${flatPersonalOsQuestions.length}`} />
            <Metric label="Oakfire skipped" value={`${oakfireSkipped}`} />
            <Metric label="Future OS skipped" value={`${personalSkipped}`} />
            <Metric label="Oakfire follow-up" value={`${oakfireFollowUp}`} />
            <Metric label="Future OS follow-up" value={`${personalFollowUp}`} />
            <Metric label="Organized answers" value={`${organizedCount}/${totalQuestionCount()}`} />
            <Metric label="Oakfire categories complete" value={`${completeCategories}/${categories.length}`} />
            <Metric label="Categories started" value={`${categoriesWithAnswers.length}/${categories.length}`} />
            <Metric label="Future OS categories started" value={`${personalCategoriesWithAnswers.length}/${personalOsCategories.length}`} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Strong foundation" value={`${summary["Strong foundation"]}`} />
            <Metric label="Needs follow-up" value={`${summary["Needs follow-up"]}`} />
            <Metric label="Missing key details" value={`${summary["Missing key details"]}`} />
          </div>
          <button className="primary-button mt-8" onClick={handleGenerate} disabled={!answeredCount}>
            Generate / Update Vision Planning Draft
          </button>
        </section>

        <section className="rounded-lg oak-card p-6">
          <h2 className="text-2xl font-bold text-bone">Session readiness</h2>
          <div className="mt-4 rounded-lg oak-panel p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Categories with answers</h3>
            <p className="mt-2 text-sm leading-6 text-ash">
              Oakfire:{" "}
              {categoriesWithAnswers.length ? categoriesWithAnswers.map((category) => category.name).join(", ") : "No Oakfire categories started yet."}
            </p>
            <p className="mt-2 text-sm leading-6 text-ash">
              Future Personal OS:{" "}
              {personalCategoriesWithAnswers.length
                ? personalCategoriesWithAnswers.map((category) => category.name).join(", ")
                : "No future personal OS categories started yet."}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="oak-panel p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Strongest answered areas</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ash">
                {strongestAreas.length ? strongestAreas.map(({ category, progress }) => (
                  <li key={category.id}>{category.name}: {progress.status} - {progress.answered}/{progress.total} answered</li>
                )) : <li>No answered areas yet.</li>}
              </ul>
            </div>
            <div className="oak-panel p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Missing / weak areas</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ash">
                {weakAreas.map(({ category, progress }) => (
                  <li key={category.id}>{category.name}: {progress.status} - {progress.answered}/{progress.total} answered</li>
                ))}
              </ul>
            </div>
          </div>
          <h3 className="mt-5 text-xl font-bold text-bone">Skipped / needs-follow-up / missing areas</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="max-h-[520px] overflow-auto space-y-3">
              <h4 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Oakfire Intake</h4>
              {missing.length ? (
                missing.map((question) => {
                const answer = session.answers[question.id];
                const status = answer?.skippedAt ? "Skipped for now" : "Needs follow-up";
                return (
                  <div key={question.id} className="rounded-md border border-gold/15 bg-coal/35 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{question.category.name}</p>
                    <p className="mt-1 text-sm leading-6 text-ash">{question.text}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-bone">{status}</p>
                  </div>
                );
                })
              ) : (
                <p className="text-ash">All Oakfire questions have original answers saved.</p>
              )}
            </div>
            <div className="max-h-[520px] overflow-auto space-y-3">
              <h4 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Future Personal OS Intake</h4>
              {personalMissing.length ? (
                personalMissing.map((question) => {
                  const answer = session.answers[question.id];
                  const status = answer?.skippedAt ? "Skipped for now" : "Needs follow-up";
                  return (
                    <div key={question.id} className="rounded-md border border-gold/15 bg-coal/35 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{question.category.name}</p>
                      <p className="mt-1 text-sm leading-6 text-ash">{question.text}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-bone">{status}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-ash">All future personal OS questions have original answers saved.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function ReviewPage({ session, saveFeedback, finalizeVision, generateDraft, clearSession, answeredCount, skippedCount, followUpCount }: SessionProps) {
  const navigate = useNavigate();
  const sections = session.generatedVisionDraft.length ? session.generatedVisionDraft : generateFirstVisionDraft(session.answers);
  const oakfireSections = sections.filter((section) => !isEighthFlameSection(section));
  const eighthFlameSections = sections.filter(isEighthFlameSection);
  const summary = completenessSummary(sections, session.answers);

  const handleFinalize = () => {
    finalizeVision();
    sessionStorage.setItem("oakfire-finalized-message", "Planning Brief finalized. The Oakfire source material is ready to review and export.");
    navigate("/admin/vision");
  };

  return (
    <Shell session={session} clearSession={clearSession} showPlanningTools>
      <NeilToolLabel />
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Collaborative review</p>
          <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Review the first planning draft</h1>
          <p className="mt-3 max-w-3xl text-ash">
            Use this space to sharpen the direction together. Add what feels right, what feels wrong, what needs to be
            stronger, or what should be changed.
          </p>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-bone">
            This feedback improves the planning brief and future app direction. It does not overwrite Octavian's original answers.
          </p>
          <p className="mt-3 text-sm font-semibold text-bone">
            Completeness: {summary["Strong foundation"]} strong foundation, {summary["Needs follow-up"]} needs
            follow-up, {summary["Missing key details"]} missing key details.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="secondary-button" to="/admin/present">
            Presentation Mode
          </Link>
          <button className="primary-button" onClick={handleFinalize}>
            Finalize Planning Brief
          </button>
        </div>
      </div>

      {!session.generatedVisionDraft.length && (
        <div className="mb-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
          <h2 className="text-xl font-black text-bone">No planning draft has been generated yet.</h2>
          <p className="mt-2 text-sm leading-6 text-bone">
            Generate the first planning draft, then come back here to review the direction together.
          </p>
          <Link className="secondary-button mt-4" to="/admin/generate">
            Go to Generate
          </Link>
        </div>
      )}

      <ReviewGroup title="A. Oakfire Planning Draft" description="Review the Oakfire business story, brand, website, catering, content, systems, follow-up questions, and open decisions.">
        {oakfireSections.map((section) => (
            <ReviewSection
              key={section.id}
              section={section}
              session={session}
              value={normalizeFeedback(session.reviewFeedback[section.id])}
              onSave={(feedback) => saveFeedback(section.id, feedback)}
            />
          ))}
      </ReviewGroup>

      <ReviewGroup title="B. Future Personal OS Blueprint" description="Review the future app direction, personal modules, and first-version priorities.">
        {eighthFlameSections.map((section) => (
            <ReviewSection
              key={section.id}
              section={section}
              session={session}
              value={normalizeFeedback(session.reviewFeedback[section.id])}
              onSave={(feedback) => saveFeedback(section.id, feedback)}
            />
          ))}
      </ReviewGroup>
    </Shell>
  );
}

function ReviewGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-4 rounded-lg border border-gold/20 bg-coal/35 p-4">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-gold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ash">{description}</p>
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function ReviewSection({
  section,
  session,
  value,
  onSave,
}: {
  section: VisionSection;
  session: SessionState;
  value: ReviewFeedback;
  onSave: (feedback: ReviewFeedback) => void;
}) {
  const [feedback, setFeedback] = useState<ReviewFeedback>(value);
  const [savedMessage, setSavedMessage] = useState("");
  useEffect(() => setFeedback(value), [value]);

  const sources = section.sourceQuestionIds
    .map((questionId) => session.answers[questionId])
    .filter(Boolean);
  const marker = sectionCompleteness(section, session.answers);

  return (
    <section className="export-output rounded-lg oak-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-bone">{section.title}</h2>
        <CompletenessMarker value={marker} />
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Draft section content</h3>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-ash">
            {section.body.map((line) => (
              <li key={line} className="border-l-2 border-gold pl-3">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Source answers used</h3>
          <div className="mt-3 max-h-64 overflow-auto space-y-3">
            {sources.length ? (
              sources.map((source) => (
                <div key={source.questionId} className="rounded-md oak-panel p-3">
                  <p className="text-sm font-semibold text-bone">{source.questionText}</p>
                  <p className="mt-2 text-sm leading-6 text-ash">{source.organizedAnswer || source.originalAnswer}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ash">No direct source answer for this planning section.</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <FeedbackField
          id={`feels-${section.id}`}
          label="What feels right?"
          value={feedback.feelsRight}
          onChange={(feelsRight) => setFeedback((current) => ({ ...current, feelsRight }))}
        />
        <FeedbackField
          id={`change-${section.id}`}
          label="What needs to change?"
          value={feedback.needsChange}
          onChange={(needsChange) => setFeedback((current) => ({ ...current, needsChange }))}
        />
        <FeedbackField
          id={`stronger-${section.id}`}
          label="What should be stronger?"
          value={feedback.makeStronger}
          onChange={(makeStronger) => setFeedback((current) => ({ ...current, makeStronger }))}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="secondary-button"
          onClick={() => {
            onSave(feedback);
            setSavedMessage(`Saved feedback for ${section.title}.`);
          }}
        >
          Save Feedback
        </button>
        <p className="text-sm font-semibold text-gold">
          {savedMessage || (Object.values(value).some(Boolean) ? "Saved feedback exists for this section." : "No saved feedback yet.")}
        </p>
      </div>
    </section>
  );
}

function VisionPage({ session, clearSession, generateDraft, answeredCount, skippedCount, followUpCount }: SessionProps) {
  const sections = finalVisionSections(session);
  const summary = completenessSummary(sections, session.answers);
  const completeCategories = categoriesComplete(session.answers);
  const [finalizedMessage, setFinalizedMessage] = useState("");

  useEffect(() => {
    const message = sessionStorage.getItem("oakfire-finalized-message");
    if (message) {
      setFinalizedMessage(message);
      sessionStorage.removeItem("oakfire-finalized-message");
    }
  }, []);

  return (
    <Shell session={session} clearSession={clearSession} showPlanningTools>
      <NeilToolLabel />
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center">
          <img className="w-28 shrink-0 object-contain sm:w-36" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Session-Based Blueprint for Oakfire and the Future Octavian Personal OS</p>
            <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Oakfire Planning Brief</h1>
            <p className="mt-3 text-ash">
              {answeredCount} of {totalQuestionCount()} original answers saved. Last saved:{" "}
              {formatLastSaved(session.lastSavedAt)}. Completion summary: {summary["Strong foundation"]} strong,{" "}
              {summary["Needs follow-up"]} needs follow-up, {summary["Missing key details"]} missing key details. This is source material for the separate future Octavian personal OS.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="secondary-button" to="/admin/review">
            Return to Review
          </Link>
          <Link className="secondary-button" to="/admin/present">
            Presentation Mode
          </Link>
          <Link className="primary-button" to="/admin/export">
            Export Planning Brief
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <Metric label="Questions answered" value={`${answeredCount}/${totalQuestionCount()}`} />
        <Metric label="Planning status" value={sessionStatus(session)} />
        <Metric label="Completion score" value={`${completionScore(answeredCount)}%`} />
        <Metric label="Skipped" value={`${skippedCount}`} />
        <Metric label="Follow-up flags" value={`${followUpCount}`} />
        <Metric label="Categories complete" value={`${completeCategories}/${categories.length}`} />
        <Metric label="Strong foundation" value={`${summary["Strong foundation"]}`} />
        <Metric label="Partial sections" value={`${summary["Needs follow-up"]}`} />
        <Metric label="Needs follow-up sections" value={`${summary["Missing key details"]}`} />
      </div>

      {finalizedMessage && (
        <p className="mb-6 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm font-bold text-bone">{finalizedMessage}</p>
      )}

      {!answeredCount && (
        <div className="mb-6 rounded-lg oak-card p-5">
          <h2 className="text-xl font-black text-bone">No saved answers yet.</h2>
          <p className="mt-2 text-sm leading-6 text-ash">
            Start the answer session first. Once Octavian saves answers, this page becomes the Oakfire planning brief.
          </p>
          <Link className="secondary-button mt-4" to="/admin/generate">
            Open Public Intake
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {sections.map((section) => (
          <VisionSectionCard key={section.id} section={section} session={session} />
        ))}
      </div>

      <BeforeLeavesChecklist />
    </Shell>
  );
}

function ExportPage({ session, clearSession, importSession, generateDraft, answeredCount, skippedCount, followUpCount }: SessionProps) {
  const originalAnswers = useMemo(() => originalAnswersText(session), [session]);
  const organizedAnswers = useMemo(() => organizedAnswersText(session), [session]);
  const feedback = useMemo(() => reviewFeedbackText(session), [session]);
  const finalVision = useMemo(() => finalVisionText(session), [session]);
  const futureBlueprint = useMemo(() => futurePersonalOSBlueprintText(), []);
  const namingIdeas = useMemo(() => futureAppNamingIdeasText(), []);
  const futureQuestions = useMemo(() => questionsBeforeFutureAppText(), []);
  const sourceMaterial = useMemo(() => sourceMaterialForFuturePersonalOSText(session), [session]);
  const prompt = useMemo(() => aiPromptText(session), [session]);
  const websitePrompt = useMemo(() => websitePlanPromptText(session), [session]);
  const brandPrompt = useMemo(() => brandIdentityPromptText(session), [session]);
  const codexPrompt = useMemo(() => codexPersonalOSFoundationPromptText(session), [session]);
  const strategyPrompt = useMemo(() => personalOSStrategyPromptText(session), [session]);
  const sections = finalVisionSections(session);
  const summary = completenessSummary(sections, session.answers);
  const [copied, setCopied] = useState("");

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`Copied ${label}.`);
    } catch {
      setCopied(`Could not copy ${label}. Select the text below and copy it manually.`);
    }
  };

  const download = (label: string, filename: string, content: string, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setCopied(`Downloaded ${label}.`);
  };

  const backup = JSON.stringify({ ...sessionBackup(session), exportedAt: new Date().toISOString() }, null, 2);

  return (
    <Shell session={session} clearSession={clearSession} showPlanningTools>
      <NeilToolLabel />
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Session package</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Oakfire Planning Exports</h1>
        <p className="mt-3 max-w-3xl text-ash">
          Collect the intake source material, Oakfire planning brief, future personal OS blueprint, AI prompts, Codex
          build prompt, and full session backup.
        </p>
        <p className="mt-3 text-sm font-semibold text-bone">
          Completeness: {summary["Strong foundation"]} strong foundation, {summary["Needs follow-up"]} needs follow-up,{" "}
          {summary["Missing key details"]} missing key details.
        </p>
        {copied && <p className="mt-3 text-sm font-semibold text-gold">{copied}</p>}
      </div>

      <div className="mb-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
        <h2 className="text-xl font-black text-bone">Session Backup</h2>
        <p className="mt-2 text-sm leading-6 text-bone">Use this as a backup before clearing or moving devices.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="primary-button"
            onClick={() => download("Full Session Backup JSON", "octavian-full-session-backup.json", backup, "application/json")}
          >
            Download Full Session Backup (.json)
          </button>
          <Link className="secondary-button" to="/admin/import">
            Import Session Backup
          </Link>
        </div>
      </div>

      <BeforeLeavesChecklist />

      {!answeredCount && (
        <div className="mb-6 rounded-lg oak-card p-5">
          <h2 className="text-xl font-black text-bone">Nothing to export yet.</h2>
          <p className="mt-2 text-sm leading-6 text-ash">
            Save at least one answer first, then come back here for copy-ready outputs and backups.
          </p>
          <Link className="secondary-button mt-4" to="/admin/generate">
            Open Public Intake
          </Link>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <ExportGroup title="A. Session Records">
          <ExportBlock title="Original Answers" description="Octavian's raw Oakfire and future personal OS answers, preserved in his own words." text={originalAnswers} copied={copied} copy={() => copy("Original Answers", originalAnswers)} download={() => download("Original Answers", "octavian-original-answers.txt", originalAnswers)} />
          <ExportBlock title="Organized Answers" description="Cleaned planning statements derived from the originals without replacing them." text={organizedAnswers} copied={copied} copy={() => copy("Organized Answers", organizedAnswers)} download={() => download("Organized Answers", "octavian-organized-answers.txt", organizedAnswers)} />
          <ExportBlock title="Collaborative Review Feedback" description="Neil and Octavian's notes on what feels right, what changes, and what needs strength." text={feedback} copied={copied} copy={() => copy("Collaborative Review Feedback", feedback)} download={() => download("Collaborative Review Feedback", "octavian-review-feedback.txt", feedback)} />
          <ExportBlock title="Full Session Backup JSON" description="Complete JSON backup for restoring or moving the session." text={backup} copied={copied} copy={() => copy("Full Session Backup JSON", backup)} download={() => download("Full Session Backup JSON", "octavian-full-session-backup.json", backup, "application/json")} />
        </ExportGroup>

        <ExportGroup title="B. Planning Outputs">
          <ExportBlock title="Oakfire Planning Brief" description="The polished session blueprint for Oakfire and future app planning." text={finalVision} copied={copied} copy={() => copy("Oakfire Planning Brief", finalVision)} download={() => download("Oakfire Planning Brief", "oakfire-planning-brief.txt", finalVision)} />
          <ExportBlock title="Future Personal OS Blueprint" description="Module map and product direction for Octavian's future personal OS." text={futureBlueprint} copied={copied} copy={() => copy("Future Personal OS Blueprint", futureBlueprint)} download={() => download("Future Personal OS Blueprint", "future-personal-os-blueprint.txt", futureBlueprint)} />
          <ExportBlock title="Source Material for Future Personal OS" description="Combined planning brief, future OS blueprint, feedback, open decisions, and build questions." text={sourceMaterial} copied={copied} copy={() => copy("Source Material for Future Personal OS", sourceMaterial)} download={() => download("Source Material for Future Personal OS", "source-material-for-future-personal-os.txt", sourceMaterial)} />
          <ExportBlock title="Questions to Ask Before Building Next App" description="Focused questions to answer before Neil starts the separate future app." text={futureQuestions} copied={copied} copy={() => copy("Questions to Ask Before Building Next App", futureQuestions)} download={() => download("Questions to Ask Before Building Next App", "questions-before-building-next-app.txt", futureQuestions)} />
          <ExportBlock title="Future App Name Decision" description="Name options with meaning, best fit, and possible downside." text={namingIdeas} copied={copied} copy={() => copy("Future App Name Decision", namingIdeas)} download={() => download("Future App Name Decision", "future-app-name-decision.txt", namingIdeas)} />
        </ExportGroup>

        <ExportGroup title="C. Build Prompts" wide>
          <ExportBlock title="AI Prompt for Oakfire Final Vision Document" description="Prompt for turning the Oakfire planning brief into a polished written document." text={prompt} copied={copied} copy={() => copy("AI Prompt for Oakfire Final Vision Document", prompt)} download={() => download("AI Prompt for Oakfire Final Vision Document", "oakfire-ai-vision-prompt.txt", prompt)} />
          <ExportBlock title="AI Prompt for Oakfire Website Plan" description="Prompt for creating the first practical Oakfire website plan." text={websitePrompt} copied={copied} copy={() => copy("AI Prompt for Oakfire Website Plan", websitePrompt)} download={() => download("AI Prompt for Oakfire Website Plan", "oakfire-website-plan-prompt.txt", websitePrompt)} />
          <ExportBlock title="AI Prompt for Oakfire Brand Naming / Identity" description="Prompt for exploring Oakfire brand naming, voice, visual identity, and taglines." text={brandPrompt} copied={copied} copy={() => copy("AI Prompt for Oakfire Brand Naming / Identity", brandPrompt)} download={() => download("AI Prompt for Oakfire Brand Naming / Identity", "oakfire-brand-identity-prompt.txt", brandPrompt)} />
          <ExportBlock title="AI Prompt for Future Personal OS Strategy" description="Prompt for future app positioning, module priorities, naming, and MVP roadmap." text={strategyPrompt} copied={copied} copy={() => copy("AI Prompt for Future Personal OS Strategy", strategyPrompt)} download={() => download("AI Prompt for Future Personal OS Strategy", "future-personal-os-strategy-prompt.txt", strategyPrompt)} />
          <ExportBlock title="Codex Prompt for Future Personal OS App Foundation" description="Build-ready prompt for starting the separate future personal OS foundation in Codex." text={codexPrompt} copied={copied} copy={() => copy("Codex Prompt for Future Personal OS App Foundation", codexPrompt)} download={() => download("Codex Prompt for Future Personal OS App Foundation", "codex-future-personal-os-foundation-prompt.txt", codexPrompt)} />
        </ExportGroup>
      </div>
    </Shell>
  );
}

function ImportPage({ session, clearSession, importSession }: SessionProps) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleImport = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed.sessionId || !parsed.createdAt || typeof parsed.answers !== "object") {
          setMessage("That file does not look like an Octavian vision session backup.");
          return;
        }
        if (!window.confirm("This will replace the current saved session on this device.")) return;
        importSession(parsed);
        setMessage("Session backup imported successfully.");
        navigate(parsed.finalizedVision?.length || parsed.generatedVisionDraft?.length ? "/admin/vision" : "/admin/generate");
      } catch {
        setMessage("Could not read that JSON backup file.");
      }
    };
    reader.onerror = () => setMessage("Could not read that backup file.");
    reader.readAsText(file);
  };

  return (
    <Shell session={session} clearSession={clearSession} showPlanningTools>
      <NeilToolLabel />
      <section className="mx-auto max-w-3xl rounded-lg oak-card p-6 shadow-ember">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Safety tool</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Import Session Backup</h1>
        <p className="mt-4 text-base leading-7 text-ash">
          Use this if Neil needs to move devices or restore a saved session JSON. Importing replaces the current local
          saved session after confirmation.
        </p>
        <label className="mt-6 block text-sm font-semibold text-bone" htmlFor="backup-file">
          Session backup .json
        </label>
        <input
          id="backup-file"
          className="mt-2 w-full rounded-lg oak-panel p-4 text-bone file:mr-4 file:rounded-md file:border-0 file:bg-gold file:px-4 file:py-2 file:font-bold file:text-coal"
          type="file"
          accept="application/json,.json"
          onChange={(event) => handleImport(event.target.files?.[0] || null)}
        />
        {message && <p className="mt-4 rounded-lg oak-panel p-4 text-sm font-semibold text-bone">{message}</p>}
      </section>
    </Shell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-frame">
      <header className="app-header flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/admin" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          <img className="h-11 w-auto object-contain" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <span>Neil Planning Dashboard</span>
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link className="nav-link" to="/admin">
            Submissions
          </Link>
          <Link className="nav-link" to="/test">
            Testing Gateway
          </Link>
          <Link className="nav-link" to="/">
            Public Intake
          </Link>
        </nav>
      </header>
      <p className="mb-6 rounded-lg border border-ember/35 bg-ember/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-bone shadow-oak">
        Admin planning view - for Neil only. Do not share this link.
      </p>
      {children}
    </main>
  );
}

function AdminPage() {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [message, setMessage] = useState("Loading submissions...");
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isClearingTests, setIsClearingTests] = useState(false);
  const realSubmissions = submissions.filter((submission) => submissionLabel(submission) === "REAL");
  const testSubmissions = submissions.filter((submission) => submissionLabel(submission) === "TEST");

  const loadSubmissions = useCallback(() => {
    setMessage("Loading submissions...");
    apiJson<SubmissionSummary[]>("/api/submissions")
      .then((items) => {
        const sorted = [...items].sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
        setSubmissions(sorted);
        setMessage(sorted.length ? "" : "No submissions yet.");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load submissions."));
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const createTestSubmission = async () => {
    setIsCreatingTest(true);
    setMessage("Creating full test submission...");
    try {
      const saved = await apiJson<StoredSubmission>("/api/submissions/test", { method: "POST" });
      setSubmissions((current) => [
        {
          id: saved.id,
          submissionType: saved.submissionType,
          submitterName: saved.submitterName,
          status: saved.status,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
          completedAt: saved.completedAt,
          answeredCount: saved.answeredCount,
          oakfireAnswerCount: saved.oakfireAnswerCount,
          personalOsAnswerCount: saved.personalOsAnswerCount,
          hasPlanningOutputs: Boolean(saved.planningOutputs?.generatedAt),
        },
        ...current,
      ]);
      setMessage("Test submission created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create test submission.");
    } finally {
      setIsCreatingTest(false);
    }
  };

  const clearTestSubmissions = async () => {
    if (!window.confirm("This will delete test submissions only. Real submissions will stay saved. Continue?")) return;
    setIsClearingTests(true);
    setMessage("Clearing test submissions...");
    try {
      const result = await apiJson<{ deletedCount: number; remainingCount: number }>("/api/submissions/test", { method: "DELETE" });
      setSubmissions((current) => current.filter((submission) => submissionLabel(submission) !== "TEST"));
      setMessage(`Cleared ${result.deletedCount} test submission${result.deletedCount === 1 ? "" : "s"}. Real submissions stayed saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not clear test submissions.");
    } finally {
      setIsClearingTests(false);
    }
  };

  return (
    <AdminShell>
      <section className="admin-card rounded-lg oak-card p-6 shadow-ember">
        <img className="mb-4 h-14 w-auto object-contain" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Neil Admin Side</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Neil Planning Dashboard</h1>
        <p className="mt-3 max-w-3xl text-ash">
          Submitted Oakfire intakes and planning outputs.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Real submissions" value={`${realSubmissions.length}`} />
          <Metric label="Test submissions" value={`${testSubmissions.length}`} />
          <Metric label="Most recent real" value={realSubmissions[0]?.completedAt ? formatLastSaved(realSubmissions[0].completedAt) : "None"} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="secondary-button" to="/">
            View Public Intake
          </Link>
          <button className="primary-button" onClick={createTestSubmission} disabled={isCreatingTest}>
            {isCreatingTest ? "Creating..." : "Create Test Submission"}
          </button>
          <button className="danger-button" onClick={clearTestSubmissions} disabled={isClearingTests || !testSubmissions.length}>
            {isClearingTests ? "Clearing..." : "Clear Test Submissions"}
          </button>
          <button className="secondary-button" onClick={loadSubmissions}>
            Refresh Submissions
          </button>
        </div>
        {message && <p className="mt-5 rounded-lg oak-panel p-4 text-sm font-semibold text-bone">{message}</p>}
      </section>

      <section className="mt-6 rounded-lg oak-card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">A. Real Submissions</p>
            <h2 className="mt-1 text-2xl font-black text-bone">Ready for planning</h2>
          </div>
          <p className="text-sm font-semibold text-ash">{realSubmissions.length} real submission{realSubmissions.length === 1 ? "" : "s"}</p>
        </div>
        {realSubmissions.length ? (
          <div className="grid gap-3">
            {realSubmissions.map((submission) => (
              <AdminSubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg oak-panel p-4 text-sm font-semibold text-bone">
            No real submissions yet. Test submissions are below.
          </p>
        )}
      </section>

      <details className="mt-6 rounded-lg oak-card p-5">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.16em] text-gold">
          B. Test Submissions ({testSubmissions.length})
        </summary>
        <div className="mt-4 grid gap-3">
          {testSubmissions.length ? (
            testSubmissions.map((submission) => <AdminSubmissionCard key={submission.id} submission={submission} />)
          ) : (
            <p className="rounded-lg oak-panel p-4 text-sm font-semibold text-bone">No test submissions saved.</p>
          )}
        </div>
      </details>
    </AdminShell>
  );
}

function AdminSubmissionCard({ submission }: { submission: SubmissionSummary }) {
  return (
    <div className="rounded-lg border border-gold/15 bg-coal/35 p-4 shadow-oak">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={submissionLabel(submission) === "TEST" ? "status-pill border-ember/55 bg-ember/15 text-bone" : "status-pill"}>
              {submissionLabel(submission)}
            </span>
            <p className="text-lg font-black text-bone">{submission.submitterName || "Octavian"}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-ash">
            Completed {formatLastSaved(submission.completedAt)}. Planning status: {submission.hasPlanningOutputs ? "Generated" : "Not generated"}. Answers: {submission.oakfireAnswerCount ?? 0} Oakfire / {submission.personalOsAnswerCount ?? 0} Eighth Flame.
          </p>
        </div>
        <Link className="primary-button" to={`/admin/submissions/${submission.id}`}>
          Open Planning Brief
        </Link>
      </div>
    </div>
  );
}

function AdminSubmissionPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState<StoredSubmission | null>(null);
  const [message, setMessage] = useState("Loading submission...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiJson<StoredSubmission>(`/api/submissions/${id}`)
      .then((item) => {
        setSubmission(item);
        setMessage("");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Submission not found."));
  }, [id]);

  const session = storedSubmissionSession(submission);
  const outputs = useMemo(
    () => (submission && session ? planningOutputsForSubmission(submission, session) : null),
    [submission, session],
  );
  const fullJson = useMemo(() => (submission ? JSON.stringify(submission, null, 2) : ""), [submission]);
  const executiveSummary = useMemo(
    () => (session && outputs ? buildExecutiveSummary(session, outputs) : ""),
    [session, outputs],
  );
  const neilShouldBuildNext = useMemo(() => (session ? buildNeilShouldBuildNext(session) : ""), [session]);
  const copyReadyMasterPrompt = useMemo(
    () => (outputs ? buildCopyReadyMasterPrompt(outputs, executiveSummary, neilShouldBuildNext) : ""),
    [outputs, executiveSummary, neilShouldBuildNext],
  );

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied ${label}.`);
    } catch {
      setMessage(`Could not copy ${label}. Select and copy manually.`);
    }
  };

  const download = (label: string, filename: string, content: string, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Downloaded ${label}.`);
  };

  const generate = async () => {
    if (!submission || !outputs) return;
    setBusy(true);
    setMessage("Generating planning outputs...");
    try {
      const updated = await apiJson<StoredSubmission>(`/api/submissions/${submission.id}/generate`, {
        method: "POST",
        body: JSON.stringify({ planningOutputs: { ...outputs, fullSubmissionJson: fullJson } }),
      });
      setSubmission(updated);
      setMessage("Planning outputs generated from saved submission answers.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate planning outputs.");
    } finally {
      setBusy(false);
    }
  };

  if (!submission || !session || !outputs) {
    return (
      <AdminShell>
        <section className="rounded-lg oak-card p-6">
          <h1 className="text-3xl font-black text-bone">Submission not found</h1>
          <p className="mt-3 text-ash">{message || "Submission not found."}</p>
          <Link className="secondary-button mt-5" to="/admin">
            Back to Admin
          </Link>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <section className="admin-card mb-6 rounded-lg oak-card p-6 shadow-ember">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Neil Admin Side</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Oakfire Planning Review</h1>
        <p className="mt-3 text-ash">
          {submission.submitterName || "Octavian"} completed this intake {formatLastSaved(submission.completedAt)}. Planning outputs are generated from the saved submission answers, with raw answers preserved below.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={submissionLabel(submission) === "TEST" ? "status-pill border-ember/55 bg-ember/15 text-bone" : "status-pill"}>
            {submissionLabel(submission)}
          </span>
          <span className="status-pill">Saved backend submission</span>
          <span className="status-pill">
            {submission.planningOutputs?.generatedAt ? `Generated ${formatLastSaved(submission.planningOutputs.generatedAt)}` : "Planning not generated"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric label="Submission id" value={submission.id} />
          <Metric label="Oakfire answers" value={`${submission.oakfireAnswerCount ?? answeredInQuestions(flatQuestions.map((question) => question.id), session)}`} />
          <Metric label="Eighth Flame answers" value={`${submission.personalOsAnswerCount ?? answeredInQuestions(flatPersonalOsQuestions.map((question) => question.id), session)}`} />
          <Metric label="Status" value="Completed" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="secondary-button" to="/admin">
            Back to Admin
          </Link>
          <button className="primary-button" onClick={generate} disabled={busy}>
            {busy ? "Generating..." : "Generate / Refresh Planning Outputs"}
          </button>
          <button className="secondary-button" onClick={() => copy("Copy-Ready Master Prompt for ChatGPT", copyReadyMasterPrompt)}>
            Copy Master Prompt
          </button>
          <button className="secondary-button" onClick={() => download("Full Backup JSON", "oakfire-submission-backup.json", fullJson, "application/json")}>
            Download Backup JSON
          </button>
        </div>
        {message && <p className="mt-4 rounded-lg oak-panel p-4 text-sm font-semibold text-bone">{message}</p>}
      </section>

      <div className="grid gap-5">
        <AdminOutputBlock title="Executive Summary" text={executiveSummary} copy={copy} download={download} filename="executive-summary.txt" />
        <AdminOutputBlock title="Oakfire Planning Brief" text={outputs.oakfirePlanningBrief} copy={copy} download={download} filename="oakfire-planning-brief.txt" />
        <AdminOutputBlock title="Oakfire x Legacy Sanctum Opportunity" text={outputs.oakfireLegacySanctumOpportunity} copy={copy} download={download} filename="oakfire-legacy-sanctum-opportunity.txt" />
        <AdminOutputBlock title="Eighth Flame Personal OS Blueprint" text={outputs.eighthFlameBlueprint} copy={copy} download={download} filename="eighth-flame-blueprint.txt" />
        <AdminOutputBlock title="What Neil Should Build Next" text={neilShouldBuildNext} copy={copy} download={download} filename="what-neil-should-build-next.txt" />
        <AdminOutputBlock title="Copy-Ready Master Prompt for ChatGPT" text={copyReadyMasterPrompt} copy={copy} download={download} filename="copy-ready-master-prompt.txt" />
        <AdminOutputBlock title="Codex Prompt for Eighth Flame Foundation" text={outputs.prompts.codexFoundation} copy={copy} download={download} filename="codex-eighth-flame-foundation-prompt.txt" />
      </div>

      <details className="mt-6 rounded-lg oak-card p-5">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.16em] text-gold">
          Raw Answers and Backup
        </summary>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <AdminOutputBlock title="Oakfire Original Answers" text={outputs.originalOakfireAnswers} copy={copy} download={download} filename="oakfire-original-answers.txt" />
          <AdminOutputBlock title="Eighth Flame Original Answers" text={outputs.originalPersonalOsAnswers} copy={copy} download={download} filename="eighth-flame-original-answers.txt" />
          <AdminOutputBlock title="Organized Oakfire Answers" text={outputs.organizedOakfireAnswers} copy={copy} download={download} filename="organized-oakfire-answers.txt" />
          <AdminOutputBlock title="Organized Eighth Flame Answers" text={outputs.organizedPersonalOsAnswers} copy={copy} download={download} filename="organized-eighth-flame-answers.txt" />
          <AdminOutputBlock title="Skipped / Needs Follow-Up" text={outputs.skippedAndFollowUp} copy={copy} download={download} filename="skipped-needs-follow-up.txt" />
          <AdminOutputBlock title="Source Material for Future Eighth Flame App" text={outputs.sourceMaterialForFutureEighthFlameApp} copy={copy} download={download} filename="future-eighth-flame-source-material.txt" />
          <AdminOutputBlock title="AI Prompt for Oakfire Final Vision Document" text={outputs.prompts.oakfireFinalVision} copy={copy} download={download} filename="oakfire-final-vision-prompt.txt" />
          <AdminOutputBlock title="AI Prompt for Oakfire Website Plan" text={outputs.prompts.oakfireWebsitePlan} copy={copy} download={download} filename="oakfire-website-plan-prompt.txt" />
          <AdminOutputBlock title="AI Prompt for Oakfire Brand Naming / Identity" text={outputs.prompts.oakfireBrandIdentity} copy={copy} download={download} filename="oakfire-brand-identity-prompt.txt" />
          <AdminOutputBlock title="AI Prompt for Eighth Flame Personal OS Strategy" text={outputs.prompts.eighthFlameStrategy} copy={copy} download={download} filename="eighth-flame-strategy-prompt.txt" />
          <AdminOutputBlock title="Full Submission JSON" text={fullJson} copy={copy} download={download} filename="full-submission.json" type="application/json" />
        </div>
      </details>
    </AdminShell>
  );
}

function AdminOutputBlock({
  title,
  text,
  copy,
  download,
  filename,
  type = "text/plain",
}: {
  title: string;
  text: string;
  copy: (label: string, text: string) => void;
  download: (label: string, filename: string, content: string, type?: string) => void;
  filename: string;
  type?: string;
}) {
  return (
    <section className="output-card rounded-lg oak-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black text-bone">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" onClick={() => copy(title, text)}>
            Copy
          </button>
          <button className="secondary-button" onClick={() => download(title, filename, text, type)}>
            Download
          </button>
        </div>
      </div>
      <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-6 text-ash">
        {text || "Needs follow-up."}
      </pre>
    </section>
  );
}

function SessionControlCenter({
  session,
  answeredCount,
  skippedCount,
  followUpCount,
  generateDraft,
}: {
  session: SessionState;
  answeredCount: number;
  skippedCount: number;
  followUpCount: number;
  generateDraft: () => VisionSection[];
}) {
  const navigate = useNavigate();
  const completeCategories = categoriesComplete(session.answers);
  const nextAction = nextRecommendedAction(session, answeredCount);

  const updateDraft = () => {
    if (session.generatedVisionDraft.length) {
      const hasFeedback = Object.values(session.reviewFeedback).some((feedback) =>
        Object.values(normalizeFeedback(feedback)).some(Boolean),
      );
      const message = hasFeedback
        ? "This will update the draft using the latest saved answers. Your original answers will stay saved. Existing review feedback will remain, but some draft text may change."
        : "This will update the draft using the latest saved answers. Your original answers will stay saved.";
      if (!window.confirm(message)) return;
    }
    generateDraft();
    navigate("/admin/review");
  };

  return (
    <section className="mb-6 rounded-lg oak-card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-2 text-sm text-ash sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <p>
            <span className="font-bold text-bone">Planning status:</span> {sessionStatus(session)}
          </p>
          <p>
            <span className="font-bold text-bone">Last saved:</span> {formatLastSaved(session.lastSavedAt)}
          </p>
          <p>
            <span className="font-bold text-bone">Answered:</span> {answeredCount}/{totalQuestionCount()}
          </p>
          <p>
            <span className="font-bold text-bone">Oakfire categories:</span> {completeCategories}/{categories.length}
          </p>
          <p>
            <span className="font-bold text-bone">Needs follow-up:</span> {followUpCount + skippedCount}
          </p>
          <p className="sm:col-span-2 xl:col-span-2">
            <span className="font-bold text-gold">Next recommended action:</span> {nextAction}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="secondary-button" to="/session">
            Open Public Intake
          </Link>
          <button className="secondary-button" onClick={updateDraft}>
            Generate / Update Planning Draft
          </button>
          <Link className="secondary-button" to="/admin/review">
            Review Planning Draft
          </Link>
          <Link className="secondary-button" to="/admin/vision">
            Planning Brief
          </Link>
          <Link className="primary-button" to="/admin/export">
            Export Source Material
          </Link>
        </div>
      </div>
    </section>
  );
}

function NeilToolLabel() {
  return (
    <p className="mb-4 inline-flex rounded-full border border-gold/25 bg-soot/70 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-gold">
      Neil Planning Tools
    </p>
  );
}

function BeforeLeavesChecklist() {
  return (
    <section className="my-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
      <h2 className="text-xl font-black text-bone">Before Octavian Leaves</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {beforeOctavianLeavesChecklist().map((item) => (
          <label key={item} className="flex items-start gap-3 text-sm font-semibold leading-6 text-bone">
            <input className="mt-1 h-5 w-5 accent-[#D6A43A]" type="checkbox" />
            {item}
          </label>
        ))}
      </div>
    </section>
  );
}

function PresentPage({ session }: SessionProps) {
  const sections = finalVisionSections(session);
  const summary = completenessSummary(sections, session.answers);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 text-bone sm:px-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-gold/20 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img className="w-24 shrink-0 object-contain sm:w-32" src={oakfireLogoSrc} alt="Oakfire by Octavian" />
          <div>
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-gold">Presentation Mode</p>
          <h1 className="mt-2 text-4xl font-black text-bone sm:text-5xl">Oakfire Planning Brief</h1>
          <p className="mt-3 text-xl text-ash">
            {summary["Strong foundation"]} strong foundation, {summary["Needs follow-up"]} needs follow-up,{" "}
            {summary["Missing key details"]} missing key details.
          </p>
          </div>
        </div>
        <Link className="secondary-button" to="/admin/vision">
          Exit Presentation
        </Link>
      </div>
      <div className="grid gap-6">
        {sections.map((section) => (
          <section key={section.id} className="rounded-lg oak-card p-7 shadow-ember">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl font-black text-bone">{section.title}</h2>
              <CompletenessMarker value={sectionCompleteness(section, session.answers)} />
            </div>
            <ul className="mt-5 space-y-4 text-xl leading-9 text-bone">
              {section.body.map((line) => (
                <li key={line} className="border-l-4 border-gold pl-5">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg oak-panel p-4">
      <p className="text-sm font-semibold text-ash">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-bone sm:text-3xl">{value}</p>
    </div>
  );
}

function CompletenessMarker({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-2 text-sm font-black uppercase tracking-[0.1em] ${markerClass(value)}`}>
      Completeness: {value}
    </span>
  );
}

function FeedbackField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-bone" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="mt-2 min-h-32 w-full rounded-lg oak-panel p-4 text-base leading-7 text-bone outline-none ring-gold/30 placeholder:text-iron focus:border-gold focus:ring-4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add notes from the review conversation..."
      />
    </div>
  );
}

function VisionSectionCard({ section, session }: { section: VisionSection; session: SessionState }) {
  const feedback = normalizeFeedback(session.reviewFeedback[section.id]);
  const sources = section.sourceQuestionIds
    .map((questionId) => session.answers[questionId])
    .filter(Boolean)
    .slice(0, 3);
  const refinements = [
    feedback.feelsRight ? `What feels right: ${feedback.feelsRight}` : "",
    feedback.needsChange ? `What needs to change: ${feedback.needsChange}` : "",
    feedback.makeStronger ? `What should be stronger or clearer: ${feedback.makeStronger}` : "",
  ].filter(Boolean);

  return (
    <section className="rounded-lg oak-card p-5 shadow-ember">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-black text-bone">{section.title}</h2>
        <CompletenessMarker value={sectionCompleteness(section, session.answers)} />
      </div>
      <ul className="mt-4 space-y-3 text-base leading-7 text-ash">
        {section.body.map((line) => (
          <li key={line} className="border-l-2 border-gold pl-3">
            {line}
          </li>
        ))}
      </ul>
      {refinements.length > 0 && (
        <div className="mt-5 rounded-lg border border-gold/30 bg-gold/10 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Collaborative refinements</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-bone">
            {refinements.map((refinement) => (
              <li key={refinement}>{refinement}</li>
            ))}
          </ul>
        </div>
      )}
      {sources.length > 0 && (
        <div className="mt-5 rounded-lg oak-panel p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Source answer summary</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ash">
            {sources.map((source) => (
              <li key={source.questionId}>
                <span className="font-semibold text-bone">{source.questionText}</span>{" "}
                {source.originalAnswer || (source.skippedAt ? "Skipped for now" : "Needs follow-up")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ExportGroup({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`rounded-lg border border-gold/20 bg-coal/35 p-4 ${wide ? "xl:col-span-2" : ""}`}>
      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-gold">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function ExportBlock({
  title,
  description,
  text,
  copied,
  copy,
  download,
}: {
  title: string;
  description: string;
  text: string;
  copied: string;
  copy: () => void;
  download: () => void;
}) {
  const normalizedStatus = copied.toLowerCase();
  const normalizedTitle = title.toLowerCase();
  const isCopied =
    normalizedStatus.includes(normalizedTitle) ||
    (normalizedTitle.includes("source material") && normalizedStatus.includes("source material"));
  return (
    <section className="rounded-lg oak-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-bone">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-ash">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" onClick={copy}>
            Copy
          </button>
          <button className="secondary-button" onClick={download}>
            Download
          </button>
        </div>
      </div>
      {isCopied && <p className="mt-3 text-sm font-bold text-gold">{copied}</p>}
      <pre className="mt-4 max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-6 text-ash">
        {text}
      </pre>
    </section>
  );
}

export default App;
