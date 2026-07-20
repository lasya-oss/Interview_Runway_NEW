export const PHASE_ONE_STATUSES = ["completed", "not_completed"] as const;
export const PHASE_TWO_STATUSES = ["completed", "in_progress", "not_started"] as const;

export type PhaseOneStatus = (typeof PHASE_ONE_STATUSES)[number];
export type PhaseTwoStatus = (typeof PHASE_TWO_STATUSES)[number];

export type QualificationApplicationInput = {
  accountEmail: string;
  phaseOneStatus: PhaseOneStatus;
  phaseTwoStatus: PhaseTwoStatus;
  whatsappSupportPerson: string;
  targetRole: string;
  visibleGap: string;
  additionalContext: string | null;
  consent: true;
};

type ValidationResult =
  | { ok: true; value: QualificationApplicationInput }
  | { ok: false; error: string; field?: string };

export function validateQualificationApplication(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Enter the requested application details." };
  }

  const record = body as Record<string, unknown>;
  const accountEmail = cleanText(record.accountEmail);
  if (!accountEmail || accountEmail.length > 254 || !isEmail(accountEmail)) {
    return { ok: false, field: "accountEmail", error: "Enter the email address connected to your InterviewRunway account." };
  }

  if (!isOneOf(record.phaseOneStatus, PHASE_ONE_STATUSES)) {
    return { ok: false, field: "phaseOneStatus", error: "Tell us whether you completed Foundation." };
  }

  if (!isOneOf(record.phaseTwoStatus, PHASE_TWO_STATUSES)) {
    return { ok: false, field: "phaseTwoStatus", error: "Tell us where you are in the Second Seat." };
  }

  const whatsappSupportPerson = cleanText(record.whatsappSupportPerson);
  if (!whatsappSupportPerson || whatsappSupportPerson.length > 120) {
    return { ok: false, field: "whatsappSupportPerson", error: "Enter the name of your WhatsApp support person, or write “Not sure”." };
  }

  const targetRole = cleanText(record.targetRole);
  if (!targetRole || targetRole.length < 3 || targetRole.length > 180) {
    return { ok: false, field: "targetRole", error: "Enter the role you are preparing for." };
  }

  const visibleGap = cleanText(record.visibleGap);
  if (!visibleGap || visibleGap.length < 20 || visibleGap.length > 1_200) {
    return { ok: false, field: "visibleGap", error: "Describe the recurring interview gap in at least 20 characters." };
  }

  const additionalContext = cleanText(record.additionalContext);
  if (additionalContext.length > 1_500) {
    return { ok: false, field: "additionalContext", error: "Keep the additional context under 1,500 characters." };
  }

  if (record.consent !== true) {
    return { ok: false, field: "consent", error: "Confirm that we may review this application and contact you about Phase 3." };
  }

  return {
    ok: true,
    value: {
      accountEmail: accountEmail.toLowerCase(),
      phaseOneStatus: record.phaseOneStatus,
      phaseTwoStatus: record.phaseTwoStatus,
      whatsappSupportPerson,
      targetRole,
      visibleGap,
      additionalContext: additionalContext || null,
      consent: true,
    },
  };
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isOneOf<const T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}
