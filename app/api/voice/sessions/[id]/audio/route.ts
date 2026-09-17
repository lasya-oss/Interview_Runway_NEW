import { getChatGPTUser } from "@/app/chatgpt-auth";
import { MAX_VOICE_AUDIO_CHUNK_BYTES, putVoiceAudioChunk } from "@/app/lib/voice-audio-store";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";

const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4"];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_VOICE_AUDIO_CHUNK_BYTES) return voiceJson({ error: "Audio chunk is too large" }, 413);
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!AUDIO_TYPES.some((type) => contentType.startsWith(type))) {
    return voiceJson({ error: "Unsupported audio format" }, 415);
  }
  const sequence = Number(new URL(request.url).searchParams.get("sequence"));
  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 99_999) {
    return voiceJson({ error: "Invalid audio sequence" }, 400);
  }
  const body = await request.arrayBuffer();
  if (!body.byteLength || body.byteLength > MAX_VOICE_AUDIO_CHUNK_BYTES) {
    return voiceJson({ error: "Audio chunk is empty or too large" }, body.byteLength ? 413 : 400);
  }
  const { id } = await params;
  try {
    const key = await putVoiceAudioChunk({ email: user.email, sessionId: id, sequence, contentType, body });
    return key ? voiceJson({ ok: true }, 200) : voiceJson({ error: "Audio retention is not enabled" }, 409);
  } catch (error) {
    console.error("Voice audio retention failed", safeVoiceError(error));
    return voiceJson({ error: "Audio could not be retained" }, 503);
  }
}
