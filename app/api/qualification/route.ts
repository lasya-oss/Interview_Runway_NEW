import { NextResponse } from "next/server";
import { notifyQualificationApplication } from "@/app/lib/qualification-notifier";
import {
  countRecentQualificationApplications,
  createQualificationApplication,
  recordQualificationNotification,
} from "@/app/lib/qualification-store";
import { validateQualificationApplication } from "@/app/lib/qualification";

const MAX_REQUEST_BYTES = 24_000;
const MAX_APPLICATIONS_PER_DAY = 3;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "Application is too large." }, 413);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof body?.website === "string" && body.website.trim()) {
    return json({ ok: true }, 202);
  }

  const validation = validateQualificationApplication(body);
  if (!validation.ok) {
    return json({ error: validation.error, field: validation.field }, 400);
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
    const recentCount = await countRecentQualificationApplications(
      validation.value.accountEmail,
      since,
    );
    if (recentCount >= MAX_APPLICATIONS_PER_DAY) {
      return json(
        { error: "We already received your application. Please allow time for review before submitting again." },
        429,
      );
    }

    const application = await createQualificationApplication(validation.value);
    const notification = await notifyQualificationApplication(application);

    if (notification.status === "sent") {
      await recordQualificationNotification(application.id, { status: "sent" });
    } else if (notification.status === "failed") {
      await recordQualificationNotification(application.id, {
        status: "failed",
        error: notification.error,
      });
    }

    return json({ ok: true, applicationId: application.id }, 201);
  } catch (error) {
    console.error(
      "Phase 3 qualification submission failed",
      error instanceof Error ? error.message : "Unknown qualification error",
    );
    return json(
      { error: "The application could not be saved right now. Please try again shortly." },
      503,
    );
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function json(body: object, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
