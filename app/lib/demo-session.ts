import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cacheForRequest } from "vinext/cache";
import { findDemoById, type DemoProfile, type DemoTier } from "./demo-data";
import { getChatGPTUser, requireChatGPTUser } from "@/app/chatgpt-auth";
import {
  createFoundationProfile,
  createHumanCalibrationProfile,
  createSecondSeatProfile,
  learnerPlansForAccess,
  getLearnerAccess,
  getLearnerProgress,
  hasVaultAccess,
} from "@/app/lib/paid-access";

export const DEMO_SESSION_COOKIE = "ir_demo_session";
export const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const ACTIVE_LEARNER_PLAN_COOKIE = "ir_active_learner_plan";
export const ACTIVE_LEARNER_PLAN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const SESSION_VERSION = 1;
const MINIMUM_SECRET_LENGTH = 32;
const LOCAL_DEVELOPMENT_SECRET =
  "interviewrunway-local-demo-session-key-do-not-use-in-production";

type DemoSessionPayload = {
  version: typeof SESSION_VERSION;
  profileId: DemoTier;
  issuedAt: number;
  expiresAt: number;
};

export async function createDemoSession(profileId: DemoTier): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: DemoSessionPayload = {
    version: SESSION_VERSION,
    profileId,
    issuedAt,
    expiresAt: issuedAt + DEMO_SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encodeBytes(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBytes(new Uint8Array(signature))}`;
}

export async function getDemoProfile(): Promise<DemoProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyDemoSession(token);
    return payload ? findDemoById(payload.profileId) : null;
  } catch {
    // A missing production secret or malformed cookie must fail closed.
    return null;
  }
}

export async function requireDemoProfile(
  returnTo = "/learn",
): Promise<DemoProfile> {
  const state = await resolveWorkspaceProfile();
  const profile = state.profile;
  // An authenticated owner is always represented by an entitled live plan.
  // This prevents an older demo cookie from replacing account-backed identity,
  // plan selection, or progress after the user has signed in.
  if (profile) return profile;

  const authenticatedUser = state.user ?? (await requireChatGPTUser(returnTo));
  if (!(state.user ? state.vaultAccess : await hasVaultAccess(authenticatedUser.email))) {
    redirect(
      `/pricing?access=required&return_to=${encodeURIComponent(safeReturnTo(returnTo))}`,
    );
  }

  return createFoundationProfile(
    authenticatedUser,
    await getLearnerProgress(authenticatedUser.email),
  );
}

type WorkspaceProfileState = {
  profile: DemoProfile | null;
  user: ChatGPTUser | null;
  vaultAccess: boolean;
  secondSeatAccess: boolean;
  humanCalibrationAccess: boolean;
};

// Do not memoize this lookup outside the request lifecycle. The active plan is
// a browser cookie that changes when the QA selector is used; a long-lived edge
// worker must never reuse a previous request's selected profile.
const resolveWorkspaceProfile = cacheForRequest(async (): Promise<WorkspaceProfileState> => {
  const [profile, user] = await Promise.all([getDemoProfile(), getChatGPTUser()]);
  if (!user) {
    return {
      profile,
      user: null,
      vaultAccess: false,
      secondSeatAccess: false,
      humanCalibrationAccess: false,
    };
  }

  let access: Awaited<ReturnType<typeof getLearnerAccess>> = {
    vault: false,
    secondSeat: false,
    humanCalibration: false,
  };
  try {
    access = await getLearnerAccess(user.email);
  } catch {
    // A valid demo remains usable when the optional account lookup is not
    // available in a local preview. Live access remains fail-closed.
  }

  if (!access.vault) {
    return {
      // An explicit demo session remains a sample workspace. It never
      // supplies live access because authenticated accounts are only upgraded
      // through getLearnerAccess above.
      profile,
      user,
      vaultAccess: false,
      secondSeatAccess: false,
      humanCalibrationAccess: false,
    };
  }

  const availablePlans = learnerPlansForAccess(access);
  const selectedPlan = selectActivePlan(await getActivePlanPreference(), availablePlans);
  const liveProfile = await createProfileForPlan(user, selectedPlan, availablePlans);

  return {
    profile: liveProfile,
    user,
    vaultAccess: access.vault,
    secondSeatAccess: access.secondSeat,
    humanCalibrationAccess: access.humanCalibration,
  };
});

async function getActivePlanPreference(): Promise<DemoTier | null> {
  const value = (await cookies()).get(ACTIVE_LEARNER_PLAN_COOKIE)?.value;
  return isDemoTier(value) ? value : null;
}

function selectActivePlan(
  preference: DemoTier | null,
  availablePlans: readonly DemoTier[],
): DemoTier {
  if (preference && availablePlans.includes(preference)) return preference;
  return availablePlans.at(-1) ?? "foundation";
}

async function createProfileForPlan(
  user: ChatGPTUser,
  plan: DemoTier,
  availablePlans: readonly DemoTier[],
): Promise<DemoProfile> {
  if (plan === "premium") {
    return createHumanCalibrationProfile(
      user,
      await getLearnerProgress(user.email, 4),
      availablePlans,
    );
  }
  if (plan === "practice") {
    return createSecondSeatProfile(
      user,
      await getLearnerProgress(user.email, 4),
      availablePlans,
    );
  }
  return createFoundationProfile(
    user,
    await getLearnerProgress(user.email),
    availablePlans,
  );
}

async function verifyDemoSession(
  token: string,
): Promise<DemoSessionPayload | null> {
  if (token.length > 1024) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const payloadBytes = decodeBytes(parts[0]);
  const signatureBytes = decodeBytes(parts[1]);
  if (!payloadBytes || !signatureBytes) return null;
  if (
    encodeBytes(payloadBytes) !== parts[0] ||
    encodeBytes(signatureBytes) !== parts[1]
  ) {
    return null;
  }

  const validSignature = await crypto.subtle.verify(
    "HMAC",
    await getSigningKey(),
    signatureBytes,
    new TextEncoder().encode(parts[0]),
  );
  if (!validSignature) return null;

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }
  if (!isDemoSessionPayload(value)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (value.expiresAt <= now || value.issuedAt > now + 60) return null;
  if (
    value.expiresAt <= value.issuedAt ||
    value.expiresAt - value.issuedAt > DEMO_SESSION_MAX_AGE_SECONDS + 60
  ) {
    return null;
  }

  return value;
}

function isDemoSessionPayload(value: unknown): value is DemoSessionPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DemoSessionPayload>;
  return (
    candidate.version === SESSION_VERSION &&
    isDemoTier(candidate.profileId) &&
    Number.isInteger(candidate.issuedAt) &&
    Number.isInteger(candidate.expiresAt)
  );
}

function isDemoTier(value: unknown): value is DemoTier {
  return value === "foundation" || value === "practice" || value === "premium";
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret =
    typeof process !== "undefined" ? process.env.DEMO_SESSION_SECRET : undefined;

  if (secret && secret.length >= MINIMUM_SECRET_LENGTH) {
    return importSigningKey(secret);
  }
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    return importSigningKey(LOCAL_DEVELOPMENT_SECRET);
  }

  throw new Error(
    "DEMO_SESSION_SECRET must be configured as a server-only runtime secret.",
  );
}

function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function safeReturnTo(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/learn";
  try {
    const parsed = new URL(value, "https://demo.interviewrunway.local");
    if (parsed.origin !== "https://demo.interviewrunway.local") return "/learn";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/learn";
  }
}
