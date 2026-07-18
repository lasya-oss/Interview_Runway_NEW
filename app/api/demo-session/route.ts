import { NextResponse } from "next/server";
import { findDemoByCredentials, findDemoById } from "@/app/lib/demo-data";
import {
  createDemoSession,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_SECONDS,
} from "@/app/lib/demo-session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, message: "Invalid demo session request." }, 403);
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
    preview?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const preview = typeof body?.preview === "string" ? body.preview : undefined;
  const profile = preview === "foundation" || preview === "practice" || preview === "premium"
    ? findDemoById(preview)
    : email.length <= 254 && password.length <= 128
      ? findDemoByCredentials(email, password)
      : null;

  if (!profile) {
    return json(
      {
        ok: false,
        message: "Those demo credentials do not match a sample learner.",
      },
      401,
    );
  }

  let session: string;
  try {
    session = await createDemoSession(profile.id);
  } catch {
    return json(
      {
        ok: false,
        message: "The demo workspace is temporarily unavailable.",
      },
      503,
    );
  }

  const response = json({ ok: true, profile: profile.id }, 200);
  response.cookies.set(DEMO_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, message: "Invalid demo session request." }, 403);
  }

  const response = json({ ok: true }, 200);
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function json(body: object, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
