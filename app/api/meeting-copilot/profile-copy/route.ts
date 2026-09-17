import { NextResponse } from "next/server";
import {
  MeetingCopilotBridgeConfigurationError,
  readMeetingCopilotBridgeBearer,
  verifyMeetingCopilotProfileCopyToken,
} from "@/app/lib/meeting-copilot-bridge";
import {
  MAX_MEETING_COPILOT_PROFILE_COPY_BYTES,
  createMeetingCopilotProfilePdf,
  parseMeetingCopilotSavedProfileCopy,
} from "@/app/lib/meeting-copilot-profile-copy";
import {
  MeetingCopilotProfileDeliveryError,
  deliverMeetingCopilotProfileCopy,
} from "@/app/lib/meeting-copilot-profile-gmail";
import {
  meetingCopilotProfileDeliveryStore,
  type MeetingCopilotProfileDeliveryStore,
} from "@/app/lib/meeting-copilot-profile-delivery-store";
import { hasSecondSeatAccess } from "@/app/lib/paid-access";
import { readLimitedJson } from "@/app/lib/user-history-access";
import { saveVoiceCandidateProfile } from "@/app/lib/voice-candidate-profile-store";

export const dynamic = "force-dynamic";

type ProfileCopyDependencies = {
  verify: typeof verifyMeetingCopilotProfileCopyToken;
  hasAccess: typeof hasSecondSeatAccess;
  deliver: typeof deliverMeetingCopilotProfileCopy;
  deliveryStore: MeetingCopilotProfileDeliveryStore;
  persistVoiceProfile?: typeof saveVoiceCandidateProfile;
};

const defaultDependencies: ProfileCopyDependencies = {
  verify: verifyMeetingCopilotProfileCopyToken,
  hasAccess: hasSecondSeatAccess,
  deliver: deliverMeetingCopilotProfileCopy,
  deliveryStore: meetingCopilotProfileDeliveryStore,
  persistVoiceProfile: saveVoiceCandidateProfile,
};

export function createMeetingCopilotProfileCopyHandler(
  dependencies: ProfileCopyDependencies = defaultDependencies,
) {
  return async function meetingCopilotProfileCopyHandler(request: Request) {
    const token = readMeetingCopilotBridgeBearer(request.headers.get("authorization"));
    if (!token) return json({ ok: false, error: "Meeting Copilot session required" }, 401);

    let session: Awaited<ReturnType<typeof verifyMeetingCopilotProfileCopyToken>>;
    try {
      session = await dependencies.verify(token);
    } catch (error) {
      if (error instanceof MeetingCopilotBridgeConfigurationError) {
        return json({ ok: false, error: "Profile delivery is unavailable" }, 503);
      }
      return json({ ok: false, error: "Meeting Copilot session expired or invalid" }, 401);
    }

    try {
      if (!(await dependencies.hasAccess(session.userEmail))) {
        return json({ ok: false, error: "Second Seat access required" }, 403);
      }
    } catch {
      console.error("Meeting Copilot profile entitlement check failed");
      return json({ ok: false, error: "Profile delivery is unavailable" }, 503);
    }

    const parsed = await readLimitedJson(request, MAX_MEETING_COPILOT_PROFILE_COPY_BYTES);
    if (!parsed.ok) {
      return parsed.reason === "too-large"
        ? json({ ok: false, error: "Saved profile record is too large" }, 413)
        : json({ ok: false, error: "Saved profile record is invalid" }, 400);
    }
    const saved = await parseMeetingCopilotSavedProfileCopy(parsed.value);
    if (!saved) return json({ ok: false, error: "Saved profile record is invalid" }, 400);

    if (dependencies.persistVoiceProfile) {
      try {
        await dependencies.persistVoiceProfile(session.userEmail, saved);
      } catch {
        console.error("Meeting Copilot voice profile snapshot could not be stored", {
          eventId: saved.eventId,
        });
        return json({ ok: false, error: "Profile saved, but the voice profile sync is unavailable" }, 503);
      }
    }

    let reservation: Awaited<ReturnType<MeetingCopilotProfileDeliveryStore["reserve"]>>;
    try {
      reservation = await dependencies.deliveryStore.reserve({
        ownerKey: session.ownerKey,
        profileId: saved.profile.id,
        profileRevision: saved.profile.revision,
        eventId: saved.eventId,
      });
    } catch {
      console.error("Meeting Copilot profile delivery ledger is unavailable", {
        eventId: saved.eventId,
      });
      return json({ ok: false, error: "Profile delivery is unavailable" }, 503);
    }

    if (reservation.kind === "rate-limited") {
      return json({
        ok: false,
        error: "Profile saved, but the hourly delivery limit has been reached",
      }, 429);
    }
    if (reservation.kind === "existing") {
      return existingDeliveryResponse(reservation.record.status);
    }

    const deliveryKey = reservation.record.deliveryKey;

    let delivery: Awaited<ReturnType<typeof deliverMeetingCopilotProfileCopy>>;
    try {
      const pdf = createMeetingCopilotProfilePdf(saved, {
        userEmail: session.userEmail,
        userName: session.userName,
        ownerKey: session.ownerKey,
      });
      delivery = await dependencies.deliver({ pdf, saved, userEmail: session.userEmail });
    } catch (error) {
      if (error instanceof MeetingCopilotProfileDeliveryError) {
        await recordDeliveryFailure(
          dependencies.deliveryStore,
          deliveryKey,
          error.code === "indeterminate" ? "indeterminate" : "failed",
          error.code,
          saved.eventId,
        );
        console.error("Meeting Copilot profile copy delivery failed", {
          eventId: saved.eventId,
          code: error.code,
        });
        const status = error.code === "quota" ? 429 : error.code === "configuration" ? 503 : 502;
        return json({ ok: false, error: deliveryMessage(error.code) }, status);
      }
      await recordDeliveryFailure(
        dependencies.deliveryStore,
        deliveryKey,
        "failed",
        "generation",
        saved.eventId,
      );
      console.error("Meeting Copilot profile copy generation failed", { eventId: saved.eventId });
      return json({ ok: false, error: "Profile delivery is unavailable" }, 503);
    }

    try {
      await dependencies.deliveryStore.complete({
        deliveryKey,
        status: "sent",
        messageId: delivery.messageId,
      });
    } catch {
      await recordDeliveryFailure(
        dependencies.deliveryStore,
        deliveryKey,
        "indeterminate",
        "ledger-finalization",
        saved.eventId,
      );
      console.error("Meeting Copilot profile delivery ledger finalization failed", {
        eventId: saved.eventId,
      });
      return json({
        ok: false,
        error: "Profile saved, but delivery confirmation could not be recorded",
      }, 503);
    }
    return json({ ok: true, delivered: true, delivery: "gmail" }, 200);
  };
}

export const POST = createMeetingCopilotProfileCopyHandler();

function deliveryMessage(code: MeetingCopilotProfileDeliveryError["code"]) {
  if (code === "quota") return "Profile saved, but Gmail is temporarily limiting delivery";
  if (code === "authorization" || code === "configuration") {
    return "Profile saved, but the Vivid Labs delivery service is unavailable";
  }
  if (code === "indeterminate") {
    return "Profile saved, but Gmail did not confirm delivery";
  }
  return "Profile saved, but the Vivid Labs copy could not be delivered";
}

function existingDeliveryResponse(status: "pending" | "sent" | "failed" | "indeterminate") {
  if (status === "sent") {
    return json({ ok: true, delivered: true, delivery: "gmail", replayed: true }, 200);
  }
  const error = status === "pending"
    ? "Profile delivery is already in progress"
    : status === "indeterminate"
      ? "Profile saved, but the previous delivery could not be confirmed"
      : "Profile saved, but the previous delivery failed";
  return json({ ok: false, error }, 409);
}

async function recordDeliveryFailure(
  store: MeetingCopilotProfileDeliveryStore,
  deliveryKey: string,
  status: "failed" | "indeterminate",
  failureCode: string,
  eventId: string,
) {
  try {
    await store.complete({ deliveryKey, status, failureCode });
  } catch {
    console.error("Meeting Copilot profile delivery failure could not be recorded", { eventId });
  }
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
