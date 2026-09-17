import { NextResponse } from "next/server";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { issueMeetingCopilotBridgeSession } from "@/app/lib/meeting-copilot-bridge";
import { MEETING_COPILOT_RELEASE } from "@/app/lib/meeting-copilot-release";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await requireDemoProfile("/learn/meeting-copilot");
  if (!profile.isLive || !profile.access.practice) {
    return json({ ok: false, error: "Second Seat access required" }, 403);
  }

  let bridgeSession: Awaited<ReturnType<typeof issueMeetingCopilotBridgeSession>>;
  try {
    bridgeSession = await issueMeetingCopilotBridgeSession();
  } catch {
    console.error("Meeting Copilot launch bridge is unavailable");
    return json({ ok: false, error: "Meeting Copilot launch service is unavailable" }, 503);
  }
  if (!bridgeSession) {
    return json({ ok: false, error: "Second Seat access required" }, 403);
  }
  const destination = `${MEETING_COPILOT_RELEASE.launchUrl}#ir_profile_copy=${encodeURIComponent(bridgeSession.token)}`;

  const response = NextResponse.redirect(destination, 302);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
