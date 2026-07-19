import Link from "next/link";
import { AnalyticsView } from "@/app/components/analytics-view";
import type { DemoProfile } from "@/app/lib/demo-data";

const SAMPLE_CLEARANCE_REQUIREMENTS = [
  ["Baseline diagnostic", "Capture the target role, timeline, and starting signal."],
  ["DSA pattern system", "Complete the required recognition and explanation checks."],
  ["System-design decision lab", "Defend one architecture choice and its failure behaviour."],
  ["Behavioural evidence bank", "Prepare ownership stories with reviewable evidence."],
  ["Mock demonstration checkpoint", "Finish the required interview-shaped demonstration."],
  ["Initial learner signal profile", "Generate the baseline the Second Seat will test under pressure."],
] as const;

export function SecondSeatClearancePanel({ profile }: { profile: DemoProfile }) {
  const eligible = profile.clearanceTotal === SAMPLE_CLEARANCE_REQUIREMENTS.length
    && profile.clearanceCompleted === SAMPLE_CLEARANCE_REQUIREMENTS.length;
  const status = eligible
    ? "CLEARANCE COMPLETE · SECOND SEAT AVAILABLE"
    : `SECOND SEAT CLEARANCE · ${profile.clearanceCompleted} OF ${profile.clearanceTotal} COMPLETE`;

  return (
    <section className="member-section" aria-labelledby="second-seat-clearance-title">
      <AnalyticsView
        event="foundation_clearance_viewed"
        payload={{ surface: "sample_member_workspace", completed: profile.clearanceCompleted, total: profile.clearanceTotal }}
      />
      {eligible ? (
        <AnalyticsView
          event="second_seat_eligibility_completed"
          payload={{ surface: "sample_member_workspace", profile: profile.id }}
        />
      ) : null}

      <div className="member-section-heading">
        <div>
          <p className="member-kicker">Controlled demo · sample clearance</p>
          <h2 id="second-seat-clearance-title">Foundation powers the Second Seat.</h2>
        </div>
        <span>{status}</span>
      </div>

      <div className="mock-history-table" aria-label="Sample Foundation clearance requirements">
        {SAMPLE_CLEARANCE_REQUIREMENTS.map(([title, detail], index) => {
          const complete = index < profile.clearanceCompleted;
          return (
            <div key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
              <b aria-label={complete ? "Complete" : "Pending"}>{complete ? "✓" : "—"}</b>
              <time>{complete ? "Ready" : "Pending"}</time>
            </div>
          );
        })}
      </div>

      <div className="member-panel-label">
        <span>This sample state demonstrates the gate; it is not a commercial eligibility record.</span>
        <Link
          className="member-primary-button"
          href={eligible ? "/learn/practice" : "/learn/roadmap"}
          data-analytics-event={eligible ? "second_seat_unlock_started" : undefined}
        >
          {eligible ? "Open The Second Seat" : "Continue sample clearance"} <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
