import type { QualificationApplicationRecord } from "@/app/lib/qualification-store";

export type QualificationNotificationResult =
  | { status: "pending"; reason: "not_configured" }
  | { status: "sent" }
  | { status: "failed"; error: string };

export async function notifyQualificationApplication(
  application: QualificationApplicationRecord,
): Promise<QualificationNotificationResult> {
  const webhookUrl = process.env.QUALIFICATION_NOTIFICATION_WEBHOOK_URL?.trim();
  const recipient = process.env.QUALIFICATION_NOTIFICATION_EMAIL?.trim();
  if (!webhookUrl || !recipient) return { status: "pending", reason: "not_configured" };

  const token = process.env.QUALIFICATION_NOTIFICATION_WEBHOOK_TOKEN?.trim();
  const plainText = buildPlainText(application);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        event: "interviewrunway.phase_three_qualification_submitted",
        recipient,
        subject: `Phase 3 qualification · ${application.accountEmail}`,
        replyTo: application.accountEmail,
        text: plainText,
        application: {
          id: application.id,
          accountEmail: application.accountEmail,
          phaseOneStatus: application.phaseOneStatus,
          phaseTwoStatus: application.phaseTwoStatus,
          whatsappSupportPerson: application.whatsappSupportPerson,
          targetRole: application.targetRole,
          visibleGap: application.visibleGap,
          additionalContext: application.additionalContext,
          submittedAt: application.createdAt,
        },
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return { status: "failed", error: `Notification endpoint returned ${response.status}` };
    }

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Qualification notification failed",
    };
  }
}

function buildPlainText(application: QualificationApplicationRecord): string {
  return [
    "A new InterviewRunway Phase 3 qualification application was submitted.",
    "",
    `Application: ${application.id}`,
    `Account email: ${application.accountEmail}`,
    `Foundation: ${labelStatus(application.phaseOneStatus)}`,
    `Second Seat: ${labelStatus(application.phaseTwoStatus)}`,
    `WhatsApp support person: ${application.whatsappSupportPerson}`,
    `Target role: ${application.targetRole}`,
    "",
    "Recurring gap:",
    application.visibleGap,
    "",
    "Additional context:",
    application.additionalContext || "None provided",
    "",
    `Submitted: ${application.createdAt}`,
  ].join("\n");
}

function labelStatus(status: string): string {
  return status.replaceAll("_", " ");
}
