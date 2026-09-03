import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/app/lib/google-auth";
import { ACTIVE_LEARNER_PLAN_COOKIE } from "@/app/lib/demo-session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.nextUrl.host) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  response.cookies.set({
    name: ACTIVE_LEARNER_PLAN_COOKIE,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  response.headers.set("cache-control", "no-store");
  return response;
}
