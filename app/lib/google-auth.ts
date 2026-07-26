import {
  SignJWT,
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

export const AUTH_COOKIE_NAME = "interviewrunway_session";
export const AUTH_SESSION_SECONDS = 60 * 60 * 12;

const GOOGLE_ISSUERS = [
  "https://accounts.google.com",
  "accounts.google.com",
] as const;
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const SESSION_ISSUER = "interviewrunway";
const SESSION_AUDIENCE = "interviewrunway-web";

export type GoogleIdentity = {
  email: string;
  hostedDomain: string;
  name: string | null;
  picture: string | null;
  subject: string;
};

export type InterviewRunwaySession = {
  email: string;
  hostedDomain: string;
  name: string | null;
  subject: string;
};

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function allowedDomain(): string {
  return (
    process.env.AUTH_ALLOWED_DOMAIN?.trim().toLowerCase() || "vividlabsai.com"
  );
}

function sessionSecret(): Uint8Array {
  const value = requiredEnvironmentValue("AUTH_SESSION_SECRET");
  if (value.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

function stringClaim(
  payload: JWTPayload,
  claim: keyof JWTPayload | "email" | "hd" | "name" | "picture",
): string | null {
  const value = payload[claim];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isAllowedGoogleIdentity({
  email,
  emailVerified,
  hostedDomain,
}: {
  email: string | null;
  emailVerified: boolean;
  hostedDomain: string | null;
}): boolean {
  if (!email || !emailVerified || !hostedDomain) return false;

  const domain = allowedDomain();
  const normalizedEmail = email.toLowerCase();
  return (
    hostedDomain.toLowerCase() === domain &&
    normalizedEmail.endsWith(`@${domain}`)
  );
}

export async function verifyGoogleCredential(
  credential: string,
): Promise<GoogleIdentity | null> {
  const clientId = requiredEnvironmentValue("GOOGLE_CLIENT_ID");

  try {
    const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      audience: clientId,
      issuer: [...GOOGLE_ISSUERS],
    });

    const email = stringClaim(payload, "email");
    const hostedDomain = stringClaim(payload, "hd");
    if (
      !payload.sub ||
      !isAllowedGoogleIdentity({
        email,
        emailVerified: payload.email_verified === true,
        hostedDomain,
      })
    ) {
      return null;
    }

    return {
      email: email!,
      hostedDomain: hostedDomain!,
      name: stringClaim(payload, "name"),
      picture: stringClaim(payload, "picture"),
      subject: payload.sub,
    };
  } catch {
    return null;
  }
}

export async function createSessionToken(
  identity: GoogleIdentity,
): Promise<string> {
  return new SignJWT({
    email: identity.email,
    hd: identity.hostedDomain,
    name: identity.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(identity.subject)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<InterviewRunwaySession | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      audience: SESSION_AUDIENCE,
      issuer: SESSION_ISSUER,
    });
    const email = stringClaim(payload, "email");
    const hostedDomain = stringClaim(payload, "hd");
    if (
      !payload.sub ||
      !isAllowedGoogleIdentity({
        email,
        emailVerified: true,
        hostedDomain,
      })
    ) {
      return null;
    }

    return {
      email: email!,
      hostedDomain: hostedDomain!,
      name: stringClaim(payload, "name"),
      subject: payload.sub,
    };
  } catch {
    return null;
  }
}
