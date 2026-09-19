import type { Metadata } from "next";
import Link from "next/link";
import {
  CtaLink,
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "What Interview Runway is and how its products and services fit together: Foundation, the Vault, the Second Seat, Meeting Copilot, AI Prep, and 1:1 coaching.",
  alternates: { canonical: "/about-us" },
  openGraph: {
    title: "About Us | InterviewRunway",
    description:
      "AI-powered interview preparation by VividLabs AI — an overview of Interview Runway's products and services.",
    url: "/about-us",
  },
};

const OFFERINGS = [
  {
    kicker: "START HERE",
    name: "The Vault",
    body: "Build the fundamentals for remote and AI-adjacent software interviews: DSA, system design, behavioural communication, company context, and the reality of working from India.",
    href: "/vault",
  },
  {
    kicker: "PRACTICE LOOP",
    name: "The Second Seat",
    body: "A text-first interview practice loop that responds to your answers, shows the evidence behind your score, and changes what you study next.",
    href: "/second-seat",
  },
  {
    kicker: "HUMAN CALIBRATION",
    name: "1:1 Coaching · Human Calibration",
    body: "Founder-led coaching for engineers who have done the groundwork, practised repeatedly, and can point to the part of the interview loop that still is not moving.",
    href: "/premium",
  },
  {
    kicker: "SECOND SEAT COMPANION",
    name: "Meeting Copilot",
    body: "A Second Seat companion available to learners with active Second Seat access.",
    href: "/learn/meeting-copilot",
  },
  {
    kicker: "CANONICAL ROUTE",
    name: "AI Prep",
    body: "The AI Prep address redirects to the Second Seat, the canonical practice route.",
    href: "/ai-prep",
  },
  {
    kicker: "ENTRY LAYER",
    name: "Foundation",
    body: "Start with the ₹799 Foundation: build the foundation, complete the checkpoints, and unlock eligibility.",
    href: "/pricing",
  },
] as const;

export default function AboutUsPage() {
  return (
    <PageShell>
      <PageHero
        motif="airfoil"
        eyebrow="ABOUT US"
        title={
          <>
            One runway, <em>every kind of interview prep.</em>
          </>
        }
        body="Interview Runway is AI-powered interview preparation by VividLabs AI, built for engineers in India targeting remote and AI-adjacent tech roles."
      >
        <div className="hero-actions">
          <CtaLink href="/pricing">
            See pricing <span aria-hidden="true">→</span>
          </CtaLink>
          <Link className="text-link" href="/curriculum">
            Explore the curriculum <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      <section className="content-section" aria-labelledby="offerings-title">
        <div className="container">
          <SectionHeading
            eyebrow="PRODUCTS & SERVICES"
            title="What Interview Runway offers."
            body="Each offering below is described in the words of its own page. Follow the link for the full detail."
            id="offerings-title"
          />

          <div className="content-grid content-grid-three">
            {OFFERINGS.map((offering, index) => (
              <article className="content-card glass-card" key={offering.name}>
                <p className="module-kicker">
                  {String(index + 1).padStart(2, "0")} / {offering.kicker}
                </p>
                <h3>{offering.name}</h3>
                <p>{offering.body}</p>
                <Link className="text-link" href={offering.href}>
                  Open {offering.name} <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="founder-pointer-title">
        <div className="container">
          <SectionHeading
            eyebrow="THE TEAM"
            title="Looking for the person behind the runway?"
            body="The founder profile lives on its own page and is published only when each credential has been supplied and checked."
            id="founder-pointer-title"
          />
          <Link className="text-link" href="/about">
            About the founder <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
