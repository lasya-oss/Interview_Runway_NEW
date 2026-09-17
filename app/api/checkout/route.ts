import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  attachPaddleTransaction,
  countRecentCheckoutSessions,
  createVaultCheckoutSession,
  hasActiveVaultEntitlement,
  markCheckoutSessionFailed,
} from "@/app/lib/checkout-store";
import { createVaultTransaction } from "@/app/lib/paddle";

const MAX_CHECKOUTS_PER_WINDOW = 5;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Invalid origin" }, 403);

  const user = await getChatGPTUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  const body = (await request.json().catch(() => null)) as {
    offer?: unknown;
    termsAccepted?: unknown;
  } | null;

  if (body?.offer !== "vault") {
    return json({ error: "This offer is not available for checkout" }, 400);
  }

  if (body.termsAccepted !== true) {
    return json(
      { error: "Accept the Terms and Refund Policy before checkout" },
      400,
    );
  }

  try {
    if (await hasActiveVaultEntitlement(user.email)) {
      return json(
        { error: "The Vault is already active on this account" },
        409,
      );
    }

    if (
      (await countRecentCheckoutSessions(user.email)) >=
      MAX_CHECKOUTS_PER_WINDOW
    ) {
      return json(
        { error: "Too many checkout attempts. Please wait a few minutes." },
        429,
      );
    }

    const session = await createVaultCheckoutSession(user.email);

    try {
      const transaction = await createVaultTransaction(
        session.id,
        new Date().toISOString(),
      );
      await attachPaddleTransaction(session.id, transaction.id);

      return json(
        {
          checkoutSessionId: session.id,
          transactionId: transaction.id,
        },
        200,
      );
    } catch (error) {
      await markCheckoutSessionFailed(session.id).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    console.error("Paddle checkout creation failed", safeErrorMessage(error));
    return json(
      { error: "Secure checkout is temporarily unavailable. Please try again." },
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

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown checkout error";
}

function json(body: object, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
