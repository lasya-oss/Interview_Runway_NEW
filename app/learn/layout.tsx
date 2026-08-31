import type { ReactNode } from "react";
import { MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";

export const dynamic = "force-dynamic";

export default async function LearnerLayout({ children }: { children: ReactNode }) {
  const profile = await requireDemoProfile("/learn");

  return <MemberShell profile={profile}>{children}</MemberShell>;
}
