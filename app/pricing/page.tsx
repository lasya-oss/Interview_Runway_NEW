import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";
import { OFFERS } from "@/app/lib/site-data";

export const metadata: Metadata = {
  title: "Pricing — build your interview-prep system",
  description: "Compare the ₹799 Vault foundation, the AI Prep upgrade for Vault owners, and capacity-capped 1:1 coaching.",
  alternates: { canonical: "/pricing" },
};

const PRICING_LAYERS = [
  {
    number: "01",
    label: "FOUNDATION",
    offer: OFFERS.vault,
    status: "Open to everyone",
    priceNote: "One payment",
    body: "Build reliable patterns across DSA, system design, behavioural communication, and remote-career decisions.",
    includes: ["4-week and 12-week roadmaps", "Vault curriculum and reference library", "Editable career templates", "Launch-edition updates included"],
    href: "/checkout/vault",
    cta: "Get the Vault",
  },
  {
    number: "02",
    label: "PRACTICE",
    offer: OFFERS["ai-prep"],
    status: "Vault owners only",
    priceNote: "Working upgrade price",
    body: "Add interview pressure, transcript-linked scoring, and a study plan that responds to repeated evidence.",
    includes: ["Text-based DSA, design, and behavioural mocks", "Category-level feedback tied to each transcript", "Adaptive study-plan changes", "Progress signals across repeated sessions"],
    href: "/ai-prep",
    cta: "Preview AI Prep",
  },
  {
    number: "03",
    label: "CALIBRATION",
    offer: OFFERS.premium,
    status: "Capacity capped",
    priceNote: "Working package price",
    body: "Bring a persistent, evidenced gap to a focused human engagement instead of buying generic coaching upfront.",
    includes: ["Pre-session diagnostic", "Founder-led gap calibration", "Written next-action plan", "Final scope and terms before booking"],
    href: "/premium",
    cta: "Review coaching scope",
  },
] as const;

const COMPARISON_ROWS = [
  ["Best next step", "Build the foundation", "Practise under pressure", "Correct a persistent gap"],
  ["Who can access", "Anyone in the target audience", "Verified Vault owners", "Learners with a defined coaching need"],
  ["Core library", "Included", "Uses your Vault foundation", "Used as preparation context"],
  ["Structured roadmap", "4-week and 12-week", "Adapts to mock evidence", "Refined around the named gap"],
  ["Interactive mocks", "Not included", "Core product", "Evidence may inform coaching"],
  ["Human time", "None", "None", "Founder-led and capacity capped"],
  ["Purchase path", "Direct checkout", "Sign in and verify Vault access", "Review scope, fit, and availability"],
] as const;

const PRICING_FAQS = [
  {
    question: "Do I need to buy all three layers?",
    answer: "No. Start with the Vault. AI Prep and coaching are optional additions meant for specific needs that appear after you begin preparing.",
  },
  {
    question: "Is the ₹799 Vault a subscription?",
    answer: "No. It is a one-time purchase with the entitlement shown at checkout. No upgrade is preselected.",
  },
  {
    question: "Can I buy AI Prep without the Vault?",
    answer: "No. AI Prep is designed around the Vault roadmap and is offered only after Vault ownership is verified. Final usage limits and access duration must be shown before its checkout is enabled.",
  },
  {
    question: "What exactly is included in the ₹9,999 coaching package?",
    answer: "₹9,999 is the working launch price. Session count, duration, preparation, written deliverables, availability, EMI, rescheduling, and refund terms must be confirmed together before booking.",
  },
] as const;

export default function PricingPage() {
  return (
    <PageShell mobilePurchase>
      <PageHero
        motif="calibrator"
        eyebrow="PRICING / THREE PURPOSEFUL LAYERS"
        title={<>Start small. Add precision only when it <em>earns its place.</em></>}
        body="InterviewRunway is assembled in stages: learn the foundation, introduce adaptive practice, then add human calibration only for a gap that repeated work has made visible."
      >
        <div className="pricing-hero-signals" aria-label="Pricing principles">
          <span>INR PRICING</span><span>NO PRESELECTED UPGRADES</span><span>VAULT: ONE PAYMENT</span>
        </div>
        <div className="hero-actions">
          <CtaLink href="/checkout/vault" event="checkout_started">Start with the Vault — {OFFERS.vault.priceLabel}</CtaLink>
          <Link className="text-link" href="/demo-login">Enter the sample workspaces <span aria-hidden="true">→</span></Link>
        </div>
      </PageHero>

      <section className="content-section pricing-assembly" aria-labelledby="pricing-layers-title">
        <div className="container">
          <SectionHeading
            eyebrow="THE COMMERCIAL MODEL"
            title="Not three bundles. Three moments."
            body="Each layer has a distinct job and entry condition. The product should recommend the smallest useful commitment, not push everyone toward the highest price."
            id="pricing-layers-title"
          />
          <div className="pricing-layer-grid">
            {PRICING_LAYERS.map((layer, index) => (
              <article className={`pricing-layer pricing-layer-${index + 1}`} key={layer.offer.slug}>
                <div className="pricing-layer-top"><span>{layer.number} / {layer.label}</span><b>{layer.status}</b></div>
                <h2>{layer.offer.name.replace("InterviewRunway ", "")}</h2>
                <div className="pricing-layer-price"><strong>{layer.offer.priceLabel}</strong><span>{layer.priceNote}</span></div>
                <p>{layer.body}</p>
                <ul>{layer.includes.map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="pricing-layer-entitlement"><span>Access model</span><b>{layer.offer.entitlement}</b></div>
                <Link className={index === 0 ? "primary-cta" : "text-link"} href={layer.href}>{layer.cta} <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
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
              <thead><tr><th scope="col">Decision</th><th scope="col">Vault</th><th scope="col">AI Prep</th><th scope="col">1:1 Coaching</th></tr></thead>
              <tbody>
                {COMPARISON_ROWS.map(([label, vault, ai, premium]) => (
                  <tr key={label}><th scope="row">{label}</th><td>{vault}</td><td>{ai}</td><td>{premium}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pricing-disclosure">AI Prep usage limits and duration, and the final coaching package scope, remain launch decisions. They must appear beside the exact total before either payment route is enabled.</p>
        </div>
      </section>

      <section className="content-section pricing-route-section" aria-labelledby="pricing-route-title">
        <div className="container pricing-route-layout">
          <SectionHeading
            eyebrow="HOW THE PATH WORKS"
            title="The next purchase follows evidence."
            body="The product should become more responsive only when your preparation produces enough signal to justify it."
            id="pricing-route-title"
          />
          <ol className="pricing-route">
            <li><span>01</span><div><h3>Buy the foundation directly</h3><p>The Vault has no email gate before checkout and no optional product added to the order.</p></div></li>
            <li><span>02</span><div><h3>Upgrade inside your account</h3><p>AI Prep verifies Vault access, then states usage limits and duration before payment.</p></div></li>
            <li><span>03</span><div><h3>Book after a fit check</h3><p>Coaching opens only with a named gap, explicit scope, real availability, and final terms.</p></div></li>
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
          <h2 id="pricing-cta-title">Pay for the layer you can use now.</h2>
          <p>The Vault is {OFFERS.vault.priceLabel} once. Explore the complete curriculum or enter a sample learner account before deciding.</p>
          <div className="section-actions">
            <CtaLink href="/checkout/vault" event="checkout_started">Get the Vault <span aria-hidden="true">↗</span></CtaLink>
            <Link className="text-link" href="/curriculum">Explore the curriculum <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
