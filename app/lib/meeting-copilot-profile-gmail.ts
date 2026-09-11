import { isInternalFullAccessEmail } from "@/app/lib/internal-access";
import type { MeetingCopilotSavedProfileCopy } from "@/app/lib/meeting-copilot-profile-copy";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_GMAIL_PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
const GOOGLE_GMAIL_SEND_URL = "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media";
const MAX_PROFILE_REPORT_BYTES = 3_000_000;
// Gmail receives a raw RFC 822 message. Two 12 MiB source PDFs expand to
// roughly 32 MiB under base64, leaving a narrow bounded margin for line
// wrapping, the compact profile report, and MIME headers.
export const MAX_MEETING_COPILOT_GMAIL_MESSAGE_BYTES = 35_000_000;

type GmailConfiguration = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  senderEmail: string;
  recipients: readonly string[];
  internalDomain: string;
};

type DeliveryDependencies = {
  fetch: typeof fetch;
  now: () => Date;
  configuration: GmailConfiguration;
};

export class MeetingCopilotProfileDeliveryError extends Error {
  readonly code: "configuration" | "authorization" | "quota" | "rejected" | "indeterminate";

  constructor(
    code: MeetingCopilotProfileDeliveryError["code"],
    message = "Meeting Copilot profile copy could not be delivered",
  ) {
    super(message);
    this.name = "MeetingCopilotProfileDeliveryError";
    this.code = code;
  }
}

export function readMeetingCopilotGmailConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): GmailConfiguration {
  const internalDomain = environment.INTERNAL_FULL_ACCESS_DOMAIN?.trim().toLowerCase() ?? "";
  const clientId = environment.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = environment.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const refreshToken = environment.GOOGLE_GMAIL_REFRESH_TOKEN?.trim() ?? "";
  const senderEmail = normalizeEmail(environment.GOOGLE_GMAIL_SENDER_EMAIL ?? "");
  const recipients = uniqueEmails(environment.MEETING_COPILOT_PROFILE_RECIPIENTS ?? "");
  if (
    !internalDomain
    || internalDomain.includes("@")
    || !clientId
    || !clientSecret
    || !refreshToken
    || !isInternalFullAccessEmail(senderEmail, internalDomain)
    || recipients.length === 0
    || recipients.some((recipient) => !isInternalFullAccessEmail(recipient, internalDomain))
  ) {
    throw new MeetingCopilotProfileDeliveryError(
      "configuration",
      "Google Workspace profile delivery is not configured",
    );
  }
  return {
    clientId,
    clientSecret,
    refreshToken,
    senderEmail,
    recipients,
    internalDomain,
  };
}

export async function deliverMeetingCopilotProfileCopy(
  {
    pdf,
    saved,
    userEmail,
  }: {
    pdf: Uint8Array;
    saved: MeetingCopilotSavedProfileCopy;
    userEmail: string;
  },
  overrides: Partial<DeliveryDependencies> = {},
) {
  if (pdf.byteLength === 0 || pdf.byteLength > MAX_PROFILE_REPORT_BYTES) {
    throw new MeetingCopilotProfileDeliveryError("rejected", "Profile report is too large");
  }
  const dependencies: DeliveryDependencies = {
    fetch: overrides.fetch ?? globalThis.fetch,
    now: overrides.now ?? (() => new Date()),
    configuration: overrides.configuration ?? readMeetingCopilotGmailConfiguration(),
  };
  const accessToken = await refreshGoogleAccessToken(dependencies);
  await verifyGoogleMailbox(dependencies, accessToken);
  const message = createMeetingCopilotProfileMessage({
    configuration: dependencies.configuration,
    messageId: saved.eventId,
    pdf,
    saved,
    sentAt: dependencies.now(),
    userEmail: normalizeEmail(userEmail),
  });
  let response: Response;
  try {
    response = await dependencies.fetch(GOOGLE_GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "message/rfc822",
      },
      body: message,
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new MeetingCopilotProfileDeliveryError("indeterminate");
  }
  if (response.status === 401 || response.status === 403) {
    throw new MeetingCopilotProfileDeliveryError("authorization");
  }
  if (response.status === 429) {
    throw new MeetingCopilotProfileDeliveryError("quota");
  }
  if (response.status >= 500) {
    throw new MeetingCopilotProfileDeliveryError("indeterminate");
  }
  if (!response.ok) {
    throw new MeetingCopilotProfileDeliveryError("rejected");
  }
  const result = response.headers.get("content-type")?.toLowerCase().includes("application/json")
    ? await response.json().catch(() => null) as { id?: unknown } | null
    : null;
  if (typeof result?.id !== "string" || !result.id.trim()) {
    throw new MeetingCopilotProfileDeliveryError("indeterminate");
  }
  return {
    messageId: result.id,
    recipients: [...dependencies.configuration.recipients],
  };
}

async function verifyGoogleMailbox(dependencies: DeliveryDependencies, accessToken: string) {
  let response: Response;
  try {
    response = await dependencies.fetch(GOOGLE_GMAIL_PROFILE_URL, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-store",
      },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new MeetingCopilotProfileDeliveryError("indeterminate");
  }
  if (response.status === 401 || response.status === 403) {
    throw new MeetingCopilotProfileDeliveryError("authorization");
  }
  if (response.status === 429) throw new MeetingCopilotProfileDeliveryError("quota");
  if (!response.ok) throw new MeetingCopilotProfileDeliveryError("indeterminate");
  const body = response.headers.get("content-type")?.toLowerCase().includes("application/json")
    ? await response.json().catch(() => null) as { emailAddress?: unknown } | null
    : null;
  if (
    typeof body?.emailAddress !== "string"
    || normalizeEmail(body.emailAddress) !== dependencies.configuration.senderEmail
  ) {
    throw new MeetingCopilotProfileDeliveryError("authorization");
  }
}

export function createMeetingCopilotProfileMessage({
  configuration,
  messageId,
  pdf,
  saved,
  sentAt,
  userEmail,
}: {
  configuration: GmailConfiguration;
  messageId: string;
  pdf: Uint8Array;
  saved: MeetingCopilotSavedProfileCopy;
  sentAt: Date;
  userEmail: string;
}) {
  const profile = saved.profile;
  const updated = profile.revision > 1 || profile.updatedAt !== profile.createdAt;
  const safeId = messageId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64) || "profile";
  const boundary = `=_InterviewRunway_Profile_${safeId}`;
  const filename = "meeting-copilot-profile-report.pdf";
  const subject = `Interview Runway Meeting Copilot profile ${updated ? "updated" : "created"}`;
  const text = [
    `A Meeting Copilot profile was ${updated ? "updated" : "created"} by ${safeHeader(userEmail)}.`,
    "",
    `Profile: ${safeHeader(profile.name)}`,
    `Revision: ${profile.revision}`,
    `Saved: ${profile.updatedAt}`,
    "",
    "What should it focus on?",
    profile.focus,
    "",
    "Custom guidance",
    profile.customGuidance || "No custom guidance was provided.",
    "",
    `Resume source file: ${profile.resume.filename}`,
    `Job-description source file: ${profile.jobDescription.filename}`,
    "",
    "The confidential profile report and the exact resume and job-description PDFs committed with this profile revision are attached.",
    "The source files remain private attachments and are not exposed through a public URL.",
  ].join("\n");

  const message = [
    `From: Interview Runway <${safeHeader(configuration.senderEmail)}>`,
    `To: ${configuration.recipients.map(safeHeader).join(", ")}`,
    `Subject: ${subject}`,
    `Date: ${sentAt.toUTCString()}`,
    `Message-ID: <interviewrunway-profile-${safeId}@interviewrunway.com>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(bytesToBase64(new TextEncoder().encode(text))),
    "",
    ...pdfAttachmentPart(boundary, filename, bytesToBase64(pdf), "Meeting Copilot profile report"),
    ...pdfAttachmentPart(
      boundary,
      "resume.pdf",
      profile.resume.contentBase64,
      "Resume PDF",
    ),
    ...pdfAttachmentPart(
      boundary,
      "job-description.pdf",
      profile.jobDescription.contentBase64,
      "Job description PDF",
    ),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  if (new TextEncoder().encode(message).byteLength > MAX_MEETING_COPILOT_GMAIL_MESSAGE_BYTES) {
    throw new MeetingCopilotProfileDeliveryError(
      "rejected",
      "Profile email exceeds the secure Gmail message limit",
    );
  }
  return message;
}

function pdfAttachmentPart(
  boundary: string,
  filename: string,
  contentBase64: string,
  description: string,
) {
  return [
    `--${boundary}`,
    "Content-Type: application/pdf",
    "Content-Transfer-Encoding: base64",
    `Content-Description: ${description}`,
    `Content-Disposition: attachment; filename="${filename}"`,
    "",
    wrapBase64(contentBase64),
    "",
  ];
}

async function refreshGoogleAccessToken(dependencies: DeliveryDependencies) {
  const { configuration } = dependencies;
  let response: Response;
  try {
    response = await dependencies.fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
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
    throw new MeetingCopilotProfileDeliveryError("indeterminate");
  }
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    throw new MeetingCopilotProfileDeliveryError("authorization");
  }
  if (response.status === 429) throw new MeetingCopilotProfileDeliveryError("quota");
  if (!response.ok) throw new MeetingCopilotProfileDeliveryError("indeterminate");
  const body = response.headers.get("content-type")?.toLowerCase().includes("application/json")
    ? await response.json().catch(() => null) as { access_token?: unknown; token_type?: unknown } | null
    : null;
  if (
    typeof body?.access_token !== "string"
    || body.access_token.length < 16
    || body.access_token.length > 8_192
    || /\s/.test(body.access_token)
    || (typeof body.token_type === "string" && body.token_type.toLowerCase() !== "bearer")
  ) {
    throw new MeetingCopilotProfileDeliveryError("authorization");
  }
  return body.access_token;
}

function uniqueEmails(value: string) {
  return [...new Set(value.split(/[\s,]+/).map(normalizeEmail).filter(Boolean))];
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function safeHeader(value: string) {
  const safe = value.replace(/[\r\n\0]/g, " ").replace(/\s+/g, " ").trim();
  if (!safe) throw new MeetingCopilotProfileDeliveryError("rejected");
  return safe;
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
