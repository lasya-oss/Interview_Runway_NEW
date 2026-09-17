import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasVoiceAccess } from "@/app/lib/paid-access";
import { safeVoiceError, voiceJson } from "@/app/lib/voice-http";
import { createVoiceReportPdf } from "@/app/lib/voice-report-pdf";
import { getVoiceSession } from "@/app/lib/voice-session-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) return voiceJson({ error: "Authentication required" }, 401);
  if (!(await hasVoiceAccess(user.email))) return voiceJson({ error: "Voice practice access required" }, 403);
  const { id } = await params;
  try {
    const session = await getVoiceSession(user.email, id, true);
    if (!session) return voiceJson({ error: "Session not found" }, 404);
    if (!session.score) return voiceJson({ error: "Report is not ready" }, 409);
    return new Response(createVoiceReportPdf(session), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="voice-interview-${id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Voice report download failed", safeVoiceError(error));
    return voiceJson({ error: "Voice report is temporarily unavailable" }, 503);
  }
}
