import {
  EventName,
  type AdjustmentNotification,
  type TransactionNotification,
} from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";
import {
  activateVaultEntitlement,
  getCheckoutSession,
  paddleEventWasProcessed,
  revokeVaultEntitlement,
} from "@/app/lib/checkout-store";
import {
  getPaddleClient,
  getPaddleWebhookSecret,
} from "@/app/lib/paddle";

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature");
  if (!signature) return json({ error: "Missing Paddle signature" }, 400);

  const rawBody = await request.text();
  let event;

  try {
    event = await getPaddleClient().webhooks.unmarshal(
      rawBody,
      getPaddleWebhookSecret(),
      signature,
    );
  } catch (error) {
    const configError =
      error instanceof Error &&
      /PADDLE_(?:API_KEY|WEBHOOK_SECRET) is not configured/.test(error.message);
    console.error(
      "Paddle webhook verification failed",
      error instanceof Error ? error.message : "Unknown verification error",
    );
    return json(
      { error: "Paddle webhook verification failed" },
      configError ? 500 : 400,
    );
  }

  try {
    if (await paddleEventWasProcessed(event.eventId)) {
      return json({ received: true }, 200);
    }

    if (event.eventType === EventName.TransactionCompleted) {
      await handleTransactionCompleted(
        event.eventId,
        event.eventType,
        event.occurredAt,
        event.data as TransactionNotification,
      );
    }

    if (
      event.eventType === EventName.AdjustmentCreated ||
      event.eventType === EventName.AdjustmentUpdated
    ) {
      await handleAdjustment(
        event.eventId,
        event.eventType,
        event.occurredAt,
        event.data as AdjustmentNotification,
      );
    }

    return json({ received: true }, 200);
  } catch (error) {
    if (await paddleEventWasProcessed(event.eventId).catch(() => false)) {
      return json({ received: true }, 200);
    }

    console.error(
      "Paddle webhook processing failed",
      error instanceof Error ? error.message : "Unknown processing error",
    );
    return json({ error: "Paddle webhook processing failed" }, 500);
  }
}

async function handleTransactionCompleted(
  eventId: string,
  eventType: string,
  occurredAt: string,
  transaction: TransactionNotification,
) {
  const customData = transaction.customData as Record<string, unknown> | null;
  if (
    customData?.site !== "interviewrunway" ||
    customData.offer !== "vault" ||
    typeof customData.checkoutSessionId !== "string"
  ) {
    return;
  }

  const session = await getCheckoutSession(customData.checkoutSessionId);
  if (!session) throw new Error("Unknown InterviewRunway checkout session");

  const item = transaction.items[0];
  const amount = item?.price?.unitPrice?.amount ?? null;
  const currency = item?.price?.unitPrice?.currencyCode ?? null;

  if (
    session.offer !== "vault" ||
    session.paddleTransactionId !== transaction.id ||
    transaction.items.length !== 1 ||
    item?.quantity !== 1 ||
    amount !== String(session.expectedAmountMinor) ||
    currency !== session.expectedCurrency ||
    transaction.currencyCode !== session.expectedCurrency
  ) {
    throw new Error("Rejected Paddle fulfillment with mismatched authority data");
  }

  await activateVaultEntitlement({
    eventId,
    eventType,
    occurredAt,
    session,
    transactionId: transaction.id,
  });
}

async function handleAdjustment(
  eventId: string,
  eventType: string,
  occurredAt: string,
  adjustment: AdjustmentNotification,
) {
  const revokesAccess =
    adjustment.status === "approved" &&
    (adjustment.action === "refund" || adjustment.action === "chargeback");

  if (!revokesAccess) return;

  await revokeVaultEntitlement({
    eventId,
    eventType,
    occurredAt,
    transactionId: adjustment.transactionId,
  });
}

function json(body: object, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
