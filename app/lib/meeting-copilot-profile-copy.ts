import { createTextPdf } from "@/app/lib/text-pdf";

export const MEETING_COPILOT_PROFILE_COPY_SCHEMA_VERSION = 1;
export const MAX_MEETING_COPILOT_SOURCE_PDF_BYTES = 12 * 1024 * 1024;
export const MAX_MEETING_COPILOT_COMBINED_SOURCE_PDF_BYTES = 12 * 1024 * 1024;
// A combined 12 MiB of canonical base64 source data requires about 16 MiB.
// This narrow margin also covers bounded extracted text and JSON structure
// without making the Worker accept an unnecessarily large request body.
export const MAX_MEETING_COPILOT_PROFILE_COPY_BYTES = 18_500_000;
const MAX_DOCUMENT_TEXT_CHARACTERS = 90_000;

export type MeetingCopilotSavedDocument = {
  filename: string;
  sha256: string;
  text: string;
  sizeBytes: number;
  contentBase64: string;
};

export type MeetingCopilotSavedProfileCopy = {
  schemaVersion: typeof MEETING_COPILOT_PROFILE_COPY_SCHEMA_VERSION;
  eventId: string;
  profile: {
    id: string;
    revision: number;
    slug: string;
    name: string;
    focus: string;
    customGuidance: string;
    createdAt: string;
    updatedAt: string;
    targetRole?: string;
    resume: MeetingCopilotSavedDocument;
    jobDescription: MeetingCopilotSavedDocument;
  };
};

export type MeetingCopilotProfileCopyIdentity = {
  userEmail: string;
  userName: string | null;
  ownerKey: string;
};

export async function parseMeetingCopilotSavedProfileCopy(
  value: unknown,
): Promise<MeetingCopilotSavedProfileCopy | null> {
  if (!isPlainObject(value) || !hasExactKeys(value, ["schemaVersion", "eventId", "profile"])) {
    return null;
  }
  if (
    value.schemaVersion !== MEETING_COPILOT_PROFILE_COPY_SCHEMA_VERSION
    || !isUuid(value.eventId)
    || !isPlainObject(value.profile)
  ) {
    return null;
  }

  const profile = value.profile;
  const requiredKeys = [
    "id",
    "revision",
    "slug",
    "name",
    "focus",
    "customGuidance",
    "createdAt",
    "updatedAt",
    "resume",
    "jobDescription",
  ];
  if (!hasOnlyRequiredAndOptionalKeys(profile, requiredKeys, ["targetRole"])) return null;
  if (
    !isUuid(profile.id)
    || !Number.isSafeInteger(profile.revision)
    || Number(profile.revision) < 1
    || !isBoundedText(profile.slug, 1, 64)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.slug)
    || !isBoundedText(profile.name, 1, 100)
    || !isBoundedText(profile.focus, 1, 2_000)
    || !isBoundedText(profile.customGuidance, 0, 3_000)
    || (profile.targetRole !== undefined && !isBoundedText(profile.targetRole, 0, 180))
    || !isIsoTimestamp(profile.createdAt)
    || !isIsoTimestamp(profile.updatedAt)
    || Date.parse(profile.updatedAt) < Date.parse(profile.createdAt)
  ) {
    return null;
  }

  const combinedSourceBytes = declaredDocumentSize(profile.resume)
    + declaredDocumentSize(profile.jobDescription);
  if (
    !Number.isSafeInteger(combinedSourceBytes)
    || combinedSourceBytes < 2
    || combinedSourceBytes > MAX_MEETING_COPILOT_COMBINED_SOURCE_PDF_BYTES
  ) {
    return null;
  }

  // Validate sequentially so the two decoded PDFs and canonicalization buffers
  // are not resident at the same time in a memory-constrained Worker isolate.
  const resume = await parseDocument(profile.resume);
  if (!resume) return null;
  const jobDescription = await parseDocument(profile.jobDescription);
  if (!jobDescription) return null;

  return {
    schemaVersion: MEETING_COPILOT_PROFILE_COPY_SCHEMA_VERSION,
    eventId: value.eventId,
    profile: {
      id: profile.id,
      revision: Number(profile.revision),
      slug: profile.slug.trim(),
      name: cleanText(profile.name),
      focus: cleanMultilineText(profile.focus),
      customGuidance: cleanMultilineText(profile.customGuidance),
      createdAt: new Date(profile.createdAt).toISOString(),
      updatedAt: new Date(profile.updatedAt).toISOString(),
      ...(profile.targetRole === undefined ? {} : { targetRole: cleanText(profile.targetRole) }),
      resume,
      jobDescription,
    },
  };
}

function declaredDocumentSize(value: unknown) {
  return isPlainObject(value) && Number.isSafeInteger(value.sizeBytes)
    ? Number(value.sizeBytes)
    : Number.NaN;
}

export function createMeetingCopilotProfilePdf(
  saved: MeetingCopilotSavedProfileCopy,
  identity: MeetingCopilotProfileCopyIdentity,
) {
  const profile = saved.profile;
  const isUpdate = profile.revision > 1 || profile.updatedAt !== profile.createdAt;
  const userLabel = identity.userName
    ? `${safeReportText(identity.userName)} (${safeReportText(identity.userEmail)})`
    : safeReportText(identity.userEmail);
  const source = [
    "# Confidential Meeting Copilot Profile",
    "Authorized Vivid Labs recipients only. Do not forward externally.",
    "",
    "# Profile record",
    `Record type: ${isUpdate ? "Updated profile" : "New profile"}`,
    `User: ${userLabel}`,
    `Profile name: ${safeReportText(profile.name)}`,
    `Revision: ${profile.revision}`,
    `Created: ${formatTimestamp(profile.createdAt)}`,
    `Updated: ${formatTimestamp(profile.updatedAt)}`,
    ...(profile.targetRole ? [`Target role: ${safeReportText(profile.targetRole)}`] : []),
    "",
    "# What should it focus on?",
    asVerbatimReportText(profile.focus),
    "",
    "# Custom guidance",
    profile.customGuidance
      ? asVerbatimReportText(profile.customGuidance)
      : "No custom guidance was provided.",
    "",
    "# Resume",
    `Saved source file: ${safeReportText(profile.resume.filename)}`,
    "The exact committed resume PDF is attached privately to the same Vivid Labs email. It is not exposed through a public URL.",
    "",
    "# Job description",
    `Saved source file: ${safeReportText(profile.jobDescription.filename)}`,
    "The exact committed job-description PDF is attached privately to the same Vivid Labs email. It is not exposed through a public URL.",
  ].join("\n");

  return createTextPdf(
    "Meeting Copilot Profile",
    `meeting-copilot-profile-${profile.id}-r${profile.revision}.pdf`,
    source,
    {
      headerLabel: "MEETING COPILOT / PROFILE RECORD",
      subtitle: "CONFIDENTIAL / AUTHORIZED VIVID LABS USE",
      sourceLabel: null,
      footerLabel: "INTERVIEWRUNWAY / CONFIDENTIAL",
    },
  );
}

async function parseDocument(value: unknown): Promise<MeetingCopilotSavedDocument | null> {
  if (
    !isPlainObject(value)
    || !hasExactKeys(value, ["filename", "sha256", "text", "sizeBytes", "contentBase64"])
  ) {
    return null;
  }
  if (
    !isBoundedText(value.filename, 1, 240)
    || typeof value.sha256 !== "string"
    || !/^[a-f0-9]{64}$/.test(value.sha256)
    || !isBoundedText(value.text, 40, MAX_DOCUMENT_TEXT_CHARACTERS)
    || !Number.isSafeInteger(value.sizeBytes)
    || Number(value.sizeBytes) < 1
    || Number(value.sizeBytes) > MAX_MEETING_COPILOT_SOURCE_PDF_BYTES
    || typeof value.contentBase64 !== "string"
  ) {
    return null;
  }
  const filename = cleanFilename(value.filename);
  if (!filename || filename !== value.filename || filename === "." || filename === "..") return null;
  const sourceBytes = decodeCanonicalBase64(value.contentBase64, Number(value.sizeBytes));
  if (!sourceBytes || !hasPdfEnvelope(sourceBytes)) return null;
  const digest = await sha256Hex(sourceBytes);
  if (digest !== value.sha256) return null;
  return {
    filename,
    sha256: value.sha256,
    text: cleanMultilineText(value.text),
    sizeBytes: Number(value.sizeBytes),
    contentBase64: value.contentBase64,
  };
}

function decodeCanonicalBase64(value: string, expectedBytes: number) {
  const expectedCharacters = Math.ceil(expectedBytes / 3) * 4;
  if (
    value.length !== expectedCharacters
    || value.length % 4 !== 0
    || !hasCanonicalBase64Alphabet(value, expectedBytes)
  ) {
    return null;
  }
  try {
    const binary = atob(value);
    if (binary.length !== expectedBytes) return null;
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function hasCanonicalBase64Alphabet(value: string, expectedBytes: number) {
  const expectedPadding = expectedBytes % 3 === 1 ? 2 : expectedBytes % 3 === 2 ? 1 : 0;
  const contentLength = value.length - expectedPadding;
  for (let index = 0; index < contentLength; index += 1) {
    const code = value.charCodeAt(index);
    const valid = (
      (code >= 0x41 && code <= 0x5a)
      || (code >= 0x61 && code <= 0x7a)
      || (code >= 0x30 && code <= 0x39)
      || code === 0x2b
      || code === 0x2f
    );
    if (!valid) return false;
  }
  for (let index = contentLength; index < value.length; index += 1) {
    if (value.charCodeAt(index) !== 0x3d) return false;
  }
  if (expectedPadding > 0) {
    const finalSextet = base64Sextet(value.charCodeAt(contentLength - 1));
    if (finalSextet < 0) return false;
    if (expectedPadding === 2 && (finalSextet & 0x0f) !== 0) return false;
    if (expectedPadding === 1 && (finalSextet & 0x03) !== 0) return false;
  }
  return true;
}

function base64Sextet(code: number) {
  if (code >= 0x41 && code <= 0x5a) return code - 0x41;
  if (code >= 0x61 && code <= 0x7a) return code - 0x61 + 26;
  if (code >= 0x30 && code <= 0x39) return code - 0x30 + 52;
  if (code === 0x2b) return 62;
  if (code === 0x2f) return 63;
  return -1;
}

function hasPdfEnvelope(value: Uint8Array) {
  const validHeader = value.length >= 13
    && value[0] === 0x25
    && value[1] === 0x50
    && value[2] === 0x44
    && value[3] === 0x46
    && value[4] === 0x2d
    && (value[5] === 0x31 || value[5] === 0x32)
    && value[6] === 0x2e
    && value[7] >= 0x30
    && value[7] <= 0x39;
  if (!validHeader) return false;
  const eof = [0x25, 0x25, 0x45, 0x4f, 0x46];
  for (let index = Math.max(8, value.length - 1_024); index <= value.length - eof.length; index += 1) {
    if (eof.every((byte, offset) => value[index + offset] === byte)) return true;
  }
  return false;
}

async function sha256Hex(value: Uint8Array) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", value));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function hasOnlyRequiredAndOptionalKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
) {
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.hasOwn(value, key)) && keys.every((key) => allowed.has(key));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isBoundedText(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string"
    && value.length <= maximum
    && value.trim().length >= minimum
    && !value.includes("\0");
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && value.length >= 20
    && value.length <= 35
    && /^\d{4}-\d{2}-\d{2}T/.test(value)
    && Number.isFinite(Date.parse(value));
}

function cleanFilename(value: string) {
  const leaf = value.replaceAll("\\", "/").split("/").at(-1) ?? "document.pdf";
  return cleanText(leaf).slice(0, 240);
}

function cleanText(value: string) {
  return value.replace(/[\r\n\0]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanMultilineText(value: string) {
  return value
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeReportText(value: string) {
  return value.replace(/\0/g, "").trim();
}

// User-provided/extracted lines are content, never report-format directives. The
// PDF compositor recognizes headings and bullets only at column zero, so this
// small indent preserves literal leading "#"/"-" text without changing layout.
function asVerbatimReportText(value: string) {
  return safeReportText(value)
    .split("\n")
    .map((line) => line.trim() ? `  ${line}` : "")
    .join("\n");
}

function formatTimestamp(value: string) {
  return new Date(value).toISOString().replace("T", " ").replace(".000Z", " UTC");
}
