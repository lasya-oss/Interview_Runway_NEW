import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/app/lib/google-auth";

const PUBLIC_ROUTES = new Set([
  "/api/auth/google",
  "/api/auth/sign-out",
  "/api/webhooks/paddle",
  "/sign-in",
]);

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vinext/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
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
  if (!token) return unauthorized(request);

  const session = await verifySessionToken(token);
  if (!session) return unauthorized(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-interviewrunway-user-email", session.email);
  requestHeaders.set("x-interviewrunway-user-domain", session.hostedDomain);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/:path*"],
};
