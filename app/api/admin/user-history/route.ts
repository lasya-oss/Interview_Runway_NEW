import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isInternalFullAccessEmail } from "@/app/lib/internal-access";
import {
  buildUserHistoryReport,
  isReportTargetEmail,
  listUserHistoryLearners,
} from "@/app/lib/user-history-report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthorizedUser();
  if (!user) return json({ error: "Human Calibration admin access required" }, 403);

  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length > 120) return json({ error: "Search query is too long" }, 400);

  try {
    return json({ learners: await listUserHistoryLearners(query, user.email) }, 200);
  } catch (error) {
    console.error("User history learner lookup failed", safeErrorMessage(error));
    return json({ error: "Learner history is temporarily unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getAuthorizedUser();
  if (!user) return json({ error: "Human Calibration admin access required" }, 403);

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isReportTargetEmail(email)) {
    return json({ error: "Select a learner from the configured account domain" }, 400);
  }

  try {
    const report = await buildUserHistoryReport(email, {
      learnerName: email === user.email ? user.fullName ?? user.displayName : null,
    });
    return new NextResponse(report.pdf.bytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Disposition": `attachment; filename="${report.pdf.filename}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("User history report generation failed", safeErrorMessage(error));
    return json({ error: "The user history report could not be generated" }, 503);
  }
}

async function getAuthorizedUser() {
  const user = await getChatGPTUser();
  return user && isInternalFullAccessEmail(user.email) ? user : null;
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
