import { getVoiceSession } from "@/app/lib/voice-session-store";

export const MAX_VOICE_AUDIO_CHUNK_BYTES = 2_000_000;

export async function putVoiceAudioChunk(input: {
  email: string;
  sessionId: string;
  sequence: number;
  contentType: string;
  body: ArrayBuffer;
}) {
  const session = await getVoiceSession(input.email, input.sessionId, false);
  if (
    !session
    || session.status !== "in_progress"
    || !session.audioRetentionApproved
    || !session.audioRetained
  ) {
    return null;
  }
  const databaseRow = await (await import("@/db")).getD1()
    .then((database) => database
      .prepare("SELECT audio_object_prefix FROM voice_sessions WHERE id = ? AND user_email = ?")
      .bind(input.sessionId, input.email.trim().toLowerCase())
      .first<{ audio_object_prefix: string | null }>());
  if (!databaseRow?.audio_object_prefix) return null;
  const bucket = await getVoiceAudioBucket();
  const extension = extensionForContentType(input.contentType);
  const key = `${databaseRow.audio_object_prefix}/${String(input.sequence).padStart(6, "0")}.${extension}`;
  await bucket.put(key, input.body, {
    httpMetadata: { contentType: input.contentType },
    customMetadata: { sessionId: input.sessionId, sequence: String(input.sequence) },
  });
  return key;
}

export async function deleteVoiceAudio(sessionId: string, prefix: string | null) {
  if (!prefix) return;
  const bucket = await getVoiceAudioBucket();
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: `${prefix}/`, cursor, limit: 500 });
    if (page.objects.length) await bucket.delete(page.objects.map((object) => object.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  console.info("Voice audio deleted", { sessionId });
}

export async function getVoiceAudioPrefix(email: string, sessionId: string) {
  const row = await (await import("@/db")).getD1()
    .then((database) => database
      .prepare("SELECT audio_object_prefix FROM voice_sessions WHERE id = ? AND user_email = ?")
      .bind(sessionId, email.trim().toLowerCase())
      .first<{ audio_object_prefix: string | null }>());
  return row?.audio_object_prefix ?? null;
}

async function getVoiceAudioBucket() {
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { VOICE_AUDIO?: R2Bucket }).VOICE_AUDIO;
  if (!bucket) throw new Error("Cloudflare R2 binding `VOICE_AUDIO` is unavailable");
  return bucket;
}

function extensionForContentType(value: string) {
  if (value.startsWith("audio/mp4")) return "m4a";
  if (value.startsWith("audio/ogg")) return "ogg";
  return "webm";
}
