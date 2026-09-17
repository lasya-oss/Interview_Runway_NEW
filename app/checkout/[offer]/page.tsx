import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { Brand } from "@/app/components/site-chrome";
import { OFFERS } from "@/app/lib/site-data";
import { isInternalFullAccessEmail } from "@/app/lib/paid-access";
import {
  getPaddleClientToken,
  paddleEnvironment,
} from "@/app/lib/paddle";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Secure Vault checkout",
  description:
    "Review the InterviewRunway Vault order and complete payment securely.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ offer: string }>;
}) {
  const { offer } = await params;
  if (offer !== "vault") notFound();

  const user = await requireChatGPTUser("/checkout/vault");
  if (isInternalFullAccessEmail(user.email)) redirect("/learn");
  const vault = OFFERS.vault;
  const clientToken = getPaddleClientToken();

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Brand />
          <span className="secure-label">SECURE CHECKOUT · ONE-TIME PURCHASE</span>
        </div>

        <div className="checkout-layout">
          <section className="checkout-card" aria-labelledby="payment-title">
            <p className="module-kicker">VAULT ACCESS · ONE TIME</p>
            <h1 id="payment-title">Clearance for your next interview.</h1>
            <p className="checkout-intro">
              Review the product, final-sale policy, and terms below. Paddle is
              the merchant of record and securely handles the payment; VividLabs
              AI never stores your payment details.
            </p>

            <CheckoutClient
              clientToken={clientToken}
              environment={paddleEnvironment()}
            />

            <div className="checkout-manifest" aria-label="Vault access manifest">
              <div>
                <span>01</span>
                <p><b>4-week and 12-week flight plans</b><small>Choose the runway that matches your timeline.</small></p>
              </div>
              <div>
                <span>02</span>
                <p><b>Eight interview systems</b><small>DSA, design, behavioural, role, career, and remote-work preparation.</small></p>
              </div>
              <div>
                <span>03</span>
                <p><b>Launch edition updates included</b><small>No subscription and no upgrade selected silently.</small></p>
              </div>
            </div>

            <p className="checkout-policy-line">
              Sold by VividLabs AI · Payment processed by Paddle as merchant of
              record · <Link href="/legal/privacy">Privacy notice</Link>
            </p>
          </section>

          <aside className="checkout-card order-card" aria-labelledby="order-title">
            <p className="module-kicker">ORDER SUMMARY</p>
            <h2 id="order-title">{vault.name}</h2>
            <p>{vault.description}</p>

            <div className="price-line"><span>Subtotal</span><span>{vault.priceLabel}</span></div>
            <div className="price-line"><span>Billing</span><span>One time</span></div>
            <div className="price-line"><span>Optional add-ons</span><span>None</span></div>
            <div className="price-line"><span>Tax</span><span>Based on billing location</span></div>
            <div className="price-line price-total"><span>Exact total</span><span>Shown before payment</span></div>

            <div className="refund-inline">
              Paddle calculates any applicable tax from your billing details and
              displays the complete tax-adjusted total before its final payment
              button. You will not be charged until you confirm that amount.
            </div>

            <div className="trust-note">
              <span>✓ SECURE PAYMENT ENTRY</span>
              <span>✓ ONE-TIME ₹799 PURCHASE</span>
              <span>✓ NO SUBSCRIPTION</span>
              <span>✓ NO UPSELL OR ADD-ON</span>
              <span>✓ ACCESS ACTIVATED AFTER PAYMENT CONFIRMATION</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
