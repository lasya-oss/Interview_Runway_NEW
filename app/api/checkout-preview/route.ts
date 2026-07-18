import { NextResponse } from "next/server";
import { OFFERS, type OfferKey } from "@/app/lib/site-data";

const PAYMENT_METHODS = ["upi", "card", "netbanking", "emi"] as const;
const PREVIEW_OUTCOMES = ["success", "pending", "failed"] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type PreviewOutcome = (typeof PREVIEW_OUTCOMES)[number];

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return json({ ok: false }, 403);
  }

  const body = (await request.json().catch(() => null)) as {
    offer?: unknown;
    method?: unknown;
    outcome?: unknown;
  } | null;

  if (
    !isOfferKey(body?.offer) ||
    !isPaymentMethod(body?.method) ||
    !isPreviewOutcome(body?.outcome) ||
    (body.method === "emi" && body.offer !== "premium")
  ) {
    return json({ ok: false }, 400);
  }

  // Reading the offer here is intentional: price and product authority remain
  // server-side even though this no-charge flow does not create an order.
  const offer = OFFERS[body.offer];
  const reference = `IRP-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const parameters = new URLSearchParams({
    offer: offer.slug,
    method: body.method,
    reference,
  });

  return json(
    {
      ok: true,
      redirect: `/checkout/${body.outcome}?${parameters.toString()}`,
    },
    200,
  );
}

function isOfferKey(value: unknown): value is OfferKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(OFFERS, value)
  );
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.some((method) => method === value);
}

function isPreviewOutcome(value: unknown): value is PreviewOutcome {
  return PREVIEW_OUTCOMES.some((outcome) => outcome === value);
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
