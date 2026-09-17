import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getVoiceEntitlement } from "@/app/lib/paid-access";
import { isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import {
  MAX_VOICE_JOB_DESCRIPTION_CHARACTERS,
  countVoiceSessionsThisMonth,
  createVoiceSession,
  getVoiceSessions,
  isVoiceInterviewType,
  isVoicePersona,
} from "@/app/lib/voice-session-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  try {
    const entitlement = await getVoiceEntitlement(user.email);
    if (!entitlement.enabled) return voiceJson({ error: "Voice practice access required" }, 403);
    const [sessions, used] = await Promise.all([
      getVoiceSessions(user.email),
      countVoiceSessionsThisMonth(user.email),
    ]);
    return voiceJson({ sessions, quota: { ...entitlement, used, remaining: Math.max(0, entitlement.monthlySessionLimit - used) } }, 200);
  } catch (error) {
    console.error("Voice session history failed", safeVoiceError(error));
    return voiceJson({ error: "Voice practice history is temporarily unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) return voiceJson({ error: "Voice interview setup is too large" }, 413);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!isVoiceInterviewType(body?.interviewType) || !isVoicePersona(body?.persona) || body?.language !== "en") {
    return voiceJson({ error: "Invalid voice interview setup" }, 400);
  }
  const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
  if (jobDescription.length > MAX_VOICE_JOB_DESCRIPTION_CHARACTERS) {
    return voiceJson({ error: "Job description is too long" }, 400);
  }
  try {
    const entitlement = await getVoiceEntitlement(user.email);
    if (!entitlement.enabled) return voiceJson({ error: "Voice practice access required" }, 403);
    const session = await createVoiceSession(user.email, {
      interviewType: body.interviewType,
      persona: body.persona,
      language: "en",
      jobDescription: jobDescription || null,
    }, entitlement.monthlySessionLimit);
    if (!session) {
      return voiceJson({
        error: `Monthly voice quota reached (${entitlement.monthlySessionLimit} sessions)`,
      }, 429);
    }
    return voiceJson({ session }, 201);
  } catch (error) {
    console.error("Voice session creation failed", safeVoiceError(error));
    return voiceJson({ error: "Voice session could not be created" }, 503);
  }
}
