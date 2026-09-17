import type { VoiceSession } from "@/app/lib/voice-session-store";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_GMAIL_PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
const GOOGLE_GMAIL_SEND_URL = "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";

export class VoiceReportDeliveryError extends Error {
  constructor(public readonly code: "configuration" | "authorization" | "quota" | "rejected" | "indeterminate") {
    super("Voice report could not be delivered");
    this.name = "VoiceReportDeliveryError";
  }
}

export async function deliverVoiceReport(input: {
  email: string;
  pdf: Uint8Array;
  session: VoiceSession;
}, overrides: { fetchImpl?: typeof fetch; now?: () => Date; env?: NodeJS.ProcessEnv } = {}) {
  if (!input.pdf.byteLength || input.pdf.byteLength > 3_000_000) throw new VoiceReportDeliveryError("rejected");
  const env = overrides.env ?? process.env;
  const configuration = {
    clientId: env.GOOGLE_CLIENT_ID?.trim() ?? "",
    clientSecret: env.GOOGLE_CLIENT_SECRET?.trim() ?? "",
    refreshToken: env.GOOGLE_GMAIL_REFRESH_TOKEN?.trim() ?? "",
    senderEmail: normalizeEmail(env.GOOGLE_GMAIL_SENDER_EMAIL ?? ""),
  };
  if (!configuration.clientId || !configuration.clientSecret || !configuration.refreshToken || !isEmail(configuration.senderEmail)) {
    throw new VoiceReportDeliveryError("configuration");
  }
  const recipient = normalizeEmail(input.email);
  if (!isEmail(recipient)) throw new VoiceReportDeliveryError("rejected");
  const fetchImpl = overrides.fetchImpl ?? fetch;
  const accessToken = await refreshAccessToken(fetchImpl, configuration);
  await verifyMailbox(fetchImpl, accessToken, configuration.senderEmail);
  const message = createVoiceReportMessage({
    senderEmail: configuration.senderEmail,
    recipient,
    session: input.session,
    pdf: input.pdf,
    sentAt: (overrides.now ?? (() => new Date()))(),
  });
  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_GMAIL_SEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "message/rfc822", Accept: "application/json" },
      body: message,
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new VoiceReportDeliveryError("indeterminate");
  }
  if (response.status === 401 || response.status === 403) throw new VoiceReportDeliveryError("authorization");
  if (response.status === 429) throw new VoiceReportDeliveryError("quota");
  if (response.status >= 500) throw new VoiceReportDeliveryError("indeterminate");
  if (!response.ok) throw new VoiceReportDeliveryError("rejected");
  const result = await response.json().catch(() => null) as { id?: unknown } | null;
  if (typeof result?.id !== "string" || !result.id.trim()) throw new VoiceReportDeliveryError("indeterminate");
  return { messageId: result.id };
}

export function createVoiceReportMessage(input: {
  senderEmail: string;
  recipient: string;
  session: VoiceSession;
  pdf: Uint8Array;
  sentAt: Date;
}) {
  const boundary = `=_InterviewRunway_Voice_${input.session.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64)}`;
  const text = [
    "Your Interview Runway voice mock report is ready.",
    "",
    `Verdict: ${input.session.score?.sessionVerdict ?? "Report ready"}`,
    "The attached PDF contains the answer-level rubric, priority gaps, and recommended drills.",
    "You can also view or delete the transcript from your private learner workspace.",
  ].join("\n");
  return [
    `From: Interview Runway <${safeHeader(input.senderEmail)}>`,
    `To: ${safeHeader(input.recipient)}`,
    "Subject: Your voice mock interview report",
    `Date: ${input.sentAt.toUTCString()}`,
    `Message-ID: <voice-${safeHeader(input.session.id)}@interviewrunway.com>`,
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
    "Content-Type: application/pdf",
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: attachment; filename=\"voice-mock-interview-report.pdf\"",
    "",
    wrapBase64(bytesToBase64(input.pdf)),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function refreshAccessToken(fetchImpl: typeof fetch, configuration: { clientId: string; clientSecret: string; refreshToken: string }) {
  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        refresh_token: configuration.refreshToken,
        grant_type: "refresh_token",
      }).toString(),
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new VoiceReportDeliveryError("indeterminate");
  }
  if (response.status === 400 || response.status === 401 || response.status === 403) throw new VoiceReportDeliveryError("authorization");
  if (response.status === 429) throw new VoiceReportDeliveryError("quota");
  if (!response.ok) throw new VoiceReportDeliveryError("indeterminate");
  const body = await response.json().catch(() => null) as { access_token?: unknown } | null;
  if (typeof body?.access_token !== "string" || body.access_token.length < 16) throw new VoiceReportDeliveryError("authorization");
  return body.access_token;
}

async function verifyMailbox(fetchImpl: typeof fetch, token: string, senderEmail: string) {
  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_GMAIL_PROFILE_URL, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Cache-Control": "no-store" },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new VoiceReportDeliveryError("indeterminate");
  }
  if (response.status === 401 || response.status === 403) throw new VoiceReportDeliveryError("authorization");
  if (response.status === 429) throw new VoiceReportDeliveryError("quota");
  if (!response.ok) throw new VoiceReportDeliveryError("indeterminate");
  const body = await response.json().catch(() => null) as { emailAddress?: unknown } | null;
  if (typeof body?.emailAddress !== "string" || normalizeEmail(body.emailAddress) !== senderEmail) {
    throw new VoiceReportDeliveryError("authorization");
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function safeHeader(value: string) {
  const safe = value.replace(/[\r\n\0]/g, " ").replace(/\s+/g, " ").trim();
  if (!safe) throw new VoiceReportDeliveryError("rejected");
  return safe;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+$/.test(value) && value.length <= 254;
}
