import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { isIsoTimestamp, isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import {
  MAX_VOICE_TURN_CHARACTERS,
  MAX_VOICE_TURNS_PER_BATCH,
  saveVoiceTurns,
  type VoiceTurn,
} from "@/app/lib/voice-session-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 750_000) return voiceJson({ error: "Transcript batch is too large" }, 413);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const body = await request.json().catch(() => null) as { turns?: unknown } | null;
  if (!Array.isArray(body?.turns) || body.turns.length > MAX_VOICE_TURNS_PER_BATCH) {
    return voiceJson({ error: "Invalid transcript batch" }, 400);
  }
  const turns: VoiceTurn[] = [];
  for (const value of body.turns) {
    if (!isRecord(value)) return voiceJson({ error: "Invalid transcript turn" }, 400);
    const text = typeof value.text === "string" ? value.text.trim() : "";
    if (
      typeof value.id !== "string"
      || !/^[a-zA-Z0-9-]{8,96}$/.test(value.id)
      || (value.speaker !== "candidate" && value.speaker !== "interviewer")
      || !text
      || text.length > MAX_VOICE_TURN_CHARACTERS
      || !isIsoTimestamp(value.startedAt)
      || !isIsoTimestamp(value.endedAt)
      || Date.parse(value.endedAt) < Date.parse(value.startedAt)
    ) {
      return voiceJson({ error: "Invalid transcript turn" }, 400);
    }
    turns.push({
      id: value.id,
      speaker: value.speaker,
      text,
      startedAt: new Date(value.startedAt).toISOString(),
      endedAt: new Date(value.endedAt).toISOString(),
      toolCalls: value.speaker === "interviewer"
        && typeof value.latencyMs === "number"
        && Number.isFinite(value.latencyMs)
        && value.latencyMs >= 0
        && value.latencyMs <= 60_000
        ? [{
            name: "turnLatency",
            arguments: {},
            result: { milliseconds: Math.round(value.latencyMs) },
            createdAt: new Date(value.endedAt).toISOString(),
          }]
        : [],
    });
  }
  const { id } = await params;
  try {
    const session = await saveVoiceTurns(user.email, id, turns);
    return session ? voiceJson({ ok: true }, 200) : voiceJson({ error: "Session is not active" }, 409);
  } catch (error) {
    console.error("Voice transcript save failed", safeVoiceError(error));
    return voiceJson({ error: "Transcript could not be saved" }, 503);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
