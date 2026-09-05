import { NextResponse } from "next/server";
import {
  authorizeUserHistoryRequest,
  isSameOriginRequest,
  readLimitedJson,
} from "@/app/lib/user-history-access";
import { searchStoredLearners } from "@/app/lib/user-history";

const MAX_REQUEST_BYTES = 1_024;

export const dynamic = "force-dynamic";

type LearnerSearchDependencies = {
  authorize: typeof authorizeUserHistoryRequest;
  search: typeof searchStoredLearners;
};

const defaultDependencies: LearnerSearchDependencies = {
  authorize: authorizeUserHistoryRequest,
  search: searchStoredLearners,
};

export function createLearnerSearchHandler(dependencies: LearnerSearchDependencies = defaultDependencies) {
  return async function learnerSearchHandler(request: Request) {
    if (!isSameOriginRequest(request)) return json({ error: "Invalid origin" }, 403);

    const authorization = await dependencies.authorize();
    if (!authorization.ok) return json({ error: authorization.error }, authorization.status);

    const parsed = await readLimitedJson(request, MAX_REQUEST_BYTES);
    if (!parsed.ok) {
      return parsed.reason === "too-large"
        ? json({ error: "Search request is too large" }, 413)
        : json({ error: "Enter a learner account email" }, 400);
    }
    const body = parsed.value as { query?: unknown } | null;
    if (typeof body?.query !== "string") return json({ error: "Enter a learner account email" }, 400);

    try {
      return json({ learners: await dependencies.search(body.query) }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Learner search failed";
      if (message.startsWith("Enter at least")) return json({ error: message }, 400);
      console.error("Internal learner search failed", safeErrorMessage(error));
      return json({ error: "Learner search is temporarily unavailable" }, 503);
    }
  };
}

export const POST = createLearnerSearchHandler();

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
