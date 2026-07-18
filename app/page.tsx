import type { Metadata } from "next";
import Link from "next/link";
import { HomeAeroStage, TrajectorySequence } from "@/app/components/aero-experience";
import { Reveal } from "@/app/components/aero-runtime";
import { CtaLink, Footer, Header, MobilePurchaseBar, SectionHeading } from "@/app/components/site-chrome";
import { HOME_FAQS, VAULT_MODULES } from "@/app/lib/site-data";

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
          <div className="container payload-layout">
            <div className="payload-sticky">
              <SectionHeading
                eyebrow="Inside the ₹799 Vault"
                title="Your prep system, assembled."
                body="Each module is one working surface in the same system—built to help you recognise patterns, communicate trade-offs, and make your experience legible across borders."
                id="inside-title"
              />
              <div className="roadmap-instrument" aria-label="Four-week and twelve-week roadmaps">
                <div className="roadmap-ring roadmap-ring-outer"><span>12</span></div>
                <div className="roadmap-ring roadmap-ring-inner"><span>04</span></div>
                <div className="roadmap-core"><b>2</b><span>structured<br />roadmaps</span></div>
              </div>
              <Link className="payload-link" href="/vault">Open the full manifest <span aria-hidden="true">↗</span></Link>
            </div>

            <div className="payload-manifest">
              {VAULT_MODULES.slice(0, 6).map((module, index) => (
                <Reveal direction={index % 2 === 0 ? "right" : "left"} delay={(index % 3) * 0.05} key={module.title}>
                  <article className="manifest-row">
                    <span className="manifest-index">0{index + 1}</span>
                    <div><p>{module.kicker}</p><h3>{module.title}</h3><span>{module.description}</span></div>
                    <b>{module.meta}</b>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
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
