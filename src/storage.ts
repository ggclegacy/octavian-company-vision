import { useCallback, useEffect, useMemo, useState } from "react";
import { flatQuestions } from "./data";
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

export type SessionState = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  currentQuestionIndex: number;
  answers: Record<string, AnswerRecord>;
  generatedVisionDraft: VisionSection[];
  generatedVisionDraftUpdatedAt: string | null;
  reviewFeedback: Record<string, ReviewFeedback>;
  finalizedVision: VisionSection[];
  lastSavedAt: string | null;
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
    currentQuestionIndex: 0,
    answers: {},
    generatedVisionDraft: [],
    generatedVisionDraftUpdatedAt: null,
    reviewFeedback: {},
    finalizedVision: [],
    lastSavedAt: null,
  };
}

function normalizeAnswer(questionId: string, value: unknown): AnswerRecord | null {
  const question = flatQuestions.find((item) => item.id === questionId);
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

  return {
    sessionId: raw.sessionId || fresh.sessionId,
    createdAt: raw.createdAt || fresh.createdAt,
    updatedAt: raw.updatedAt || raw.lastUpdated || fresh.updatedAt,
    currentQuestionIndex: Number.isFinite(raw.currentQuestionIndex) ? Number(raw.currentQuestionIndex) : 0,
    answers,
    generatedVisionDraft: Array.isArray(raw.generatedVisionDraft) ? raw.generatedVisionDraft : [],
    generatedVisionDraftUpdatedAt: raw.generatedVisionDraftUpdatedAt || null,
    reviewFeedback,
    finalizedVision: Array.isArray(raw.finalizedVision) ? raw.finalizedVision : [],
    lastSavedAt: raw.lastSavedAt || raw.lastUpdated || null,
  };
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
      const question = flatQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current, timestamp) => ({
        ...current,
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
      const question = flatQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current, timestamp) => {
        const existing = current.answers[questionId];
        const answerText = originalAnswer ?? existing?.originalAnswer ?? "";
        return {
          ...current,
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

  const generateDraft = useCallback(() => {
    let draft: VisionSection[] = [];
    touch((current) => {
      draft = generateFirstVisionDraft(current.answers);
      return { ...current, generatedVisionDraft: draft, generatedVisionDraftUpdatedAt: current.updatedAt, finalizedVision: [] };
    });
    return draft;
  }, [touch]);

  const skipQuestion = useCallback(
    (questionId: string) => {
      const question = flatQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current, timestamp) => {
        const existing = current.answers[questionId];
        return {
          ...current,
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
      const question = flatQuestions.find((item) => item.id === questionId);
      if (!question) return;

      touch((current) => {
        const existing = current.answers[questionId];
        return {
          ...current,
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
      };
    });
    return finalized;
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
    saveFeedback,
    finalizeVision,
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
