import { getChatGPTUser } from "@/app/chatgpt-auth";
import { deleteVoiceAudio, getVoiceAudioPrefix } from "@/app/lib/voice-audio-store";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import {
  deleteVoiceSessionRecord,
  getVoiceSession,
  recordVoiceConsent,
} from "@/app/lib/voice-session-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const { id } = await params;
  try {
    const session = await getVoiceSession(user.email, id, true);
    if (!session) return voiceJson({ error: "Session not found" }, 404);
    if (new URL(request.url).searchParams.get("download") === "transcript") {
      const payload = JSON.stringify({
        exportedAt: new Date().toISOString(),
        session,
      }, null, 2);
      return new Response(payload, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="voice-transcript-${id}.json"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    return voiceJson({ session }, 200);
  } catch (error) {
    console.error("Voice session lookup failed", safeVoiceError(error));
    return voiceJson({ error: "Voice session is temporarily unavailable" }, 503);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_000) return voiceJson({ error: "Consent request is too large" }, 413);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const body = await request.json().catch(() => null) as { microphoneConsent?: unknown; retainAudio?: unknown } | null;
  if (body?.microphoneConsent !== true || typeof body.retainAudio !== "boolean") {
    return voiceJson({ error: "Microphone consent is required" }, 400);
  }
  const { id } = await params;
  try {
    const session = await recordVoiceConsent(user.email, id, body.retainAudio);
    return session ? voiceJson({ session }, 200) : voiceJson({ error: "Session cannot accept consent" }, 409);
  } catch (error) {
    console.error("Voice consent save failed", safeVoiceError(error));
    return voiceJson({ error: "Consent could not be saved" }, 503);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const { id } = await params;
  try {
    const session = await getVoiceSession(user.email, id, false);
    if (!session) return voiceJson({ error: "Session not found" }, 404);
    const prefix = await getVoiceAudioPrefix(user.email, id);
    await deleteVoiceAudio(id, prefix);
    const deleted = await deleteVoiceSessionRecord(user.email, id);
    return deleted ? voiceJson({ ok: true }, 200) : voiceJson({ error: "Session not found" }, 404);
  } catch (error) {
    console.error("Voice session deletion failed", safeVoiceError(error));
    return voiceJson({ error: "Voice session could not be deleted" }, 503);
  }
}
