import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const isDev = process.argv.includes("--dev");
const dataDir = process.env.OAKFIRE_DATA_DIR ? path.resolve(process.env.OAKFIRE_DATA_DIR) : path.join(__dirname, "data");
const submissionsPath = path.join(dataDir, "submissions.json");

app.use(express.json({ limit: "10mb" }));

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(submissionsPath);
  } catch {
    await fs.writeFile(submissionsPath, "[]\n", "utf8");
  }
}

async function readSubmissions() {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(submissionsPath, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    try {
      const raw = await fs.readFile(submissionsPath, "utf8");
      if (raw.trim()) {
        const backupPath = path.join(dataDir, `submissions.malformed-${Date.now()}.json`);
        await fs.writeFile(backupPath, raw, "utf8");
        console.warn(`Malformed submissions file backed up to ${backupPath}. Resetting submissions.json.`);
      }
    } catch {
      console.warn("Could not back up malformed submissions file. Resetting submissions.json.");
    }
    await fs.writeFile(submissionsPath, "[]\n", "utf8");
    return [];
  }
}

async function writeSubmissions(submissions) {
  await ensureDataFile();
  await fs.writeFile(submissionsPath, `${JSON.stringify(submissions, null, 2)}\n`, "utf8");
}

function now() {
  return new Date().toISOString();
}

function createId() {
  return `submission-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function answerCount(session) {
  return Object.values(session?.answers || {}).filter((answer) => String(answer?.originalAnswer || "").trim()).length;
}

function splitAnswers(session) {
  const answers = session?.answers || {};
  const entries = Object.entries(answers);
  const oakfireEntries = entries.filter(([questionId]) => !questionId.startsWith("os-"));
  const personalEntries = entries.filter(([questionId]) => questionId.startsWith("os-"));
  return {
    oakfireAnswers: Object.fromEntries(oakfireEntries),
    personalOsAnswers: Object.fromEntries(personalEntries),
    organizedOakfireAnswers: Object.fromEntries(oakfireEntries.map(([questionId, answer]) => [questionId, answer?.organizedAnswer || ""])),
    organizedPersonalOsAnswers: Object.fromEntries(personalEntries.map(([questionId, answer]) => [questionId, answer?.organizedAnswer || ""])),
    skippedQuestions: entries
      .filter(([, answer]) => answer?.skippedAt)
      .map(([questionId, answer]) => ({ questionId, questionText: answer?.questionText || questionId, skippedAt: answer?.skippedAt })),
    needsFollowUpQuestions: entries
      .filter(([, answer]) => answer?.followUpNeeded)
      .map(([questionId, answer]) => ({ questionId, questionText: answer?.questionText || questionId })),
  };
}

function basicPlanningOutputs(session) {
  const answers = session?.answers || {};
  const answerLines = Object.values(answers).map((answer) => {
    const status = [
      answer?.skippedAt ? "skipped" : "",
      answer?.followUpNeeded ? "needs follow-up" : "",
    ].filter(Boolean).join(", ");
    return `Q: ${answer?.questionText || answer?.questionId || "Unknown question"}\nA: ${answer?.originalAnswer || "Needs follow-up"}${status ? `\nStatus: ${status}` : ""}`;
  });
  const sanctumAnswers = Object.values(answers).filter((answer) => String(answer?.questionId || "").startsWith("sanctum-"));
  const sanctumLines = sanctumAnswers.length
    ? sanctumAnswers.map((answer) => `${answer.questionText}: ${answer.organizedAnswer || answer.originalAnswer || "Needs follow-up"}`)
    : ["Needs follow-up."];

  return {
    generatedAt: now(),
    oakfirePlanningBrief: answerLines.join("\n\n") || "Needs follow-up.",
    eighthFlameBlueprint:
      "Eighth Flame is a future separate personal OS guided by Orion. Use the completed intake answers to define Oakfire Command, personal planning, finance, health, content, mature private strain notes, and AI concierge needs.",
    oakfireLegacySanctumOpportunity: sanctumLines.join("\n"),
    sourceMaterialForFutureEighthFlameApp:
      "Use the Oakfire Planning Brief, Oakfire x Legacy Sanctum Opportunity, and Eighth Flame intake answers as source material for a separate future app.",
    prompts: {
      oakfireFinalVision:
        "Create an Oakfire Planning Brief from the submitted answers. Include Oakfire x Legacy Sanctum as the food, hospitality, and community-experience layer inside Legacy Sanctum. Do not invent answers; mark unknowns as Needs follow-up.",
      oakfireWebsitePlan: "Create a practical Oakfire website plan from the submitted answers. Do not invent missing details.",
      oakfireBrandIdentity: "Create a brand naming and identity brief from the submitted answers. Do not invent missing details.",
      eighthFlameStrategy:
        "Create an Eighth Flame personal OS strategy from the submitted answers, keeping it separate from the intake app.",
      codexFoundation:
        "Build a separate Eighth Flame personal OS foundation. Include Oakfire x Sanctum inside Oakfire Command with event ideas, plate drop planning, tasting night checklists, partnership roadmap, lead tracking, content capture checklist, and 30-day test metrics.",
    },
  };
}

function buildStoredSubmission({
  id = createId(),
  timestamp = now(),
  submitterName = "Octavian",
  session,
  planningOutputs,
  submissionType = "REAL",
  isTest = false,
}) {
  const safeSession = session && typeof session === "object" ? session : { answers: {} };
  const completedSession = {
    ...safeSession,
    stage: "Completed",
    completedAt: safeSession.completedAt || timestamp,
    updatedAt: safeSession.updatedAt || timestamp,
    lastSavedAt: safeSession.lastSavedAt || timestamp,
  };
  const outputs = {
    ...basicPlanningOutputs(completedSession),
    ...(planningOutputs && typeof planningOutputs === "object" ? planningOutputs : {}),
  };
  const split = splitAnswers(completedSession);
  return {
    id,
    submissionType,
    isTest: isTest || submissionType === "TEST",
    submitterName,
    status: "completed",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: completedSession.completedAt,
    answeredCount: answerCount(completedSession),
    oakfireAnswerCount: Object.values(split.oakfireAnswers).filter((answer) => String(answer?.originalAnswer || "").trim()).length,
    personalOsAnswerCount: Object.values(split.personalOsAnswers).filter((answer) => String(answer?.originalAnswer || "").trim()).length,
    ...split,
    oakfirePlanningBrief: outputs.oakfirePlanningBrief || "Needs follow-up.",
    oakfireLegacySanctumOpportunity: outputs.oakfireLegacySanctumOpportunity || "Needs follow-up.",
    eighthFlameBlueprint: outputs.eighthFlameBlueprint || "Needs follow-up.",
    sourceMaterialForFutureApp: outputs.sourceMaterialForFutureEighthFlameApp || outputs.sourceMaterialForFutureApp || "Needs follow-up.",
    aiPrompts: outputs.prompts || {},
    codexPrompt: outputs.prompts?.codexFoundation || outputs.codexPrompt || "Needs follow-up.",
    rawSessionBackup: completedSession,
    session: completedSession,
    planningOutputs: outputs,
  };
}

function answer(questionId, categoryId, questionText, originalAnswer, timestamp) {
  return {
    questionId,
    categoryId,
    questionText,
    originalAnswer,
    organizedAnswer: originalAnswer,
    answeredAt: timestamp,
    skippedAt: null,
    followUpNeeded: false,
  };
}

function createFullTestSession(timestamp) {
  const testAnswers = [
    answer("story-love", "story", "What made you fall in love with BBQ?", "I got hooked on BBQ because it brings people together. The smoke, patience, and payoff feel like something I can build a real name around.", timestamp),
    answer("story-inspired", "story", "Who taught you or inspired you?", "Family cooks, backyard gatherings, and pitmasters who make food feel like hospitality inspired me most.", timestamp),
    answer("story-feeling", "story", "What do you want people to feel when they eat your food?", "I want people to feel taken care of, impressed, full, and like they found a BBQ brand with real soul.", timestamp),
    answer("name-current", "name", "What name are you using right now?", "Pit Bull Barbecue is the current name, but I am open to Oakfire if it feels more premium and expandable.", timestamp),
    answer("name-choice", "name", "Do you want to keep Pit Bull Barbecue, improve it, or explore new names?", "Explore new names. I want something strong enough for catering, events, content, merch, and maybe a restaurant later.", timestamp),
    answer("brand-colors", "brand", "What colors do you imagine for the brand?", "Black, smoke gray, warm gold, ember red, and natural wood tones.", timestamp),
    answer("brand-feel", "brand", "Should the brand feel backyard and rugged, clean and professional, bold and loud, premium smokehouse, family/community focused, old-school Southern BBQ, modern food truck style, or something else?", "Premium smokehouse with backyard roots. Clean enough for business catering but still warm and rugged.", timestamp),
    answer("food-meats", "food", "What meats do you cook best?", "Brisket, ribs, smoked chicken, pulled pork, and wings.", timestamp),
    answer("food-sides", "food", "What are your best sides?", "Mac and cheese, baked beans, greens, potato salad, and cornbread.", timestamp),
    answer("food-plate", "food", "What is one plate you would proudly put in front of anybody?", "Brisket, ribs, mac and cheese, beans, pickles, onions, sauce, and cornbread.", timestamp),
    answer("goals-six-months", "goals", "What do you want this BBQ business to become in the next 6 months?", "I want a clear brand, a simple menu, a catering/preorder workflow, photos, and one or two successful test events.", timestamp),
    answer("goals-paths", "goals", "Which paths interest you most: catering, plate lunches, pop-ups, food truck, festivals, private parties, business lunches, YouTube/content, competitions, restaurant, merch, or something else?", "Catering, private parties, preorder plate drops, pop-ups, and content first. Food truck later if demand proves it.", timestamp),
    answer("sanctum-exciting", "sanctum", "When Neil brought up Oakfire being connected to Legacy Sanctum, what made the idea feel exciting to you?", "It gives Oakfire a real place to start, a built-in audience, and a premium environment instead of just posting food online.", timestamp),
    answer("sanctum-imagine", "sanctum", "When you picture Oakfire inside or connected to Legacy Sanctum, what do you imagine?", "Private tasting nights, barber and BBQ events, game-day plate drops, catering pickup, and a polished Oakfire presence at special events.", timestamp),
    answer("sanctum-starting-model", "sanctum", "Which starting model feels most realistic first? Options could include private tasting night, monthly Oakfire night, preorder plate drops, catering pickup, event food, food truck outside, small onsite service later, or not sure yet.", "Private tasting night first, then monthly Oakfire night and preorder plate drops.", timestamp),
    answer("sanctum-30-day-success", "sanctum", "What would success look like after the first 30 days of testing Oakfire with Legacy Sanctum? Examples could include plates sold, catering leads, event turnout, customer feedback, repeat interest, social content, revenue, or confidence in the direction.", "Strong customer feedback, photos/videos, at least a few catering leads, repeat interest, and confidence in which plates sell best.", timestamp),
    answer("web-job", "website", "What should a website help you do?", "Help people understand the brand, see the menu direction, request catering, join plate drop updates, and follow the story.", timestamp),
    answer("cat-events", "catering", "What kinds of events would you want to cater?", "Private parties, business lunches, barbershop events, family events, and small community gatherings.", timestamp),
    answer("content-kind", "content", "What kind of content would feel natural for you?", "Cooking clips, behind-the-scenes prep, customer reactions, plate reveals, and short lessons about BBQ.", timestamp),
    answer("ai-help", "ai", "Where could AI help you most with this business?", "Menu planning, pricing, prep checklists, content ideas, catering quotes, and staying organized.", timestamp),
    answer("final-understand", "final", "What do you want Neil to understand most before building the plan?", "I want this to be real and practical, not just a nice-looking idea. I need a first step I can actually execute while working full-time.", timestamp),
    answer("os-purpose-help", "os-purpose", "If Neil built you a personal app, what would you want it to help you with most?", "Keep Oakfire, money, goals, reminders, health, and content organized in one simple place.", timestamp),
    answer("os-daily-week", "os-daily", "What does a normal week look like for you right now?", "Work takes most weekdays, so Oakfire needs evening and weekend planning with simple reminders.", timestamp),
    answer("os-oakfire-first", "os-oakfire-support", "What part of building Oakfire would you want the app to help with first?", "Catering requests, prep lists, plate drop planning, content planning, and simple financial tracking.", timestamp),
    answer("os-money-tools", "os-money", "Would budgeting, savings goals, expense tracking, or income tracking help you?", "Expense tracking, savings goals, and basic income tracking would help.", timestamp),
    answer("os-orion-role", "os-orion", "Should the AI concierge feel more like a business coach, personal assistant, strategist, or simple helper?", "A calm strategist and simple helper. Direct, practical, and not overwhelming.", timestamp),
    answer("os-feel-three", "os-feel", "If Neil could only build three things first, what should they be?", "Oakfire command center, weekly priorities, and money/expense tracking.", timestamp),
  ];
  return {
    sessionId: `test-octavian-${Date.now()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    stage: "Completed",
    currentQuestionIndex: 0,
    answers: Object.fromEntries(testAnswers.map((item) => [item.questionId, item])),
    generatedVisionDraft: [],
    generatedVisionDraftUpdatedAt: null,
    reviewFeedback: {},
    finalizedVision: [],
    finalizedAt: null,
    completedAt: timestamp,
    lastSavedAt: timestamp,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "oakfire-vision-intake", time: now() });
});

app.post("/api/submissions", async (req, res) => {
  try {
    const timestamp = now();
    const session = req.body?.session;
    if (!session || typeof session !== "object" || !session.answers || typeof session.answers !== "object") {
      res.status(400).json({ error: "Submission must include a session with answers." });
      return;
    }
    const submissions = await readSubmissions();
    const submission = buildStoredSubmission({
      timestamp,
      submitterName: req.body?.submitterName || "Octavian",
      session,
      planningOutputs: req.body?.planningOutputs,
      submissionType: "REAL",
    });
    submissions.push(submission);
    await writeSubmissions(submissions);
    res.status(201).json(submission);
  } catch {
    res.status(500).json({ error: "Could not save submission. Your local draft was not cleared." });
  }
});

app.post("/api/submissions/test", async (_req, res) => {
  try {
    const timestamp = now();
    const submissions = await readSubmissions();
    const session = createFullTestSession(timestamp);
    const submission = buildStoredSubmission({
      timestamp,
      submitterName: "Octavian Test Submission",
      session,
      planningOutputs: basicPlanningOutputs(session),
      submissionType: "TEST",
      isTest: true,
    });
    submissions.push(submission);
    await writeSubmissions(submissions);
    res.status(201).json(submission);
  } catch {
    res.status(500).json({ error: "Could not create test submission." });
  }
});

app.delete("/api/submissions/test", async (_req, res) => {
  try {
    const submissions = await readSubmissions();
    const realSubmissions = submissions.filter((submission) => !(submission.isTest || submission.submissionType === "TEST"));
    const deletedCount = submissions.length - realSubmissions.length;
    await writeSubmissions(realSubmissions);
    res.json({ deletedCount, remainingCount: realSubmissions.length });
  } catch {
    res.status(500).json({ error: "Could not clear test submissions." });
  }
});

app.get("/api/submissions", async (_req, res) => {
  try {
    const submissions = await readSubmissions();
    res.json(
      [...submissions]
        .sort((a, b) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime())
        .map((submission) => ({
        id: submission.id,
        submissionType: submission.submissionType || (submission.isTest ? "TEST" : "REAL"),
        submitterName: submission.submitterName || "Octavian",
        status: submission.status || "completed",
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        completedAt: submission.completedAt,
        answeredCount: submission.answeredCount || answerCount(submission.session),
        oakfireAnswerCount: submission.oakfireAnswerCount ?? Object.keys(submission.oakfireAnswers || {}).length,
        personalOsAnswerCount: submission.personalOsAnswerCount ?? Object.keys(submission.personalOsAnswers || {}).length,
        hasPlanningOutputs: Boolean(submission.planningOutputs?.generatedAt),
        isTest: Boolean(submission.isTest || submission.submissionType === "TEST"),
      })),
    );
  } catch {
    res.status(500).json({ error: "Could not load submissions." });
  }
});

app.get("/api/submissions/:id", async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const submission = submissions.find((item) => item.id === req.params.id);
    if (!submission) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    res.json(submission);
  } catch {
    res.status(500).json({ error: "Could not load submission." });
  }
});

app.post("/api/submissions/:id/generate", async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const index = submissions.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Submission not found." });
      return;
    }
    const timestamp = now();
    const rebuilt = buildStoredSubmission({
      id: submissions[index].id,
      timestamp: submissions[index].createdAt,
      submitterName: submissions[index].submitterName || "Octavian",
      session: submissions[index].session || submissions[index].rawSessionBackup || {
        answers: {
          ...(submissions[index].oakfireAnswers || {}),
          ...(submissions[index].personalOsAnswers || {}),
        },
      },
      planningOutputs: {
        ...(req.body?.planningOutputs && typeof req.body.planningOutputs === "object" ? req.body.planningOutputs : {}),
        generatedAt: timestamp,
      },
      submissionType: submissions[index].submissionType || "REAL",
      isTest: Boolean(submissions[index].isTest || submissions[index].submissionType === "TEST"),
    });
    submissions[index] = {
      ...rebuilt,
      updatedAt: timestamp,
    };
    await writeSubmissions(submissions);
    res.json(submissions[index]);
  } catch {
    res.status(500).json({ error: "Could not generate planning outputs." });
  }
});

if (isDev) {
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    server: { middlewareMode: true, hmr: false },
    environments: {
      client: {
        dev: {
          hmr: false,
          createEnvironment(name, config, context) {
            return new vite.DevEnvironment(name, config, {
              ...context,
              hot: false,
              disableFetchModule: true,
            });
          },
        },
      },
    },
    appType: "spa",
  });
  app.use(viteServer.middlewares);
  app.use(/.*/, async (req, res, next) => {
    try {
      const template = await fs.readFile(path.join(__dirname, "index.html"), "utf8");
      const html = await viteServer.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      viteServer.ssrFixStacktrace(error);
      next(error);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const shouldListen = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (shouldListen) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Oakfire Vision Intake ${isDev ? "dev" : "production"} server running on port ${port}`);
  });
}

export { app };
