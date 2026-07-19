import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsView } from "@/app/components/analytics-view";
import { HomeAeroStage } from "@/app/components/aero-experience";
import { Reveal } from "@/app/components/aero-runtime";
import { PrepSystemExplorer } from "@/app/components/prep-system-explorer";
import { SecondSeatHeroInstrument, SecondSeatJourney, SecondSeatPreview } from "@/app/components/second-seat-experience";
import { CtaLink, Footer, Header, SectionHeading } from "@/app/components/site-chrome";
import { TestimonialFlightDeck } from "@/app/components/testimonial-flight-deck";
import { HOME_FAQS, OFFERS } from "@/app/lib/site-data";

const SIGNAL_DIMENSIONS = [
  ["01", "Pattern recognition", "Recognise the shape before code"],
  ["02", "Systems judgment", "Make trade-offs visible"],
  ["03", "Behavioural evidence", "Turn experience into proof"],
  ["04", "Role intelligence", "Prepare for the actual signal"],
  ["05", "Career signal", "Make scope recruiter-readable"],
  ["06", "Remote reality", "Evaluate the complete offer"],
] as const;

const HOME_PRICING_LAYERS = [
  {
    phase: "01 / FOUNDATION",
    offer: OFFERS.vault,
    status: "CLEARANCE KEY",
    for: "Build the foundation. Complete the checkpoints. Unlock eligibility.",
    visible: "Flight plan, systems, evidence, diagnostic, and mock demonstration",
    unlock: "Measurable Second Seat eligibility",
    includes: ["Six clearance checkpoints", "4-week and 12-week flight plans", "Lifetime launch-edition access"],
    href: "/checkout/vault",
    cta: "Start Foundation",
    event: "foundation_checkout_started",
  },
  {
    phase: "02 / THE SECOND SEAT",
    offer: OFFERS["ai-prep"],
    status: "FOUNDATION CLEARANCE REQUIRED",
    for: "Foundation-cleared learners ready to test under pressure",
    visible: "Dynamic practice, multiple perspectives, guidance, and responsive mocks",
    unlock: "A live correction loop that keeps pace with the conversation",
    includes: ["Responsive mock interviews", "Multiple reasoning perspectives", "WhatsApp guidance", "Specialist training systems", "Included practice-time allowance", "Permitted live interview support"],
    href: "#second-seat-preview",
    cta: "Preview the Second Seat",
    event: "second_seat_preview_started",
  },
  {
    phase: "03 / HUMAN CALIBRATION",
    offer: OFFERS.premium,
    status: "EVIDENCE-LED · CAPACITY CAPPED",
    for: "Repeated evidence identifies one persistent personal gap",
    visible: "Flight-recorder packet, mentor review, and focused correction plan",
    unlock: "A clean final approach guided by a real person",
    includes: ["Evidence packet review", "Focused mentor relationship", "Explicit final-approach plan"],
    href: "/premium",
    cta: "Review Human Calibration",
    event: undefined,
  },
] as const;

export const metadata: Metadata = {
  title: "Interview signal for remote & AI-adjacent tech roles",
  description: "Turn engineering experience into recruiter-visible evidence and rehearse it under interview pressure.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="site-shell site-shell-v2">
      <HomeAeroStage />
      <Header />

      <main className="home-v2 narrative-home">
        <section className="hero-v2 narrative-hero" aria-labelledby="hero-title" data-aero-phase="hero">
          <div className="hero-atmosphere" aria-hidden="true"><i /><i /><i /></div>
          <div className="container hero-v2-grid">
            <div className="hero-v2-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> Interview signal for engineers in India</p>
              <h1 id="hero-title">Turn your experience into <em>interview signal.</em></h1>
              <p className="hero-v2-body">A structured system for engineers who need to recognise patterns, explain trade-offs, and make their experience legible to remote and AI-adjacent teams.</p>
              <div className="hero-v2-actions">
                <CtaLink href="/diagnostic" event="hero_signal_cta_clicked">Check your interview signal <span aria-hidden="true">↗</span></CtaLink>
                <Link className="text-link" href="/demo-login">Enter the demo cockpit <span aria-hidden="true">→</span></Link>
              </div>
              <p className="microcopy">Free · 7–10 minutes · No payment or account</p>
            </div>

            <SecondSeatHeroInstrument />
          </div>
          <div className="hero-scroll-cue" aria-hidden="true"><span>SCROLL TO FOLLOW THE SIGNAL</span><i /></div>
        </section>

        <section className="signal-intro-section" aria-labelledby="signal-intro-title" data-aero-phase="diagnostic">
          <div className="signal-intro-lines" aria-hidden="true"><i /><i /><i /></div>
          <div className="container signal-intro-layout">
            <Reveal>
              <p className="eyebrow">Start with diagnosis, not a purchase</p>
              <h2 id="signal-intro-title">Find where the signal breaks.</h2>
              <p>Knowledge, judgment, and experience can all be strong while the interview evidence stays weak. The free scan finds the limiting system before it recommends any product.</p>
              <CtaLink href="/diagnostic" event="hero_signal_cta_clicked">Run the free signal check <span aria-hidden="true">↗</span></CtaLink>
            </Reveal>
            <div className="signal-dimension-board">
              {SIGNAL_DIMENSIONS.map(([code, label, detail], index) => (
                <Reveal className="signal-dimension-row" direction={index % 2 ? "right" : "left"} delay={index * 0.035} key={code}>
                  <span>{code}</span><div><strong>{label}</strong><small>{detail}</small></div><i aria-hidden="true"><b /></i>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <SecondSeatPreview />

        <section className="payload-section" id="inside" aria-labelledby="inside-title" data-aero-phase="vault">
          <div className="payload-ribs" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="container"><PrepSystemExplorer /></div>
        </section>

        <SecondSeatJourney />

        <section className="workspace-preview-section" aria-labelledby="workspace-preview-title" data-aero-phase="product">
          <div className="container">
            <Reveal>
              <SectionHeading eyebrow="Enter the product before buying" title="One cockpit. Three levels of evidence." body="Choose Foundation, The Second Seat, or Human Calibration. Each demo opens populated, includes real review-edition material, and gives you a meaningful action within the first minute." id="workspace-preview-title" />
            </Reveal>

            <Reveal className="workspace-preview-frame" direction="right">
              <aside className="workspace-preview-nav" aria-label="Sample learner navigation">
                <div className="workspace-preview-brand"><span aria-hidden="true">IR</span><b>Learning workspace</b></div>
                <ol>
                  <li className="is-active"><span>01</span><b>Today</b></li><li><span>02</span><b>Roadmap</b></li><li><span>03</span><b>Library</b></li><li className="is-locked"><span>04</span><b>Practice</b><small>Upgrade</small></li><li className="is-locked"><span>05</span><b>Feedback</b><small>Upgrade</small></li>
                </ol>
                <div className="workspace-preview-plan"><span>Current access</span><strong>Foundation · Flight Plan</strong><i><b /></i><small>18% plan progress · Week 2</small></div>
              </aside>
              <div className="workspace-preview-main">
                <div className="workspace-preview-topbar"><span>Demo workspace · sample learner data</span><b>Remote backend roles</b></div>
                <div className="workspace-preview-welcome"><div><p>Friday · Week 2 of 12</p><h3>Good evening, Ananya. <em>Keep the loop tight.</em></h3><span>Build repeatable technical patterns before adding timed mocks.</span></div><div className="workspace-preview-readiness"><strong>18</strong><span>Plan<br />complete</span></div></div>
                <div className="workspace-preview-command">
                  <article><p><span>Next action</span><b>System design · 18 min</b></p><div className="workspace-preview-visual" aria-hidden="true"><i /><i /><i /><span /></div><h4>Rate limiting: choose the right algorithm</h4><small>Continue the lesson, then explain your choice aloud before viewing the worked decision tree.</small></article>
                  <article className="workspace-preview-week"><p><span>This week</span><b>Plan active</b></p><div aria-label="Five of nine sample weekly tasks complete"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><dl><div><dt>Completed</dt><dd>5 / 9</dd></div><div><dt>Focused time</dt><dd>2h 14m</dd></div><div><dt>Next review</dt><dd>Sunday</dd></div></dl></article>
                </div>
              </div>
            </Reveal>
            <div className="workspace-preview-footer"><div className="workspace-access-states" aria-label="Demo access levels"><span><b>Foundation</b> Build the flight plan</span><span><b>The Second Seat</b> Expose the gap</span><span><b>Human Calibration</b> Complete the landing</span></div><Link className="primary-cta" href="/demo-login">Choose a demo cockpit <span aria-hidden="true">↗</span></Link></div>
          </div>
        </section>

        <section className="home-pricing-section" aria-labelledby="home-pricing-title" data-aero-phase="pricing">
          <div className="container">
            <Reveal><SectionHeading eyebrow="Clear progression" title="Foundation earns access to the system at the center." body="Build the flight plan first. Unlock the Second Seat when the clearance requirements are complete. Add Human Calibration only when repeated evidence identifies a gap technology alone has not fixed." id="home-pricing-title" /></Reveal>
            <div className="home-pricing-layers">
              {HOME_PRICING_LAYERS.map((layer, index) => (
                <Reveal className={`home-price-layer home-price-layer-${index + 1}`} direction={index % 2 === 0 ? "left" : "right"} key={layer.offer.slug}>
                  <AnalyticsView event="pricing_tier_viewed" payload={{ tier: layer.offer.slug, surface: "homepage" }} />
                  <p><span>{layer.phase}</span><b>{layer.status}</b></p>
                  <h3>{layer.offer.name.replace("InterviewRunway ", "")}</h3><strong>{layer.offer.priceLabel}</strong>
                  <dl><div><dt>FOR</dt><dd>{layer.for}</dd></div><div><dt>VISIBLE IMMEDIATELY</dt><dd>{layer.visible}</dd></div><div><dt>NEXT UNLOCK</dt><dd>{layer.unlock}</dd></div></dl>
                  <ul>{layer.includes.map((item) => <li key={item}>{item}</li>)}</ul>
                  <small>{layer.offer.entitlement}</small><Link href={layer.href} data-analytics-event={layer.event}>{layer.cta} <span aria-hidden="true">↗</span></Link>
                </Reveal>
              ))}
            </div>
            <div className="home-pricing-footer"><span>INR pricing · Taxes and exact entitlement shown before payment · Foundation refund terms linked at checkout</span><Link className="text-link" href="/pricing">Compare every layer <span aria-hidden="true">→</span></Link></div>
          </div>
        </section>

        <TestimonialFlightDeck />

        <section className="envelope-section" aria-labelledby="fit-title" data-aero-phase="fit">
          <div className="container envelope-layout">
            <Reveal><SectionHeading eyebrow="The operating envelope" title="Clear about where this works." body="InterviewRunway helps build, test, and communicate interview signal. It does not predict or promise a hiring outcome." id="fit-title" /></Reveal>
            <div className="envelope-planes">
              <Reveal className="envelope-plane envelope-plane-positive" direction="left"><div className="plane-label"><span>GO</span><i /></div><h3>Built for</h3><ul><li>Engineers with roughly 1–8 years of experience</li><li>Backend, platform, infrastructure, data, and AI-adjacent roles</li><li>Remote-first and US-company interview loops</li><li>People who want a structured plan and reviewable evidence</li></ul></Reveal>
              <Reveal className="envelope-plane" direction="right"><div className="plane-label"><span>LIMIT</span><i /></div><h3>Never a promise of</h3><ul><li>A job, placement, visa, sponsorship, or salary</li><li>Insider or leaked interview questions</li><li>Instant results without deliberate practice</li><li>Anonymous proof or manufactured scarcity</li></ul></Reveal>
            </div>
          </div>
        </section>

        <section className="faq-section-v2" aria-labelledby="faq-title">
          <div className="faq-horizon" aria-hidden="true" />
          <div className="container faq-layout-v2"><Reveal><SectionHeading eyebrow="Questions, answered" title="Know the terms before you start." id="faq-title" /></Reveal><div className="faq-list faq-list-v2">{HOME_FAQS.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div>
        </section>

        <section className="final-cta-v2" aria-labelledby="final-title" data-aero-phase="start">
          <div className="convergence-field" aria-hidden="true"><i /><i /><i /><span /></div>
          <div className="container final-cta-v2-inner"><Reveal><p className="eyebrow">Begin with evidence</p><h2 id="final-title">Find the gap before you buy the fix.</h2><p>The free Interview Signal Check gives you one risk, one exercise, and the smallest useful next layer.</p><div className="hero-v2-actions"><CtaLink href="/diagnostic" event="hero_signal_cta_clicked">Check your interview signal <span aria-hidden="true">↗</span></CtaLink><Link className="text-link" href="/demo-login">Enter the demo cockpit <span aria-hidden="true">→</span></Link></div></Reveal></div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
