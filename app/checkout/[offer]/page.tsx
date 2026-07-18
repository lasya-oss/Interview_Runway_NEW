import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/app/components/site-chrome";
import { OFFERS, type OfferKey } from "@/app/lib/site-data";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Secure checkout",
  description: "Review your InterviewRunway order before continuing to Razorpay hosted checkout.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params }: { params: Promise<{ offer: string }> }) {
  const { offer: offerParam } = await params;
  if (!(offerParam in OFFERS)) notFound();
  const offer = OFFERS[offerParam as OfferKey];
  const isPremium = offerParam === "premium";

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Brand />
          <span className="secure-label">HOSTED PAYMENT · RAZORPAY</span>
        </div>
        <div className="checkout-layout">
          <section className="checkout-card" aria-labelledby="payment-title">
            <p className="module-kicker">PAYMENT METHOD</p>
            <h1 id="payment-title">Choose how to pay.</h1>
            <p className="checkout-intro">UPI is selected by default. Card details will be collected only inside Razorpay&apos;s hosted flow—never by InterviewRunway.</p>
            <CheckoutClient premium={isPremium} />
          </section>

          <aside className="checkout-card order-card" aria-labelledby="order-title">
            <p className="module-kicker">ORDER SUMMARY</p>
            <h2 id="order-title">{offer.name}</h2>
            <p>{offer.description}</p>
            <div className="price-line"><span>Subtotal</span><span>{offer.priceLabel}</span></div>
            <div className="price-line"><span>GST</span><span>Pending final treatment</span></div>
            <div className="price-line price-total"><span>Total before payment</span><span>{offer.priceLabel}*</span></div>
            <div className="refund-inline">
              The final refund summary will appear here before payments are enabled. <Link href="/legal/refund">Read the draft policy</Link>.
            </div>
            <div className="trust-note">
              <span>✓ NO PRE-SELECTED ADD-ONS</span>
              <span>✓ EXACT TOTAL BEFORE RAZORPAY OPENS</span>
              <span>✓ ACCESS STARTS AFTER VERIFIED PAYMENT</span>
              <span>* GST and seller details must be final before launch</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
