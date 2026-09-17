import { after } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { isSameOrigin, safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import { finalizeVoiceReport } from "@/app/lib/voice-report-workflow";
import { closeVoiceSession } from "@/app/lib/voice-session-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return voiceJson({ error: "Invalid origin" }, 403);
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const { id } = await params;
  try {
    const result = await closeVoiceSession(user.email, id);
    if (!result) return voiceJson({ error: "Session not found" }, 404);
    if (result.claimed) after(() => finalizeVoiceReport(user.email, id));
    return voiceJson({ session: result.session }, result.claimed ? 202 : 200);
  } catch (error) {
    console.error("Voice session close failed", safeVoiceError(error));
    return voiceJson({ error: "Voice session could not be closed" }, 503);
  }
}
