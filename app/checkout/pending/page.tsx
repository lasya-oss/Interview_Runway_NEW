import { redirect } from "next/navigation";

export default function LegacyPendingCheckoutPage() {
  redirect("/checkout/vault");
}
