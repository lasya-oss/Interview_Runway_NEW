import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { findRoadmapTask } from "@/app/lib/roadmap-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning brief | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function RoadmapTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = findRoadmapTask(id);
  if (!task || task.learning.kind !== "planned") notFound();

  const profile = await requireDemoProfile(`/learn/roadmap/task/${id}`);

  return (
    <MemberShell profile={profile} active="roadmap">
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
    </MemberShell>
  );
}
