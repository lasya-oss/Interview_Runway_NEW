import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Interview Kickstart alternative in India",
  description:
    "A respectful, criteria-based guide for engineers comparing InterviewRunway with Interview Kickstart or another interview-prep program in India.",
  alternates: {
    canonical: "/compare/interview-kickstart-alternative-india",
  },
};

const CRITERIA = [
  {
    title: "Starting commitment",
    interviewRunway:
      "The published launch path starts with a ₹799, one-time Vault. The Second Seat and 1:1 coaching are separate, optional steps.",
    verify:
      "Check the other program's current total price, financing terms, included services, and cancellation terms on its official pages or contract.",
  },
  {
    title: "Audience and role fit",
    interviewRunway:
      "The material is framed for engineers in India targeting remote-first and AI-adjacent software, backend, platform, infrastructure, and data roles.",
    verify:
      "Compare the exact roles, experience levels, locations, and interview formats covered—not just the company logos shown.",
  },
  {
    title: "Learning format",
    interviewRunway:
      "The model is staged: self-paced foundations first, optional text-based AI practice next, and capacity-capped human coaching only when needed.",
    verify:
      "Confirm whether the alternative is cohort-based, self-paced, group-led, or 1:1, and how much live support is included in writing.",
  },
  {
    title: "India payment experience",
    interviewRunway:
      "Checkout is priced in INR. Paddle, the merchant of record, shows the exact total including applicable taxes before payment.",
    verify:
      "Check the final currency, taxes, payment methods, financing cost, and foreign-transaction implications for your location.",
  },
  {
    title: "Proof and outcomes",
    interviewRunway:
      "InterviewRunway publishes a learner outcome only with consent and a source. It does not promise a job, salary, visa, or placement.",
    verify:
      "For every provider, separate sourced learner evidence from averages, selected examples, forecasts, and contractual guarantees.",
  },
  {
    title: "Refund and exit terms",
    interviewRunway:
      "Digital-product sales are final once access is granted. Duplicate charges and payments that fail to activate access are reversed through Paddle.",
    verify:
      "Read the provider's current written refund, deferral, attendance, financing, and cancellation conditions before signing or paying.",
  },
] as const;

export default function InterviewKickstartAlternativeIndiaPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="COMPARE ON THE TERMS THAT MATTER"
        title="An Interview Kickstart alternative for engineers in India."
        body="This is a decision guide, not a verdict on another company. InterviewRunway is not affiliated with or endorsed by Interview Kickstart. Competitor products and terms can change, so verify them directly before deciding."
      />

      <section className="content-section" aria-labelledby="comparison-title">
        <div className="container">
          <SectionHeading
            eyebrow="SIX USEFUL CRITERIA"
            title="Compare the commitment, not the marketing volume."
            body="Start with your role, preferred learning format, budget, and need for live support. Then compare what is promised in writing at the moment you buy."
            id="comparison-title"
          />

          <div className="content-grid content-grid-three module-grid">
            {CRITERIA.map((criterion) => (
              <article className="content-card" key={criterion.title}>
                <h3>{criterion.title}</h3>
                <p><strong>InterviewRunway:</strong> {criterion.interviewRunway}</p>
                <p><strong>Verify elsewhere:</strong> {criterion.verify}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="fit-title">
        <div className="container">
          <SectionHeading
            eyebrow="FIT BEFORE FEATURES"
            title="When InterviewRunway may—or may not—fit."
            id="fit-title"
          />
          <div className="content-grid fit-grid">
            <article className="content-card">
              <h3>It may fit if you want</h3>
              <ul>
                <li>A low-commitment, self-paced starting point</li>
                <li>Prep framed for India-to-remote interview contexts</li>
                <li>DSA, system design, behavioural, and remote-career foundations</li>
                <li>Optional practice and coaching instead of one bundled package</li>
                <li>Clear limits without a placement or salary promise</li>
              </ul>
            </article>
            <article className="content-card">
              <h3>Look elsewhere if you need</h3>
              <ul>
                <li>A live cohort from the first day</li>
                <li>High-touch coaching bundled into the initial purchase</li>
                <li>A placement, visa, sponsorship, or salary guarantee</li>
                <li>A purchase today—the InterviewRunway checkout is not active yet</li>
                <li>A format or role focus not covered by the published curriculum</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="checklist-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="BEFORE YOU PAY ANY PROVIDER"
            title="Keep the decision evidence-based."
            id="checklist-title"
          />
          <ul>
            <li>Get the complete price, taxes, financing cost, and refund rules in writing.</li>
            <li>Confirm how many live sessions are included and who conducts them.</li>
            <li>Ask whether access expires and whether pauses or deferrals have conditions.</li>
            <li>Check whether outcome claims describe typical users or selected examples.</li>
            <li>Choose the smallest commitment that can answer your next prep question.</li>
          </ul>
          <div className="section-actions">
            <Link className="text-link" href="/vault">
              Review the ₹799 Vault <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-link" href="/proof">
              Read the proof standard <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
