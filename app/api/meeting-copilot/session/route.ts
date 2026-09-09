import { NextResponse } from "next/server";
import {
  MeetingCopilotBridgeAuthorizationError,
  MeetingCopilotBridgeConfigurationError,
  createMeetingCopilotProfileCopyToken,
  readMeetingCopilotBridgeBearer,
  verifyMeetingCopilotBridgeToken,
} from "@/app/lib/meeting-copilot-bridge";
import {
  meetingCopilotBridgeTokenStore,
  type MeetingCopilotBridgeTokenStore,
} from "@/app/lib/meeting-copilot-bridge-token-store";
import { hasSecondSeatAccess } from "@/app/lib/paid-access";

export const dynamic = "force-dynamic";

type SessionDependencies = {
  verify: typeof verifyMeetingCopilotBridgeToken;
  hasAccess: typeof hasSecondSeatAccess;
  issueProfileCopyToken: typeof createMeetingCopilotProfileCopyToken;
  tokenStore: MeetingCopilotBridgeTokenStore;
};

const defaultDependencies: SessionDependencies = {
  verify: verifyMeetingCopilotBridgeToken,
  hasAccess: hasSecondSeatAccess,
  issueProfileCopyToken: createMeetingCopilotProfileCopyToken,
  tokenStore: meetingCopilotBridgeTokenStore,
};

export function createMeetingCopilotSessionHandler(
  dependencies: SessionDependencies = defaultDependencies,
) {
  return async function meetingCopilotSessionHandler(request: Request) {
    const token = readMeetingCopilotBridgeBearer(request.headers.get("authorization"));
    if (!token) return json({ ok: false, error: "Meeting Copilot session required" }, 401);

    let session: Awaited<ReturnType<typeof verifyMeetingCopilotBridgeToken>>;
    try {
      session = await dependencies.verify(token);
    } catch (error) {
      if (error instanceof MeetingCopilotBridgeConfigurationError) {
        return json({ ok: false, error: "Meeting Copilot session service is unavailable" }, 503);
      }
      if (error instanceof MeetingCopilotBridgeAuthorizationError) {
        return json({ ok: false, error: "Meeting Copilot session expired or invalid" }, 401);
      }
      console.error("Meeting Copilot session resolution failed");
      return json({ ok: false, error: "Meeting Copilot session service is unavailable" }, 503);
    }

    try {
      if (!(await dependencies.hasAccess(session.userEmail))) {
        return json({ ok: false, error: "Second Seat access required" }, 403);
      }
    } catch {
      console.error("Meeting Copilot session entitlement check failed");
      return json({ ok: false, error: "Meeting Copilot session service is unavailable" }, 503);
    }

    let profileCopySession: Awaited<ReturnType<typeof createMeetingCopilotProfileCopyToken>>;
    try {
      profileCopySession = await dependencies.issueProfileCopyToken({ session });
    } catch (error) {
      if (error instanceof MeetingCopilotBridgeConfigurationError) {
        return json({ ok: false, error: "Meeting Copilot session service is unavailable" }, 503);
      }
      console.error("Meeting Copilot profile delivery session could not be issued");
      return json({ ok: false, error: "Meeting Copilot session service is unavailable" }, 503);
    }

    let consumption: Awaited<ReturnType<MeetingCopilotBridgeTokenStore["consume"]>>;
    try {
      consumption = await dependencies.tokenStore.consume({
        tokenId: session.tokenId,
        ownerKey: session.ownerKey,
        expiresAt: session.expiresAt,
      });
    } catch {
      console.error("Meeting Copilot session token ledger is unavailable");
      return json({ ok: false, error: "Meeting Copilot session service is unavailable" }, 503);
    }
    if (consumption === "replayed") {
      return json({ ok: false, error: "Meeting Copilot session expired or invalid" }, 401);
    }

    return json({
      ok: true,
      ownerKey: session.ownerKey,
      expiresAt: profileCopySession.expiresAt,
      profileCopyToken: profileCopySession.token,
    }, 200);
  };
}

export const POST = createMeetingCopilotSessionHandler();

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
