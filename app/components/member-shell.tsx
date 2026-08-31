import Link from "next/link";
import type { ReactNode } from "react";
import type { DemoProfile } from "@/app/lib/demo-data";
import { Brand } from "./site-chrome";
import { DemoLogoutButton, LiveLogoutButton } from "./member-actions";

const MEMBER_NAV = [
  { key: "today", href: "/learn", label: "Today", mark: "01", access: "library" },
  { key: "roadmap", href: "/learn/roadmap", label: "Roadmap", mark: "02", access: "library" },
  { key: "library", href: "/learn/library", label: "Library", mark: "03", access: "library" },
  { key: "practice", href: "/learn/practice", label: "Practice", mark: "04", access: "practice" },
  { key: "feedback", href: "/learn/feedback", label: "Feedback", mark: "05", access: "feedback" },
  { key: "coaching", href: "/learn/coaching", label: "Coach room", mark: "06", access: "coaching" },
] as const;

const VAULT_SECTION_LABELS: Record<(typeof MEMBER_NAV)[number]["key"], string> = {
  today: "Today",
  roadmap: "Roadmap",
  library: "Library",
  practice: "Practice",
  feedback: "Feedback",
  coaching: "Coach room",
};

type WorkspaceState = {
  window: string;
  signal: string;
  event: string;
  eventTime: string;
};

export function MemberShell({
  profile,
  active,
  children,
}: {
  profile: DemoProfile;
  active: (typeof MEMBER_NAV)[number]["key"];
  children: ReactNode;
}) {
  const isLive = profile.isLive === true;
  const isFreshLearner = profile.progress === 0 && (profile.completedTaskIds?.length ?? 0) === 0;
  const isVaultWorkspace = profile.id === "foundation";
  const isSecondSeatWorkspace = profile.id === "practice";
  const workspaceState: WorkspaceState = isVaultWorkspace
    ? { window: "8–12 weeks", signal: "Baseline pending", event: isFreshLearner ? "First study step" : "Weekly review", eventTime: isFreshLearner ? "After start" : "Sun · 18:00" }
    : isSecondSeatWorkspace
      ? { window: "19 days", signal: isFreshLearner ? "Practice baseline pending" : "78 · practice", event: isFreshLearner ? "First practice round" : "Adaptive mock 08", eventTime: isFreshLearner ? "After start" : "Tue · 20:00" }
      : { window: "13 days", signal: "84 · coach calibrated", event: "Calibration session", eventTime: "Thu · 18:30" };
  const conversion = profile.id === "foundation"
    ? isLive
      ? { href: "/learn/roadmap", label: "Continue Foundation", event: undefined }
      : { href: "/checkout/vault", label: "Start Vault · ₹799", event: "checkout_started" }
    : profile.id === "practice"
      ? { href: "/second-seat", label: "Review Second Seat access", event: undefined }
      : { href: "/qualify", label: "Check Phase 3 eligibility", event: undefined };
  const workspaceRoot = isVaultWorkspace ? "Vault" : isSecondSeatWorkspace ? "Second Seat" : "Calibration";
  const workspaceTitle = isVaultWorkspace ? "Foundation workspace" : isSecondSeatWorkspace ? "The Second Seat workspace" : "Human Calibration workspace";
  const workspaceSubtitle = isLive ? "Signed-in learner view" : "Preview learner view";
  const accessLabel = isVaultWorkspace ? (isLive ? "₹799 access active" : "Demo workspace") : isSecondSeatWorkspace ? (isLive ? "₹2,499 access active" : "Demo workspace") : (isLive ? "Calibration access active" : "Demo workspace");

  return (
    <div className="member-shell" data-member-tier={profile.id} data-member-layout={isVaultWorkspace ? "vault" : isSecondSeatWorkspace ? "second-seat" : "calibration"}>
      <aside className="member-sidebar">
        <div className="member-sidebar-brand"><Brand /><span>Learning workspace</span></div>

        <nav className="member-nav" aria-label="Learner workspace">
          {MEMBER_NAV.map((item) => {
            const unlocked = profile.access[item.access];
            return (
              <Link className={`${active === item.key ? "is-active" : ""} ${unlocked ? "" : "is-locked"}`} href={item.href} key={item.key}>
                <span>{item.mark}</span><b>{item.label}</b>{unlocked ? null : <small>Upgrade</small>}
              </Link>
            );
          })}
        </nav>

        {!isVaultWorkspace ? <CurrentAccessCard profile={profile} /> : null}

        <div className="member-profile-card">
          <span className="member-avatar">{profile.initials}</span>
          <div><strong>{profile.name}</strong><small>{profile.role}</small></div>
          {isLive ? <LiveLogoutButton /> : <DemoLogoutButton />}
        </div>
      </aside>

      <div className="member-surface">
        <header className="member-topbar member-topbar-vault">
          <div className="member-vault-header">
            <div className="member-vault-header-title">
              <span>{workspaceRoot} / {VAULT_SECTION_LABELS[active]}</span>
              <strong>{workspaceTitle}</strong>
              <small>{workspaceSubtitle}</small>
            </div>
            <div className="member-vault-header-metrics">
              <div><span>Target</span><strong>{profile.target}</strong></div>
              <div><span>Current track</span><strong>{profile.roadmapWeeks}-week · W{profile.week}</strong></div>
              <div><span>Interview window</span><strong>{workspaceState.window}</strong></div>
              <div><span>Time zone</span><strong>Asia / Kolkata</strong></div>
              <div><span>Learner data</span><strong>{isLive ? "Account-backed" : "Sample profile"}</strong></div>
            </div>
            <div className="member-vault-header-actions">
              <details className="member-status-drawer" aria-label="Workspace status">
                <summary className="member-status-drawer-toggle" title="Open workspace status panel">
                  <span className="ops-rail-toggle-icon" aria-hidden="true"><i /><i /><i /></span>
                  <span className="member-status-drawer-copy">
                    <b>STATUS</b>
                    <strong className="member-status-drawer-closed">Open</strong>
                    <strong className="member-status-drawer-open">Close</strong>
                  </span>
                </summary>
                <div className="member-status-drawer-content">
                  <WorkspaceStatusContent
                    profile={profile}
                    workspaceState={workspaceState}
                    showCurrentAccess
                  />
                </div>
              </details>
              <span className="member-account-status"><i />{accessLabel}</span>
              <Link href={conversion.href} data-analytics-event={conversion.event}>{conversion.label} ↗</Link>
            </div>
          </div>
        </header>
        <main className="member-main">{children}</main>
      </div>
    </div>
  );
}

function WorkspaceStatusContent({
  profile,
  workspaceState,
  showCurrentAccess = false,
}: {
  profile: DemoProfile;
  workspaceState: WorkspaceState;
  showCurrentAccess?: boolean;
}) {
  const preparationHref = profile.id === "premium"
    ? "/learn/coaching"
    : profile.id === "practice"
      ? "/learn/practice"
      : "/learn/roadmap";

  return (
    <>
      <div className="ops-rail-head"><span>OPS / STATUS</span><i /></div>
      <section>
        <span>Next event</span>
        <strong>{workspaceState.event}</strong>
        <small>{workspaceState.eventTime} · IST</small>
        <Link href={preparationHref}>Open preparation ↗</Link>
      </section>
      <section>
        <span>Current signal</span>
        <strong>{workspaceState.signal}</strong>
        <div className="ops-signal-trace" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <small>{profile.id === "foundation" || workspaceState.signal.includes("pending") ? "No scored mocks yet" : "Evidence from recent sessions"}</small>
      </section>
      {showCurrentAccess ? (
        <section className="ops-current-access">
          <CurrentAccessCard profile={profile} inStatusPanel />
        </section>
      ) : null}
      <section>
        <span>Access stack</span>
        <ul>
          <li className="is-on"><i /> Vault library</li>
          <li className={profile.access.practice ? "is-on" : ""}><i /> AI practice</li>
          <li className={profile.access.coaching ? "is-on" : ""}><i /> Coach room</li>
        </ul>
      </section>
      <p>{profile.isLive ? "PAID FOUNDATION QA<br />₹799 ACCESS ACTIVE" : "DEMO WORKSPACE<br />NO PURCHASE REQUIRED"}</p>
    </>
  );
}

function CurrentAccessCard({ profile, inStatusPanel = false }: { profile: DemoProfile; inStatusPanel?: boolean }) {
  return (
    <div className={`member-plan-card${inStatusPanel ? " member-plan-card-status" : ""}`}>
      <span>Current access</span>
      <strong>{profile.plan}</strong>
      <div><i style={{ width: `${profile.progress}%` }} /></div>
      <small>{profile.progress}% plan progress · Week {profile.week}</small>
      <Link href="/pricing">Compare access</Link>
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
