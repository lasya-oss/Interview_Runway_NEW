import type { Metadata } from "next";
import {
  CheckoutStatus,
  type CheckoutPreviewSearchParams,
} from "@/app/checkout/checkout-status";

export const metadata: Metadata = {
  title: "Checkout preview approved",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: CheckoutPreviewSearchParams;
}) {
  return <CheckoutStatus status="success" searchParams={searchParams} />;
}
