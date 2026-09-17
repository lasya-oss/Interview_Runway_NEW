import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/app/lib/google-auth";

const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/ai-prep",
  "/api/auth/google",
  "/api/auth/sign-out",
  "/api/demo-session",
  "/api/meeting-copilot/profile-copy",
  "/api/meeting-copilot/session",
  "/api/qualification",
  "/api/webhooks/paddle",
  "/compare/interview-kickstart-alternative-india",
  "/curriculum",
  "/demo-login",
  "/diagnostic",
  "/legal/privacy",
  "/legal/refund",
  "/legal/terms",
  "/premium",
  "/pricing",
  "/proof",
  "/qualify",
  "/second-seat",
  "/sign-in",
  "/vault",
]);

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vinext/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function isDemoCompatiblePath(pathname: string): boolean {
  // /learn/voice remains inside the same signed-in learner boundary as every
  // other learner section. /api/voice is intentionally not demo-compatible.
  return pathname === "/learn"
    || pathname.startsWith("/learn/")
    || pathname.startsWith("/api/learn/library/material-preview/");
}

function authenticatedResponse(request: NextRequest, session: Awaited<ReturnType<typeof verifySessionToken>>) {
  if (!session) return null;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-interviewrunway-user-email", session.email);
  requestHeaders.set("x-interviewrunway-user-domain", session.hostedDomain);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Learner pages vary by the authenticated account and active-plan cookie.
  // Keep an edge cache from replaying one account's workspace to another.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, message: "Google sign-in is required." },
      { status: 401 },
    );
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/sign-in";
  signInUrl.search = "";
  signInUrl.searchParams.set(
    "return_to",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const response = NextResponse.redirect(signInUrl);
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export async function proxy(request: NextRequest) {
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const incomingHostname =
    forwardedHost.split(",")[0]?.trim().split(":")[0] ||
    request.nextUrl.hostname;
  if (incomingHostname === "www.interviewrunway.com") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "interviewrunway.com";
    return NextResponse.redirect(canonicalUrl);
  }

  if (request.method === "OPTIONS" || isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (isDemoCompatiblePath(request.nextUrl.pathname)) {
    if (!token) return NextResponse.next();
    const session = await verifySessionToken(token);
    return authenticatedResponse(request, session) ?? NextResponse.next();
  }

  if (!token) return unauthorized(request);

  const session = await verifySessionToken(token);
  if (!session) return unauthorized(request);
  return authenticatedResponse(request, session) ?? unauthorized(request);
}

export const config = {
  matcher: ["/:path*"],
};
