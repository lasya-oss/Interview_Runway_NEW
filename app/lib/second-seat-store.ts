import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  evaluateSecondSeatSession,
  findSecondSeatMock,
  type SecondSeatEvaluation,
  type SecondSeatMock,
} from "./second-seat-engine";
import { parseStoredSecondSeatEvaluation } from "./second-seat-ai-evaluator";
import { secondSeatSessions } from "@/db/schema";

export type SecondSeatSession = {
  id: string;
  mockId: string;
  status: "in_progress" | "completed";
  answers: string[];
  evaluation: SecondSeatEvaluation | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

export type SecondSeatEvaluationClaim = {
  attempt: number;
  marker: string;
};

const MAXIMUM_AI_EVALUATION_ATTEMPTS = 2;
const STALE_AI_EVALUATION_CLAIM_MS = 30_000;

export async function createSecondSeatSession(
  email: string,
  mock: SecondSeatMock,
): Promise<SecondSeatSession> {
  const now = new Date().toISOString();
  const record: typeof secondSeatSessions.$inferInsert = {
    id: crypto.randomUUID(),
    userEmail: normalizeEmail(email),
    mockId: mock.id,
    status: "in_progress",
    answers: "[]",
    evaluation: null,
    startedAt: now,
    completedAt: null,
    updatedAt: now,
  };
  await (await getDb()).insert(secondSeatSessions).values(record);
  return toSession(record);
}

export async function getSecondSeatSession(email: string, id: string) {
  const [record] = await (await getDb())
    .select()
    .from(secondSeatSessions)
    .where(
      and(
        eq(secondSeatSessions.id, id),
        eq(secondSeatSessions.userEmail, normalizeEmail(email)),
      ),
    )
    .limit(1);
  return record ? toSession(record) : null;
}

export async function getSecondSeatSessions(email: string) {
  const records = await (await getDb())
    .select()
    .from(secondSeatSessions)
    .where(eq(secondSeatSessions.userEmail, normalizeEmail(email)))
    .orderBy(desc(secondSeatSessions.updatedAt))
    .limit(20);
  return records.map(toSession);
}

export async function getLatestCompletedSecondSeatSession(email: string) {
  const [record] = await (await getDb())
    .select()
    .from(secondSeatSessions)
    .where(
      and(
        eq(secondSeatSessions.userEmail, normalizeEmail(email)),
        eq(secondSeatSessions.status, "completed"),
      ),
    )
    .orderBy(desc(secondSeatSessions.completedAt))
    .limit(1);
  return record ? toSession(record) : null;
}

export async function saveSecondSeatAnswers(
  email: string,
  id: string,
  answers: readonly string[],
) {
  const session = await getSecondSeatSession(email, id);
  if (!session) return null;
  if (session.status === "completed") return session;

  const mock = findSecondSeatMock(session.mockId);
  if (!mock) return null;
  const now = new Date().toISOString();
  const isComplete = answers.length === mock.turns.length;
  const evaluation = isComplete
    ? evaluateSecondSeatSession(mock, answers)
    : null;

  await (await getDb())
    .update(secondSeatSessions)
    .set({
      answers: JSON.stringify(answers),
      status: isComplete ? "completed" : "in_progress",
      evaluation: evaluation ? JSON.stringify(evaluation) : null,
      completedAt: isComplete ? now : null,
      updatedAt: now,
    })
    .where(
      and(
        eq(secondSeatSessions.id, id),
        eq(secondSeatSessions.userEmail, normalizeEmail(email)),
        eq(secondSeatSessions.status, "in_progress"),
      ),
    );

  return getSecondSeatSession(email, id);
}

export async function saveSecondSeatEvaluation(
  email: string,
  id: string,
  answers: readonly string[],
  claim: SecondSeatEvaluationClaim,
  evaluation: SecondSeatEvaluation,
) {
  const now = new Date().toISOString();
  const storedEvaluation = evaluation.evaluationSource === "ai"
    ? evaluation
    : {
        ...evaluation,
        aiEvaluationAttempts: claim.attempt,
        aiEvaluationRetryAvailable: claim.attempt < MAXIMUM_AI_EVALUATION_ATTEMPTS,
      };
  await (await getDb())
    .update(secondSeatSessions)
    .set({ evaluation: JSON.stringify(storedEvaluation), updatedAt: now })
    .where(
      and(
        eq(secondSeatSessions.id, id),
        eq(secondSeatSessions.userEmail, normalizeEmail(email)),
        eq(secondSeatSessions.status, "completed"),
        eq(secondSeatSessions.answers, JSON.stringify(answers)),
        eq(secondSeatSessions.evaluation, claim.marker),
      ),
    );
  return getSecondSeatSession(email, id);
}

/**
 * Atomically claims the remote evaluation for one immutable transcript.
 *
 * The claim lives inside the existing evaluation JSON column, avoiding a new
 * persistence model while ensuring concurrent final PUTs cannot double-spend
 * provider calls. A stale interrupted claim may be recovered once; each
 * session is capped at two provider attempts.
 */
export async function claimSecondSeatEvaluation(
  email: string,
  id: string,
  answers: readonly string[],
): Promise<SecondSeatEvaluationClaim | null> {
  const database = await getDb();
  const normalizedEmail = normalizeEmail(email);
  const [record] = await database
    .select()
    .from(secondSeatSessions)
    .where(
      and(
        eq(secondSeatSessions.id, id),
        eq(secondSeatSessions.userEmail, normalizedEmail),
        eq(secondSeatSessions.status, "completed"),
      ),
    )
    .limit(1);
  if (!record || !sameAnswers(parseAnswers(record.answers), answers)) return null;

  const mock = findSecondSeatMock(record.mockId);
  if (!mock || parseStoredSecondSeatEvaluation(record.evaluation, mock, answers)) return null;

  const state = evaluationAttemptState(record.evaluation);
  if (state.pending && !state.stale) return null;
  if (state.attempts >= MAXIMUM_AI_EVALUATION_ATTEMPTS) return null;

  const claim: SecondSeatEvaluationClaim = {
    attempt: state.attempts + 1,
    marker: "",
  };
  claim.marker = JSON.stringify({
    schemaVersion: 2,
    evaluationSource: "ai_pending",
    claimId: crypto.randomUUID(),
    attempt: claim.attempt,
    startedAt: new Date().toISOString(),
  });
  const currentEvaluationCondition = record.evaluation === null
    ? isNull(secondSeatSessions.evaluation)
    : eq(secondSeatSessions.evaluation, record.evaluation);
  const claimed = await database
    .update(secondSeatSessions)
    .set({ evaluation: claim.marker, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(secondSeatSessions.id, id),
        eq(secondSeatSessions.userEmail, normalizedEmail),
        eq(secondSeatSessions.status, "completed"),
        eq(secondSeatSessions.answers, JSON.stringify(answers)),
        currentEvaluationCondition,
      ),
    )
    .returning({ id: secondSeatSessions.id });
  return claimed.length === 1 ? claim : null;
}

function toSession(
  record: typeof secondSeatSessions.$inferSelect | typeof secondSeatSessions.$inferInsert,
): SecondSeatSession {
  const answers = parseAnswers(record.answers ?? "[]");
  const evaluation = evaluationFromAnswers(record, answers);
  return {
    id: record.id,
    mockId: record.mockId,
    status: record.status === "completed" ? "completed" : "in_progress",
    answers,
    evaluation,
    startedAt: record.startedAt,
    completedAt: record.completedAt ?? null,
    updatedAt: record.updatedAt,
  };
}

function parseAnswers(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((answer): answer is string => typeof answer === "string")
      : [];
  } catch {
    return [];
  }
}

function evaluationFromAnswers(
  record: typeof secondSeatSessions.$inferSelect | typeof secondSeatSessions.$inferInsert,
  answers: readonly string[],
): SecondSeatEvaluation | null {
  if (record.status !== "completed") return null;
  const mock = findSecondSeatMock(record.mockId);
  if (!mock || answers.length !== mock.turns.length) return null;

  const persisted = parseStoredSecondSeatEvaluation(record.evaluation, mock, answers);
  if (persisted) return persisted;

  // Version 1 rows predate immutable AI feedback. Recompute their deterministic
  // rubric from the transcript, while version 2 rows retain the exact validated
  // provider result that the learner received when the round was completed.
  const fallback = evaluateSecondSeatSession(mock, answers);
  const state = evaluationAttemptState(record.evaluation);
  return {
    ...fallback,
    aiEvaluationAttempts: state.attempts,
    aiEvaluationRetryAvailable:
      !state.pending && state.attempts < MAXIMUM_AI_EVALUATION_ATTEMPTS,
  };
}

function evaluationAttemptState(value: string | null | undefined) {
  try {
    const parsed = value ? JSON.parse(value) as Record<string, unknown> : null;
    if (!parsed || typeof parsed !== "object") {
      return { attempts: 0, pending: false, stale: false };
    }
    if (parsed.evaluationSource === "ai_pending") {
      const attempts = Number.isInteger(parsed.attempt) ? Number(parsed.attempt) : 0;
      const startedAt = typeof parsed.startedAt === "string" ? Date.parse(parsed.startedAt) : Number.NaN;
      return {
        attempts,
        pending: true,
        stale: !Number.isFinite(startedAt) || Date.now() - startedAt >= STALE_AI_EVALUATION_CLAIM_MS,
      };
    }
    const attempts = Number.isInteger(parsed.aiEvaluationAttempts)
      ? Number(parsed.aiEvaluationAttempts)
      : 0;
    return { attempts, pending: false, stale: false };
  } catch {
    return { attempts: 0, pending: false, stale: false };
  }
}

function sameAnswers(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((answer, index) => answer === right[index]);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
