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
import {
  deliverUserHistoryReportWithGmail,
  GmailAttachmentTooLargeError,
  GmailAuthorizationError,
  GmailDeliveryError,
  GmailDeliveryIndeterminateError,
  GmailQuotaError,
  GmailWorkspacePolicyError,
  readGoogleBearerToken,
} from "@/app/lib/user-history-gmail";

const MAX_REQUEST_BYTES = 1_024;

export const dynamic = "force-dynamic";

type UserHistoryReportDependencies = {
  authorize: typeof authorizeUserHistoryRequest;
  deliver: typeof deliverUserHistoryReportWithGmail;
  loadSources: typeof loadUserHistorySources;
};

const defaultDependencies: UserHistoryReportDependencies = {
  authorize: authorizeUserHistoryRequest,
  deliver: deliverUserHistoryReportWithGmail,
  loadSources: loadUserHistorySources,
};

export function createUserHistoryReportHandler(dependencies: UserHistoryReportDependencies = defaultDependencies) {
  return async function userHistoryReportHandler(request: Request) {
    if (!request.headers.get("origin") || !isSameOriginRequest(request)) {
      return json({ error: "Invalid origin" }, 403);
    }

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
    const googleAccessToken = readGoogleBearerToken(request.headers.get("authorization"));
    if (!googleAccessToken) {
      return json({ error: "Authorize Gmail with your signed-in Vivid Labs account" }, 400);
    }

    try {
      const sources = await dependencies.loadSources({
        learnerEmail,
        learnerName: learnerEmail === normalizeEmail(authorization.user.email)
          ? authorization.user.fullName
          : null,
        generatedByEmail: authorization.user.email,
      });
      const pdf = createUserHistoryPdf(buildUserHistoryReport(sources));
      await dependencies.deliver({
        accessToken: googleAccessToken,
        learnerEmail,
        pdf,
        recipientEmail: authorization.user.email,
        recipientSubject: authorization.user.subject,
      });
      const responseBody = Uint8Array.from(pdf).buffer;

      return new NextResponse(responseBody, {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": "attachment; filename=\"interviewrunway-user-history-report.pdf\"",
          "Content-Length": String(pdf.byteLength),
          "Content-Type": "application/pdf",
          "Pragma": "no-cache",
          "X-InterviewRunway-Report-Delivered": "gmail",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      if (error instanceof UserHistoryNotFoundError) {
        return json({ error: "The selected learner has no stored Interview Runway history" }, 404);
      }
      if (error instanceof GmailAttachmentTooLargeError) {
        return json({ error: "This report is too large to attach to a Gmail message" }, 413);
      }
      if (error instanceof GmailAuthorizationError) {
        return json({ error: "Authorize Gmail with the same signed-in Vivid Labs account and allow email sending" }, 403);
      }
      if (error instanceof GmailDeliveryIndeterminateError) {
        console.error("Internal user history report Gmail delivery was indeterminate");
        return json({ error: "Gmail did not confirm delivery. Check your Inbox or Sent folder before trying again" }, 502);
      }
      if (error instanceof GmailWorkspacePolicyError) {
        console.error("Internal user history report Gmail delivery was blocked by Workspace policy");
        return json({ error: "Google Workspace has not enabled this report delivery. Ask a Workspace administrator to allow Interview Runway Gmail sending" }, 503);
      }
      if (error instanceof GmailQuotaError) {
        console.error("Internal user history report Gmail delivery was rate limited");
        return json({ error: "Gmail is temporarily limiting report delivery. Wait a moment, then try again" }, 429);
      }
      if (error instanceof GmailDeliveryError) {
        console.error("Internal user history report Gmail delivery failed", safeErrorMessage(error));
        return json({ error: "Gmail could not send the report. Check your Gmail permission and try again" }, 502);
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
