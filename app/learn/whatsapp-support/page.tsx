import { redirect } from "next/navigation";
import { requireDemoProfile } from "@/app/lib/demo-session";

export const dynamic = "force-dynamic";

export default async function WhatsAppSupportPage() {
  // No support channel is published until its number, owner, and service
  // commitment are verified. Keep old bookmarks safe without presenting a
  // launch placeholder or an action that cannot be completed.
  await requireDemoProfile("/learn/whatsapp-support");
  redirect("/learn");
}
