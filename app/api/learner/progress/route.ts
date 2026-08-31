import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getLearnerProgress,
  hasSecondSeatAccess,
  hasVaultAccess,
  type RoadmapWeeks,
  saveLearnerProgress,
} from "@/app/lib/paid-access";

export async function GET(request: Request) {
  let roadmapWeeks: RoadmapWeeks;
  try {
    roadmapWeeks = readRoadmapWeeks(new URL(request.url).searchParams.get("roadmapWeeks"));
  } catch {
    return json({ error: "Invalid roadmap" }, 400);
  }

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasVaultAccess(user.email))) {
    return json({ error: "Foundation access required" }, 403);
  }
  if (roadmapWeeks === 4 && !(await hasSecondSeatAccess(user.email))) {
    return json({ error: "Second Seat access required" }, 403);
  }

  try {
    return json(
      await getLearnerProgress(user.email, roadmapWeeks),
      200,
    );
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
    roadmapWeeks?: unknown;
  } | null;
  if (
    !Array.isArray(body?.completedTaskIds) ||
    body.completedTaskIds.length > 100 ||
    !body.completedTaskIds.every((taskId) => typeof taskId === "string")
  ) {
    return json({ error: "Invalid learner progress" }, 400);
  }

  let roadmapWeeks: RoadmapWeeks;
  try {
    roadmapWeeks = readRoadmapWeeks(body?.roadmapWeeks);
  } catch {
    return json({ error: "Invalid roadmap" }, 400);
  }
  if (roadmapWeeks === 4 && !(await hasSecondSeatAccess(user.email))) {
    return json({ error: "Second Seat access required" }, 403);
  }

  try {
    return json(
      await saveLearnerProgress(user.email, body.completedTaskIds, roadmapWeeks),
      200,
    );
  } catch (error) {
    console.error("Learner progress update failed", safeErrorMessage(error));
    return json({ error: "Learner progress could not be saved" }, 503);
  }
}

function readRoadmapWeeks(value: unknown): RoadmapWeeks {
  if (value === undefined || value === null || value === "") return 12;
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && /^\d+$/.test(value)
      ? Number(value)
      : NaN;
  if (parsed === 4 || parsed === 12) return parsed;
  throw new Error("Unsupported roadmap");
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
