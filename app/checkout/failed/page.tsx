import { redirect } from "next/navigation";

export default function LegacyFailedCheckoutPage() {
  redirect("/checkout/vault");
}
