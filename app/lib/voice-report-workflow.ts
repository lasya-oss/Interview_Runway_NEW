import { diagnoseVoiceSession } from "@/app/lib/voice-diagnosis";
import {
  completeVoiceReportDelivery,
  reserveVoiceReportDelivery,
} from "@/app/lib/voice-report-delivery-store";
import { deliverVoiceReport, VoiceReportDeliveryError } from "@/app/lib/voice-report-gmail";
import { createVoiceReportPdf } from "@/app/lib/voice-report-pdf";
import {
  getVoiceSession,
  markVoiceSessionFailed,
  saveVoiceScore,
} from "@/app/lib/voice-session-store";

export async function finalizeVoiceReport(email: string, sessionId: string) {
  try {
    const session = await getVoiceSession(email, sessionId, true);
    if (!session || session.status !== "scoring") return;
    const score = await diagnoseVoiceSession(session);
    const completed = await saveVoiceScore(email, sessionId, score);
    if (!completed?.score) throw new Error("Voice score could not be stored");

    const reservation = await reserveVoiceReportDelivery(sessionId);
    if (reservation.kind === "existing") return;
    try {
      const pdf = createVoiceReportPdf(completed);
      const delivery = await deliverVoiceReport({ email, pdf, session: completed });
      await completeVoiceReportDelivery({
        deliveryKey: reservation.record.deliveryKey,
        status: "sent",
        messageId: delivery.messageId,
      });
    } catch (error) {
      const code = error instanceof VoiceReportDeliveryError ? error.code : "generation";
      const status = error instanceof VoiceReportDeliveryError && error.code === "indeterminate"
        ? "indeterminate" as const
        : "failed" as const;
      try {
        await completeVoiceReportDelivery({
          deliveryKey: reservation.record.deliveryKey,
          status,
          failureCode: code,
        });
      } catch {
        console.error("Voice report delivery failure could not be recorded", { sessionId });
      }
      console.error("Voice report email delivery failed", { sessionId, code });
    }
  } catch (error) {
    console.error("Voice report diagnosis failed", {
      sessionId,
      message: error instanceof Error ? error.message : "unknown",
    });
    await markVoiceSessionFailed(email, sessionId).catch(() => undefined);
  }
}
