import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getCheckoutSessionForUser } from "@/app/lib/checkout-store";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  const checkoutSessionId = new URL(request.url).searchParams.get("session");
  if (!checkoutSessionId || !isUuid(checkoutSessionId)) {
    return json({ error: "Invalid checkout session" }, 400);
  }

  try {
    const session = await getCheckoutSessionForUser(
      checkoutSessionId,
      user.email,
    );

    if (!session) return json({ error: "Checkout session not found" }, 404);

    const status = publicStatus(session.status, session.expiresAt);
    return json({ status }, 200);
  } catch (error) {
    console.error(
      "Checkout status lookup failed",
      error instanceof Error ? error.message : "Unknown status error",
    );
    return json({ error: "Checkout status is temporarily unavailable" }, 503);
  }
}

function publicStatus(status: string, expiresAt: string) {
  if (status === "completed") return "active";
  if (status === "revoked") return "revoked";
  if (status === "failed") return "failed";
  if (new Date(expiresAt).getTime() <= Date.now()) return "expired";
  return "pending";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function json(body: object, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
