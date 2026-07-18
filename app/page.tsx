import type { Metadata } from "next";
import Link from "next/link";
import {
  AirfoilVisual,
  CtaLink,
  Footer,
  Header,
  MobilePurchaseBar,
  SectionHeading,
  StageRail,
} from "@/app/components/site-chrome";
import { HOME_FAQS, VAULT_MODULES } from "@/app/lib/site-data";

export const metadata: Metadata = {
  title: "Interview prep for remote & AI-adjacent tech roles",
  description:
    "Founder-designed interview prep for engineers in India targeting remote and AI-adjacent US tech roles. Start with the ₹799 Vault.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="site-shell has-mobile-purchase">
      <Header />

      <main>
        <section className="hero section-pad" aria-labelledby="hero-title">
          <div className="runway-grid" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="eyebrow-dot" /> Built for engineers in India
              </p>
              <h1 id="hero-title">
                Get interview-ready for remote &amp; <em>AI-adjacent</em> tech
                roles.
              </h1>
              <p className="hero-body">
                Practical DSA, system design, behavioural, and remote-career
                prep for backend, platform, infrastructure, data, and software
                roles at US and remote-first companies.
              </p>

              <div className="hero-offer" aria-label="The Vault price">
                <div>
                  <span className="data-label">START WITH THE VAULT</span>
                  <strong>₹799</strong>
                </div>
                <span className="price-note">once<br />instant access</span>
              </div>

              <div className="hero-actions">
                <CtaLink href="/checkout/vault" event="checkout_started">
                  Get instant access — ₹799 <span aria-hidden="true">↗</span>
                </CtaLink>
                <Link className="text-link" href="#inside">
                  See exactly what&apos;s inside <span aria-hidden="true">↓</span>
                </Link>
              </div>
              <p className="microcopy">
                UPI accepted <span>·</span> No subscription <span>·</span> No
                surprise fees
              </p>
            </div>

            <AirfoilVisual />
          </div>

          <div className="container trust-strip" aria-label="Purchase assurances">
            <div><b>₹799</b><span>One-time price</span></div>
            <div><b>UPI</b><span>Default at checkout</span></div>
            <div><b>0</b><span>Placement guarantees</span></div>
            <div><b>INR</b><span>Clear India pricing</span></div>
          </div>
        </section>

        <section className="section-pad stage-section" aria-labelledby="path-title">
          <div className="container">
            <SectionHeading
              eyebrow="YOUR PREP RUNWAY"
              title="Start with knowledge. Add practice only when you need it."
              body="The path is deliberately staged so you do not overpay before you know what will actually move your interview performance."
              id="path-title"
            />
            <StageRail />
          </div>
        </section>

        <section className="section-pad" id="inside" aria-labelledby="inside-title">
          <div className="container">
            <div className="split-heading">
              <SectionHeading
                eyebrow="INSIDE THE ₹799 VAULT"
                title="A focused prep system, not a pile of downloads."
                body="Each module answers a specific question you will face while targeting remote and AI-adjacent roles."
                id="inside-title"
              />
              <Link className="text-link text-link-top" href="/vault">
                Explore the full Vault <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="module-grid">
              {VAULT_MODULES.slice(0, 6).map((module, index) => (
                <article className="glass-card module-card" key={module.title}>
                  <div className="module-index">0{index + 1}</div>
                  <p className="module-kicker">{module.kicker}</p>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <span className="module-meta">{module.meta}</span>
                </article>
              ))}
            </div>

            <div className="roadmap-banner glass-card">
              <div className="roadmap-dial" aria-hidden="true">
                <span>04</span><i /> <span>12</span>
              </div>
              <div>
                <p className="module-kicker">TWO CLEAR FLIGHT PLANS</p>
                <h3>Choose the 4-week sprint or 12-week standard track.</h3>
                <p>
                  Both roadmaps tell you what to learn, what to practise, and
                  when you are ready to test yourself.
                </p>
              </div>
              <Link className="inline-arrow" href="/vault#roadmaps" aria-label="View Vault roadmaps">
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section-pad method-section" aria-labelledby="method-title">
          <div className="container method-layout">
            <div className="method-copy">
              <SectionHeading
                eyebrow="HOW IT WORKS"
                title="Learn. Practise. Diagnose."
                body="Static prep gets you moving. Feedback tells you where to steer. Human coaching is reserved for the moments where it can make the biggest difference."
                id="method-title"
              />
              <CtaLink href="/vault">Start with the Vault</CtaLink>
            </div>
            <ol className="method-list">
              <li>
                <span>01</span>
                <div><h3>Build the fundamentals</h3><p>Follow a roadmap across DSA, system design, behavioural, and remote-career prep.</p></div>
              </li>
              <li>
                <span>02</span>
                <div><h3>Practise under pressure</h3><p>Vault buyers can add text-based AI mocks, scoring, and an adaptive study plan.</p></div>
              </li>
              <li>
                <span>03</span>
                <div><h3>Fix the stubborn gaps</h3><p>Use founder-led 1:1 coaching only when repeated feedback shows you need it.</p></div>
              </li>
            </ol>
          </div>
        </section>

        <section className="section-pad" aria-labelledby="fit-title">
          <div className="container">
            <SectionHeading
              eyebrow="FIT CHECK"
              title="Precise about what this can—and cannot—do."
              id="fit-title"
            />
            <div className="fit-grid">
              <article className="fit-card fit-card-positive">
                <p className="fit-label">BUILT FOR</p>
                <ul>
                  <li>Engineers with roughly 1–8 years of experience</li>
                  <li>Remote-first and US-company interview loops</li>
                  <li>Backend, platform, infra, data, and AI-adjacent roles</li>
                  <li>People who want a structured plan, not hype</li>
                </ul>
              </article>
              <article className="fit-card">
                <p className="fit-label">NOT A PROMISE OF</p>
                <ul>
                  <li>A job, placement, visa, or sponsorship</li>
                  <li>Insider or leaked interview questions</li>
                  <li>Instant results without deliberate practice</li>
                  <li>Anonymous testimonials or manufactured scarcity</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section-pad proof-section" aria-labelledby="proof-title">
          <div className="container proof-layout">
            <div>
              <p className="eyebrow">PROOF, WITH A SOURCE</p>
              <h2 id="proof-title">No anonymous praise. No composite stories.</h2>
            </div>
            <div className="proof-panel glass-card">
              <span className="status-pill"><i /> EVIDENCE POLICY</span>
              <p>
                Outcomes are published only when a real learner has consented
                and the result can be linked to its source. Until those records
                are supplied, we will not fill this space with invented quotes.
              </p>
              <Link className="text-link" href="/proof">
                See the results standard <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section-pad faq-section" aria-labelledby="faq-title">
          <div className="container faq-layout">
            <SectionHeading eyebrow="PRE-FLIGHT CHECK" title="Questions before you start." id="faq-title" />
            <div className="faq-list">
              {HOME_FAQS.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad final-cta" aria-labelledby="final-title">
          <div className="runway-grid runway-grid-final" aria-hidden="true" />
          <div className="container final-cta-inner">
            <p className="eyebrow">YOUR NEXT INTERVIEW STARTS HERE</p>
            <h2 id="final-title">Build the signal before the stakes get high.</h2>
            <p>One payment. A clear roadmap. Built for the interviews you are actually targeting.</p>
            <CtaLink href="/checkout/vault" event="checkout_started">
              Get the Vault — ₹799 <span aria-hidden="true">↗</span>
            </CtaLink>
          </div>
        </section>
      </main>

      <Footer />
      <MobilePurchaseBar />
    </div>
  );
}
