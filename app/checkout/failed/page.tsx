import type { Metadata } from "next";
import {
  CheckoutStatus,
  type CheckoutPreviewSearchParams,
} from "@/app/checkout/checkout-status";

export const metadata: Metadata = {
  title: "Checkout preview declined",
  robots: { index: false, follow: false },
};

export default function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: CheckoutPreviewSearchParams;
}) {
  return <CheckoutStatus status="failed" searchParams={searchParams} />;
}
