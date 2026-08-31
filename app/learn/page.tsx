import type { Metadata } from "next";
import { MemberShell } from "@/app/components/member-shell";
import { toDemoProfileView } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { TodayDashboard } from "./today-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Today | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function LearnerHomePage() {
  const profile = await requireDemoProfile("/learn");
  return (
    <MemberShell
      profile={profile}
      active="today"
    >
      <TodayDashboard profile={toDemoProfileView(profile)} />
    </MemberShell>
  );
}
