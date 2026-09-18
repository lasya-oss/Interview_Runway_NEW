import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import { beginVoiceSession, getVoiceSession } from "@/app/lib/voice-session-store";
import { createGeminiVoiceToken, VoiceTokenError } from "@/app/lib/voice-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_000) return voiceJson({ error: "Credential request is too large" }, 413);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const body = await request.json().catch(() => null) as { sessionId?: unknown } | null;
  if (typeof body?.sessionId !== "string") return voiceJson({ error: "Session id is required" }, 400);
  try {
    const session = await getVoiceSession(user.email, body.sessionId, true);
    if (!session) return voiceJson({ error: "Session not found" }, 404);
    if (!session.consentAt) return voiceJson({ error: "Microphone consent is required" }, 409);
    if (session.status !== "ready" && session.status !== "in_progress") {
      return voiceJson({ error: "Session is not available for connection" }, 409);
    }
    const credential = await createGeminiVoiceToken(session);
    const started = await beginVoiceSession(user.email, session.id, credential.tokenId);
    if (!started) return voiceJson({ error: "Session could not be started" }, 409);
    return voiceJson({ credential }, 201);
  } catch (error) {
    if (error instanceof VoiceTokenError) {
      const status = error.code === "quota" ? 429 : error.code === "configuration" ? 503 : 502;
      console.error("Voice provider credential failed", { code: error.code, providerStatus: error.providerStatus });
      return voiceJson({
        error: error.code === "quota" ? "Voice provider is temporarily rate limited" : "Voice provider is unavailable",
        code: error.code,
        providerStatus: error.providerStatus ?? null,
      }, status);
    }
    console.error("Voice token route failed", safeVoiceError(error));
    return voiceJson({ error: "Voice session could not connect" }, 503);
  }
}
