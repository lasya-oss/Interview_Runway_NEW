import { getD1 } from "@/db";
import { getVoiceCandidateProfile, parseVoiceCandidateProfile, type VoiceCandidateProfile } from "@/app/lib/voice-candidate-profile-store";

export const MAX_VOICE_JOB_DESCRIPTION_CHARACTERS = 20_000;
export const MAX_VOICE_TURN_CHARACTERS = 12_000;
export const MAX_VOICE_TURNS_PER_BATCH = 40;
export const VOICE_SESSION_MINUTES = 30;

export type VoiceInterviewType = "behavioral" | "role_specific";
export type VoicePersona = "hiring_manager" | "peer_engineer";
export type VoiceSessionStatus = "ready" | "in_progress" | "scoring" | "completed" | "failed";
export type VoiceSpeaker = "candidate" | "interviewer";

export type VoiceTurn = {
  id: string;
  speaker: VoiceSpeaker;
  text: string;
  startedAt: string;
  endedAt: string;
  toolCalls: readonly VoiceToolCall[];
};

export type VoiceToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
};

export type VoiceRecommendedDrill = {
  slug: string;
  title: string;
  reason: string;
};

export type VoiceAnswerScore = {
  question: string;
  answer: string;
  structure: number;
  specificity: number;
  relevance: number;
  communication: number;
  feedback: string;
};

export type VoiceScore = {
  rubricVersion: string;
  perAnswer: readonly VoiceAnswerScore[];
  sessionVerdict: string;
  strengths: readonly string[];
  gaps: readonly string[];
  recommendedDrills: readonly VoiceRecommendedDrill[];
  provider: string;
  model: string;
  createdAt: string;
};

export type VoiceSession = {
  id: string;
  interviewType: VoiceInterviewType;
  persona: VoicePersona;
  language: "en";
  jobDescription: string | null;
  candidateProfile: VoiceCandidateProfile | null;
  status: VoiceSessionStatus;
  consentAt: string | null;
  audioRetentionApproved: boolean;
  audioRetained: boolean;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
  turns?: readonly VoiceTurn[];
  score?: VoiceScore | null;
};

export type VoiceSessionCreateInput = {
  interviewType: VoiceInterviewType;
  persona: VoicePersona;
  language: "en";
  jobDescription: string | null;
};

type VoiceSessionRow = {
  id: string;
  user_email: string;
  interview_type: string;
  persona: string;
  language: string;
  job_description: string | null;
  candidate_profile: string | null;
  status: string;
  token_id: string | null;
  consent_at: string | null;
  audio_retention_approved: number;
  audio_object_prefix: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  updated_at: string;
};

type VoiceTurnRow = {
  id: string;
  speaker: string;
  text: string;
  started_at: string;
  ended_at: string;
  tool_calls: string | null;
};

type VoiceScoreRow = {
  rubric_version: string;
  per_answer: string;
  session_verdict: string;
  strengths: string;
  gaps: string;
  recommended_drills: string;
  provider: string;
  model: string;
  created_at: string;
};

const SESSION_COLUMNS = `id, user_email, interview_type, persona, language,
  job_description, candidate_profile, status, token_id, consent_at,
  audio_retention_approved, audio_object_prefix, created_at, started_at,
  ended_at, updated_at`;

export async function createVoiceSession(
  email: string,
  input: VoiceSessionCreateInput,
  monthlyLimit: number,
  now = new Date(),
) {
  const database = await getD1();
  const normalizedEmail = normalizeEmail(email);
  const candidateProfile = await getVoiceCandidateProfile(normalizedEmail);
  const timestamp = now.toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const id = crypto.randomUUID();
  const record = await database
    .prepare(
      `INSERT INTO voice_sessions (
         id, user_email, interview_type, persona, language, job_description,
         candidate_profile, status, token_id, consent_at,
         audio_retention_approved, audio_object_prefix, created_at, started_at,
         ended_at, updated_at
       )
       SELECT ?, ?, ?, ?, 'en', ?, ?, 'ready', NULL, NULL, 0, NULL, ?, NULL, NULL, ?
       WHERE (
         SELECT COUNT(*) FROM voice_session_usage
         WHERE user_email = ? AND created_at >= ?
       ) < ?
       RETURNING ${SESSION_COLUMNS}`,
    )
    .bind(
      id,
      normalizedEmail,
      input.interviewType,
      input.persona,
      input.jobDescription,
      candidateProfile ? JSON.stringify(candidateProfile) : null,
      timestamp,
      timestamp,
      normalizedEmail,
      monthStart,
      monthlyLimit,
    )
    .first<VoiceSessionRow>();
  return record ? parseSessionRow(record) : null;
}

export async function getVoiceSession(email: string, id: string, includeDetail = false) {
  const database = await getD1();
  const record = await database
    .prepare(`SELECT ${SESSION_COLUMNS} FROM voice_sessions WHERE id = ? AND user_email = ? LIMIT 1`)
    .bind(id, normalizeEmail(email))
    .first<VoiceSessionRow>();
  if (!record) return null;
  const session = parseSessionRow(record);
  if (!includeDetail) return session;
  const [turnRows, scoreRow] = await Promise.all([
    database
      .prepare(
        `SELECT id, speaker, text, started_at, ended_at, tool_calls
         FROM voice_turns WHERE session_id = ? ORDER BY started_at ASC, created_at ASC`,
      )
      .bind(id)
      .all<VoiceTurnRow>(),
    database
      .prepare(
        `SELECT rubric_version, per_answer, session_verdict, strengths, gaps,
                recommended_drills, provider, model, created_at
         FROM voice_scores WHERE session_id = ? LIMIT 1`,
      )
      .bind(id)
      .first<VoiceScoreRow>(),
  ]);
  return {
    ...session,
    turns: turnRows.results.map(parseTurnRow),
    score: scoreRow ? parseScoreRow(scoreRow) : null,
  } satisfies VoiceSession;
}

export async function getVoiceSessions(email: string, limit = 20) {
  const result = await (await getD1())
    .prepare(
      `SELECT ${SESSION_COLUMNS} FROM voice_sessions
       WHERE user_email = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(normalizeEmail(email), Math.max(1, Math.min(limit, 50)))
    .all<VoiceSessionRow>();
  return result.results.map(parseSessionRow);
}

export async function countVoiceSessionsThisMonth(email: string, now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const row = await (await getD1())
    .prepare(
      `SELECT COUNT(*) AS count FROM voice_session_usage
       WHERE user_email = ? AND created_at >= ?`,
    )
    .bind(normalizeEmail(email), monthStart)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function recordVoiceConsent(email: string, id: string, retainAudio: boolean) {
  const database = await getD1();
  const normalizedEmail = normalizeEmail(email);
  const existing = await database
    .prepare(`SELECT ${SESSION_COLUMNS} FROM voice_sessions WHERE id = ? AND user_email = ? LIMIT 1`)
    .bind(id, normalizedEmail)
    .first<VoiceSessionRow>();
  if (!existing) return null;
  if (existing.status === "in_progress") {
    // Consent is immutable after streaming begins. This avoids orphaning audio
    // if a resumed browser sends a different retention choice.
    return Boolean(existing.audio_retention_approved) === retainAudio
      ? parseSessionRow(existing)
      : null;
  }
  if (existing.status !== "ready") return null;
  const timestamp = new Date().toISOString();
  const audioPrefix = retainAudio
    ? `voice/v1/${await sha256Hex(normalizedEmail)}/${id}`
    : null;
  const row = await database
    .prepare(
      `UPDATE voice_sessions
       SET consent_at = ?, audio_retention_approved = ?, audio_object_prefix = ?, updated_at = ?
       WHERE id = ? AND user_email = ? AND status = 'ready'
       RETURNING ${SESSION_COLUMNS}`,
    )
    .bind(timestamp, retainAudio ? 1 : 0, audioPrefix, timestamp, id, normalizedEmail)
    .first<VoiceSessionRow>();
  return row ? parseSessionRow(row) : null;
}

export async function beginVoiceSession(email: string, id: string, tokenId: string) {
  const timestamp = new Date().toISOString();
  const row = await (await getD1())
    .prepare(
      `UPDATE voice_sessions
       SET status = 'in_progress', token_id = ?,
           started_at = COALESCE(started_at, ?), updated_at = ?
       WHERE id = ? AND user_email = ? AND consent_at IS NOT NULL
         AND status IN ('ready', 'in_progress')
       RETURNING ${SESSION_COLUMNS}`,
    )
    .bind(tokenId.slice(0, 512), timestamp, timestamp, id, normalizeEmail(email))
    .first<VoiceSessionRow>();
  return row ? parseSessionRow(row) : null;
}

export async function saveVoiceTurns(email: string, id: string, turns: readonly VoiceTurn[]) {
  if (!turns.length) return getVoiceSession(email, id, false);
  const database = await getD1();
  const session = await getVoiceSession(email, id, false);
  if (!session || session.status !== "in_progress") return null;
  const timestamp = new Date().toISOString();
  const statements = turns.map((turn) => database
    .prepare(
      `INSERT INTO voice_turns (
         id, session_id, speaker, text, started_at, ended_at, tool_calls, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         speaker = excluded.speaker,
         text = excluded.text,
         started_at = excluded.started_at,
         ended_at = excluded.ended_at,
         tool_calls = excluded.tool_calls
       WHERE voice_turns.session_id = excluded.session_id`,
    )
    .bind(
      turn.id,
      id,
      turn.speaker,
      turn.text,
      turn.startedAt,
      turn.endedAt,
      turn.toolCalls.length ? JSON.stringify(turn.toolCalls) : null,
      timestamp,
    ));
  statements.push(database
    .prepare("UPDATE voice_sessions SET updated_at = ? WHERE id = ? AND user_email = ?")
    .bind(timestamp, id, normalizeEmail(email)));
  await database.batch(statements);
  return getVoiceSession(email, id, false);
}

export async function recordVoiceToolCall(
  email: string,
  id: string,
  callId: string,
  call: VoiceToolCall,
) {
  const timestamp = call.createdAt;
  return saveVoiceTurns(email, id, [{
    id: `${id.slice(0, 48)}-tool-${callId}`.slice(0, 96),
    speaker: "interviewer",
    text: "",
    startedAt: timestamp,
    endedAt: timestamp,
    toolCalls: [call],
  }]);
}

export async function closeVoiceSession(email: string, id: string) {
  const database = await getD1();
  const timestamp = new Date().toISOString();
  const row = await database
    .prepare(
      `UPDATE voice_sessions
       SET status = 'scoring', ended_at = COALESCE(ended_at, ?), updated_at = ?
       WHERE id = ? AND user_email = ? AND status IN ('ready', 'in_progress')
       RETURNING ${SESSION_COLUMNS}`,
    )
    .bind(timestamp, timestamp, id, normalizeEmail(email))
    .first<VoiceSessionRow>();
  if (row) return { session: parseSessionRow(row), claimed: true };
  const existing = await getVoiceSession(email, id, false);
  return existing ? { session: existing, claimed: false } : null;
}

export async function saveVoiceScore(email: string, id: string, score: VoiceScore) {
  const database = await getD1();
  const session = await getVoiceSession(email, id, false);
  if (!session || session.status !== "scoring") return null;
  const timestamp = new Date().toISOString();
  await database.batch([
    database.prepare(
      `INSERT INTO voice_scores (
         session_id, rubric_version, per_answer, session_verdict, strengths,
         gaps, recommended_drills, provider, model, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         rubric_version = excluded.rubric_version,
         per_answer = excluded.per_answer,
         session_verdict = excluded.session_verdict,
         strengths = excluded.strengths,
         gaps = excluded.gaps,
         recommended_drills = excluded.recommended_drills,
         provider = excluded.provider,
         model = excluded.model,
         created_at = excluded.created_at`,
    ).bind(
      id,
      score.rubricVersion,
      JSON.stringify(score.perAnswer),
      score.sessionVerdict,
      JSON.stringify(score.strengths),
      JSON.stringify(score.gaps),
      JSON.stringify(score.recommendedDrills),
      score.provider,
      score.model,
      score.createdAt,
    ),
    database.prepare(
      `UPDATE voice_sessions SET status = 'completed', updated_at = ?
       WHERE id = ? AND user_email = ? AND status = 'scoring'`,
    ).bind(timestamp, id, normalizeEmail(email)),
  ]);
  return getVoiceSession(email, id, true);
}

export async function markVoiceSessionFailed(email: string, id: string) {
  await (await getD1())
    .prepare(
      `UPDATE voice_sessions SET status = 'failed', updated_at = ?
       WHERE id = ? AND user_email = ? AND status = 'scoring'`,
    )
    .bind(new Date().toISOString(), id, normalizeEmail(email))
    .run();
}

export async function deleteVoiceSessionRecord(email: string, id: string) {
  const result = await (await getD1())
    .prepare("DELETE FROM voice_sessions WHERE id = ? AND user_email = ?")
    .bind(id, normalizeEmail(email))
    .run();
  return Number(result.meta?.changes ?? 0) === 1;
}

export function isVoiceInterviewType(value: unknown): value is VoiceInterviewType {
  return value === "behavioral" || value === "role_specific";
}

export function isVoicePersona(value: unknown): value is VoicePersona {
  return value === "hiring_manager" || value === "peer_engineer";
}

function parseSessionRow(row: VoiceSessionRow): VoiceSession {
  if (!isVoiceInterviewType(row.interview_type) || !isVoicePersona(row.persona)) {
    throw new Error("Stored voice session configuration is invalid");
  }
  if (!isVoiceSessionStatus(row.status)) throw new Error("Stored voice session status is invalid");
  return {
    id: row.id,
    interviewType: row.interview_type,
    persona: row.persona,
    language: "en",
    jobDescription: row.job_description,
    candidateProfile: parseVoiceCandidateProfile(row.candidate_profile),
    status: row.status,
    consentAt: row.consent_at,
    audioRetentionApproved: row.audio_retention_approved === 1,
    audioRetained: row.audio_retention_approved === 1 && Boolean(row.audio_object_prefix),
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    updatedAt: row.updated_at,
  };
}

function parseTurnRow(row: VoiceTurnRow): VoiceTurn {
  return {
    id: row.id,
    speaker: row.speaker === "candidate" ? "candidate" : "interviewer",
    text: row.text,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    toolCalls: parseJsonArray<VoiceToolCall>(row.tool_calls),
  };
}

function parseScoreRow(row: VoiceScoreRow): VoiceScore {
  return {
    rubricVersion: row.rubric_version,
    perAnswer: parseJsonArray<VoiceAnswerScore>(row.per_answer),
    sessionVerdict: row.session_verdict,
    strengths: parseJsonArray<string>(row.strengths),
    gaps: parseJsonArray<string>(row.gaps),
    recommendedDrills: parseJsonArray<VoiceRecommendedDrill>(row.recommended_drills),
    provider: row.provider,
    model: row.model,
    createdAt: row.created_at,
  };
}

function parseJsonArray<T>(value: string | null) {
  try {
    const parsed = value ? JSON.parse(value) as unknown : [];
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [] as T[];
  }
}

function isVoiceSessionStatus(value: string): value is VoiceSessionStatus {
  return value === "ready" || value === "in_progress" || value === "scoring"
    || value === "completed" || value === "failed";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function sha256Hex(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
