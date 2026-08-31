import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { findRoadmapTask, TWELVE_WEEK_PLAN } from "@/app/lib/roadmap-data";
import { StudyProgressButton } from "../../../study-progress-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning brief | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function RoadmapTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = findRoadmapTask(id);
  if (!task || (task.learning.kind !== "planned" && task.learning.kind !== "lesson")) notFound();

  const profile = await requireDemoProfile(`/learn/roadmap/task/${id}`);

  const isVaultRoadmapTask = TWELVE_WEEK_PLAN.some((week) =>
    week.tasks.some((entry) => entry.id === task.id),
  );
  const isProfileRoadmapTask = profile.roadmapWeeks === 12
    ? isVaultRoadmapTask
    : !isVaultRoadmapTask;
  if (!isProfileRoadmapTask) {
    const requestedTier = isVaultRoadmapTask ? "The Vault" : "The Second Seat";
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier={requestedTier}
          title="This checkpoint is outside your current roadmap."
          body={isVaultRoadmapTask
            ? "The current workspace uses the 12-week Foundation roadmap. This four-week brief remains unpublished and gated until its separate content and access review is complete."
            : "The current workspace uses the four-week practice roadmap. Foundation checkpoints remain separate from this tier and are not opened by a direct link."}
        />
      </div>
    );
  }

  if (task.learning.kind === "lesson") {
    return (
        <article className="member-page roadmap-task-page roadmap-published-lesson">
          <nav className="material-breadcrumb" aria-label="Breadcrumb">
            <Link href="/learn/roadmap">Roadmap</Link><span>/</span><span>Foundation lesson</span><span>/</span><strong>{task.id}</strong>
          </nav>

          <header className="roadmap-task-header">
            <div>
              <p className="member-kicker">Foundation lesson · {task.learning.plannedFormat}</p>
              <h1>{task.title}</h1>
              <p>{task.learning.objective}</p>
            </div>
            <dl>
              <div><dt>Format</dt><dd>{task.learning.plannedFormat}</dd></div>
              <div><dt>Study time</dt><dd>{task.meta.split(" · ").at(-1) ?? task.meta}</dd></div>
              <div><dt>Content state</dt><dd>Vault QA lesson</dd></div>
            </dl>
          </header>

          <section className="roadmap-task-status roadmap-task-status-published" aria-labelledby="roadmap-task-status-title">
            <p className="member-kicker">Vault learning content</p>
            <h2 id="roadmap-task-status-title">A complete QA lesson for this Foundation checkpoint.</h2>
            <p>Work through the decision sequence, complete the checkpoint, and record it in your account roadmap. This is authenticated Vault testing content; it is not a publication approval for the underlying asset archive or a practice, feedback, or coaching unlock.</p>
          </section>

          <section className="roadmap-lesson-sections" aria-labelledby="roadmap-lesson-title">
            <div className="member-section-heading">
              <div><p className="member-kicker">Lesson sequence</p><h2 id="roadmap-lesson-title">Make the decision visible.</h2></div>
              <span>{task.learning.sections.length} sections</span>
            </div>
            <div>
              {task.learning.sections.map((section, index) => (
                <article key={section.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{section.title}</h3><p>{section.detail}</p></div>
                </article>
              ))}
            </div>
          </section>

          <section className="roadmap-task-resources roadmap-lesson-checkpoint" aria-labelledby="roadmap-checkpoint-title">
            <div className="member-section-heading">
              <div><p className="member-kicker">Checkpoint</p><h2 id="roadmap-checkpoint-title">Produce evidence, not just notes.</h2></div>
            </div>
            <p>{task.learning.exercise}</p>
            <ul>
              {task.learning.requiredResources.map((resource) => <li key={resource}>{resource}</li>)}
            </ul>
            {profile.isLive ? <StudyProgressButton profileId={profile.id} roadmapWeeks={profile.roadmapWeeks} taskId={task.id} initiallyCompleted={profile.completedTaskIds?.includes(task.id) === true} /> : null}
          </section>

          <footer className="material-next-step">
            <div><p className="member-kicker">Continue the plan</p><h2>Return to the roadmap.</h2><p>Your completion is stored against the signed-in Foundation account when you record this checkpoint.</p></div>
            <Link className="member-primary-button" href="/learn/roadmap">Back to roadmap <span aria-hidden="true">↗</span></Link>
          </footer>
        </article>
    );
  }

  return (
      <article className="member-page roadmap-task-page">
        <nav className="material-breadcrumb" aria-label="Breadcrumb">
          <Link href="/learn/roadmap">Roadmap</Link><span>/</span><span>Learning brief</span><span>/</span><strong>{task.id}</strong>
        </nav>

        <header className="roadmap-task-header">
          <div>
            <p className="member-kicker">Roadmap learning destination · content brief</p>
            <h1>{task.title}</h1>
            <p>{task.learning.objective}</p>
          </div>
          <dl>
            <div><dt>Planned format</dt><dd>{task.learning.plannedFormat}</dd></div>
            <div><dt>Study time</dt><dd>{task.meta.split(" · ").at(-1) ?? task.meta}</dd></div>
            <div><dt>Content state</dt><dd>Not published</dd></div>
          </dl>
        </header>

        <section className="roadmap-task-status" aria-labelledby="roadmap-task-status-title">
          <p className="member-kicker">Honest content boundary</p>
          <h2 id="roadmap-task-status-title">The destination exists; the reviewed lesson does not yet.</h2>
          <p>This roadmap item is connected to a named content record so it has a stable place in the learning journey. It is intentionally not presented as a completed lesson or filled with placeholder teaching copy.</p>
        </section>

        <section className="roadmap-task-resources" aria-labelledby="roadmap-task-resources-title">
          <div className="member-section-heading">
            <div><p className="member-kicker">Content contract</p><h2 id="roadmap-task-resources-title">What this item must contain.</h2></div>
            <span>Before publication</span>
          </div>
          <ul>
            {task.learning.requiredResources.map((resource) => <li key={resource}>{resource}</li>)}
          </ul>
        </section>

        <footer className="material-next-step">
          <div><p className="member-kicker">Continue the plan</p><h2>Return to the roadmap.</h2><p>Use the learning objective to understand the intended outcome, then open a published material when one is connected to this task.</p></div>
          <Link className="member-primary-button" href="/learn/roadmap">Back to roadmap <span aria-hidden="true">↗</span></Link>
        </footer>
      </article>
  );
}
