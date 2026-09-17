import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import { resolveVoicePrepMaterial } from "@/app/lib/voice-materials";
import { getVoiceSession, recordVoiceToolCall } from "@/app/lib/voice-session-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) return voiceJson({ error: "Interviewer tool call is too large" }, 413);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const body = await request.json().catch(() => null) as { id?: unknown; name?: unknown; arguments?: unknown } | null;
  if (
    typeof body?.id !== "string"
    || !/^[a-zA-Z0-9._-]{1,80}$/.test(body.id)
    || !isToolName(body.name)
    || !isRecord(body.arguments)
  ) {
    return voiceJson({ error: "Invalid interviewer tool call" }, 400);
  }
  const { id } = await params;
  try {
    const session = await getVoiceSession(user.email, id, false);
    if (!session || session.status !== "in_progress") return voiceJson({ error: "Session is not active" }, 409);
    const result = toolResult(session, body.name, body.arguments);
    await recordVoiceToolCall(user.email, id, body.id, {
      name: body.name,
      arguments: boundedArguments(body.arguments),
      result: summarizeResult(result),
      createdAt: new Date().toISOString(),
    });
    return voiceJson({ result, scheduling: "WHEN_IDLE" }, 200);
  } catch (error) {
    console.error("Voice interviewer tool failed", safeVoiceError(error));
    return voiceJson({ error: "Interviewer lookup failed" }, 503);
  }
}

function toolResult(
  session: NonNullable<Awaited<ReturnType<typeof getVoiceSession>>>,
  name: ToolName,
  args: Record<string, unknown>,
) {
  if (name === "getCandidateProfile") {
    const profile = session.candidateProfile;
    return profile ? {
      name: profile.name,
      targetRole: profile.targetRole,
      focus: profile.focus,
      customGuidance: profile.customGuidance,
      resumeText: profile.resumeText.slice(0, 12_000),
    } : { available: false };
  }
  if (name === "getJobDescription") {
    return { jobDescription: session.jobDescription ?? session.candidateProfile?.jobDescriptionText.slice(0, 20_000) ?? null };
  }
  if (name === "getPrepMaterial") {
    const topic = typeof args.topic === "string" ? args.topic.slice(0, 240) : "interview communication";
    return resolveVoicePrepMaterial(topic) ?? { available: false };
  }
  const note = typeof args.note === "string" ? args.note.trim().slice(0, 1_000) : "";
  return note ? { saved: true, note } : { saved: false };
}

type ToolName = "getCandidateProfile" | "getJobDescription" | "getPrepMaterial" | "saveInterviewerNote";

function isToolName(value: unknown): value is ToolName {
  return value === "getCandidateProfile" || value === "getJobDescription"
    || value === "getPrepMaterial" || value === "saveInterviewerNote";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedArguments(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).slice(0, 8).map(([key, item]) => [
    key.slice(0, 80),
    boundedToolValue(item),
  ]));
}

function summarizeResult(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).slice(0, 8).map(([key, item]) => [
    key,
    boundedToolValue(item),
  ]));
}

function boundedToolValue(value: unknown) {
  if (typeof value === "string") return value.slice(0, 1_000);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean" || value === null) return value;
  return "[omitted]";
}
