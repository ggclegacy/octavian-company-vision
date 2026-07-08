import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const isDev = process.argv.includes("--dev");
const dataDir = path.join(__dirname, "data");
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

function buildStoredSubmission({ id = createId(), timestamp = now(), submitterName = "Octavian", session, planningOutputs }) {
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
    });
    submissions.push(submission);
    await writeSubmissions(submissions);
    res.status(201).json(submission);
  } catch {
    res.status(500).json({ error: "Could not save submission. Your local draft was not cleared." });
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
        submitterName: submission.submitterName || "Octavian",
        status: submission.status || "completed",
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        completedAt: submission.completedAt,
        answeredCount: submission.answeredCount || answerCount(submission.session),
        oakfireAnswerCount: submission.oakfireAnswerCount ?? Object.keys(submission.oakfireAnswers || {}).length,
        personalOsAnswerCount: submission.personalOsAnswerCount ?? Object.keys(submission.personalOsAnswers || {}).length,
        hasPlanningOutputs: Boolean(submission.planningOutputs?.generatedAt),
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

app.listen(port, "0.0.0.0", () => {
  console.log(`Oakfire Vision Intake ${isDev ? "dev" : "production"} server running on port ${port}`);
});
