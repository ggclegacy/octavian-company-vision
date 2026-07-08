import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};
type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SessionProps = ReturnType<typeof useSession>;

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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(27,45,36,0.72),transparent_34%),radial-gradient(circle_at_50%_105%,rgba(122,36,24,0.32),transparent_32%),radial-gradient(circle_at_8%_8%,rgba(214,164,58,0.1),transparent_24%),linear-gradient(180deg,#0E0D0B_0%,#12110E_42%,#0E0D0B_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.44)_78%),linear-gradient(90deg,rgba(240,228,208,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(240,228,208,0.018)_1px,transparent_1px)] bg-[length:auto,72px_72px,72px_72px]" />
      <Routes>
        <Route path="/" element={<StartPage {...sessionApi} />} />
        <Route path="/session" element={<SessionPage {...sessionApi} />} />
        <Route path="/review-answers" element={<ReviewAnswersPage {...sessionApi} />} />
        <Route path="/complete" element={<CompletePage {...sessionApi} />} />
        <Route path="/generate" element={<GeneratePage {...sessionApi} />} />
        <Route path="/review" element={<ReviewPage {...sessionApi} />} />
        <Route path="/vision" element={<VisionPage {...sessionApi} />} />
        <Route path="/present" element={<PresentPage {...sessionApi} />} />
        <Route path="/export" element={<ExportPage {...sessionApi} />} />
        <Route path="/import" element={<ImportPage {...sessionApi} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function Shell({
  children,
  session,
  clearSession,
}: {
  children: React.ReactNode;
  session: SessionState;
  clearSession: () => void;
}) {
  const handleClear = () => {
    if (window.confirm("This will erase the saved vision session from this device. Continue?")) {
      clearSession();
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 border-b border-gold/20 pb-5 xl:flex-row xl:items-center xl:justify-between">
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
          <Link className="nav-link" to="/complete">
            Complete
          </Link>
          <span className="mx-1 hidden h-8 border-l border-gold/20 sm:block" />
          <span className="rounded-full border border-gold/20 bg-soot/50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-gold">
            Neil Planning Tools
          </span>
          <Link className="nav-link" to="/generate">
            Generate
          </Link>
          <Link className="nav-link" to="/review">
            Draft Review
          </Link>
          <Link className="nav-link" to="/vision">
            Planning Brief
          </Link>
          <Link className="nav-link" to="/export">
            Export
          </Link>
          <span className="rounded-full border border-gold/20 bg-soot/60 px-3 py-2 font-semibold text-bone">
            Stage: {sessionStatus(session)}
          </span>
          <span className="rounded-full border border-gold/20 bg-coal/35 px-3 py-2 text-ash">
            Last saved: {formatLastSaved(session.lastSavedAt)}
          </span>
          <span className="rounded-full border border-gold/20 bg-coal/35 px-3 py-2 text-ash">
            Saved on this device
          </span>
          <button className="quiet-button" onClick={handleClear}>
            Clear Session
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

function StartPage(props: SessionProps) {
  const steps = [
    "Answer the Oakfire business questions.",
    "Answer the future personal OS questions.",
    "Review your answers.",
    "Submit when finished.",
    "Neil uses your answers to build the Oakfire Planning Brief and future Eighth Flame app foundation.",
  ];

  return (
    <Shell {...props}>
      <section className="flex flex-1 flex-col justify-center">
        <HeroLogoEmblem />
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-gold">Oakfire by Octavian remote intake</p>
          <h1 className="text-4xl font-black leading-tight text-bone sm:text-6xl">Oakfire Vision Intake & Planning</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-bone">
            A guided intake to help turn your barbecue vision into a real brand and future personal OS.
          </p>
          <div className="mt-8 max-w-2xl space-y-5 text-lg leading-8 text-ash">
            <p className="text-bone">Octavian, this is the starting point.</p>
            <p>
              You supported me early when Groomed Gent Co. was still just an idea, and now I want to take everything
              I've learned from building my brand, websites, systems, and AI tools and use it to help you build out the
              vision for Oakfire.
            </p>
            <p>This intake has two parts.</p>
            <p>
              Part 1 is about Oakfire - the food, the story, the brand, catering, content, website, and what you want
              the business to become.
            </p>
            <p>
              Part 2 is about Eighth Flame - the future personal OS app I may build for you. That app can support your
              business, goals, lifestyle, finances, health, content, cannabis strain notes, real estate work if that
              still matters, and your AI concierge Orion.
            </p>
            <p>
              No need to overthink it. Just answer honestly in your own words. The better your answers are, the better
              I can build the plan around you.
            </p>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="oak-panel p-4">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Part 1: Oakfire Vision</h2>
              <p className="mt-2 text-sm leading-6 text-ash">
                Capture the story, food identity, business direction, website needs, catering goals, content strategy,
                and Oakfire roadmap.
              </p>
            </div>
            <div className="oak-panel p-4">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-gold">Part 2: Future Personal OS</h2>
              <p className="mt-2 text-sm leading-6 text-ash">
                Capture business tools, lifestyle support, finance tracking, health goals, cannabis strain library,
                real estate support, AI concierge ideas, and weekly planning.
              </p>
            </div>
          </div>
          <div className="mt-5 max-w-2xl rounded-lg border border-gold/20 bg-soot/70 p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-gold">What this session creates</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-bone sm:grid-cols-2">
              <p>Oakfire Planning Brief</p>
              <p>Brand and business direction</p>
              <p>Future Personal OS Blueprint</p>
              <p>Build prompts for the next app</p>
              <p>Session backup</p>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link className="primary-button" to="/session">
              Start Intake
            </Link>
            <p className="max-w-md text-sm leading-6 text-ash">
              Your answers save on this device as you go. You can type or use voice input if your browser supports it.
            </p>
          </div>
          </div>

          <div className="oak-card p-6">
          <h2 className="text-2xl font-black text-bone">How this works</h2>
          <ol className="mt-5 space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-md border border-gold/15 bg-coal/35 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold bg-gold/10 text-sm font-black text-gold">
                  {index + 1}
                </span>
                <span className="font-semibold text-bone">{step}</span>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function SessionPage({
  session,
  saveOriginalAnswer,
  organizeAnswer,
  setCurrentQuestionIndex,
  generateDraft,
  skipQuestion,
  setFollowUpNeeded,
  clearSession,
  answeredCount,
  skippedCount,
  followUpCount,
  organizedCount,
}: SessionProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPart = searchParams.get("part") === "eighth-flame" ? "eighth-flame" : "oakfire";
  const [activeIntake, setActiveIntake] = useState<"oakfire" | "eighth-flame">(initialPart);
  const [showPartIntro, setShowPartIntro] = useState(() => !searchParams.get("q"));
  const activeQuestions = activeIntake === "oakfire" ? flatQuestions : flatPersonalOsQuestions;
  const activeCategories = activeIntake === "oakfire" ? categories : personalOsCategories;
  const activeLabel = activeIntake === "oakfire" ? "Part 1: Oakfire Vision" : "Part 2: Eighth Flame OS";
  const activeIntro =
    activeIntake === "oakfire"
      ? {
          title: "Oakfire Vision Intake",
          body: "This section is about your barbecue company: the story, food, brand, website, catering, content, and where you want Oakfire to go.",
        }
      : {
          title: "Eighth Flame Personal OS Intake",
          body: "This section is about the future app Neil may build for you. It is bigger than Oakfire. It can support your business, lifestyle, finances, health, goals, content, cannabis strain notes, real estate work if relevant, and your AI concierge Orion.",
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
  const [voiceStatus, setVoiceStatus] = useState("Voice ready.");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const SpeechRecognitionApi = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const progress = Math.round(((index + 1) / total) * 100);

  useEffect(() => {
    setDraft(session.answers[item.id]?.originalAnswer ?? "");
    setFollowUpChecked(Boolean(session.answers[item.id]?.followUpNeeded));
    setVoiceStatus("Voice ready.");
  }, [item.id, session.answers]);

  const save = () => saveOriginalAnswer(item.id, draft);
  const organize = () => {
    saveOriginalAnswer(item.id, draft);
    organizeAnswer(item.id, draft);
  };
  const switchIntake = (nextIntake: "oakfire" | "eighth-flame", intro = true) => {
    setActiveIntake(nextIntake);
    setShowPartIntro(intro);
    setCurrentQuestionIndex(0);
    setSearchParams({ part: nextIntake });
  };
  const goTo = (nextIndex: number) => {
    save();
    const safeIndex = Math.max(0, Math.min(total - 1, nextIndex));
    setCurrentQuestionIndex(safeIndex);
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
    else navigate("/review-answers");
  };
  const skip = () => {
    skipQuestion(item.id);
    if (index < total - 1) {
      const nextIndex = Math.max(0, Math.min(total - 1, index + 1));
      setCurrentQuestionIndex(nextIndex);
      setSearchParams({ part: activeIntake, q: String(nextIndex) });
    } else if (activeIntake === "oakfire") {
      switchIntake("eighth-flame", true);
    } else {
      navigate("/review-answers");
    }
  };

  const startRecording = () => {
    if (!SpeechRecognitionApi) return;
    const recognition = new SpeechRecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (transcript) setDraft((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => {
      setIsRecording(false);
      setVoiceStatus("Recording stopped. Review your answer before saving.");
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceStatus("Microphone permission was blocked.");
      } else if (event.error === "no-speech") {
        setVoiceStatus("No speech detected. Try again or type the answer.");
      } else {
        setVoiceStatus("Voice capture stopped. You can try again or type the answer.");
      }
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setVoiceStatus("Listening... speak naturally.");
    } catch {
      setVoiceStatus("Voice capture stopped. You can try again or type the answer.");
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setVoiceStatus("Recording stopped. Review your answer before saving.");
  };

  return (
    <Shell session={session} clearSession={clearSession}>
      <section className="mb-6 rounded-lg border border-gold/20 bg-soot/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-gold">Self-guided intake</p>
            <p className="mt-2 text-sm leading-6 text-ash">
              Your answers are saved on this device. Last saved: {formatLastSaved(session.lastSavedAt)}. If voice input
              does not work, typing still works.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="secondary-button" to="/review-answers">
              Review Answers
            </Link>
            <Link className="secondary-button" to="/export">
              Backup / Export
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg oak-card p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Answer Session</p>
          <div className="mt-4 grid gap-2">
            <button
              className={activeIntake === "oakfire" ? "primary-button w-full" : "secondary-button w-full"}
              onClick={() => {
                switchIntake("oakfire");
              }}
            >
              Part 1: Oakfire
            </button>
            <button
              className={activeIntake === "eighth-flame" ? "primary-button w-full" : "secondary-button w-full"}
              onClick={() => {
                switchIntake("eighth-flame");
              }}
            >
              Part 2: Eighth Flame
            </button>
          </div>
          <div className="mt-4 h-3 rounded-full bg-white/10" aria-label={`${progress}% complete`}>
            <div className="h-3 rounded-full bg-gradient-to-r from-gold to-[#E8C56D]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-ash">
            {activeLabel}. Question {index + 1} of {total}. {answeredInQuestions(activeQuestions.map((question) => question.id), session)} answered.{" "}
            {skippedInQuestions(activeQuestions.map((question) => question.id), session)} skipped.{" "}
            {followUpInQuestions(activeQuestions.map((question) => question.id), session)} needs follow-up.
          </p>
          <Link className="secondary-button mt-5 w-full" to="/review-answers" onClick={save}>
            Review Answers
          </Link>
          <div className="mt-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Category overview</p>
            {activeCategories.map((category) => {
              const progress = categoryProgress(category, session);
              return (
                <button
                  key={category.id}
                  className={`w-full rounded-md border px-3 py-3 text-left text-sm ${
                    category.id === item.category.id
                      ? "border-gold bg-gold/15 text-bone"
                      : "border-gold/15 bg-coal/35 text-ash hover:border-gold/45 hover:text-bone"
                  }`}
                  onClick={() => {
                    const categoryIndex = activeQuestions.findIndex((question) => question.category.id === category.id);
                    goTo(categoryIndex);
                  }}
                >
                  <span className="block font-bold">{category.name}</span>
                  <span className="mt-1 block text-xs">
                    {progress.status} - {progress.answered}/{progress.total} answered
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="rounded-lg oak-card p-5 shadow-ember sm:p-8">
          {showPartIntro ? (
            <div className="grid min-h-[520px] place-items-center">
              <div className="max-w-2xl text-center">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-gold">{activeLabel}</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-bone sm:text-5xl">{activeIntro.title}</h2>
                <p className="mt-5 text-lg leading-8 text-ash">{activeIntro.body}</p>
                <p className="mt-5 rounded-lg border border-gold/15 bg-coal/35 p-4 text-sm font-semibold leading-6 text-bone">
                  Answer in your own words. You can leave blanks, skip for now, or mark anything that needs follow-up.
                </p>
                <button
                  className="primary-button mt-7"
                  onClick={() => {
                    setShowPartIntro(false);
                    setSearchParams({ part: activeIntake, q: String(index) });
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <>
          <div className="mb-6 border-b border-gold/15 pb-5">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gold">{activeLabel}</p>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">{item.category.name}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ash">{item.category.purpose}</p>
          </div>

          <p className="text-sm font-semibold text-ash">Question {index + 1}</p>
          <h2 className="mt-2 text-2xl font-bold leading-snug text-bone sm:text-4xl">{item.text}</h2>
          <p className="mt-4 rounded-lg border border-gold/15 bg-coal/35 p-3 text-sm font-semibold text-bone">
            Answer naturally. This is about capturing the truth first. Your original answer stays saved.
          </p>
          <div className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-4">
            <p className="text-sm font-semibold text-gold">Why this matters</p>
            <p className="mt-1 text-base leading-7 text-bone">{item.why}</p>
          </div>

          <div className="mt-6">
            {SpeechRecognitionApi ? (
              <div className="mb-3 flex flex-wrap gap-3">
                <button className="secondary-button" onClick={startRecording} disabled={isRecording}>
                  Start Recording
                </button>
                <button className="secondary-button" onClick={stopRecording} disabled={!isRecording}>
                  Stop Recording
                </button>
                <span className="self-center text-sm font-semibold text-ash">{voiceStatus}</span>
              </div>
            ) : (
              <p className="mb-3 rounded-lg border border-gold/15 bg-smoke/70 p-3 text-sm text-ash">
                Voice input is not supported in this browser. You can still type the answer.
              </p>
            )}
            <p className="mb-3 text-sm leading-6 text-ash">
              Voice works best in Chrome/Safari with microphone access allowed. If it does not work, type the answer
              instead.
            </p>
            <p className="mb-3 rounded-lg border border-gold/15 bg-coal/35 p-3 text-sm font-semibold text-bone">
              Your original answer stays saved. Organized answers only help build the planning brief.
            </p>
            <label className="text-sm font-semibold text-bone" htmlFor="original-answer">
              Original answer
            </label>
            <textarea
              id="original-answer"
              className="mt-2 min-h-[18rem] w-full rounded-lg oak-panel p-4 text-lg leading-8 text-bone outline-none ring-gold/30 placeholder:text-iron focus:border-gold focus:ring-4"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Octavian's answer goes here, in his own words..."
            />
            <div className="mt-4 rounded-lg oak-panel p-4">
              <p className="text-sm font-semibold text-gold">Prepared answer for planning brief</p>
              <p className="mt-1 text-xs leading-5 text-ash">
                This does not replace your original answer. It only helps Neil organize the planning brief.
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ash">
                {answer?.organizedAnswer || "Not prepared yet. Prepared answers help create the planning brief and future app build source material."}
              </p>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-lg border border-gold/15 bg-coal/35 p-4 text-sm font-semibold text-bone">
              <input
                className="h-5 w-5 accent-[#D6A43A]"
                type="checkbox"
                checked={followUpChecked}
                onChange={(event) => {
                  setFollowUpChecked(event.target.checked);
                  setFollowUpNeeded(item.id, event.target.checked);
                }}
              />
              Needs follow-up
              <span className="font-normal text-ash">Mark this when the answer is partial or worth coming back to.</span>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="primary-button" onClick={save}>
                Save Answer
              </button>
            <button className="secondary-button" onClick={organize}>
                Prepare Answer for Planning Brief
              </button>
              <button className="quiet-button" onClick={skip}>
                Skip for Now
              </button>
            </div>
            <div className="flex gap-3">
              <button className="secondary-button" onClick={() => goTo(index - 1)} disabled={index === 0}>
                Back
              </button>
              <button className="secondary-button" onClick={continueFlow}>
                {index === total - 1 ? (activeIntake === "oakfire" ? "Start Part 2" : "Review Answers") : "Continue"}
              </button>
            </div>
          </div>
          </>
          )}
        </article>
      </section>
    </Shell>
  );
}

function ReviewAnswersPage({ session, clearSession, completeIntake }: SessionProps) {
  const navigate = useNavigate();
  const oakfireSkipped = skippedInQuestions(flatQuestions.map((question) => question.id), session);
  const personalSkipped = skippedInQuestions(flatPersonalOsQuestions.map((question) => question.id), session);
  const oakfireFollowUp = followUpInQuestions(flatQuestions.map((question) => question.id), session);
  const personalFollowUp = followUpInQuestions(flatPersonalOsQuestions.map((question) => question.id), session);

  const submit = () => {
    completeIntake();
    navigate("/complete");
  };

  return (
    <Shell session={session} clearSession={clearSession}>
      <section className="mb-7 rounded-lg oak-card p-6 shadow-ember">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Review answers</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Review your answers before finishing.</h1>
        <p className="mt-3 max-w-3xl text-ash">
          You can leave blanks if you are not sure yet. Your answers are saved on this device, and you can come back to
          edit anything before or after submitting.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric label="Oakfire answered" value={`${answeredInQuestions(flatQuestions.map((question) => question.id), session)}/${flatQuestions.length}`} />
          <Metric label="Eighth Flame answered" value={`${answeredInQuestions(flatPersonalOsQuestions.map((question) => question.id), session)}/${flatPersonalOsQuestions.length}`} />
          <Metric label="Skipped" value={`${oakfireSkipped + personalSkipped}`} />
          <Metric label="Needs follow-up" value={`${oakfireFollowUp + personalFollowUp}`} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="secondary-button" to="/session">
            Continue Intake
          </Link>
          <button className="primary-button" onClick={submit}>
            Submit / Finish
          </button>
        </div>
      </section>

      <AnswerReviewGroup title="Part 1: Oakfire Answers" part="oakfire" categoriesToShow={categories} session={session} />
      <AnswerReviewGroup title="Part 2: Eighth Flame Answers" part="eighth-flame" categoriesToShow={personalOsCategories} session={session} />
    </Shell>
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
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-gold">{title}</h2>
      <div className="grid gap-4">
        {categoriesToShow.map((category) => (
          <div key={category.id} className="rounded-lg oak-card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-bone">{category.name}</h3>
                <p className="mt-1 text-sm leading-6 text-ash">{category.purpose}</p>
              </div>
              <p className="text-sm font-semibold text-gold">
                {answeredInQuestions(category.questions.map((question) => question.id), session)}/{category.questions.length} answered
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {category.questions.map((question) => {
                const answer = session.answers[question.id];
                const questionIndex = partQuestions.findIndex((item) => item.id === question.id);
                const status = answer?.skippedAt
                  ? "Skipped for now"
                  : answer?.followUpNeeded
                    ? "Needs follow-up"
                    : answer?.originalAnswer.trim()
                      ? "Answered"
                      : "Blank";
                return (
                  <div key={question.id} className="rounded-md border border-gold/15 bg-coal/35 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-bone">{question.text}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ash">
                          {answer?.originalAnswer.trim() || "No answer saved yet."}
                        </p>
                        {answer?.organizedAnswer.trim() && (
                          <p className="mt-2 text-xs leading-5 text-ash">Prepared for planning: {answer.organizedAnswer}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span className="rounded-full border border-gold/20 bg-soot/70 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-gold">
                          {status}
                        </span>
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

function CompletePage({ session, clearSession }: SessionProps) {
  const [message, setMessage] = useState("");
  const backup = useMemo(() => JSON.stringify({ ...sessionBackup(session), exportedAt: new Date().toISOString() }, null, 2), [session]);
  const sourceMaterial = useMemo(() => sourceMaterialForFuturePersonalOSText(session), [session]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sourceMaterial);
      setMessage("Copied source material for Neil.");
    } catch {
      setMessage("Could not copy automatically. Use the export page to copy manually.");
    }
  };

  const download = (filename: string, content: string, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Downloaded ${filename}.`);
  };

  return (
    <Shell session={session} clearSession={clearSession}>
      <section className="mx-auto max-w-4xl rounded-lg oak-card p-6 shadow-ember sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Intake complete</p>
        <h1 className="mt-2 text-3xl font-black text-bone sm:text-5xl">Your intake is complete.</h1>
        <div className="mt-5 space-y-4 text-lg leading-8 text-ash">
          <p>Appreciate you filling this out.</p>
          <p>
            Your answers are saved, and Neil can use them to build your Oakfire Planning Brief and the source material
            for Eighth Flame, your future personal OS guided by Orion.
          </p>
          <p>You do not need to do anything else right now unless Neil asks for follow-up details.</p>
        </div>
        <p className="mt-5 rounded-lg border border-gold/20 bg-coal/35 p-4 text-sm font-semibold leading-6 text-bone">
          Your answers are saved on this device. If Neil needs a copy, use the download/export option or send him the
          completed session link/file. This app does not automatically send anything to Neil.
        </p>
        <p className="mt-3 text-sm text-ash">
          Completed: {formatLastSaved(session.completedAt)}. Last saved: {formatLastSaved(session.lastSavedAt)}.
        </p>
        {message && <p className="mt-4 text-sm font-semibold text-gold">{message}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="primary-button" to="/review-answers">
            Review My Answers
          </Link>
          <button className="secondary-button" onClick={() => download("octavian-full-intake-backup.json", backup, "application/json")}>
            Download Full Intake Backup
          </button>
          <button className="secondary-button" onClick={copy}>
            Copy Source Material for Neil
          </button>
          <Link className="secondary-button" to="/export">
            Export Tools
          </Link>
        </div>
      </section>
    </Shell>
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
    navigate("/review");
  };

  return (
    <Shell session={session} clearSession={clearSession}>
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
                Start Answer Session
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
    navigate("/vision");
  };

  return (
    <Shell session={session} clearSession={clearSession}>
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
          <Link className="secondary-button" to="/present">
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
          <Link className="secondary-button mt-4" to="/generate">
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
    <section className="rounded-lg oak-card p-5">
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
    <Shell session={session} clearSession={clearSession}>
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
          <Link className="secondary-button" to="/review">
            Return to Review
          </Link>
          <Link className="secondary-button" to="/present">
            Presentation Mode
          </Link>
          <Link className="primary-button" to="/export">
            Export Planning Brief
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <Metric label="Questions answered" value={`${answeredCount}/${totalQuestionCount()}`} />
        <Metric label="Session stage" value={sessionStatus(session)} />
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
          <Link className="secondary-button mt-4" to="/session">
            Start Answer Session
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
    <Shell session={session} clearSession={clearSession}>
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
          <Link className="secondary-button" to="/import">
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
          <Link className="secondary-button mt-4" to="/session">
            Start Answer Session
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
        navigate(parsed.finalizedVision?.length || parsed.generatedVisionDraft?.length ? "/vision" : "/session");
      } catch {
        setMessage("Could not read that JSON backup file.");
      }
    };
    reader.onerror = () => setMessage("Could not read that backup file.");
    reader.readAsText(file);
  };

  return (
    <Shell session={session} clearSession={clearSession}>
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
    navigate("/review");
  };

  return (
    <section className="mb-6 rounded-lg oak-card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-2 text-sm text-ash sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <p>
            <span className="font-bold text-bone">Session stage:</span> {sessionStatus(session)}
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
            Continue Answer Session
          </Link>
          <button className="secondary-button" onClick={updateDraft}>
            Generate / Update Planning Draft
          </button>
          <Link className="secondary-button" to="/review">
            Review Together
          </Link>
          <Link className="secondary-button" to="/vision">
            Planning Brief
          </Link>
          <Link className="primary-button" to="/export">
            Export Session
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
        <Link className="secondary-button" to="/vision">
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
      <pre className="mt-4 max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg bg-smoke p-4 text-sm leading-6 text-ash">
        {text}
      </pre>
    </section>
  );
}

export default App;
