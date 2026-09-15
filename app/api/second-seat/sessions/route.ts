import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasSecondSeatAccess } from "@/app/lib/paid-access";
import {
  createSecondSeatSession,
  getSecondSeatSessions,
} from "@/app/lib/second-seat-store";
import { findSecondSeatMock } from "@/app/lib/second-seat-engine";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasSecondSeatAccess(user.email))) {
    return json({ error: "Second Seat access required" }, 403);
  }

  try {
    return json({ sessions: await getSecondSeatSessions(user.email) }, 200);
  } catch (error) {
    console.error("Second Seat session lookup failed", safeErrorMessage(error));
    return json({ error: "Practice history is temporarily unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasSecondSeatAccess(user.email))) {
    return json({ error: "Second Seat access required" }, 403);
  }

  const body = (await request.json().catch(() => null)) as { mockId?: unknown } | null;
  const mockId = typeof body?.mockId === "string" ? body.mockId : "";
  const mock = findSecondSeatMock(mockId);
  if (!mock) return json({ error: "Unknown practice track" }, 400);

  try {
    return json({ session: await createSecondSeatSession(user.email, mock) }, 201);
  } catch (error) {
    console.error("Second Seat session creation failed", safeErrorMessage(error));
    return json({ error: "Practice session could not be started" }, 503);
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
