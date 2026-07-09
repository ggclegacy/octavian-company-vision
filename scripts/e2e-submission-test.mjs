import { once } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const timestamp = Date.now();
const oakfirePhrase = `UNIQUE_OAKFIRE_TEST_${timestamp}`;
const sanctumPhrase = `UNIQUE_SANCTUM_TEST_${timestamp}`;
const eighthFlamePhrase = `UNIQUE_EIGHTH_FLAME_TEST_${timestamp}`;
const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oakfire-e2e-"));

process.env.OAKFIRE_DATA_DIR = dataDir;

const { app } = await import("../server.js");
let server;
let baseUrl = "";

function answer(questionId, categoryId, questionText, originalAnswer, answeredAt) {
  return {
    questionId,
    categoryId,
    questionText,
    originalAnswer,
    organizedAnswer: originalAnswer,
    answeredAt,
    skippedAt: null,
    followUpNeeded: false,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathname} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function closeServer() {
  if (!server?.listening) return;
  server.close();
  await once(server, "close");
}

try {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  const now = new Date().toISOString();
  const session = {
    sessionId: `e2e-${timestamp}`,
    createdAt: now,
    updatedAt: now,
    stage: "Completed",
    currentQuestionIndex: 0,
    currentPart: "eighth-flame",
    publicStep: "review",
    answers: {
      "name-current": answer(
        "name-current",
        "name",
        "What name are you using right now?",
        `Oakfire backend save proof ${oakfirePhrase}`,
        now,
      ),
      "sanctum-imagine": answer(
        "sanctum-imagine",
        "sanctum",
        "When you picture Oakfire inside or connected to Legacy Sanctum, what do you imagine?",
        `Legacy Sanctum proof ${sanctumPhrase}`,
        now,
      ),
      "os-purpose-help": answer(
        "os-purpose-help",
        "os-purpose",
        "If Neil built you a personal app, what would you want it to help you with most?",
        `Future Eighth Flame proof ${eighthFlamePhrase}`,
        now,
      ),
      "food-sides": {
        ...answer("food-sides", "food", "What are your best sides?", "", null),
        skippedAt: now,
        followUpNeeded: true,
      },
    },
    generatedVisionDraft: [],
    generatedVisionDraftUpdatedAt: null,
    reviewFeedback: {},
    finalizedVision: [],
    finalizedAt: null,
    completedAt: now,
    lastSavedAt: now,
    submittedAt: now,
    submissionId: null,
  };

  const health = await request("/api/health");
  assert(health.ok === true, "Health route did not return ok: true.");

  const created = await request("/api/submissions", {
    method: "POST",
    body: JSON.stringify({ submitterName: "Octavian E2E Test", session }),
  });
  assert(created.id, "POST /api/submissions did not return an id.");
  assert(created.submissionType === "REAL", "Created submission was not marked REAL.");

  const list = await request("/api/submissions");
  assert(list.some((submission) => submission.id === created.id), "GET /api/submissions did not include created submission.");

  const detail = await request(`/api/submissions/${created.id}`);
  const detailText = JSON.stringify(detail);
  assert(detailText.includes(oakfirePhrase), "Saved detail is missing the unique Oakfire phrase.");
  assert(detailText.includes(sanctumPhrase), "Saved detail is missing the unique Sanctum phrase.");
  assert(detailText.includes(eighthFlamePhrase), "Saved detail is missing the unique Eighth Flame phrase.");
  assert(detail.skippedQuestions?.length === 1, "Skipped question was not preserved.");
  assert(detail.needsFollowUpQuestions?.length === 1, "Needs-follow-up flag was not preserved.");

  const generated = await request(`/api/submissions/${created.id}/generate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  assert(generated.planningOutputs?.generatedAt, "Generate route did not save planningOutputs.generatedAt.");
  assert(generated.planningOutputs.oakfirePlanningBrief.includes(oakfirePhrase), "Generated Oakfire brief is missing the Oakfire phrase.");
  assert(generated.planningOutputs.oakfirePlanningBrief.includes(eighthFlamePhrase), "Generated planning output is missing the Eighth Flame phrase.");
  assert(generated.planningOutputs.oakfireLegacySanctumOpportunity.includes(sanctumPhrase), "Generated Sanctum opportunity is missing the Sanctum phrase.");

  const testSubmission = await request("/api/submissions/test", { method: "POST" });
  assert(testSubmission.id, "POST /api/submissions/test did not return an id.");
  assert(testSubmission.isTest === true, "Test submission was not marked isTest.");

  const clearResult = await request("/api/submissions/test", { method: "DELETE" });
  assert(clearResult.deletedCount === 1, "DELETE /api/submissions/test did not delete exactly one test submission.");

  const realStillExists = await request(`/api/submissions/${created.id}`);
  assert(realStillExists.id === created.id, "Clear test submissions deleted the real submission.");

  const dataFile = path.join(dataDir, "submissions.json");
  const persisted = await fs.readFile(dataFile, "utf8");
  assert(persisted.includes(oakfirePhrase), "Persisted submissions.json is missing the Oakfire phrase.");
  assert(persisted.includes(eighthFlamePhrase), "Persisted submissions.json is missing the Eighth Flame phrase.");

  await closeServer();
  const restartedServer = app.listen(0, "127.0.0.1");
  await once(restartedServer, "listening");
  const restartedAddress = restartedServer.address();
  const restartedResponse = await fetch(`http://127.0.0.1:${restartedAddress.port}/api/submissions/${created.id}`);
  assert(restartedResponse.ok, "Submission was not available after server restart.");
  restartedServer.close();
  await once(restartedServer, "close");

  console.log("E2E submission test passed.");
  console.log(`Verified phrases: ${oakfirePhrase}, ${sanctumPhrase}, ${eighthFlamePhrase}`);
} finally {
  await closeServer();
  await fs.rm(dataDir, { recursive: true, force: true });
}
