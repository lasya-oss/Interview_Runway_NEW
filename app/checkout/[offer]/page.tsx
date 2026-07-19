import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { Brand } from "@/app/components/site-chrome";
import { OFFERS } from "@/app/lib/site-data";
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

  await requireChatGPTUser("/checkout/vault");
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
              Review your order, then continue to the encrypted payment screen.
              Your payment details are handled securely and are never stored by
              InterviewRunway.
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
              By continuing, you can review the final tax-adjusted total before
              paying. Read the <Link href="/legal/terms">terms</Link>,{" "}
              <Link href="/legal/privacy">privacy notice</Link>, and{" "}
              <Link href="/legal/refund">refund policy</Link>.
            </p>
          </section>

          <aside className="checkout-card order-card" aria-labelledby="order-title">
            <p className="module-kicker">ORDER SUMMARY</p>
            <h2 id="order-title">{vault.name}</h2>
            <p>{vault.description}</p>

            <div className="price-line"><span>Vault access</span><span>{vault.priceLabel}</span></div>
            <div className="price-line"><span>Billing</span><span>One time</span></div>
            <div className="price-line"><span>Tax</span><span>Calculated at checkout</span></div>
            <div className="price-line price-total"><span>Base price</span><span>{vault.priceLabel}</span></div>

            <div className="refund-inline">
              Any applicable tax and the final amount are shown before payment.
              You will not be charged until you confirm the order.
            </div>

            <div className="trust-note">
              <span>✓ SECURE PAYMENT ENTRY</span>
              <span>✓ ONE-TIME ₹799 PURCHASE</span>
              <span>✓ NO SUBSCRIPTION</span>
              <span>✓ ACCESS ACTIVATED AFTER PAYMENT CONFIRMATION</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
