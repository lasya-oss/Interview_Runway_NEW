import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  ACTIVE_LEARNER_PLAN_COOKIE,
  ACTIVE_LEARNER_PLAN_MAX_AGE_SECONDS,
} from "@/app/lib/demo-session";
import {
  canAccessLearnerPlan,
  getLearnerAccess,
  isLearnerPlan,
} from "@/app/lib/paid-access";
import type { DemoTier } from "@/app/lib/demo-data";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  const body = (await request.json().catch(() => null)) as { plan?: unknown } | null;
  const plan = typeof body?.plan === "string" ? body.plan : "";
  if (!isLearnerPlan(plan)) {
    return json({ error: "Unknown learner plan" }, 400);
  }

  let access;
  try {
    access = await getLearnerAccess(user.email);
  } catch (error) {
    console.error("Learner plan lookup failed", safeErrorMessage(error));
    return json({ error: "Plan access is temporarily unavailable" }, 503);
  }

  const selectedPlan: DemoTier = plan;
  if (!canAccessLearnerPlan(access, selectedPlan)) {
    return json({ error: "That plan is not active on this account" }, 403);
  }

  const response = json({ ok: true, plan: selectedPlan }, 200);
  response.cookies.set(ACTIVE_LEARNER_PLAN_COOKIE, selectedPlan, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: ACTIVE_LEARNER_PLAN_MAX_AGE_SECONDS,
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

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function json(body: object, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
