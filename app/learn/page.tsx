import type { Metadata } from "next";
import { toDemoProfileView } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { TodayDashboard } from "./today-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function LearnerHomePage() {
  const profile = await requireDemoProfile("/learn");
  return <TodayDashboard profile={toDemoProfileView(profile)} />;
}
