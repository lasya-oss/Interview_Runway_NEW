import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/app/components/site-chrome";
import { OFFERS, type OfferKey } from "@/app/lib/site-data";

export type CheckoutPreviewStatus = "success" | "pending" | "failed";

export type CheckoutPreviewSearchParams = Promise<{
  offer?: string;
  method?: string;
  reference?: string;
}>;

const STATUS_COPY = {
  success: {
    eyebrow: "PREVIEW APPROVED",
    title: "The handoff works. Nothing was charged.",
    body: "The checkout simulation reached its approved state. No payment provider was contacted, no order was created, and no product entitlement was granted.",
  },
  pending: {
    eyebrow: "PREVIEW PENDING",
    title: "Verification is still in progress.",
    body: "A live checkout would now wait for signed provider confirmation. This simulation remains no-charge and has not created access to any product.",
  },
  failed: {
    eyebrow: "PREVIEW DECLINED",
    title: "The recovery path is ready.",
    body: "The checkout simulation reached a declined state. There is nothing to refund because no payment details were submitted and no charge was attempted.",
  },
} as const;

const METHOD_LABELS: Record<string, string> = {
  upi: "UPI preview",
  card: "Card preview",
  netbanking: "Netbanking preview",
  emi: "EMI preview",
};

export async function CheckoutStatus({
  status,
  searchParams,
}: {
  status: CheckoutPreviewStatus;
  searchParams: CheckoutPreviewSearchParams;
}) {
  const parameters = await searchParams;
  if (!isOfferKey(parameters.offer)) notFound();

  const offer = OFFERS[parameters.offer];
  const method = METHOD_LABELS[parameters.method ?? ""] ?? "Checkout preview";
  const reference = validReference(parameters.reference)
    ? parameters.reference.toUpperCase()
    : "IRP-DIRECT-PREVIEW";
  const copy = STATUS_COPY[status];
  const stateParameters = new URLSearchParams({
    offer: offer.slug,
    method: parameters.method && METHOD_LABELS[parameters.method] ? parameters.method : "upi",
    reference,
  });

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Brand />
          <span className="secure-label">NO-CHARGE CHECKOUT PREVIEW</span>
        </div>

        <div className="checkout-layout">
          <section className="checkout-card" aria-labelledby="checkout-state-title">
            <p className="module-kicker">{copy.eyebrow}</p>
            <h1 id="checkout-state-title">{copy.title}</h1>
            <p className="checkout-intro">{copy.body}</p>

            {status === "pending" ? (
              <div className="hero-actions">
                <Link className="primary-cta" href={`/checkout/success?${stateParameters.toString()}`}>
                  Simulate approval <span aria-hidden="true">↗</span>
                </Link>
                <Link className="text-link" href={`/checkout/failed?${stateParameters.toString()}`}>
                  Simulate decline
                </Link>
              </div>
            ) : status === "failed" ? (
              <div className="hero-actions">
                <Link className="primary-cta" href={`/checkout/${offer.slug}`}>
                  Retry the preview <span aria-hidden="true">↗</span>
                </Link>
                <Link className="text-link" href="/pricing">Return to pricing</Link>
              </div>
            ) : (
              <div className="hero-actions">
                <Link className="primary-cta" href="/demo-login">
                  Explore the learner demo <span aria-hidden="true">↗</span>
                </Link>
                <Link className="text-link" href="/pricing">Return to pricing</Link>
              </div>
            )}
          </section>

          <aside className="checkout-card order-card" aria-labelledby="preview-record-title">
            <p className="module-kicker">SIMULATION RECORD</p>
            <h2 id="preview-record-title">{offer.name}</h2>
            <p>{offer.entitlement}</p>
            <div className="price-line"><span>Published offer price</span><span>{offer.priceLabel}</span></div>
            <div className="price-line"><span>Selected route</span><span>{method}</span></div>
            <div className="price-line price-total"><span>Amount charged</span><span>₹0</span></div>
            <div className="trust-note">
              <span>REFERENCE · {reference}</span>
              <span>NO PROVIDER TRANSACTION</span>
              <span>NO ORDER OR ENTITLEMENT CREATED</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function isOfferKey(value: string | undefined): value is OfferKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(OFFERS, value)
  );
}

function validReference(value: string | undefined): value is string {
  return typeof value === "string" && /^IRP-[A-Z0-9]{12}$/i.test(value);
}
