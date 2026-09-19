import type { Metadata } from "next";
import Link from "next/link";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { PricingWorkspacePreview } from "@/app/components/pricing-workspace-preview";
import { AnalyticsView } from "@/app/components/analytics-view";
import { CtaLink, PageShell, SectionHeading } from "@/app/components/site-chrome";
import { OFFERS } from "@/app/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — Foundation, The Second Seat & Human Calibration",
  description: "Start with ₹799 Foundation, earn access to the ₹2,499 Second Seat, and add capacity-capped Human Calibration only when the evidence calls for it.",
  alternates: { canonical: "/pricing" },
};

const PRICING_LAYERS = [
  {
    number: "01",
    label: "FOUNDATION",
    offer: OFFERS.vault,
    displayName: "Foundation",
    entitlement: "Lifetime access to the launch edition, checkpoints, and included updates",
    status: "START HERE",
    priceNote: "One payment",
    body: "Build the foundation. Complete the checkpoints. Unlock eligibility.",
    includes: ["4-week and 12-week flight plans", "Patterns, systems, and behavioural evidence", "Role intelligence and remote-career material", "Diagnostics, mock demonstrations, and checkpoints"],
    href: "/checkout/vault",
    cta: "Start Foundation",
  },
  {
    number: "02",
    label: "THE SYSTEM COMES ALIVE",
    offer: OFFERS["ai-prep"],
    displayName: "The Second Seat",
    entitlement: "Foundation-cleared access · included practice-time allowance shown before unlock",
    status: "FOUNDATION CLEARANCE REQUIRED",
    priceNote: "Available after clearance",
    body: "Live intelligence for practice, guidance, and permitted interview support. You remain in command.",
    includes: ["Dynamic, responsive mock interviews", "Interviewer, technical, and communication perspectives", "WhatsApp guidance", "Specialist training systems", "Included practice-time allowance", "Permitted live interview support"],
    href: "/second-seat",
    cta: "Preview the Second Seat",
  },
  {
    number: "03",
    label: "HUMAN CALIBRATION",
    offer: OFFERS.premium,
    displayName: "Human Calibration",
    entitlement: "Evidence-led · capacity capped · scope and quote confirmed after review",
    status: "APPLICATION REQUIRED",
    priceNote: "No public checkout",
    body: "Apply for a real person only when repeated evidence identifies a persistent gap.",
    includes: ["Flight-recorder evidence packet", "Focused review of one persistent gap", "Human judgment and mentoring", "Explicit correction and next-action plan"],
    href: "/qualify",
    cta: "Check if you qualify",
  },
] as const;

const COMPARISON_ROWS = [
  ["Core job", "Build a usable baseline", "Practise, observe, and guide", "Calibrate one persistent gap"],
  ["Entry condition", "Open to every target learner", "Foundation clearance complete", "Repeated evidence identifies a human need"],
  ["Structured flight plan", "4-week and 12-week", "Responds to practice evidence", "Becomes the mentor context"],
  ["Responsive mock interviews", "Mock demonstrations and checkpoints", "Core experience", "Transcripts shape the review"],
  ["Multiple perspectives", "Introduced in the curriculum", "Live interviewer, technical, and communication views", "A person resolves the remaining ambiguity"],
  ["Practice time", "Not metered", "Included allowance; additions disclosed before unlock", "Defined by the confirmed package"],
  ["Purchase path", "Direct Foundation checkout", "Preview publicly; unlock after clearance", "Review evidence, scope, fit, and availability"],
] as const;

const PRICING_FAQS = [
  {
    question: "Do I need to buy all three layers?",
    answer: "No. Start with Foundation. The Second Seat becomes available only after measurable clearance, and Human Calibration is reserved for a persistent gap that repeated evidence has made visible.",
  },
  {
    question: "Is the ₹799 Foundation a subscription?",
    answer: "No. It is a one-time purchase with the entitlement shown at checkout. No upgrade is preselected.",
  },
  {
    question: "Can I buy the Second Seat directly?",
    answer: "No. You can preview it, but the unlock appears only after the required Foundation systems, diagnostic, mock checkpoint, and initial signal profile are complete. The gate measures readiness; it is not artificial scarcity.",
  },
  {
    question: "When does Human Calibration make sense?",
    answer: "When repeated Second Seat practice exposes the same narrow gap and human judgment is more useful than more repetition. Qualification, package scope, availability, and a private quote are confirmed before booking.",
  },
] as const;

export default async function PricingPage() {
  const user = await getChatGPTUser();
  const signedIn = user !== null;
  const learnerName = getLearnerName(user?.fullName, user?.email);

  return (
    <PageShell mobilePurchase>
      <section className="content-section pricing-assembly pricing-assembly-first" aria-labelledby="pricing-layers-title">
        <div className="container">
          <SectionHeading
            eyebrow="ONE CONTINUOUS FLIGHT PATH"
            title="Foundation earns access. The Second Seat brings it alive."
            body="Human Calibration joins only when technology has made a remaining gap specific enough to deserve a person's time."
            id="pricing-layers-title"
            level="h1"
          />
          <div className="pricing-layer-grid">
            {PRICING_LAYERS.map((layer, index) => (
              <article className={`pricing-layer pricing-layer-${index + 1}`} key={layer.offer.slug}>
                <AnalyticsView event="pricing_tier_viewed" payload={{ tier: layer.offer.slug, surface: "pricing" }} />
                <div className="pricing-layer-top"><span>{layer.number} / {layer.label}</span><b>{layer.status}</b></div>
                <h2>{layer.displayName}</h2>
                <div className="pricing-layer-price"><strong>{layer.offer.priceLabel}</strong><span>{layer.priceNote}</span></div>
                <p>{layer.body}</p>
                <ul>{layer.includes.map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="pricing-layer-entitlement"><span>Access model</span><b>{layer.entitlement}</b></div>
                {index === 0 && signedIn ? (
                  <Link className="primary-cta" href="/learn">
                    Open workspace <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <Link
                    className={index === 0 ? "primary-cta" : "text-link"}
                    data-analytics-event={index === 0 ? "foundation_checkout_started" : index === 1 ? "second_seat_preview_started" : undefined}
                    href={layer.href}
                  >
                    {layer.cta} <span aria-hidden="true">↗</span>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section pricing-workspace-section" aria-labelledby="pricing-workspace-title">
        <div className="container">
          <div className="pricing-workspace-heading">
            <SectionHeading
              eyebrow="CONTROLLED SECOND SEAT DEMO"
              title="Enter a populated cockpit—not an empty dashboard."
              body="Inspect a sample learner at week three: responsive practice, several perspectives, specific evidence, and one defensible next action."
              id="pricing-workspace-title"
            />
            <div className="pricing-workspace-identity">
              <span>DEMO LEARNER</span>
              <strong>{learnerName}</strong>
              <small>{user ? "Name shown in this preview only" : "Sample profile"}</small>
            </div>
          </div>
          <PricingWorkspacePreview learnerName={learnerName} />
        </div>
      </section>

      <section className="content-section pricing-comparison-section" aria-labelledby="comparison-title">
        <div className="container">
          <SectionHeading
            eyebrow="COMPARE THE ROLE OF EACH LAYER"
            title="Know what changes before you add it."
            body="The layers are additive, not interchangeable. A higher price does not make the earlier work optional."
            id="comparison-title"
          />
          <div className="pricing-table-wrap">
            <table className="pricing-table">
              <thead><tr><th scope="col">Decision</th><th scope="col">Foundation</th><th scope="col">The Second Seat</th><th scope="col">Human Calibration</th></tr></thead>
              <tbody>
                {COMPARISON_ROWS.map(([label, vault, ai, premium]) => (
                  <tr key={label}><th scope="row">{label}</th><td>{vault}</td><td>{ai}</td><td>{premium}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pricing-disclosure">The public path never skips Foundation clearance. Included practice time and any additional operating cost are shown before an unlock. Human Calibration has no public checkout: qualification, scope, availability, and a private quote come first.</p>
        </div>
      </section>

      <section className="content-section pricing-route-section" aria-labelledby="pricing-route-title">
        <div className="container pricing-route-layout">
          <SectionHeading
            eyebrow="HOW THE PATH WORKS"
            title="Each unlock follows evidence."
            body="Learn the terrain, unlock live intelligence, then bring in a person only when the remaining gap needs human judgment."
            id="pricing-route-title"
          />
          <ol className="pricing-route">
            <li><span>01</span><div><h3>Build the flight plan</h3><p>Start Foundation directly. Nothing else is added to the order.</p></div></li>
            <li><span>02</span><div><h3>Complete measurable clearance</h3><p>Required systems, the baseline diagnostic, a mock checkpoint, and an initial signal profile make the Second Seat unlock visible.</p></div></li>
            <li><span>03</span><div><h3>Apply only when evidence says so</h3><p>Human Calibration opens around a named gap, completed prerequisites, explicit scope, and real availability.</p><Link className="text-link" href="/qualify">Check if you qualify <span aria-hidden="true">↗</span></Link></div></li>
          </ol>
        </div>
      </section>

      <section className="content-section pricing-faq-section" aria-labelledby="pricing-faq-title">
        <div className="container faq-layout-v2">
          <SectionHeading eyebrow="PRICING QUESTIONS" title="No ambiguity before payment." id="pricing-faq-title" />
          <div className="faq-list faq-list-v2">
            {PRICING_FAQS.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="section-pad final-cta" aria-labelledby="pricing-cta-title">
        <div className="container final-cta-inner">
          <p className="eyebrow">START WITH THE FOUNDATION</p>
          <h2 id="pricing-cta-title">Build the flight plan first.</h2>
          <p>Foundation is {OFFERS.vault.priceLabel} once. Complete its checkpoints, then unlock the Second Seat when you are ready to use it.</p>
          <div className="section-actions">
            {signedIn ? (
              <CtaLink href="/learn">Open workspace <span aria-hidden="true">→</span></CtaLink>
            ) : (
              <CtaLink href="/checkout/vault" event="foundation_checkout_started">Start Foundation <span aria-hidden="true">↗</span></CtaLink>
            )}
            <Link className="text-link" href="/curriculum">Explore the curriculum <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function getLearnerName(fullName: string | null | undefined, email: string | undefined): string {
  const preferredName = fullName?.trim().split(/\s+/)[0];
  if (preferredName) return preferredName;

  const emailName = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (emailName) return emailName.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return "Your name here";
}
