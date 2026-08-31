import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  evaluateSecondSeatSession,
  findSecondSeatMock,
  type SecondSeatEvaluation,
  type SecondSeatMock,
} from "./second-seat-engine";
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

function toSession(
  record: typeof secondSeatSessions.$inferSelect | typeof secondSeatSessions.$inferInsert,
): SecondSeatSession {
  return {
    id: record.id,
    mockId: record.mockId,
    status: record.status === "completed" ? "completed" : "in_progress",
    answers: parseAnswers(record.answers ?? "[]"),
    evaluation: parseEvaluation(record.evaluation),
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

function parseEvaluation(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as SecondSeatEvaluation;
    return parsed && typeof parsed.overall === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
