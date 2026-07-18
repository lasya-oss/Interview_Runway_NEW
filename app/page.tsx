import type { Metadata } from "next";
import Link from "next/link";
import { HomeAeroStage, TrajectorySequence } from "@/app/components/aero-experience";
import { Reveal } from "@/app/components/aero-runtime";
import { PrepSystemExplorer } from "@/app/components/prep-system-explorer";
import { CtaLink, Footer, Header, MobilePurchaseBar, SectionHeading } from "@/app/components/site-chrome";
import { HOME_FAQS, OFFERS } from "@/app/lib/site-data";

const HOME_PRICING_LAYERS = [
  {
    phase: "01 / FOUNDATION",
    offer: OFFERS.vault,
    note: "Start here",
    href: "/checkout/vault",
    cta: "Get the Vault",
  },
  {
    phase: "02 / PRACTICE",
    offer: OFFERS["ai-prep"],
    note: "Vault-owner upgrade",
    href: "/ai-prep",
    cta: "Preview AI Prep",
  },
  {
    phase: "03 / CALIBRATION",
    offer: OFFERS.premium,
    note: "Capacity-capped package",
    href: "/premium",
    cta: "Review coaching",
  },
] as const;

export const metadata: Metadata = {
  title: "Interview prep for remote & AI-adjacent tech roles",
  description:
    "Founder-designed interview prep for engineers in India targeting remote and AI-adjacent US tech roles. Start with the ₹799 Vault.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="site-shell site-shell-v2 has-mobile-purchase">
      <HomeAeroStage />
      <Header />

      <main className="home-v2">
        <section className="hero-v2" aria-labelledby="hero-title" data-aero-phase="foundation">
          <div className="hero-atmosphere" aria-hidden="true"><i /><i /><i /></div>
          <div className="container hero-v2-grid">
            <div className="hero-v2-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> For engineers in India</p>
              <h1 id="hero-title">
                Get interview-ready for remote &amp; <em>AI-adjacent</em> tech roles.
              </h1>
              <p className="hero-v2-body">
                A structured path through DSA, system design, behavioural
                communication, and the realities of working remotely for US
                and global teams.
              </p>

              <div className="hero-v2-actions">
                <CtaLink href="/checkout/vault" event="checkout_started">
                  Get the Vault — ₹799 <span aria-hidden="true">↗</span>
                </CtaLink>
                <Link className="text-link" href="#inside">
                  See the prep system <span aria-hidden="true">↓</span>
                </Link>
              </div>
              <p className="microcopy">UPI accepted · One payment · No surprise add-ons</p>
            </div>

            <aside className="hero-flight-card" aria-label="Vault offer summary">
              <div className="flight-card-top"><span>FOUNDATION / 01</span><i /></div>
              <p>INTERVIEWRUNWAY VAULT</p>
              <strong>₹799</strong>
              <div className="flight-card-grid">
                <div><span>ACCESS</span><b>One time</b></div>
                <div><span>PATHS</span><b>4 / 12 weeks</b></div>
                <div><span>SYSTEMS</span><b>08 modules</b></div>
                <div><span>UPGRADE</span><b>Optional</b></div>
              </div>
            </aside>
          </div>

          <div className="hero-scroll-cue" aria-hidden="true"><span>SCROLL TO EXPLORE</span><i /></div>
        </section>

        <TrajectorySequence />

        <section className="payload-section" id="inside" aria-labelledby="inside-title" data-aero-phase="vault">
          <div className="payload-ribs" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="container"><PrepSystemExplorer /></div>
        </section>

        <section className="control-section" aria-labelledby="method-title" data-aero-phase="guidance">
          <div className="control-vapour" aria-hidden="true" />
          <div className="container">
            <Reveal>
              <SectionHeading
                eyebrow="A closed feedback loop"
                title="Learn. Practise. Correct."
                body="Readiness comes from closing the loop: build the model, test it under pressure, then correct the part that needs work."
                id="method-title"
              />
            </Reveal>
            <div className="control-loop">
              <div className="control-path" aria-hidden="true"><i /><i /><i /></div>
              <Reveal className="control-step control-step-1" direction="left">
                <span>01 / BUILD</span><h3>Learn the pattern</h3><p>Use a structured roadmap to understand the patterns behind strong answers.</p><b>VAULT</b>
              </Reveal>
              <Reveal className="control-step control-step-2" direction="right">
                <span>02 / TEST</span><h3>Practise under pressure</h3><p>Run responsive mocks that expose gaps in reasoning, communication, and trade-offs.</p><b>AI PREP</b>
              </Reveal>
              <Reveal className="control-step control-step-3" direction="left">
                <span>03 / CORRECT</span><h3>Fix the persistent gap</h3><p>Use evidence from repeated attempts to decide whether targeted human coaching is worthwhile.</p><b>1:1 COACHING</b>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="workspace-preview-section" aria-labelledby="workspace-preview-title" data-aero-phase="product">
          <div className="container">
            <Reveal>
              <SectionHeading
                eyebrow="The member product"
                title="The work continues after checkout."
                body="Open a realistic learner workspace before you buy. Three sample accounts show how the same product changes from self-paced foundations to adaptive practice and private coaching."
                id="workspace-preview-title"
              />
            </Reveal>

            <Reveal className="workspace-preview-frame" direction="right">
              <aside className="workspace-preview-nav" aria-label="Sample learner navigation">
                <div className="workspace-preview-brand"><span aria-hidden="true">IR</span><b>Learning workspace</b></div>
                <ol>
                  <li className="is-active"><span>01</span><b>Today</b></li>
                  <li><span>02</span><b>Roadmap</b></li>
                  <li><span>03</span><b>Library</b></li>
                  <li className="is-locked"><span>04</span><b>Practice</b><small>Upgrade</small></li>
                  <li className="is-locked"><span>05</span><b>Feedback</b><small>Upgrade</small></li>
                </ol>
                <div className="workspace-preview-plan"><span>Current access</span><strong>The Vault · Foundation</strong><i><b /></i><small>18% plan progress · Week 2</small></div>
              </aside>

              <div className="workspace-preview-main">
                <div className="workspace-preview-topbar"><span>Sample learner · Fictional data</span><b>Remote backend roles</b></div>
                <div className="workspace-preview-welcome">
                  <div><p>Friday · Week 2 of 12</p><h3>Good evening, Ananya. <em>Keep the loop tight.</em></h3><span>Build repeatable technical patterns before adding timed mocks.</span></div>
                  <div className="workspace-preview-readiness"><strong>18</strong><span>Plan<br />complete</span></div>
                </div>
                <div className="workspace-preview-command">
                  <article>
                    <p><span>Next action</span><b>System design · 18 min</b></p>
                    <div className="workspace-preview-visual" aria-hidden="true"><i /><i /><i /><span /></div>
                    <h4>Rate limiting: choose the right algorithm</h4>
                    <small>Continue the lesson, then explain your choice aloud before viewing the worked decision tree.</small>
                  </article>
                  <article className="workspace-preview-week">
                    <p><span>This week</span><b>Plan active</b></p>
                    <div aria-label="Five of nine sample weekly tasks complete"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                    <dl><div><dt>Completed</dt><dd>5 / 9</dd></div><div><dt>Focused time</dt><dd>2h 14m</dd></div><div><dt>Next review</dt><dd>Sunday</dd></div></dl>
                  </article>
                </div>
              </div>
            </Reveal>

            <div className="workspace-preview-footer">
              <div className="workspace-access-states" aria-label="Sample account access levels">
                <span><b>Vault</b> Library + roadmaps</span>
                <span><b>AI Prep</b> Mocks + feedback</span>
                <span><b>Premium</b> Coach room + calibration</span>
              </div>
              <Link className="primary-cta" href="/demo-login">Enter all three sample accounts <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>

        <section className="home-pricing-section" aria-labelledby="home-pricing-title" data-aero-phase="pricing">
          <div className="container">
            <Reveal>
              <SectionHeading
                eyebrow="Build only what you need"
                title="One foundation. Two optional layers."
                body="The Vault is the starting product. Adaptive practice and human coaching are separate additions—never preselected, never disguised as a subscription."
                id="home-pricing-title"
              />
            </Reveal>
            <div className="home-pricing-layers">
              {HOME_PRICING_LAYERS.map((layer, index) => (
                <Reveal className={`home-price-layer home-price-layer-${index + 1}`} direction={index % 2 === 0 ? "left" : "right"} key={layer.offer.slug}>
                  <p><span>{layer.phase}</span><b>{layer.note}</b></p>
                  <h3>{layer.offer.name.replace("InterviewRunway ", "")}</h3>
                  <strong>{layer.offer.priceLabel}</strong>
                  <span>{layer.offer.description}</span>
                  <small>{layer.offer.entitlement}</small>
                  <Link href={layer.href}>{layer.cta} <span aria-hidden="true">↗</span></Link>
                </Reveal>
              ))}
            </div>
            <div className="home-pricing-footer">
              <span>Prices shown in INR · Exact taxes and final entitlement shown before payment</span>
              <Link className="text-link" href="/pricing">Compare every layer <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="envelope-section" aria-labelledby="fit-title" data-aero-phase="fit">
          <div className="container envelope-layout">
            <Reveal>
              <SectionHeading
                eyebrow="Who it is for"
                title="Clear about where this works."
                body="The strongest trust signal is knowing what the product is not trying to claim."
                id="fit-title"
              />
            </Reveal>
            <div className="envelope-planes">
              <Reveal className="envelope-plane envelope-plane-positive" direction="left">
                <div className="plane-label"><span>GO</span><i /></div>
                <h3>Built for</h3>
                <ul>
                  <li>Engineers with roughly 1–8 years of experience</li>
                  <li>Backend, platform, infrastructure, data, and AI-adjacent roles</li>
                  <li>Remote-first and US-company interview loops</li>
                  <li>People who want a structured plan, not hype</li>
                </ul>
              </Reveal>
              <Reveal className="envelope-plane" direction="right">
                <div className="plane-label"><span>LIMIT</span><i /></div>
                <h3>Not a promise of</h3>
                <ul>
                  <li>A job, placement, visa, sponsorship, or salary</li>
                  <li>Insider or leaked interview questions</li>
                  <li>Instant results without deliberate practice</li>
                  <li>Anonymous proof or manufactured scarcity</li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="evidence-section" aria-labelledby="proof-title" data-aero-phase="proof">
          <div className="container evidence-layout">
            <Reveal direction="left">
              <div>
                <p className="eyebrow">Evidence standard</p>
                <h2 id="proof-title">Proof should withstand review.</h2>
                <p>No anonymous praise. No composite stories. No outcome published without a real learner, clear consent, and a reviewable source.</p>
                <Link className="text-link" href="/proof">Read the evidence standard <span aria-hidden="true">→</span></Link>
              </div>
            </Reveal>
            <Reveal className="evidence-trace" direction="right">
              <div className="evidence-trace-line" aria-label="Claim, consent, and source review">
                <span><b>01</b>Claim</span><i /><span><b>02</b>Consent</span><i /><span><b>03</b>Source</span>
              </div>
              <strong>Publish only after all three checks.</strong>
              <p>Every outcome must be specific, consented, and connected to a reviewable source. Until then, it stays off the site.</p>
            </Reveal>
          </div>
        </section>

        <section className="faq-section-v2" aria-labelledby="faq-title">
          <div className="faq-horizon" aria-hidden="true" />
          <div className="container faq-layout-v2">
            <Reveal>
              <SectionHeading eyebrow="Questions, answered" title="Know the terms before you start." id="faq-title" />
            </Reveal>
            <div className="faq-list faq-list-v2">
              {HOME_FAQS.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta-v2" aria-labelledby="final-title" data-aero-phase="start">
          <div className="convergence-field" aria-hidden="true"><i /><i /><i /><span /></div>
          <div className="container final-cta-v2-inner">
            <Reveal>
              <p className="eyebrow">Start with the foundation</p>
              <h2 id="final-title">Build the signal before the stakes get high.</h2>
              <p>One payment. Two structured roadmaps. A foundation made for the interview loops you are actually targeting.</p>
              <div className="final-offer"><strong>₹799</strong><span>once<br />instant access</span></div>
              <CtaLink href="/checkout/vault" event="checkout_started">Get the Vault <span aria-hidden="true">↗</span></CtaLink>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
      <MobilePurchaseBar />
    </div>
  );
}
