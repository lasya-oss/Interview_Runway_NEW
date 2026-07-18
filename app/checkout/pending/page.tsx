import type { Metadata } from "next";
import {
  CheckoutStatus,
  type CheckoutPreviewSearchParams,
} from "@/app/checkout/checkout-status";

export const metadata: Metadata = {
  title: "Checkout preview pending",
  robots: { index: false, follow: false },
};

export default function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: CheckoutPreviewSearchParams;
}) {
  return <CheckoutStatus status="pending" searchParams={searchParams} />;
}
