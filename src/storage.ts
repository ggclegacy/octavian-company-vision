import { useCallback, useEffect, useMemo, useState } from "react";
import { allQuestions } from "./data";
import {
  buildFinalizedVision,
  generateFirstVisionDraft,
  normalizeFeedback,
  organizeAnswerText,
  type VisionSection,
} from "./vision";

const STORAGE_KEY = "octavian-company-vision-session";

export type AnswerRecord = {
  questionId: string;
  categoryId: string;
  questionText: string;
  originalAnswer: string;
  organizedAnswer: string;
  answeredAt: string | null;
  skippedAt: string | null;
  followUpNeeded: boolean;
};

export type ReviewFeedback = {
  feelsRight: string;
  needsChange: string;
  makeStronger: string;
};

export type IntakePart = "oakfire" | "eighth-flame";
export type PublicStep = "session" | "review";

export type SessionState = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  stage: "Not Started" | "Answering" | "Draft Generated" | "Reviewing" | "Finalized" | "Completed";
  currentQuestionIndex: number;
  currentPart: IntakePart;
  publicStep: PublicStep;
  answers: Record<string, AnswerRecord>;
  generatedVisionDraft: VisionSection[];
  generatedVisionDraftUpdatedAt: string | null;
  reviewFeedback: Record<string, ReviewFeedback>;
  finalizedVision: VisionSection[];
  finalizedAt: string | null;
  completedAt: string | null;
  lastSavedAt: string | null;
  submittedAt: string | null;
  submissionId: string | null;
};

function now() {
  return new Date().toISOString();
}

function newSession(): SessionState {
  const createdAt = now();
  return {
    sessionId: `octavian-${Date.now()}`,
    createdAt,
    updatedAt: createdAt,
    stage: "Not Started",
    currentQuestionIndex: 0,
    currentPart: "oakfire",
    publicStep: "session",
    answers: {},
    generatedVisionDraft: [],
    generatedVisionDraftUpdatedAt: null,
    reviewFeedback: {},
    finalizedVision: [],
    finalizedAt: null,
    completedAt: null,
    lastSavedAt: null,
    submittedAt: null,
    submissionId: null,
  };
}

function normalizeAnswer(questionId: string, value: unknown): AnswerRecord | null {
  const question = allQuestions.find((item) => item.id === questionId);
  if (!question) return null;

  if (typeof value === "string") {
    return {
      questionId,
      categoryId: question.category.id,
      questionText: question.text,
      originalAnswer: value,
      organizedAnswer: "",
      answeredAt: value.trim() ? now() : null,
      skippedAt: null,
      followUpNeeded: false,
    };
  }

  if (value && typeof value === "object") {
    const record = value as Partial<AnswerRecord>;
    return {
      questionId,
      categoryId: record.categoryId || question.category.id,
      questionText: record.questionText || question.text,
      originalAnswer: record.originalAnswer || "",
      organizedAnswer: record.organizedAnswer || "",
      answeredAt: record.answeredAt || null,
      skippedAt: record.skippedAt || null,
      followUpNeeded: Boolean(record.followUpNeeded),
    };
  }

  return null;
}

function normalizeSession(value: unknown): SessionState {
  const fresh = newSession();
  if (!value || typeof value !== "object") return fresh;

  const raw = value as Partial<SessionState> & { lastUpdated?: string | null };
  const answers: Record<string, AnswerRecord> = {};
  if (raw.answers && typeof raw.answers === "object") {
    Object.entries(raw.answers as Record<string, unknown>).forEach(([questionId, answerValue]) => {
      const answer = normalizeAnswer(questionId, answerValue);
      if (answer) answers[questionId] = answer;
    });
  }

  const reviewFeedback: Record<string, ReviewFeedback> = {};
  if (raw.reviewFeedback && typeof raw.reviewFeedback === "object") {
    Object.entries(raw.reviewFeedback as Record<string, unknown>).forEach(([sectionId, feedback]) => {
      reviewFeedback[sectionId] = normalizeFeedback(feedback);
    });
  }

  const imported: SessionState = {
    sessionId: raw.sessionId || fresh.sessionId,
    createdAt: raw.createdAt || fresh.createdAt,
    updatedAt: raw.updatedAt || raw.lastUpdated || fresh.updatedAt,
    stage: raw.stage || "Not Started",
    currentQuestionIndex: Number.isFinite(raw.currentQuestionIndex) ? Number(raw.currentQuestionIndex) : 0,
    currentPart: raw.currentPart === "eighth-flame" ? "eighth-flame" : "oakfire",
    publicStep: raw.publicStep === "review" ? "review" : "session",
    answers,
    generatedVisionDraft: Array.isArray(raw.generatedVisionDraft) ? raw.generatedVisionDraft : [],
    generatedVisionDraftUpdatedAt: raw.generatedVisionDraftUpdatedAt || null,
    reviewFeedback,
    finalizedVision: Array.isArray(raw.finalizedVision) ? raw.finalizedVision : [],
    finalizedAt: raw.finalizedAt || null,
    completedAt: raw.completedAt || null,
    lastSavedAt: raw.lastSavedAt || raw.lastUpdated || null,
    submittedAt: raw.submittedAt || null,
    submissionId: raw.submissionId || null,
  };
  if (imported.completedAt) imported.stage = "Completed";
  else if (imported.finalizedVision.length) imported.stage = "Finalized";
  else if (Object.values(imported.reviewFeedback).some((feedback) => Object.values(normalizeFeedback(feedback)).some(Boolean))) {
    imported.stage = "Reviewing";
  } else if (imported.generatedVisionDraft.length) imported.stage = "Draft Generated";
  else if (Object.values(imported.answers).some((answer) => answer.originalAnswer.trim() || answer.skippedAt || answer.followUpNeeded)) {
    imported.stage = "Answering";
  }
  return imported;
}

function readSession(): SessionState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeSession(JSON.parse(stored)) : newSession();
  } catch {
    return newSession();
  }
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(() => readSession());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const touch = useCallback((updater: (current: SessionState, timestamp: string) => SessionState) => {
    setSession((current) => {
      const timestamp = now();
      return updater({ ...current, updatedAt: timestamp, lastSavedAt: timestamp }, timestamp);
    });
  }, []);

  const saveOriginalAnswer = useCallback(
    (questionId: string, originalAnswer: string) => {
      const question = allQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current, timestamp) => ({
        ...current,
        stage: current.finalizedVision.length ? current.stage : "Answering",
        answers: {
          ...current.answers,
          [questionId]: {
            questionId,
            categoryId: question.category.id,
            questionText: question.text,
            originalAnswer,
            organizedAnswer: current.answers[questionId]?.organizedAnswer || "",
            answeredAt: originalAnswer.trim() ? timestamp : current.answers[questionId]?.answeredAt || null,
            skippedAt: originalAnswer.trim() ? null : current.answers[questionId]?.skippedAt || null,
            followUpNeeded: current.answers[questionId]?.followUpNeeded || false,
          },
        },
      }));
    },
    [touch],
  );

  const organizeAnswer = useCallback(
    (questionId: string, originalAnswer?: string) => {
      const question = allQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current, timestamp) => {
        const existing = current.answers[questionId];
        const answerText = originalAnswer ?? existing?.originalAnswer ?? "";
        return {
          ...current,
          stage: current.finalizedVision.length ? current.stage : "Answering",
          answers: {
            ...current.answers,
            [questionId]: {
              questionId,
              categoryId: question.category.id,
              questionText: question.text,
              originalAnswer: answerText,
              organizedAnswer: organizeAnswerText(question.text, answerText),
              answeredAt: answerText.trim() ? existing?.answeredAt || timestamp : existing?.answeredAt || null,
              skippedAt: answerText.trim() ? null : existing?.skippedAt || null,
              followUpNeeded: existing?.followUpNeeded || false,
            },
          },
        };
      });
    },
    [touch],
  );

  const setCurrentQuestionIndex = useCallback(
    (index: number) => {
      touch((current) => ({ ...current, currentQuestionIndex: index }));
    },
    [touch],
  );

  const saveResumePosition = useCallback(
    (part: IntakePart, index: number, publicStep: PublicStep = "session") => {
      touch((current) => ({
        ...current,
        stage: current.completedAt ? "Completed" : current.stage === "Not Started" ? "Answering" : current.stage,
        currentPart: part,
        currentQuestionIndex: Math.max(0, index),
        publicStep,
      }));
    },
    [touch],
  );

  const generateDraft = useCallback(() => {
    let draft: VisionSection[] = [];
    touch((current) => {
      draft = generateFirstVisionDraft(current.answers);
      return {
        ...current,
        stage: "Draft Generated",
        generatedVisionDraft: draft,
        generatedVisionDraftUpdatedAt: current.updatedAt,
        finalizedVision: [],
        finalizedAt: null,
      };
    });
    return draft;
  }, [touch]);

  const skipQuestion = useCallback(
    (questionId: string) => {
      const question = allQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current, timestamp) => {
        const existing = current.answers[questionId];
        return {
          ...current,
          stage: current.finalizedVision.length ? current.stage : "Answering",
          answers: {
            ...current.answers,
            [questionId]: {
              questionId,
              categoryId: question.category.id,
              questionText: question.text,
              originalAnswer: existing?.originalAnswer || "",
              organizedAnswer: existing?.organizedAnswer || "",
              answeredAt: existing?.answeredAt || null,
              skippedAt: timestamp,
              followUpNeeded: true,
            },
          },
        };
      });
    },
    [touch],
  );

  const setFollowUpNeeded = useCallback(
    (questionId: string, followUpNeeded: boolean) => {
      const question = allQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current) => {
        const existing = current.answers[questionId];
        return {
          ...current,
          stage: current.finalizedVision.length ? current.stage : "Answering",
          answers: {
            ...current.answers,
            [questionId]: {
              questionId,
              categoryId: question.category.id,
              questionText: question.text,
              originalAnswer: existing?.originalAnswer || "",
              organizedAnswer: existing?.organizedAnswer || "",
              answeredAt: existing?.answeredAt || null,
              skippedAt: existing?.skippedAt || null,
              followUpNeeded,
            },
          },
        };
      });
    },
    [touch],
  );

  const saveFeedback = useCallback(
    (sectionId: string, feedback: ReviewFeedback) => {
      touch((current) => ({
        ...current,
        stage: current.finalizedVision.length ? "Finalized" : "Reviewing",
        reviewFeedback: { ...current.reviewFeedback, [sectionId]: normalizeFeedback(feedback) },
      }));
    },
    [touch],
  );

  const finalizeVision = useCallback(() => {
    let finalized: VisionSection[] = [];
    touch((current) => {
      const draft = current.generatedVisionDraft.length ? current.generatedVisionDraft : generateFirstVisionDraft(current.answers);
      finalized = buildFinalizedVision(draft, current.reviewFeedback, current.answers);
      return {
        ...current,
        generatedVisionDraft: draft,
        generatedVisionDraftUpdatedAt: current.generatedVisionDraftUpdatedAt || current.updatedAt,
        finalizedVision: finalized,
        finalizedAt: current.updatedAt,
        stage: "Finalized",
      };
    });
    return finalized;
  }, [touch]);

  const completeIntake = useCallback((submissionId?: string) => {
    touch((current, timestamp) => ({
      ...current,
      stage: "Completed",
      completedAt: current.completedAt || timestamp,
      submittedAt: timestamp,
      submissionId: submissionId || current.submissionId,
      publicStep: "review",
    }));
  }, [touch]);

  const importSession = useCallback((value: unknown) => {
    if (!value || typeof value !== "object") {
      throw new Error("This does not look like a valid Octavian vision session backup.");
    }
    const raw = value as Partial<SessionState>;
    if (!raw.sessionId || !raw.createdAt || !raw.updatedAt || !raw.answers || typeof raw.answers !== "object") {
      throw new Error("This does not look like a valid Octavian vision session backup.");
    }
    const imported = normalizeSession(value);
    setSession({ ...imported, updatedAt: now(), lastSavedAt: now() });
  }, []);

  const clearSession = useCallback(() => {
    const fresh = newSession();
    localStorage.removeItem(STORAGE_KEY);
    setSession(fresh);
  }, []);

  const answeredCount = useMemo(
    () => Object.values(session.answers).filter((answer) => answer.originalAnswer.trim().length > 0).length,
    [session.answers],
  );

  const skippedCount = useMemo(
    () => Object.values(session.answers).filter((answer) => answer.skippedAt).length,
    [session.answers],
  );

  const followUpCount = useMemo(
    () => Object.values(session.answers).filter((answer) => answer.followUpNeeded).length,
    [session.answers],
  );

  const organizedCount = useMemo(
    () => Object.values(session.answers).filter((answer) => answer.organizedAnswer.trim().length > 0).length,
    [session.answers],
  );

  return {
    session,
    saveOriginalAnswer,
    organizeAnswer,
    setCurrentQuestionIndex,
    generateDraft,
    skipQuestion,
    setFollowUpNeeded,
    saveResumePosition,
    saveFeedback,
    finalizeVision,
    completeIntake,
    importSession,
    clearSession,
    answeredCount,
    skippedCount,
    followUpCount,
    organizedCount,
  };
}

export function formatLastSaved(value: string | null) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
