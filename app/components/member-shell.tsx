import Link from "next/link";
import type { ReactNode } from "react";
import type { DemoProfile } from "@/app/lib/demo-data";
import { Brand } from "./site-chrome";
import { DemoLogoutButton } from "./member-actions";

const MEMBER_NAV = [
  { key: "today", href: "/learn", label: "Today", mark: "01", access: "library" },
  { key: "roadmap", href: "/learn/roadmap", label: "Roadmap", mark: "02", access: "library" },
  { key: "library", href: "/learn/library", label: "Library", mark: "03", access: "library" },
  { key: "practice", href: "/learn/practice", label: "Second Seat", mark: "04", access: "practice" },
  { key: "feedback", href: "/learn/feedback", label: "Feedback", mark: "05", access: "feedback" },
  { key: "coaching", href: "/learn/coaching", label: "Human Calibration", mark: "06", access: "coaching" },
] as const;

export function MemberShell({
  profile,
  active,
  children,
}: {
  profile: DemoProfile;
  active: (typeof MEMBER_NAV)[number]["key"];
  children: ReactNode;
}) {
  const workspaceState = profile.id === "foundation"
    ? { window: "8–12 weeks", signal: "Baseline pending", event: "Weekly review", eventTime: "Sun · 18:00" }
    : profile.id === "practice"
      ? { window: "19 days", signal: "78 · practice", event: "Adaptive mock 08", eventTime: "Tue · 20:00" }
      : { window: "13 days", signal: "84 · coach calibrated", event: "Calibration session", eventTime: "Thu · 18:30" };
  const accessName = profile.id === "foundation"
    ? "Foundation · Sample"
    : profile.id === "practice"
      ? "The Second Seat · Sample"
      : "Human Calibration · Sample";
  const clearanceComplete = profile.clearanceCompleted === profile.clearanceTotal;
  const conversion = profile.id === "foundation"
    ? { href: "/learn/roadmap", label: "Continue Foundation clearance", event: undefined }
    : profile.id === "practice"
      ? { href: "/learn/practice", label: "Open The Second Seat", event: "second_seat_unlock_started" }
      : { href: "/learn/coaching", label: "Open Human Calibration", event: undefined };

  return (
    <div className="member-shell" data-member-tier={profile.id}>
      <aside className="member-sidebar">
        <div className="member-sidebar-brand"><Brand /><span>Learning workspace</span></div>

        <nav className="member-nav" aria-label="Learner workspace">
          {MEMBER_NAV.map((item) => {
            const unlocked = profile.access[item.access];
            return (
              <Link className={`${active === item.key ? "is-active" : ""} ${unlocked ? "" : "is-locked"}`} href={item.href} key={item.key}>
                <span>{item.mark}</span><b>{item.label}</b>{unlocked ? null : <small>{item.key === "practice" ? "Clearance" : "Evidence"}</small>}
              </Link>
            );
          })}
        </nav>

        <div className="member-plan-card">
          <span>Current access</span>
          <strong>{accessName}</strong>
          <div><i style={{ width: `${profile.progress}%` }} /></div>
          <small>{profile.progress}% plan progress · Week {profile.week}<br />{clearanceComplete ? "Sample clearance complete" : `Sample clearance ${profile.clearanceCompleted} of ${profile.clearanceTotal}`}</small>
          <Link href="/pricing">Compare access</Link>
        </div>

        <div className="member-profile-card">
          <span className="member-avatar">{profile.initials}</span>
          <div><strong>{profile.name}</strong><small>{profile.role}</small></div>
          <DemoLogoutButton />
        </div>
      </aside>

      <div className="member-surface">
        <header className="member-topbar">
          <div className="member-status-band">
            <div><span>Target</span><strong>{profile.target}</strong></div>
            <div><span>Current track</span><strong>{profile.roadmapWeeks}-week · W{profile.week}</strong></div>
            <div><span>Interview window</span><strong>{workspaceState.window}</strong></div>
            <div><span>Timezone</span><strong>Asia / Kolkata</strong></div>
          </div>
          <div className="member-topbar-signals">
            <span><i /> Demo workspace · sample learner data</span>
            <span>{profile.streak}-day rhythm</span>
            <Link href={conversion.href} data-analytics-event={conversion.event}>{conversion.label} ↗</Link>
          </div>
        </header>
        <main className="member-main">{children}</main>
      </div>

      <aside className="member-ops-rail" aria-label="Workspace status">
        <div className="ops-rail-head"><span>OPS / STATUS</span><i /></div>
        <section>
          <span>Next event</span>
          <strong>{workspaceState.event}</strong>
          <small>{workspaceState.eventTime} · IST</small>
          <Link href={profile.id === "premium" ? "/learn/coaching" : profile.id === "practice" ? "/learn/practice" : "/learn/roadmap"}>Open preparation ↗</Link>
        </section>
        <section>
          <span>Current signal</span>
          <strong>{workspaceState.signal}</strong>
          <div className="ops-signal-trace" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <small>{profile.id === "foundation" ? "No scored mocks yet" : "Evidence from recent sessions"}</small>
        </section>
        <section>
          <span>Access stack</span>
          <ul>
            <li className="is-on"><i /> Foundation</li>
            <li className={profile.access.practice ? "is-on" : ""}><i /> The Second Seat</li>
            <li className={profile.access.coaching ? "is-on" : ""}><i /> Human Calibration</li>
          </ul>
        </section>
        <p>DEMO WORKSPACE<br />NO PURCHASE REQUIRED</p>
      </aside>
    </div>
  );
}

export function LockedMemberPanel({
  title,
  body,
  tier,
  children,
}: {
  title: string;
  body: string;
  tier: string;
  children?: ReactNode;
}) {
  return (
    <section className="member-locked-panel">
      <div className="locked-orbit" aria-hidden="true"><i /><i /><span /></div>
      <p className="member-kicker">Available with {tier}</p>
      <h1>{title}</h1>
      <p>{body}</p>
      {children}
      <Link className="member-primary-button" href="/pricing">Compare plans <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
