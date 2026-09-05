import { NextResponse } from "next/server";
import {
  authorizeUserHistoryRequest,
  isSameOriginRequest,
  readLimitedJson,
} from "@/app/lib/user-history-access";
import {
  buildUserHistoryReport,
  isEmail,
  loadUserHistorySources,
  normalizeEmail,
  UserHistoryNotFoundError,
} from "@/app/lib/user-history";
import { createUserHistoryPdf } from "@/app/lib/user-history-pdf";

const MAX_REQUEST_BYTES = 1_024;

export const dynamic = "force-dynamic";

type UserHistoryReportDependencies = {
  authorize: typeof authorizeUserHistoryRequest;
  loadSources: typeof loadUserHistorySources;
};

const defaultDependencies: UserHistoryReportDependencies = {
  authorize: authorizeUserHistoryRequest,
  loadSources: loadUserHistorySources,
};

export function createUserHistoryReportHandler(dependencies: UserHistoryReportDependencies = defaultDependencies) {
  return async function userHistoryReportHandler(request: Request) {
    if (!isSameOriginRequest(request)) return json({ error: "Invalid origin" }, 403);

    const authorization = await dependencies.authorize();
    if (!authorization.ok) return json({ error: authorization.error }, authorization.status);

    const parsed = await readLimitedJson(request, MAX_REQUEST_BYTES);
    if (!parsed.ok) {
      return parsed.reason === "too-large"
        ? json({ error: "Report request is too large" }, 413)
        : json({ error: "Select a valid stored learner account" }, 400);
    }
    const body = parsed.value as { learnerEmail?: unknown } | null;
    const learnerEmail = typeof body?.learnerEmail === "string" ? normalizeEmail(body.learnerEmail) : "";
    if (!isEmail(learnerEmail)) return json({ error: "Select a valid stored learner account" }, 400);

    try {
      const sources = await dependencies.loadSources({
        learnerEmail,
        learnerName: learnerEmail === normalizeEmail(authorization.user.email)
          ? authorization.user.fullName
          : null,
        generatedByEmail: authorization.user.email,
      });
      const pdf = createUserHistoryPdf(buildUserHistoryReport(sources));
      const responseBody = Uint8Array.from(pdf).buffer;

      return new NextResponse(responseBody, {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": "attachment; filename=\"interviewrunway-user-history-report.pdf\"",
          "Content-Length": String(pdf.byteLength),
          "Content-Type": "application/pdf",
          "Pragma": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      if (error instanceof UserHistoryNotFoundError) {
        return json({ error: "The selected learner has no stored Interview Runway history" }, 404);
      }
      console.error("Internal user history report generation failed", safeErrorMessage(error));
      return json({ error: "The user history report could not be generated" }, 503);
    }
  };
}

export const POST = createUserHistoryReportHandler();

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
