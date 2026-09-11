import {
  CompactEncrypt,
  SignJWT,
  compactDecrypt,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { hasSecondSeatAccess } from "@/app/lib/paid-access";

const BRIDGE_ISSUER = "interviewrunway";
export const MEETING_COPILOT_BRIDGE_AUDIENCE = "meeting-copilot-session-exchange";
export const MEETING_COPILOT_BRIDGE_SCOPE = "session:exchange";
export const MEETING_COPILOT_PROFILE_COPY_AUDIENCE = "meeting-copilot-profile-copy";
export const MEETING_COPILOT_PROFILE_COPY_SCOPE = "profile-report:write";
export const MEETING_COPILOT_BRIDGE_TTL_SECONDS = 2 * 60 * 60;
const MAX_BRIDGE_TOKEN_LENGTH = 8_192;
const MINIMUM_SECRET_LENGTH = 32;

type BridgeTokenOptions = {
  secret?: string;
  now?: Date;
  tokenId?: string;
};

export type MeetingCopilotBridgeSession = {
  tokenId: string;
  userEmail: string;
  userName: string | null;
  userSubject: string;
  ownerKey: string;
  expiresAt: string;
};

export class MeetingCopilotBridgeConfigurationError extends Error {
  constructor(message = "Meeting Copilot bridge is not configured") {
    super(message);
    this.name = "MeetingCopilotBridgeConfigurationError";
  }
}

export class MeetingCopilotBridgeAuthorizationError extends Error {
  constructor(message = "Meeting Copilot bridge authorization is invalid") {
    super(message);
    this.name = "MeetingCopilotBridgeAuthorizationError";
  }
}

export async function issueMeetingCopilotBridgeSession() {
  const user = await getChatGPTUser();
  if (!user || !(await hasSecondSeatAccess(user.email))) return null;
  return createMeetingCopilotBridgeToken({ user });
}

export async function createMeetingCopilotBridgeToken({
  user,
  secret,
  now = new Date(),
  tokenId = crypto.randomUUID(),
}: {
  user: ChatGPTUser;
} & BridgeTokenOptions) {
  const configuredSecret = readBridgeSecret(secret);
  const issuedAt = Math.floor(now.getTime() / 1_000);
  const expiresAtSeconds = issuedAt + MEETING_COPILOT_BRIDGE_TTL_SECONDS;
  const email = normalizeEmail(user.email);
  if (!isEmail(email) || !user.subject.trim()) {
    throw new MeetingCopilotBridgeAuthorizationError();
  }

  const ownerKey = await createOwnerKey(user.subject);
  const token = await createEncryptedToken({
    audience: MEETING_COPILOT_BRIDGE_AUDIENCE,
    email,
    name: cleanOptionalName(user.fullName ?? user.displayName),
    scope: MEETING_COPILOT_BRIDGE_SCOPE,
    subject: user.subject,
    tokenId,
    issuedAt,
    expiresAtSeconds,
    secret: configuredSecret,
  });

  return {
    token,
    tokenId,
    ownerKey,
    expiresAt: new Date(expiresAtSeconds * 1_000).toISOString(),
  };
}

export async function createMeetingCopilotProfileCopyToken({
  session,
  secret,
  now = new Date(),
  tokenId = crypto.randomUUID(),
}: {
  session: MeetingCopilotBridgeSession;
} & BridgeTokenOptions) {
  const configuredSecret = readBridgeSecret(secret);
  const issuedAt = Math.floor(now.getTime() / 1_000);
  const expiresAtSeconds = Math.floor(Date.parse(session.expiresAt) / 1_000);
  if (!Number.isSafeInteger(expiresAtSeconds) || expiresAtSeconds <= issuedAt) {
    throw new MeetingCopilotBridgeAuthorizationError();
  }
  const token = await createEncryptedToken({
    audience: MEETING_COPILOT_PROFILE_COPY_AUDIENCE,
    email: session.userEmail,
    name: session.userName,
    scope: MEETING_COPILOT_PROFILE_COPY_SCOPE,
    subject: session.userSubject,
    tokenId,
    issuedAt,
    expiresAtSeconds,
    secret: configuredSecret,
  });
  return {
    token,
    tokenId,
    ownerKey: session.ownerKey,
    expiresAt: new Date(expiresAtSeconds * 1_000).toISOString(),
  };
}

export async function verifyMeetingCopilotBridgeToken(
  token: string,
  options: Pick<BridgeTokenOptions, "secret" | "now"> = {},
): Promise<MeetingCopilotBridgeSession> {
  return verifyEncryptedToken(
    token,
    MEETING_COPILOT_BRIDGE_AUDIENCE,
    MEETING_COPILOT_BRIDGE_SCOPE,
    options,
  );
}

export async function verifyMeetingCopilotProfileCopyToken(
  token: string,
  options: Pick<BridgeTokenOptions, "secret" | "now"> = {},
): Promise<MeetingCopilotBridgeSession> {
  return verifyEncryptedToken(
    token,
    MEETING_COPILOT_PROFILE_COPY_AUDIENCE,
    MEETING_COPILOT_PROFILE_COPY_SCOPE,
    options,
  );
}

export function readMeetingCopilotBridgeBearer(value: string | null) {
  const match = value?.match(/^Bearer ([^\s]+)$/);
  return match && match[1].length <= MAX_BRIDGE_TOKEN_LENGTH ? match[1] : null;
}

async function bridgeSessionFromPayload(
  payload: JWTPayload,
  requiredScope: string,
): Promise<MeetingCopilotBridgeSession> {
  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  const subject = typeof payload.sub === "string" ? payload.sub.trim() : "";
  const tokenId = typeof payload.jti === "string" ? payload.jti.trim() : "";
  const name = typeof payload.name === "string" ? cleanOptionalName(payload.name) : null;
  if (
    payload.scope !== requiredScope
    || !isEmail(email)
    || !subject
    || !tokenId
    || typeof payload.exp !== "number"
  ) {
    throw new MeetingCopilotBridgeAuthorizationError();
  }
  return {
    tokenId,
    userEmail: email,
    userName: name,
    userSubject: subject,
    ownerKey: await createOwnerKey(subject),
    expiresAt: new Date(payload.exp * 1_000).toISOString(),
  };
}

async function createEncryptedToken({
  audience,
  email,
  name,
  scope,
  subject,
  tokenId,
  issuedAt,
  expiresAtSeconds,
  secret,
}: {
  audience: string;
  email: string;
  name: string | null;
  scope: string;
  subject: string;
  tokenId: string;
  issuedAt: number;
  expiresAtSeconds: number;
  secret: string;
}) {
  const [signingKey, encryptionKey] = await Promise.all([
    derivedKey(secret, "signing"),
    derivedKey(secret, "encryption"),
  ]);
  const signed = await new SignJWT({ email, name, scope })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(BRIDGE_ISSUER)
    .setAudience(audience)
    .setSubject(subject)
    .setJti(tokenId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAtSeconds)
    .sign(signingKey);
  return new CompactEncrypt(new TextEncoder().encode(signed))
    .setProtectedHeader({ alg: "dir", enc: "A256GCM", cty: "JWT" })
    .encrypt(encryptionKey);
}

async function verifyEncryptedToken(
  token: string,
  audience: string,
  scope: string,
  options: Pick<BridgeTokenOptions, "secret" | "now">,
) {
  if (!token || token.length > MAX_BRIDGE_TOKEN_LENGTH || token.split(".").length !== 5) {
    throw new MeetingCopilotBridgeAuthorizationError();
  }
  const configuredSecret = readBridgeSecret(options.secret);
  const [signingKey, encryptionKey] = await Promise.all([
    derivedKey(configuredSecret, "signing"),
    derivedKey(configuredSecret, "encryption"),
  ]);
  try {
    const decrypted = await compactDecrypt(token, encryptionKey, {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    if (decrypted.protectedHeader.cty !== "JWT") {
      throw new MeetingCopilotBridgeAuthorizationError();
    }
    const signed = new TextDecoder().decode(decrypted.plaintext);
    const { payload } = await jwtVerify(signed, signingKey, {
      issuer: BRIDGE_ISSUER,
      audience,
      algorithms: ["HS256"],
      currentDate: options.now,
      clockTolerance: 15,
    });
    return bridgeSessionFromPayload(payload, scope);
  } catch (error) {
    if (error instanceof MeetingCopilotBridgeAuthorizationError) throw error;
    throw new MeetingCopilotBridgeAuthorizationError();
  }
}

async function createOwnerKey(subject: string) {
  // This is a durable storage namespace, not an authentication credential.
  // Keep it independent from the rotatable bridge encryption/signing secret so
  // an ordinary key rotation cannot orphan a learner's locally saved profiles.
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`interviewrunway:meeting-copilot:owner:v1\0${subject}`),
    ),
  );
  return `mc_${base64Url(digest)}`;
}

async function derivedKey(secret: string, purpose: string) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`interviewrunway:meeting-copilot:${purpose}\0${secret}`),
    ),
  );
}

function readBridgeSecret(override?: string) {
  const secret = override ?? process.env.MEETING_COPILOT_BRIDGE_SECRET;
  if (!secret || secret.length < MINIMUM_SECRET_LENGTH) {
    throw new MeetingCopilotBridgeConfigurationError(
      "MEETING_COPILOT_BRIDGE_SECRET must contain at least 32 characters",
    );
  }
  return secret;
}

function cleanOptionalName(value: string) {
  const cleaned = value.replace(/[\r\n\0]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return cleaned || null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+$/.test(value) && value.length <= 254;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
