import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/app/components/site-chrome";
import { OFFERS, type OfferKey } from "@/app/lib/site-data";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout flow preview",
  description: "Explore the InterviewRunway checkout states without creating an order or charge.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params }: { params: Promise<{ offer: string }> }) {
  const { offer: offerParam } = await params;
  if (!Object.prototype.hasOwnProperty.call(OFFERS, offerParam)) notFound();
  const offer = OFFERS[offerParam as OfferKey];
  const isPremium = offerParam === "premium";

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Brand />
          <span className="secure-label">INTERACTIVE DEMO · NO CHARGE</span>
        </div>
        <div className="checkout-layout">
          <section className="checkout-card" aria-labelledby="payment-title">
            <p className="module-kicker">CHECKOUT PROTOTYPE</p>
            <h1 id="payment-title">Test the full handoff.</h1>
            <p className="checkout-intro">Choose a payment method and an outcome to inspect every checkout state. This preview never asks for payment details or contacts a payment provider.</p>
            <CheckoutClient offer={offer.slug} premium={isPremium} />
          </section>

          <aside className="checkout-card order-card" aria-labelledby="order-title">
            <p className="module-kicker">ORDER SUMMARY</p>
            <h2 id="order-title">{offer.name}</h2>
            <p>{offer.description}</p>
            <div className="price-line"><span>Published offer price</span><span>{offer.priceLabel}</span></div>
            <div className="price-line"><span>Preview charge</span><span>₹0</span></div>
            <div className="price-line price-total"><span>Charged today</span><span>₹0</span></div>
            <div className="refund-inline">
              This is a no-charge product simulation. The final refund summary must appear here before live payments are enabled. <Link href="/legal/refund">Read the draft policy</Link>.
            </div>
            <div className="trust-note">
              <span>✓ SERVER-VERIFIED OFFER AND DISPLAY PRICE</span>
              <span>✓ NO PAYMENT PROVIDER IS CONTACTED</span>
              <span>✓ NO PRODUCT ACCESS IS GRANTED</span>
              <span>Live checkout remains unavailable until merchant, tax, and refund details are complete.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
