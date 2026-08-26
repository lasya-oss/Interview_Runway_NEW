import type { Metadata } from "next";
import { MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { FOUR_WEEK_PLAN, TWELVE_WEEK_PLAN } from "@/app/lib/roadmap-data";
import { RoadmapChecklist } from "./roadmap-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roadmap | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function RoadmapPage() {
  const profile = await requireDemoProfile("/learn/roadmap");
  const weeks = profile.roadmapWeeks === 12 ? TWELVE_WEEK_PLAN : FOUR_WEEK_PLAN;
  const orderedTaskIds = weeks.flatMap((week) => week.tasks.map((task) => task.id));
  const defaultCompletedCount = Math.round(orderedTaskIds.length * (profile.progress / 100));

  return (
    <MemberShell profile={profile} active="roadmap">
      <div className="member-page">
        <RoadmapChecklist
          profileId={profile.id}
          currentWeek={profile.week}
          weeks={weeks}
          initialCompleted={orderedTaskIds.slice(0, defaultCompletedCount)}
        />
      </div>
    </MemberShell>
  );
}
