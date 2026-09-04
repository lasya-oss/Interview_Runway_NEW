import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hasSecondSeatAccess } from "@/app/lib/paid-access";
import {
  MAXIMUM_SECOND_SEAT_ANSWER_CHARACTERS,
  findSecondSeatMock,
  validateSecondSeatAnswer,
} from "@/app/lib/second-seat-engine";
import {
  getSecondSeatSession,
  saveSecondSeatAnswers,
} from "@/app/lib/second-seat-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasSecondSeatAccess(user.email))) {
    return json({ error: "Second Seat access required" }, 403);
  }

  const { id } = await params;
  try {
    const session = await getSecondSeatSession(user.email, id);
    return session ? json({ session }, 200) : json({ error: "Session not found" }, 404);
  } catch (error) {
    console.error("Second Seat session lookup failed", safeErrorMessage(error));
    return json({ error: "Practice session is temporarily unavailable" }, 503);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);
  if (!(await hasSecondSeatAccess(user.email))) {
    return json({ error: "Second Seat access required" }, 403);
  }

  const { id } = await params;
  const session = await getSecondSeatSession(user.email, id);
  if (!session) return json({ error: "Session not found" }, 404);
  const mock = findSecondSeatMock(session.mockId);
  const body = (await request.json().catch(() => null)) as { answers?: unknown } | null;
  if (!mock || !Array.isArray(body?.answers)) {
    return json({ error: "Invalid practice answers" }, 400);
  }

  if (!body.answers.every((answer) => typeof answer === "string")) {
    return json({ error: "Invalid practice answers" }, 400);
  }
  const answers = body.answers as string[];
  if (
    answers.length > mock.turns.length ||
    answers.some((answer) => answer.length > MAXIMUM_SECOND_SEAT_ANSWER_CHARACTERS)
  ) {
    return json({ error: "Invalid practice answers" }, 400);
  }

  const invalidAnswer = answers
    .map((answer, index) => {
      const turn = mock.turns[index];
      return turn
        ? validateSecondSeatAnswer(turn, answer)
        : { ok: false as const, error: "Invalid practice answers", matchedSignals: [] };
    })
    .find((validation) => !validation.ok);
  if (invalidAnswer && !invalidAnswer.ok) {
    return json({ error: invalidAnswer.error }, 400);
  }

  try {
    const updated = await saveSecondSeatAnswers(user.email, id, answers);
    return updated ? json({ session: updated }, 200) : json({ error: "Session could not be saved" }, 409);
  } catch (error) {
    console.error("Second Seat answer save failed", safeErrorMessage(error));
    return json({ error: "Your response could not be saved" }, 503);
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
