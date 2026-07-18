import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { Brand } from "@/app/components/site-chrome";
import { getCheckoutSessionForUser } from "@/app/lib/checkout-store";
import { CheckoutVerification } from "./verification-client";

export const metadata: Metadata = {
  title: "Verifying your Vault access",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const user = await requireChatGPTUser("/checkout/success");
  const { session: checkoutSessionId } = await searchParams;

  if (!checkoutSessionId || !isUuid(checkoutSessionId)) notFound();

  const session = await getCheckoutSessionForUser(
    checkoutSessionId,
    user.email,
  );
  if (!session) notFound();

  return (
    <main className="checkout-page checkout-verification-page">
      <div className="container">
        <div className="checkout-header">
          <Brand />
          <span className="secure-label">SIGNED PAYMENT VERIFICATION</span>
        </div>
        <CheckoutVerification
          checkoutSessionId={checkoutSessionId}
          initialStatus={publicStatus(session.status, session.expiresAt)}
          userEmail={user.email}
        />
      </div>
    </main>
  );
}

function publicStatus(status: string, expiresAt: string) {
  if (status === "completed") return "active" as const;
  if (status === "revoked") return "revoked" as const;
  if (status === "failed") return "failed" as const;
  if (new Date(expiresAt).getTime() <= Date.now()) return "expired" as const;
  return "pending" as const;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
