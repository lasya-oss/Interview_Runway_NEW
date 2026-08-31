import type { Metadata } from "next";
import { MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { roadmapPlanForWeeks } from "@/app/lib/learner-progress";
import { RoadmapChecklist } from "./roadmap-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roadmap | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function RoadmapPage() {
  const profile = await requireDemoProfile("/learn/roadmap");
  const weeks = roadmapPlanForWeeks(profile.roadmapWeeks);
  const orderedTaskIds = weeks.flatMap((week) => week.tasks.map((task) => task.id));
  const initialCompleted = profile.isLive
    ? profile.completedTaskIds ?? []
    : orderedTaskIds.slice(0, Math.round(orderedTaskIds.length * (profile.progress / 100)));

  return (
    <MemberShell profile={profile} active="roadmap">
      <div className="member-page">
        <RoadmapChecklist
          profileId={profile.id}
          roadmapWeeks={profile.roadmapWeeks}
          currentWeek={profile.week}
          weeks={weeks}
          initialCompleted={initialCompleted}
          persistMode={profile.isLive ? "account" : "demo"}
        />
      </div>
    </MemberShell>
  );
}
