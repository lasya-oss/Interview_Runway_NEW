import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createSessionToken,
  verifyGoogleCredential,
} from "@/app/lib/google-auth";

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { ok: false, message: "The sign-in request origin was rejected." },
      { status: 403 },
    );
  }

  let credential: string;
  try {
    const body = (await request.json()) as { credential?: unknown };
    credential = typeof body.credential === "string" ? body.credential : "";
  } catch {
    credential = "";
  }

  if (!credential) {
    return NextResponse.json(
      { ok: false, message: "Google did not return a sign-in credential." },
      { status: 400 },
    );
  }

  const identity = await verifyGoogleCredential(credential);
  if (!identity) {
    return NextResponse.json(
      {
        ok: false,
        message: "Use an approved @vividlabsai.com Google Workspace account.",
      },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: { email: identity.email, name: identity.name },
  });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: await createSessionToken(identity),
    httpOnly: true,
    maxAge: AUTH_SESSION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  response.headers.set("cache-control", "no-store");
  return response;
}
