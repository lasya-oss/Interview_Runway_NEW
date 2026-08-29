import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getLearnerProgress,
  hasVaultAccess,
  saveLearnerProgress,
} from "@/app/lib/paid-access";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasVaultAccess(user.email))) {
    return json({ error: "Foundation access required" }, 403);
  }

  try {
    return json(await getLearnerProgress(user.email), 200);
  } catch (error) {
    console.error("Learner progress lookup failed", safeErrorMessage(error));
    return json({ error: "Learner progress is temporarily unavailable" }, 503);
  }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasVaultAccess(user.email))) {
    return json({ error: "Foundation access required" }, 403);
  }

  const body = (await request.json().catch(() => null)) as {
    completedTaskIds?: unknown;
  } | null;
  if (
    !Array.isArray(body?.completedTaskIds) ||
    body.completedTaskIds.length > 100 ||
    !body.completedTaskIds.every((taskId) => typeof taskId === "string")
  ) {
    return json({ error: "Invalid learner progress" }, 400);
  }

  try {
    return json(
      await saveLearnerProgress(user.email, body.completedTaskIds),
      200,
    );
  } catch (error) {
    console.error("Learner progress update failed", safeErrorMessage(error));
    return json({ error: "Learner progress could not be saved" }, 503);
  }
}

function isSameOrigin(request: Request) {
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

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
