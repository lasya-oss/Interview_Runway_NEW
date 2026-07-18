import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { MemberShell } from "@/app/components/member-shell";
import { LEARNING_MATERIALS, MOCK_HISTORY, SCORE_DIMENSIONS } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Today | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function LearnerHomePage() {
  const profile = await requireDemoProfile("/learn");
  const scoreKey = profile.id;
  const continuedMaterials = LEARNING_MATERIALS.slice(0, profile.id === "foundation" ? 3 : 4);

  return (
    <MemberShell profile={profile} active="today">
      <div className="member-page member-dashboard">
        <section className="member-hero-grid">
          <div className="member-hero-copy">
            <p className="member-kicker">Friday · Week {profile.week} of {profile.roadmapWeeks}</p>
            <h1>Good evening, {profile.firstName}. <em>Keep the loop tight.</em></h1>
            <p>{profile.focus}</p>
          </div>
          <div className="readiness-dial" style={{ "--readiness": `${profile.progress * 3.6}deg` } as CSSProperties}>
            <div><strong>{profile.progress}</strong><span>{profile.id === "foundation" ? <>Plan<br />complete</> : <>Readiness<br />signal</>}</span></div>
            <i /><i /><i />
          </div>
        </section>

        <section className="member-command-grid">
          <article className="next-action-panel">
            <div className="member-panel-label"><span>Next action</span><b>{profile.nextActionMeta}</b></div>
            <div className="next-action-visual" aria-hidden="true"><i /><i /><i /><span /></div>
            <h2>{profile.nextAction}</h2>
            <p>{profile.id === "foundation" ? "Continue the lesson, then explain your choice aloud before viewing the worked decision tree." : profile.id === "practice" ? "The prompt adapts after each design commitment. Your previous gap is already loaded into the rubric." : "Bring two examples that show cross-team influence. The coach packet has the evidence prompts ready."}</p>
            <Link className="member-primary-button" href={profile.id === "premium" ? "/learn/coaching" : profile.id === "practice" ? "/learn/practice" : "/learn/material/rate-limiter"}>Continue <span aria-hidden="true">↗</span></Link>
          </article>

          <article className="weekly-plan-panel">
            <div className="member-panel-label"><span>This week</span><b>{profile.week === 4 ? "Final pass" : "Plan active"}</b></div>
            <div className="week-strip" aria-label="Weekly activity">
              {[72, 100, 48, 86, 34, 0, 0].map((value, index) => <span key={index}><i style={{ height: `${Math.max(8, value)}%` }} /><b>{"MTWTFSS"[index]}</b></span>)}
            </div>
            <dl className="weekly-stats">
              <div><dt>Completed</dt><dd>{profile.id === "foundation" ? "5 / 9" : profile.id === "practice" ? "8 / 11" : "9 / 10"}</dd></div>
              <div><dt>Focused time</dt><dd>{profile.id === "foundation" ? "2h 14m" : profile.id === "practice" ? "4h 38m" : "5h 06m"}</dd></div>
              <div><dt>Next review</dt><dd>{profile.id === "premium" ? "Thu 18:30" : "Sunday"}</dd></div>
            </dl>
          </article>
        </section>

        <section className="member-section">
          <div className="member-section-heading"><div><p className="member-kicker">Skill signal</p><h2>Where the evidence points.</h2></div><Link href="/learn/feedback">Open full feedback <span>↗</span></Link></div>
          <div className="signal-grid">
            {profile.id === "foundation" ? (
              <article className="foundation-baseline-panel">
                <span>BASELINE / NOT ESTABLISHED</span>
                <div className="baseline-radar" aria-hidden="true"><i /><i /><i /><b>?</b></div>
                <h3>No synthetic readiness score.</h3>
                <p>Your lesson completion is tracked, but readiness only appears after a scored practice session. Until then, the product keeps those concepts separate.</p>
                <Link href="/pricing">See how AI practice establishes it ↗</Link>
              </article>
            ) : (
              <article className="signal-bars">
                {SCORE_DIMENSIONS.map((dimension) => (
                  <div key={dimension.label}><span>{dimension.label}</span><div><i style={{ width: `${dimension[scoreKey]}%` }} /></div><b>{dimension[scoreKey]}</b></div>
                ))}
              </article>
            )}
            <article className={`tier-insight tier-insight-${profile.id}`}>
              <span>{profile.id === "foundation" ? "Foundation signal" : profile.id === "practice" ? "Adaptive plan change" : "Coach observation"}</span>
              <h3>{profile.id === "foundation" ? "Explanation quality is ahead of trade-off depth." : profile.id === "practice" ? "Move consistency decisions to minute five." : "Your scope is senior; your story still sounds team-local."}</h3>
              <p>{profile.id === "foundation" ? "Finish the rate-limit and caching decision guides before adding timed practice." : profile.id === "practice" ? "The next two mocks will probe consistency before scale so the choice becomes automatic." : "Thursday’s session will rebuild one project story around influence, decision cost, and measurable outcome."}</p>
            </article>
          </div>
        </section>

        {profile.access.practice ? (
          <section className="member-section">
            <div className="member-section-heading"><div><p className="member-kicker">Recent practice</p><h2>Every attempt leaves evidence.</h2></div><Link href="/learn/practice">Start another mock <span>↗</span></Link></div>
            <div className="mock-history-table">
              {MOCK_HISTORY.map((mock) => <div key={mock.id}><span>{mock.id}</span><strong>{mock.title}</strong><small>{mock.signal}</small><b>{mock.score}</b><time>{mock.date}</time></div>)}
            </div>
          </section>
        ) : null}

        <section className="member-section">
          <div className="member-section-heading"><div><p className="member-kicker">Continue learning</p><h2>Materials placed in context.</h2></div><Link href="/learn/library">View the library <span>↗</span></Link></div>
          <div className="member-material-row">
            {continuedMaterials.map((material) => (
              <Link href={`/learn/material/${material.slug}`} className="member-material-card" key={material.slug}>
                <span>{material.number}</span><small>{material.category} · {material.duration}</small><h3>{material.title}</h3><p>{material.description}</p><b>{material.format} ↗</b>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MemberShell>
  );
}
