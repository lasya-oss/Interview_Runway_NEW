import { isInternalFullAccessEmail } from "@/app/lib/internal-access";

export const USER_HISTORY_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";
const MAX_ACCESS_TOKEN_LENGTH = 8_192;
const MAX_PDF_ATTACHMENT_BYTES = 3_000_000;

export class GmailAuthorizationError extends Error {
  constructor() {
    super("Gmail authorization does not match the signed-in Vivid Labs account");
    this.name = "GmailAuthorizationError";
  }
}

export class GmailDeliveryError extends Error {
  constructor(message = "Gmail could not deliver the user history report") {
    super(message);
    this.name = "GmailDeliveryError";
  }
}

export class GmailWorkspacePolicyError extends GmailDeliveryError {
  constructor() {
    super("Google Workspace policy does not allow this Gmail delivery");
    this.name = "GmailWorkspacePolicyError";
  }
}

export class GmailQuotaError extends GmailDeliveryError {
  constructor() {
    super("Gmail has temporarily limited report delivery");
    this.name = "GmailQuotaError";
  }
}

export class GmailDeliveryIndeterminateError extends Error {
  constructor() {
    super("Gmail did not return a final delivery response");
    this.name = "GmailDeliveryIndeterminateError";
  }
}

export class GmailAttachmentTooLargeError extends Error {
  constructor() {
    super("The generated report is too large for this Gmail delivery flow");
    this.name = "GmailAttachmentTooLargeError";
  }
}

type GmailDeliveryDependencies = {
  fetch: typeof fetch;
  now: () => Date;
  randomId: () => string;
  configuredDomain: string | undefined;
};

type GmailDeliveryInput = {
  accessToken: string;
  learnerEmail: string;
  pdf: Uint8Array;
  recipientEmail: string;
  recipientSubject: string;
};

export function isGoogleAccessToken(value: unknown): value is string {
  return typeof value === "string"
    && value.length >= 16
    && value.length <= MAX_ACCESS_TOKEN_LENGTH
    && !/\s/.test(value);
}

export function readGoogleBearerToken(value: string | null) {
  const match = value?.match(/^Bearer ([^\s]+)$/);
  return match && isGoogleAccessToken(match[1]) ? match[1] : null;
}

export async function deliverUserHistoryReportWithGmail(
  input: GmailDeliveryInput,
  overrides: Partial<GmailDeliveryDependencies> = {},
) {
  if (!isGoogleAccessToken(input.accessToken)) throw new GmailAuthorizationError();
  if (input.pdf.byteLength > MAX_PDF_ATTACHMENT_BYTES) throw new GmailAttachmentTooLargeError();

  const dependencies: GmailDeliveryDependencies = {
    fetch: overrides.fetch ?? globalThis.fetch,
    now: overrides.now ?? (() => new Date()),
    randomId: overrides.randomId ?? (() => crypto.randomUUID()),
    configuredDomain: overrides.configuredDomain ?? process.env.INTERNAL_FULL_ACCESS_DOMAIN,
  };
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const learnerEmail = normalizeEmail(input.learnerEmail);
  assertSafeHeaderValue(recipientEmail);
  assertSafeHeaderValue(learnerEmail);

  const identity = await readGoogleIdentity(dependencies.fetch, input.accessToken);
  const configuredDomain = dependencies.configuredDomain?.trim().toLowerCase();
  if (
    !configuredDomain
    || identity.emailVerified !== true
    || !identity.subject
    || identity.subject !== input.recipientSubject
    || normalizeEmail(identity.email) !== recipientEmail
    || normalizeEmail(identity.hostedDomain) !== configuredDomain
    || !isInternalFullAccessEmail(identity.email, configuredDomain)
  ) {
    throw new GmailAuthorizationError();
  }

  const message = createGmailReportMessage({
    learnerEmail,
    pdf: input.pdf,
    recipientEmail,
    sentAt: dependencies.now(),
    messageId: dependencies.randomId(),
  });

  let response: Response;
  try {
    response = await dependencies.fetch(GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "message/rfc822",
      },
      body: message,
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new GmailDeliveryIndeterminateError();
  }

  if (response.status === 401) {
    throw new GmailAuthorizationError();
  }
  if (response.status === 403) {
    const reason = await readGmailErrorReason(response);
    if (GMAIL_AUTHORIZATION_REASONS.has(reason)) throw new GmailAuthorizationError();
    if (GMAIL_POLICY_REASONS.has(reason)) throw new GmailWorkspacePolicyError();
    if (GMAIL_QUOTA_REASONS.has(reason)) throw new GmailQuotaError();
    throw new GmailDeliveryError("Gmail rejected report delivery");
  }
  if (response.status === 429) throw new GmailQuotaError();
  if (response.status >= 500) {
    throw new GmailDeliveryIndeterminateError();
  }
  if (!response.ok) {
    throw new GmailDeliveryError(`Gmail delivery returned status ${response.status}`);
  }

  const result = response.headers.get("content-type")?.toLowerCase().includes("application/json")
    ? await response.json().catch(() => null) as { id?: unknown } | null
    : null;
  if (typeof result?.id !== "string" || !result.id.trim()) {
    throw new GmailDeliveryIndeterminateError();
  }

  return {
    messageId: result.id,
    recipientEmail,
  };
}

const GMAIL_AUTHORIZATION_REASONS = new Set([
  "autherror",
  "insufficientauthenticationscopes",
  "insufficientpermissions",
  "invalidcredentials",
]);

const GMAIL_POLICY_REASONS = new Set([
  "accessnotconfigured",
  "domainpolicy",
]);

const GMAIL_QUOTA_REASONS = new Set([
  "dailylimitexceeded",
  "quotaexceeded",
  "ratelimitexceeded",
  "userratelimitexceeded",
]);

async function readGmailErrorReason(response: Response) {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) return "";
  const body = await response.json().catch(() => null) as {
    error?: {
      errors?: Array<{ reason?: unknown }>;
    };
  } | null;
  const reason = body?.error?.errors?.find((item) => typeof item.reason === "string")?.reason;
  return typeof reason === "string" ? reason.replace(/[^a-z]/gi, "").toLowerCase() : "";
}

export function createGmailReportMessage({
  learnerEmail,
  messageId,
  pdf,
  recipientEmail,
  sentAt,
}: {
  learnerEmail: string;
  messageId: string;
  pdf: Uint8Array;
  recipientEmail: string;
  sentAt: Date;
}) {
  assertSafeHeaderValue(recipientEmail);
  assertSafeHeaderValue(learnerEmail);
  const safeId = messageId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64) || "report";
  const boundary = `=_InterviewRunway_${safeId}`;
  const filename = "interviewrunway-user-history-report.pdf";
  const text = [
    `The Interview Runway User History Report for ${learnerEmail} is attached.`,
    "",
    "This report contains confidential learner information and was requested from your authenticated Vivid Labs account.",
    "Keep it within approved Vivid Labs workflows and do not forward it externally.",
  ].join("\n");

  return [
    `From: Interview Runway <${recipientEmail}>`,
    `To: ${recipientEmail}`,
    "Subject: Interview Runway User History Report",
    `Date: ${sentAt.toUTCString()}`,
    `Message-ID: <interviewrunway-report-${safeId}@interviewrunway.com>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(bytesToBase64(new TextEncoder().encode(text))),
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${filename}"`,
    "",
    wrapBase64(bytesToBase64(pdf)),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function readGoogleIdentity(fetchImpl: typeof fetch, accessToken: string) {
  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_USERINFO_URL, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-store",
      },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new GmailDeliveryError("Google identity verification is unavailable");
  }
  if (response.status === 401 || response.status === 403) throw new GmailAuthorizationError();
  if (!response.ok) throw new GmailDeliveryError("Google identity verification is unavailable");
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new GmailDeliveryError("Google identity verification returned an unexpected response");
  }

  const body = await response.json().catch(() => null) as {
    email?: unknown;
    email_verified?: unknown;
    hd?: unknown;
    sub?: unknown;
  } | null;
  if (!body || typeof body.email !== "string" || typeof body.hd !== "string") {
    throw new GmailAuthorizationError();
  }
  return {
    email: body.email,
    emailVerified: body.email_verified === true,
    hostedDomain: body.hd,
    subject: typeof body.sub === "string" ? body.sub : "",
  };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function assertSafeHeaderValue(value: string) {
  if (!value || /[\r\n]/.test(value)) throw new GmailAuthorizationError();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
