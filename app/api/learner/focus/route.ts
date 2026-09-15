import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasVaultAccess, recordFocusedTime } from "@/app/lib/paid-access";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasVaultAccess(user.email))) {
    return json({ error: "Foundation access required" }, 403);
  }

  const body = (await request.json().catch(() => null)) as { seconds?: unknown } | null;
  if (!Number.isInteger(body?.seconds) || body.seconds < 1 || body.seconds > 300) {
    return json({ error: "Invalid focused time" }, 400);
  }

  try {
    return json(await recordFocusedTime(user.email, body.seconds), 200);
  } catch (error) {
    console.error("Focused time update failed", safeErrorMessage(error));
    return json({ error: "Focused time could not be saved" }, 503);
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
