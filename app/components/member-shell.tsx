"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { DemoProfile } from "@/app/lib/demo-data";
import { CurrentAccessCard } from "./current-access-card";
import { RoadmapProgressProvider, RoadmapTrackLabel } from "@/app/learn/roadmap/learner-progress-client";
import { FocusTimeTracker } from "@/app/learn/focus-time-tracker";
import { DemoLogoutButton, LiveLogoutButton, LivePlanSwitcher } from "./member-actions";

const MEMBER_NAV = [
  { key: "today", href: "/learn", label: "Dashboard", mark: "01", access: "library" },
  { key: "roadmap", href: "/learn/roadmap", label: "Roadmap", mark: "02", access: "library" },
  { key: "library", href: "/learn/library", label: "Library", mark: "03", access: "library" },
  { key: "practice", href: "/learn/practice", label: "Practice", mark: "04", access: "practice" },
  { key: "feedback", href: "/learn/feedback", label: "Feedback", mark: "05", access: "feedback" },
  { key: "meeting-copilot", href: "/learn/meeting-copilot", label: "Meeting Copilot", mark: "06", access: "practice" },
  { key: "whatsapp-support", href: "/learn/whatsapp-support", label: "WhatsApp Support", mark: "07", access: "practice" },
  { key: "coaching", href: "/learn/coaching", label: "Coach room", mark: "08", access: "coaching" },
] as const;

const MEETING_COPILOT_URL = "http://127.0.0.1:8123/";

const VAULT_SECTION_LABELS: Record<(typeof MEMBER_NAV)[number]["key"], string> = {
  today: "Dashboard",
  roadmap: "Roadmap",
  library: "Library",
  practice: "Practice",
  feedback: "Feedback",
  coaching: "Coach room",
  "meeting-copilot": "Meeting Copilot",
  "whatsapp-support": "WhatsApp Support",
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
  active?: (typeof MEMBER_NAV)[number]["key"];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!profile.access.library) return;
    // Vinext's native prefetch is source-route-specific. The persistent
    // sidebar's one-shot viewport observer cannot warm a new return journey.
    if (pathname?.startsWith("/learn/library") || pathname?.startsWith("/learn/material")) router.prefetch("/learn/roadmap");
    else if (pathname === "/learn/roadmap") router.prefetch("/learn/library");
  }, [pathname, profile.access.library, router]);
  const currentSection = sectionForPathname(pathname) ?? active ?? "today";
  const isLive = profile.isLive === true;
  const isFreshLearner = profile.progress === 0 && (profile.completedTaskIds?.length ?? 0) === 0;
  const isVaultWorkspace = profile.id === "foundation";
  const isSecondSeatWorkspace = profile.id === "practice";
  const showDashboardLabel = isVaultWorkspace || isSecondSeatWorkspace;
  const workspaceState: WorkspaceState = isVaultWorkspace
    ? { window: "8–12 weeks", signal: "Starting score pending", event: isFreshLearner ? "First study step" : "Weekly review", eventTime: isFreshLearner ? "After start" : "Sun · 18:00" }
    : isSecondSeatWorkspace
      ? { window: "19 days", signal: isFreshLearner ? "Starting score pending" : "78 · practice", event: isFreshLearner ? "First practice round" : "Adaptive mock 08", eventTime: isFreshLearner ? "After start" : "Tue · 20:00" }
      : { window: "13 days", signal: "84 · coach reviewed", event: "Human Calibration session", eventTime: "Thu · 18:30" };
  const conversion = profile.id === "foundation"
    ? isLive
      ? { href: "/learn/roadmap", label: "Continue Foundation", event: undefined }
      : { href: "/checkout/vault", label: "Start Vault · ₹799", event: "checkout_started" }
    : profile.id === "practice"
      ? { href: "/second-seat", label: "Review Second Seat access", event: undefined }
      : isLive
        ? { href: "/learn/coaching", label: "Open Coach room", event: undefined }
        : { href: "/qualify", label: "Check Phase 3 eligibility", event: undefined };
  const workspaceRoot = isVaultWorkspace ? "Vault" : isSecondSeatWorkspace ? "Second Seat" : "Human Calibration";
  const workspaceTitle = isVaultWorkspace ? "Foundation workspace" : isSecondSeatWorkspace ? "The Second Seat workspace" : "Human Calibration workspace";
  const workspaceSubtitle = isLive ? "Signed-in learner view" : "Preview learner view";
  const accessLabel = isVaultWorkspace
    ? (isLive ? "Vault Plan Active" : "Demo workspace")
    : isSecondSeatWorkspace
      ? (isLive ? "Second Seat Plan Active" : "Demo workspace")
      : (isLive ? "Human Calibration Plan Active" : "Demo workspace");
  const memberNav = MEMBER_NAV.filter((item) => (
    (item.key !== "meeting-copilot" && item.key !== "whatsapp-support")
      || (isSecondSeatWorkspace && profile.access.practice)
  ));

  return (
    <div className="member-shell" data-member-tier={profile.id} data-member-layout={isVaultWorkspace ? "vault" : isSecondSeatWorkspace ? "second-seat" : "calibration"}>
      <RoadmapProgressProvider
        profileId={profile.id}
        roadmapWeeks={profile.roadmapWeeks}
        isLive={isLive}
        initialCompleted={profile.completedTaskIds}
        initialCompletionActivity={profile.completionActivity}
        initialFocusedSeconds={profile.focusedSeconds}
        initialProgress={profile.progress}
        initialWeek={profile.week}
      >
      {isLive ? <FocusTimeTracker profileId={profile.id} /> : null}
      <aside className="member-sidebar">
        <div className="member-sidebar-brand"><Brand /><span>Learning workspace</span></div>

        <nav className="member-nav" aria-label="Learner workspace">
          {memberNav.map((item, index) => {
            const unlocked = profile.access[item.access];
            return (
              <Link
                className={`${currentSection === item.key ? "is-active" : ""} ${unlocked ? "" : "is-locked"}`}
                href={item.href}
                key={item.key}
                onClick={item.key === "meeting-copilot" && unlocked ? openMeetingCopilot : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span><MemberNavigationLabel>{item.key === "today" && showDashboardLabel ? "Dashboard" : item.label}</MemberNavigationLabel>{unlocked ? null : <small>Upgrade</small>}
              </Link>
            );
          })}
        </nav>

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
              <span>{workspaceRoot} / {VAULT_SECTION_LABELS[currentSection]}</span>
              <strong>{workspaceTitle}</strong>
              <small>{workspaceSubtitle}</small>
            </div>
            <div className="member-vault-header-metrics">
              <div><span>Target</span><strong>{profile.target}</strong></div>
              <div><span>Current plan</span><strong><RoadmapTrackLabel fallbackWeek={profile.week} roadmapWeeks={profile.roadmapWeeks} /></strong></div>
              <div><span>Plan timeline</span><strong>{workspaceState.window}</strong></div>
              <div><span>Time zone</span><strong>Asia / Kolkata</strong></div>
              <div><span>Learner data</span><strong>{isLive ? "Account-backed" : "Sample profile"}</strong></div>
            </div>
            <div className="member-vault-header-actions">
              {isLive && (profile.availablePlans?.length ?? 0) > 1 ? (
                <LivePlanSwitcher
                  currentPlan={profile.id}
                  availablePlans={profile.availablePlans}
                />
              ) : null}
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
      </RoadmapProgressProvider>
    </div>
  );
}

function MemberNavigationLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return <b data-navigation-pending={pending || undefined} aria-busy={pending}>{children}</b>;
}

function sectionForPathname(pathname: string | null): (typeof MEMBER_NAV)[number]["key"] | null {
  if (!pathname || pathname === "/learn") return "today";
  if (pathname.startsWith("/learn/roadmap")) return "roadmap";
  if (pathname.startsWith("/learn/library") || pathname.startsWith("/learn/material")) return "library";
  if (pathname.startsWith("/learn/practice")) return "practice";
  if (pathname.startsWith("/learn/feedback")) return "feedback";
  if (pathname.startsWith("/learn/coaching")) return "coaching";
  if (pathname.startsWith("/learn/meeting-copilot")) return "meeting-copilot";
  if (pathname.startsWith("/learn/whatsapp-support")) return "whatsapp-support";
  return null;
}

function openMeetingCopilot() {
  window.open(MEETING_COPILOT_URL, "_blank", "noopener,noreferrer");
}

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="InterviewRunway home">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      <span>INTERVIEW<span>RUNWAY</span></span>
    </Link>
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
      <div className="ops-rail-head"><span>WORKSPACE / STATUS</span><i /></div>
      <section>
        <span>Next activity</span>
        <strong>{workspaceState.event}</strong>
        <small>{workspaceState.eventTime} · IST</small>
        <Link className="member-action-button" href={preparationHref}>Open preparation <span aria-hidden="true">↗</span></Link>
      </section>
      <section>
        <span>Current score</span>
        <strong>{workspaceState.signal}</strong>
        <div className="ops-signal-trace" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <small>{profile.id === "foundation" || workspaceState.signal.includes("pending") ? "No scored practice yet" : "Evidence from recent sessions"}</small>
      </section>
      {showCurrentAccess ? (
        <section className="ops-current-access">
          <CurrentAccessCard
            plan={profile.plan}
            fallbackProgress={profile.progress}
            fallbackWeek={profile.week}
            inStatusPanel
          />
        </section>
      ) : null}
      <section>
        <span>Your access</span>
        <ul>
          <li className="is-on"><i /> Vault materials</li>
          <li className={profile.access.practice ? "is-on" : ""}><i /> AI practice</li>
          <li className={profile.access.coaching ? "is-on" : ""}><i /> Coaching</li>
        </ul>
      </section>
      <p>{profile.isLive
        ? profile.id === "premium"
          ? "HUMAN CALIBRATION<br />FULL ACCESS ACTIVE"
          : profile.id === "practice"
            ? "PAID SECOND SEAT QA<br />₹2,499 ACCESS ACTIVE"
            : "PAID FOUNDATION QA<br />₹799 ACCESS ACTIVE"
        : "DEMO WORKSPACE<br />NO PURCHASE REQUIRED"}</p>
    </>
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
