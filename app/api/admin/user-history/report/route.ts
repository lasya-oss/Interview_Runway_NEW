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
  describeGmailDeliveryFailure,
  deliverUserHistoryReportWithGmail,
  GmailAttachmentTooLargeError,
  GmailAuthorizationError,
  GmailDeliveryError,
  GmailDeliveryIndeterminateError,
  GmailProviderUnavailableError,
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

    const requestId = crypto.randomUUID();
    let stage: "load-sources" | "pdf-generation" | "gmail-delivery" = "load-sources";
    try {
      const sources = await dependencies.loadSources({
        learnerEmail,
        learnerName: learnerEmail === normalizeEmail(authorization.user.email)
          ? authorization.user.fullName
          : null,
        generatedByEmail: authorization.user.email,
      });
      stage = "pdf-generation";
      const pdf = createUserHistoryPdf(buildUserHistoryReport(sources));
      stage = "gmail-delivery";
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
          "X-InterviewRunway-Report-Request-Id": requestId,
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      logReportFailure(requestId, stage, error);
      const failureHeaders = { "X-InterviewRunway-Report-Request-Id": requestId };
      if (error instanceof UserHistoryNotFoundError) {
        return json({ error: "The selected learner has no stored Interview Runway history", reference: requestId }, 404, failureHeaders);
      }
      if (error instanceof GmailAttachmentTooLargeError) {
        return json({ error: "This report is too large to attach to a Gmail message", reference: requestId }, 413, failureHeaders);
      }
      if (error instanceof GmailAuthorizationError) {
        return json(
          { error: "Gmail authorization expired or is no longer granted. Reconnect Gmail and try again", reference: requestId },
          401,
          {
            ...failureHeaders,
            "WWW-Authenticate": 'Bearer realm="user-history-report", error="invalid_token"',
            "X-InterviewRunway-Gmail-Authorization": "required",
          },
        );
      }
      if (error instanceof GmailDeliveryIndeterminateError) {
        return json({ error: "Gmail did not confirm delivery. Check your Inbox or Sent folder before trying again", reference: requestId }, 502, failureHeaders);
      }
      if (error instanceof GmailProviderUnavailableError) {
        return json({ error: "Google authorization is temporarily unavailable. Wait a moment, then try again", reference: requestId }, 503, failureHeaders);
      }
      if (error instanceof GmailWorkspacePolicyError) {
        return json({ error: "Google Workspace has not enabled this report delivery. Ask a Workspace administrator to allow Interview Runway Gmail sending", reference: requestId }, 503, failureHeaders);
      }
      if (error instanceof GmailQuotaError) {
        return json({ error: "Gmail is temporarily limiting report delivery. Wait a moment, then try again", reference: requestId }, 429, failureHeaders);
      }
      if (error instanceof GmailDeliveryError) {
        return json({ error: "Gmail could not send the report. Check your Gmail permission and try again", reference: requestId }, 502, failureHeaders);
      }
      return json({ error: "The user history report could not be generated", reference: requestId }, 503, failureHeaders);
    }
  };
}

export const POST = createUserHistoryReportHandler();

function logReportFailure(
  requestId: string,
  routeStage: "load-sources" | "pdf-generation" | "gmail-delivery",
  error: unknown,
) {
  console.error("Internal user history report failed", {
    requestId,
    routeStage,
    ...describeGmailDeliveryFailure(error),
  });
}

function json(body: object, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", ...headers },
  });
}
