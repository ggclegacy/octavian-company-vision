import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, flatQuestions } from "./data";
import { formatLastSaved, type ReviewFeedback, SessionState, useSession } from "./storage";
import {
  aiPromptText,
  bbqAppPromptText,
  beforeOctavianLeavesChecklist,
  brandIdentityPromptText,
  categoriesComplete,
  completenessSummary,
  finalVisionSections,
  finalVisionText,
  generateFirstVisionDraft,
  normalizeFeedback,
  organizedAnswersText,
  originalAnswersText,
  reviewFeedbackText,
  sectionCompleteness,
  sessionBackup,
  sessionStatus,
  websitePlanPromptText,
  type VisionSection,
} from "./vision";

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

function App() {
  const sessionApi = useSession();

  return (
    <div className="min-h-screen bg-coal text-bone">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(224,177,95,0.13),transparent_28%),linear-gradient(135deg,#0d0c0a,#171512_48%,#0d0c0a)]" />
      <Routes>
        <Route path="/" element={<StartPage {...sessionApi} />} />
        <Route path="/session" element={<SessionPage {...sessionApi} />} />
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
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <Link to="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Octavian Vision Builder
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="nav-link" to="/session">
            Answer
          </Link>
          <Link className="nav-link" to="/generate">
            Generate
          </Link>
          <Link className="nav-link" to="/review">
            Review
          </Link>
          <Link className="nav-link" to="/vision">
            Vision Hub
          </Link>
          <Link className="nav-link" to="/export">
            Export
          </Link>
          <Link className="nav-link" to="/present">
            Present
          </Link>
          <Link className="nav-link" to="/import">
            Import
          </Link>
          <span className="rounded-full border border-white/10 px-3 py-2 text-ash">
            Last saved: {formatLastSaved(session.lastSavedAt)}
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

function StartPage(props: SessionProps) {
  const steps = [
    "Answer naturally",
    "Generate the draft",
    "Review together",
    "Finalize the vision",
    "Export the plan",
  ];

  return (
    <Shell {...props}>
      <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-gold">Guided company vision session</p>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">Octavian Company Vision Builder</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-bone">
            A guided session to turn the food, the story, and the business vision into a real company blueprint.
          </p>
          <div className="mt-8 max-w-2xl space-y-5 text-lg leading-8 text-ash">
            <p>This is not a form to fill out alone.</p>
            <p>
              Octavian answers in his own words. The app keeps those answers safe, organizes them into a draft, and
              helps turn the conversation into a stronger direction for the barbecue company.
            </p>
            <p>
              Neil and Octavian review the draft together, sharpen what matters, and leave with a plan they can copy,
              export, and keep building from.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link className="primary-button" to="/session">
              Start Answer Session
            </Link>
            <p className="max-w-md text-sm leading-6 text-ash">
              You can speak the answers or type them. The original answers stay saved. The app only organizes the
              wording to help build the vision.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-soot/85 p-6 shadow-ember">
          <h2 className="text-2xl font-black text-white">How the session works</h2>
          <ol className="mt-5 space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold text-sm font-black text-gold">
                  {index + 1}
                </span>
                <span className="font-semibold text-bone">{step}</span>
              </li>
            ))}
          </ol>
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
  const total = flatQuestions.length;
  const index = Math.min(session.currentQuestionIndex, total - 1);
  const item = flatQuestions[index];
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
  const goTo = (nextIndex: number) => {
    save();
    setCurrentQuestionIndex(Math.max(0, Math.min(total - 1, nextIndex)));
  };
  const skip = () => {
    skipQuestion(item.id);
    setCurrentQuestionIndex(Math.max(0, Math.min(total - 1, index + 1)));
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
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-white/10 bg-soot/80 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Answer Session</p>
          <div className="mt-4 h-3 rounded-full bg-white/10" aria-label={`${progress}% complete`}>
            <div className="h-3 rounded-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-ash">
            Question {index + 1} of {total}. {answeredCount} answered. {skippedCount} skipped. {followUpCount} needs
            follow-up. {organizedCount} organized.
          </p>
          <Link className="secondary-button mt-5 w-full" to="/generate" onClick={save}>
            Generate Vision
          </Link>
          <div className="mt-6 space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  category.id === item.category.id
                    ? "border-gold bg-gold/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-ash"
                }`}
                onClick={() => {
                  const categoryIndex = flatQuestions.findIndex((question) => question.category.id === category.id);
                  goTo(categoryIndex);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </aside>

        <article className="rounded-lg border border-white/10 bg-soot/90 p-5 shadow-ember sm:p-8">
          <div className="mb-6 border-b border-white/10 pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">{item.category.name}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ash">{item.category.purpose}</p>
          </div>

          <p className="text-sm font-semibold text-ash">Question {index + 1}</p>
          <h2 className="mt-2 text-2xl font-bold leading-snug text-white sm:text-4xl">{item.text}</h2>
          <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm font-semibold text-bone">
            Answer in your own words. The original answer stays saved.
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
              <p className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-ash">
                Voice input is not supported in this browser. You can still type the answer.
              </p>
            )}
            <p className="mb-3 text-sm leading-6 text-ash">
              Voice works best in Chrome/Safari with microphone access allowed. If it does not work, type the answer
              instead.
            </p>
            <label className="text-sm font-semibold text-bone" htmlFor="original-answer">
              Original answer
            </label>
            <textarea
              id="original-answer"
              className="mt-2 min-h-52 w-full rounded-lg border border-white/10 bg-coal p-4 text-lg leading-7 text-white outline-none ring-gold/30 placeholder:text-iron focus:border-gold focus:ring-4"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Octavian's answer goes here, in his own words..."
            />
            <div className="mt-4 rounded-lg border border-white/10 bg-coal p-4">
              <p className="text-sm font-semibold text-gold">Organized answer for vision</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ash">
                {answer?.organizedAnswer || "Not organized yet. Original answer will be used until this is generated."}
              </p>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-bone">
              <input
                className="h-5 w-5 accent-[#e0b15f]"
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
                Organize Answer for Vision
              </button>
              <button className="secondary-button" onClick={skip}>
                Skip for Now
              </button>
            </div>
            <div className="flex gap-3">
              <button className="secondary-button" onClick={() => goTo(index - 1)} disabled={index === 0}>
                Back
              </button>
              <button className="secondary-button" onClick={() => goTo(index + 1)} disabled={index === total - 1}>
                Next
              </button>
            </div>
          </div>
        </article>
      </section>
    </Shell>
  );
}

function GeneratePage({ session, generateDraft, clearSession, answeredCount, skippedCount, followUpCount, organizedCount }: SessionProps) {
  const navigate = useNavigate();
  const missing = flatQuestions.filter((question) => {
    const answer = session.answers[question.id];
    return !answer?.originalAnswer.trim() || answer.skippedAt || answer.followUpNeeded;
  });
  const previewSections = session.generatedVisionDraft.length ? session.generatedVisionDraft : generateFirstVisionDraft(session.answers);
  const summary = completenessSummary(previewSections, session.answers);
  const completeCategories = categoriesComplete(session.answers);
  const categoriesWithAnswers = categories.filter((category) =>
    category.questions.some((question) => session.answers[question.id]?.originalAnswer.trim()),
  );

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
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-white/10 bg-soot/90 p-6 shadow-ember">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Generate draft</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Ready for the first vision draft</h1>
          <p className="mt-5 text-lg leading-8 text-ash">
            This draft is not final. It is the first blueprint we'll review together.
          </p>
          {!answeredCount && (
            <div className="mt-5 rounded-lg border border-white/10 bg-coal p-4">
              <p className="font-semibold text-bone">No answers are saved yet.</p>
              <p className="mt-2 text-sm leading-6 text-ash">
                Start with the answer session, save a few responses, then come back here to build the first draft.
              </p>
              <Link className="secondary-button mt-4" to="/session">
                Start Answer Session
              </Link>
            </div>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Original answers" value={`${answeredCount}/${flatQuestions.length}`} />
            <Metric label="Skipped" value={`${skippedCount}`} />
            <Metric label="Needs follow-up" value={`${followUpCount}`} />
            <Metric label="Organized answers" value={`${organizedCount}/${flatQuestions.length}`} />
            <Metric label="Categories complete" value={`${completeCategories}/${categories.length}`} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Strong foundation" value={`${summary["Strong foundation"]}`} />
            <Metric label="Needs follow-up" value={`${summary["Needs follow-up"]}`} />
            <Metric label="Missing key details" value={`${summary["Missing key details"]}`} />
          </div>
          <button className="primary-button mt-8" onClick={handleGenerate} disabled={!answeredCount}>
            Generate / Update Vision Draft
          </button>
        </section>

        <section className="rounded-lg border border-white/10 bg-soot/80 p-6">
          <h2 className="text-2xl font-bold text-white">Session readiness</h2>
          <div className="mt-4 rounded-lg border border-white/10 bg-coal p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Categories with answers</h3>
            <p className="mt-2 text-sm leading-6 text-ash">
              {categoriesWithAnswers.length
                ? categoriesWithAnswers.map((category) => category.name).join(", ")
                : "No categories have saved answers yet."}
            </p>
          </div>
          <h3 className="mt-5 text-xl font-bold text-white">Skipped / needs-follow-up / missing areas</h3>
          <div className="mt-4 max-h-[520px] overflow-auto space-y-3">
            {missing.length ? (
              missing.map((question) => {
                const answer = session.answers[question.id];
                const status = answer?.skippedAt ? "Skipped for now" : "Needs follow-up";
                return (
                  <div key={question.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{question.category.name}</p>
                    <p className="mt-1 text-sm leading-6 text-ash">{question.text}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-bone">{status}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-ash">All guided questions have original answers saved.</p>
            )}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function ReviewPage({ session, saveFeedback, finalizeVision, generateDraft, clearSession, answeredCount, skippedCount, followUpCount }: SessionProps) {
  const navigate = useNavigate();
  const sections = session.generatedVisionDraft.length ? session.generatedVisionDraft : generateFirstVisionDraft(session.answers);
  const summary = completenessSummary(sections, session.answers);

  const handleFinalize = () => {
    finalizeVision();
    navigate("/vision");
  };

  return (
    <Shell session={session} clearSession={clearSession}>
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
          <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Review the first vision draft</h1>
          <p className="mt-3 max-w-3xl text-ash">
            Use this space to sharpen the direction together. Add what feels right, what feels wrong, what needs to be
            stronger, or what should be changed.
          </p>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-bone">
            This is feedback on the company vision, not an edit to Octavian's original answers.
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
            Finalize Vision Hub
          </button>
        </div>
      </div>

      {!session.generatedVisionDraft.length && (
        <div className="mb-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
          <h2 className="text-xl font-black text-white">No vision draft has been generated yet.</h2>
          <p className="mt-2 text-sm leading-6 text-bone">
            Generate the first draft, then come back here to review the company vision together.
          </p>
          <Link className="secondary-button mt-4" to="/generate">
            Go to Generate
          </Link>
        </div>
      )}

      <div className="grid gap-5">
        {sections.map((section) => (
          <ReviewSection
            key={section.id}
            section={section}
            session={session}
            value={normalizeFeedback(session.reviewFeedback[section.id])}
            onSave={(feedback) => saveFeedback(section.id, feedback)}
          />
        ))}
      </div>
    </Shell>
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
  useEffect(() => setFeedback(value), [value]);

  const sources = section.sourceQuestionIds
    .map((questionId) => session.answers[questionId])
    .filter(Boolean);
  const marker = sectionCompleteness(section, session.answers);

  return (
    <section className="rounded-lg border border-white/10 bg-soot/85 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white">{section.title}</h2>
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
                <div key={source.questionId} className="rounded-md border border-white/10 bg-coal p-3">
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
      <button className="secondary-button mt-3" onClick={() => onSave(feedback)}>
        Save Feedback
      </button>
    </section>
  );
}

function VisionPage({ session, clearSession, generateDraft, answeredCount, skippedCount, followUpCount }: SessionProps) {
  const sections = finalVisionSections(session);
  const summary = completenessSummary(sections, session.answers);
  const completeCategories = categoriesComplete(session.answers);

  return (
    <Shell session={session} clearSession={clearSession}>
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Session-Based Draft</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Octavian BBQ Company Vision</h1>
          <p className="mt-3 text-ash">
            {answeredCount} of {flatQuestions.length} original answers saved. Last saved:{" "}
            {formatLastSaved(session.lastSavedAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="secondary-button" to="/review">
            Return to Review
          </Link>
          <Link className="secondary-button" to="/present">
            Presentation Mode
          </Link>
          <Link className="primary-button" to="/export">
            Export Vision
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <Metric label="Questions answered" value={`${answeredCount}/${flatQuestions.length}`} />
        <Metric label="Skipped" value={`${skippedCount}`} />
        <Metric label="Follow-up flags" value={`${followUpCount}`} />
        <Metric label="Categories complete" value={`${completeCategories}/${categories.length}`} />
        <Metric label="Strong foundation" value={`${summary["Strong foundation"]}`} />
        <Metric label="Partial sections" value={`${summary["Needs follow-up"]}`} />
        <Metric label="Needs follow-up sections" value={`${summary["Missing key details"]}`} />
      </div>

      <BeforeLeavesChecklist />

      {!answeredCount && (
        <div className="mb-6 rounded-lg border border-white/10 bg-soot/85 p-5">
          <h2 className="text-xl font-black text-white">No saved answers yet.</h2>
          <p className="mt-2 text-sm leading-6 text-ash">
            Start the answer session first. Once Octavian saves answers, this page becomes the company vision hub.
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
    </Shell>
  );
}

function ExportPage({ session, clearSession, importSession, generateDraft, answeredCount, skippedCount, followUpCount }: SessionProps) {
  const original = useMemo(() => originalAnswersText(session), [session]);
  const organized = useMemo(() => organizedAnswersText(session), [session]);
  const feedback = useMemo(() => reviewFeedbackText(session), [session]);
  const finalVision = useMemo(() => finalVisionText(session), [session]);
  const prompt = useMemo(() => aiPromptText(session), [session]);
  const websitePrompt = useMemo(() => websitePlanPromptText(session), [session]);
  const brandPrompt = useMemo(() => brandIdentityPromptText(session), [session]);
  const appPrompt = useMemo(() => bbqAppPromptText(session), [session]);
  const sections = finalVisionSections(session);
  const summary = completenessSummary(sections, session.answers);
  const [copied, setCopied] = useState("");

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${label} copied.`);
    } catch {
      setCopied(`Could not copy ${label}. Select the text below and copy it manually.`);
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
  };

  const fullSession = JSON.stringify({ ...session, exportedAt: new Date().toISOString(), categories }, null, 2);
  const backup = JSON.stringify({ ...sessionBackup(session), exportedAt: new Date().toISOString() }, null, 2);

  return (
    <Shell session={session} clearSession={clearSession}>
      <SessionControlCenter
        session={session}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        followUpCount={followUpCount}
        generateDraft={generateDraft}
      />
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Session package</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Export / Copy</h1>
        <p className="mt-3 text-sm font-semibold text-bone">
          Completeness: {summary["Strong foundation"]} strong foundation, {summary["Needs follow-up"]} needs follow-up,{" "}
          {summary["Missing key details"]} missing key details.
        </p>
        {copied && <p className="mt-3 text-sm font-semibold text-gold">{copied}</p>}
      </div>

      <div className="mb-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
        <h2 className="text-xl font-black text-white">Session Backup</h2>
        <p className="mt-2 text-sm leading-6 text-bone">Use this as a backup before clearing or moving devices.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="primary-button"
            onClick={() => download("octavian-full-session-backup.json", backup, "application/json")}
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
        <div className="mb-6 rounded-lg border border-white/10 bg-soot/85 p-5">
          <h2 className="text-xl font-black text-white">Nothing to export yet.</h2>
          <p className="mt-2 text-sm leading-6 text-ash">
            Save at least one answer first, then come back here for copy-ready outputs and backups.
          </p>
          <Link className="secondary-button mt-4" to="/session">
            Start Answer Session
          </Link>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <ExportBlock title="Original Answers" text={original} copy={() => copy("Original answers", original)} download={() => download("octavian-original-answers.txt", original)} />
        <ExportBlock title="Organized Answers" text={organized} copy={() => copy("Organized answers", organized)} download={() => download("octavian-organized-answers.txt", organized)} />
        <ExportBlock title="Collaborative Review Feedback" text={feedback} copy={() => copy("Review feedback", feedback)} download={() => download("octavian-review-feedback.txt", feedback)} />
        <ExportBlock title="Final Company Vision" text={finalVision} copy={() => copy("Final vision", finalVision)} download={() => download("octavian-final-company-vision.txt", finalVision)} />
        <ExportBlock title="AI Prompt for Polished Vision Document" text={prompt} copy={() => copy("AI vision prompt", prompt)} download={() => download("octavian-ai-vision-prompt.txt", prompt)} wide />
        <ExportBlock title="AI Prompt for Website Plan" text={websitePrompt} copy={() => copy("Website prompt", websitePrompt)} download={() => download("octavian-website-plan-prompt.txt", websitePrompt)} />
        <ExportBlock title="AI Prompt for Brand Naming / Identity" text={brandPrompt} copy={() => copy("Brand identity prompt", brandPrompt)} download={() => download("octavian-brand-identity-prompt.txt", brandPrompt)} />
        <ExportBlock title="AI Prompt for Future Personal BBQ App" text={appPrompt} copy={() => copy("BBQ app prompt", appPrompt)} download={() => download("octavian-bbq-app-prompt.txt", appPrompt)} />
        <ExportBlock title="Full Session JSON" text={fullSession} copy={() => copy("Full session JSON", fullSession)} download={() => download("octavian-full-session.json", fullSession, "application/json")} wide />
        <ExportBlock title="Full Session Backup JSON" text={backup} copy={() => copy("Full session backup", backup)} download={() => download("octavian-full-session-backup.json", backup, "application/json")} wide />
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
      <section className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-soot/90 p-6 shadow-ember">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Safety tool</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Import Session Backup</h1>
        <p className="mt-4 text-base leading-7 text-ash">
          Use this if Neil needs to move devices or restore a saved session JSON. Importing replaces the current local
          saved session after confirmation.
        </p>
        <label className="mt-6 block text-sm font-semibold text-bone" htmlFor="backup-file">
          Session backup .json
        </label>
        <input
          id="backup-file"
          className="mt-2 w-full rounded-lg border border-white/10 bg-coal p-4 text-bone file:mr-4 file:rounded-md file:border-0 file:bg-gold file:px-4 file:py-2 file:font-bold file:text-coal"
          type="file"
          accept="application/json,.json"
          onChange={(event) => handleImport(event.target.files?.[0] || null)}
        />
        {message && <p className="mt-4 rounded-lg border border-white/10 bg-coal p-4 text-sm font-semibold text-bone">{message}</p>}
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
    <section className="mb-6 rounded-lg border border-white/10 bg-soot/80 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-2 text-sm text-ash sm:grid-cols-2 lg:grid-cols-5">
          <p>
            <span className="font-bold text-bone">Status:</span> {sessionStatus(session)}
          </p>
          <p>
            <span className="font-bold text-bone">Last saved:</span> {formatLastSaved(session.lastSavedAt)}
          </p>
          <p>
            <span className="font-bold text-bone">Answered:</span> {answeredCount}/{flatQuestions.length}
          </p>
          <p>
            <span className="font-bold text-bone">Categories:</span> {completeCategories}/{categories.length}
          </p>
          <p>
            <span className="font-bold text-bone">Needs follow-up:</span> {followUpCount + skippedCount}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="secondary-button" to="/session">
            Continue Answer Session
          </Link>
          <button className="secondary-button" onClick={updateDraft}>
            Generate / Update Vision Draft
          </button>
          <Link className="secondary-button" to="/review">
            Review Together
          </Link>
          <Link className="secondary-button" to="/vision">
            Final Vision Hub
          </Link>
          <Link className="primary-button" to="/export">
            Export Session
          </Link>
        </div>
      </div>
    </section>
  );
}

function BeforeLeavesChecklist() {
  return (
    <section className="my-6 rounded-lg border border-gold/30 bg-gold/10 p-5">
      <h2 className="text-xl font-black text-white">Before Octavian Leaves</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {beforeOctavianLeavesChecklist().map((item) => (
          <label key={item} className="flex items-start gap-3 text-sm font-semibold leading-6 text-bone">
            <input className="mt-1 h-5 w-5 accent-[#e0b15f]" type="checkbox" />
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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-8 py-8 text-bone">
      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-gold">Presentation Mode</p>
          <h1 className="mt-2 text-5xl font-black text-white">Octavian BBQ Company Vision</h1>
          <p className="mt-3 text-xl text-ash">
            {summary["Strong foundation"]} strong foundation, {summary["Needs follow-up"]} needs follow-up,{" "}
            {summary["Missing key details"]} missing key details.
          </p>
        </div>
        <Link className="secondary-button" to="/vision">
          Exit Presentation
        </Link>
      </div>
      <div className="grid gap-6">
        {sections.map((section) => (
          <section key={section.id} className="rounded-lg border border-white/10 bg-soot/90 p-7 shadow-ember">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl font-black text-white">{section.title}</h2>
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
    <div className="rounded-lg border border-white/10 bg-coal p-4">
      <p className="text-sm font-semibold text-ash">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function CompletenessMarker({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-black uppercase tracking-[0.1em] text-bone">
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
        className="mt-2 min-h-32 w-full rounded-lg border border-white/10 bg-coal p-4 text-base leading-7 text-white outline-none ring-gold/30 placeholder:text-iron focus:border-gold focus:ring-4"
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
    <section className="rounded-lg border border-white/10 bg-soot/85 p-5 shadow-ember">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-black text-white">{section.title}</h2>
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
        <div className="mt-5 rounded-lg border border-white/10 bg-coal p-4">
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

function ExportBlock({
  title,
  text,
  copy,
  download,
  wide = false,
}: {
  title: string;
  text: string;
  copy: () => void;
  download: () => void;
  wide?: boolean;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-soot/85 p-5 ${wide ? "xl:col-span-2" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" onClick={copy}>
            Copy
          </button>
          <button className="secondary-button" onClick={download}>
            Download
          </button>
        </div>
      </div>
      <pre className="mt-4 max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg bg-coal p-4 text-sm leading-6 text-ash">
        {text}
      </pre>
    </section>
  );
}

export default App;
