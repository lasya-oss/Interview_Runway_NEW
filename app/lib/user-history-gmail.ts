import { isInternalFullAccessEmail } from "@/app/lib/internal-access";

export const USER_HISTORY_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const GOOGLE_USERINFO_URLS = [
  "https://openidconnect.googleapis.com/v1/userinfo",
  "https://www.googleapis.com/oauth2/v3/userinfo",
] as const;
const GMAIL_SEND_URL = "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";
const MAX_ACCESS_TOKEN_LENGTH = 8_192;
const MAX_PDF_ATTACHMENT_BYTES = 3_000_000;
const GOOGLE_IDENTITY_ATTEMPTS = 2;
const GOOGLE_IDENTITY_RETRY_DELAY_MS = 100;

export type GmailFailureStage =
  | "input-validation"
  | "identity-request"
  | "identity-response"
  | "identity-match"
  | "gmail-send-request"
  | "gmail-send-response"
  | "gmail-confirmation";

type GmailFailureContext = {
  stage?: GmailFailureStage;
  providerStatus?: number;
  providerReason?: string;
  providerMessage?: string;
  cause?: unknown;
};

class GmailDiagnosticError extends Error {
  readonly stage: GmailFailureStage;
  readonly providerStatus: number | null;
  readonly providerReason: string | null;
  readonly providerMessage: string | null;
  readonly causeMessage: string | null;

  constructor(message: string, defaultStage: GmailFailureStage, context: GmailFailureContext = {}) {
    super(message);
    this.stage = context.stage ?? defaultStage;
    this.providerStatus = context.providerStatus ?? null;
    this.providerReason = sanitizeDiagnostic(context.providerReason);
    this.providerMessage = sanitizeDiagnostic(context.providerMessage);
    this.causeMessage = sanitizeDiagnostic(
      context.cause instanceof Error ? `${context.cause.name}: ${context.cause.message}` : context.cause,
    );
  }
}

export class GmailAuthorizationError extends GmailDiagnosticError {
  constructor(context: GmailFailureContext = {}) {
    super("Gmail authorization does not match the signed-in Vivid Labs account", "identity-match", context);
    this.name = "GmailAuthorizationError";
  }
}

export class GmailDeliveryError extends GmailDiagnosticError {
  constructor(message = "Gmail could not deliver the user history report", context: GmailFailureContext = {}) {
    super(message, "gmail-send-response", context);
    this.name = "GmailDeliveryError";
  }
}

export class GmailProviderUnavailableError extends GmailDeliveryError {
  constructor(context: GmailFailureContext = {}) {
    super("Google identity verification is temporarily unavailable", { stage: "identity-request", ...context });
    this.name = "GmailProviderUnavailableError";
  }
}

export class GmailWorkspacePolicyError extends GmailDeliveryError {
  constructor(context: GmailFailureContext = {}) {
    super("Google Workspace policy does not allow this Gmail delivery", context);
    this.name = "GmailWorkspacePolicyError";
  }
}

export class GmailQuotaError extends GmailDeliveryError {
  constructor(context: GmailFailureContext = {}) {
    super("Gmail has temporarily limited report delivery", context);
    this.name = "GmailQuotaError";
  }
}

export class GmailDeliveryIndeterminateError extends GmailDiagnosticError {
  constructor(context: GmailFailureContext = {}) {
    super("Gmail did not return a final delivery response", "gmail-confirmation", context);
    this.name = "GmailDeliveryIndeterminateError";
  }
}

export class GmailAttachmentTooLargeError extends GmailDiagnosticError {
  constructor() {
    super("The generated report is too large for this Gmail delivery flow", "input-validation");
    this.name = "GmailAttachmentTooLargeError";
  }
}

export function describeGmailDeliveryFailure(error: unknown) {
  if (error instanceof GmailDiagnosticError) {
    return {
      errorName: error.name,
      message: error.message,
      stage: error.stage,
      providerStatus: error.providerStatus,
      providerReason: error.providerReason,
      providerMessage: error.providerMessage,
      cause: error.causeMessage,
    };
  }
  return {
    errorName: error instanceof Error ? error.name : "UnknownError",
    message: sanitizeDiagnostic(error instanceof Error ? error.message : error) ?? "Unknown error",
    stage: null,
    providerStatus: null,
    providerReason: null,
    providerMessage: null,
    cause: null,
  };
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
  if (!isGoogleAccessToken(input.accessToken)) {
    throw new GmailAuthorizationError({ stage: "input-validation", providerReason: "invalid_access_token_shape" });
  }
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
    throw new GmailAuthorizationError({ stage: "identity-match", providerReason: "signed_in_identity_mismatch" });
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
    response = await fetchWithTimeout(dependencies.fetch, GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "message/rfc822",
      },
      body: message,
      redirect: "error",
    }, 15_000);
  } catch (error) {
    throw new GmailDeliveryIndeterminateError({ stage: "gmail-send-request", cause: error });
  }

  if (response.status === 401) {
    const provider = await readGoogleError(response);
    throw new GmailAuthorizationError(gmailResponseContext(response, provider));
  }
  if (response.status === 403) {
    const provider = await readGoogleError(response);
    const context = gmailResponseContext(response, provider);
    if (GMAIL_AUTHORIZATION_REASONS.has(provider.reason)) throw new GmailAuthorizationError(context);
    if (GMAIL_POLICY_REASONS.has(provider.reason)) throw new GmailWorkspacePolicyError(context);
    if (GMAIL_QUOTA_REASONS.has(provider.reason)) throw new GmailQuotaError(context);
    throw new GmailDeliveryError("Gmail rejected report delivery", context);
  }
  if (response.status === 429) {
    const provider = await readGoogleError(response);
    throw new GmailQuotaError(gmailResponseContext(response, provider));
  }
  if (response.status >= 500) {
    const provider = await readGoogleError(response);
    throw new GmailDeliveryIndeterminateError(gmailResponseContext(response, provider));
  }
  if (!response.ok) {
    const provider = await readGoogleError(response);
    throw new GmailDeliveryError(
      `Gmail delivery returned status ${response.status}`,
      gmailResponseContext(response, provider),
    );
  }

  const result = response.headers.get("content-type")?.toLowerCase().includes("application/json")
    ? await response.json().catch(() => null) as { id?: unknown } | null
    : null;
  if (typeof result?.id !== "string" || !result.id.trim()) {
    throw new GmailDeliveryIndeterminateError({
      stage: "gmail-confirmation",
      providerStatus: response.status,
      providerReason: "missing_message_id",
    });
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

type GoogleProviderError = { reason: string; message: string };

async function readGoogleError(response: Response): Promise<GoogleProviderError> {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return { reason: "", message: "" };
  }
  const body = await response.json().catch(() => null) as {
    error?: {
      errors?: Array<{ reason?: unknown }>;
      message?: unknown;
    };
  } | null;
  const reason = body?.error?.errors?.find((item) => typeof item.reason === "string")?.reason;
  return {
    reason: typeof reason === "string" ? reason.replace(/[^a-z]/gi, "").toLowerCase() : "",
    message: typeof body?.error?.message === "string" ? body.error.message : "",
  };
}

function gmailResponseContext(response: Response, provider: GoogleProviderError): GmailFailureContext {
  return {
    stage: "gmail-send-response",
    providerStatus: response.status,
    providerReason: provider.reason,
    providerMessage: provider.message,
  };
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
  let lastFailure: GmailFailureContext = { stage: "identity-request" };
  for (const userInfoUrl of GOOGLE_USERINFO_URLS) {
    for (let attempt = 1; attempt <= GOOGLE_IDENTITY_ATTEMPTS; attempt += 1) {
      let response: Response;
      try {
        response = await fetchWithTimeout(fetchImpl, userInfoUrl, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
            "Cache-Control": "no-store",
          },
          redirect: "error",
        }, 8_000);
      } catch (error) {
        lastFailure = { stage: "identity-request", cause: error };
        if (attempt < GOOGLE_IDENTITY_ATTEMPTS) {
          await waitForGoogleIdentityRetry();
          continue;
        }
        break;
      }

      if (response.status === 401 || response.status === 403) {
        const provider = await readGoogleError(response);
        throw new GmailAuthorizationError({
          stage: "identity-response",
          providerStatus: response.status,
          providerReason: provider.reason,
          providerMessage: provider.message,
        });
      }
      if (response.status === 408 || response.status === 429 || response.status >= 500) {
        const provider = await readGoogleError(response);
        lastFailure = {
          stage: "identity-response",
          providerStatus: response.status,
          providerReason: provider.reason,
          providerMessage: provider.message,
        };
        if (attempt < GOOGLE_IDENTITY_ATTEMPTS) {
          await waitForGoogleIdentityRetry();
          continue;
        }
        break;
      }
      if (!response.ok) {
        const provider = await readGoogleError(response);
        throw new GmailDeliveryError(`Google identity verification returned status ${response.status}`, {
          stage: "identity-response",
          providerStatus: response.status,
          providerReason: provider.reason,
          providerMessage: provider.message,
        });
      }
      if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
        lastFailure = {
          stage: "identity-response",
          providerStatus: response.status,
          providerReason: "unexpected_content_type",
          providerMessage: response.headers.get("content-type") ?? "missing content-type",
        };
        break;
      }

      const body = await response.json().catch(() => null) as {
        email?: unknown;
        email_verified?: unknown;
        hd?: unknown;
        sub?: unknown;
      } | null;
      if (!body || typeof body.email !== "string" || typeof body.hd !== "string") {
        throw new GmailAuthorizationError({
          stage: "identity-response",
          providerStatus: response.status,
          providerReason: "incomplete_workspace_identity",
        });
      }
      return {
        email: body.email,
        emailVerified: body.email_verified === true,
        hostedDomain: body.hd,
        subject: typeof body.sub === "string" ? body.sub : "",
      };
    }
  }

  throw new GmailProviderUnavailableError(lastFailure);
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function waitForGoogleIdentityRetry() {
  return new Promise<void>((resolve) => setTimeout(resolve, GOOGLE_IDENTITY_RETRY_DELAY_MS));
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

function sanitizeDiagnostic(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  return normalized ? normalized.slice(0, 500) : null;
}
