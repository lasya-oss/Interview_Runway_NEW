# RemoteRunway Website Build Requirements (interviewrunway.com)

## Non-Negotiable First Principle

The value prop must survive the visual concept, not get buried by it. Every requirement below is in service of the theme, but if a design choice ever forces a tradeoff between "looks cool" and "the visitor understands what this is and what it costs within 3 seconds," the message wins. This is the single most common way ambitious visual concepts fail commercially, don't let it happen here.

**Core value prop to keep legible everywhere:** Interview prep for Indian engineers targeting remote/AI-adjacent US tech roles, taught by a real person, priced for India, not for a US wallet. The narrower framing (AI-adjacent roles specifically, not generic SWE) is the differentiator, it must show up in the hero headline, not just buried in body copy.

---

## Brand Theme: Aero-Mechanical, Not Literal Aviation

The feeling is: standing at the head of a runway, engines spooling up, about to accelerate into takeoff. This is conveyed through motion, materials, and typography, not imagery.

**Explicitly avoid:** plane silhouettes, airport iconography, clip-art clouds, stock aviation photography, luggage/travel visual cliches. If it looks like a travel booking site, it's wrong.

**Aim for instead:**
- Precision engineering surfaces: machined metal textures, instrument-panel data readouts, HUD-style numerals for stats/pricing.
- Directional motion: everything on the page should feel like it's accelerating forward/upward, not just fading in. Elements enter from behind and sweep past, not pop in place.
- Runway-line motifs used abstractly: converging perspective lines, threshold markings, used as layout guides and section dividers, not as literal runway photos.

---

## Visual System

### Color Palette
- Base: deep graphite/near-black (`#0B0E13`-ish range) and a cool dark navy, not pure black, so the glass panels have something to refract against.
- Accent: one high-energy "afterburner" color, amber-orange or electric cyan, used sparingly for CTAs and key data points, not washed across the page.
- Metallic neutrals: brushed-silver/chrome gradients for borders and dividers, reinforces the mechanical-precision feel.
- Avoid: playful pastel edtech colors (the generic ed-tech palette of soft purple/mint/yellow), that palette signals "cheap course platform," works against the premium positioning of Funnel 3.

### Typography
- Headline face: a geometric sans with a forward lean available (italic or a custom slight-skew treatment), used for hero statements and section headers.
- Body face: a clean humanist sans, high legibility, this is the workhorse font, resist the urge to stylize body copy.
- Data/numerals face: a monospace or semi-condensed technical face for prices, countdowns, stats, and scores, evokes a cockpit/instrument readout.
- Every headline using the stylized/leaning treatment must still pass a plain-reading test, if someone can't parse it in half a second, drop the lean.

### "Liquid Crystal" Glass Panels
Apple-style glassmorphism, specifically:
- Frosted translucent panels (backdrop blur) over the dark base, with a subtle 1px gradient border catching light.
- A specular highlight that shifts subtly with scroll or cursor position, not a static sheen baked into the image.
- Panels should feel like they have depth/thickness, not just a flat blur filter, use layered shadow + highlight to sell it.
- Contrast requirement: text inside glass panels must maintain WCAG AA contrast against the busiest part of whatever's behind it. Test against the brightest background moment, not the average. If a panel goes translucent-thin, add a subtle scrim behind text automatically.

### 3D Aero Motion, Mapped Per Section
Not one looping hero animation reused everywhere, each part of the site gets a motif matching what it's selling:
- **Home/hero:** abstract airfoil cross-section morphing with scroll, suggesting acceleration and lift, tied to scroll position not autoplaying on a timer.
- **Funnel 1 (Vault, ₹799):** a compact, dense "instrument panel" motif, lots of small readouts assembling, conveys "packed with stuff" for the low-cost impulse buy.
- **Funnel 2 (AI Prep):** a fluid, adaptive turbine/liquid motion, conveys "responds to you" for the interactive AI tier.
- **Funnel 3 (1:1 Premium):** a single, isolated, precisely-lit object, spotlighted and still rather than busy, conveys exclusivity and scarcity, not volume.
- **Payment page:** motion should calm down here, not accelerate. This is a trust moment, not a spectacle moment, keep 3D minimal or absent so nothing distracts from confirming what's being charged.

### Motion/Easing Language
- Primary easing: fast-start, smooth-decelerate (ease-out-expo style), mimics acceleration down a runway and settling into flight, not bouncy/playful easing.
- Respect `prefers-reduced-motion` completely, serve a static-but-still-on-theme version (frozen mid-pose glass panels, no parallax), not just fewer animations.

---

## Site Map

1. **Home** — hero with plain-language value prop, how-it-works in 3 steps, pricing tiers teaser, real testimonials, primary CTA into Funnel 1.
2. **Vault (Funnel 1) sales page** — itemized value stack (see funnel_level_1_gen_req.md for the actual content list), price, direct checkout, no email-gate friction before purchase.
3. **AI Prep (Funnel 2) upsell page** — shown post-purchase or via account dashboard, not sold cold, not indexed for outside search traffic.
4. **1:1 Premium (Funnel 3) page** — scarcity-forward: visible slots-remaining-this-month indicator, premium price, calendar booking.
5. **Payment page** — see detailed spec below.
6. **About/Founder** — real photo, real credentials, this page is load-bearing for trust given the "real 1:1 with an actual person" positioning, don't skimp on it.
7. **Proof/testimonials** — real outcomes only, linkable to source (LinkedIn post, screenshot) where possible.
8. **Legal** — refund policy, terms, privacy policy. Refund policy must be short and plain-language, this is a deliberate contrast against IK's contested multi-condition guarantee, don't let a lawyer template turn it back into the thing you're differentiating against.

---

## Payment Page Detailed Spec

This page gets the most craft attention of anything on the site, it's where trust either closes or breaks.

- **Payment methods:** UPI as the primary/default option (this audience overwhelmingly prefers it), cards and netbanking as secondary, via Razorpay.
- **Price clarity:** exact ₹ amount shown before any redirect, no surprise fees added at checkout, GST (if applicable) itemized, not bundled invisibly.
- **PCI scope:** use Razorpay's hosted checkout/embedded flow rather than building custom card-number fields, keeps you out of PCI compliance scope entirely.
- **Refund policy visible at the point of payment**, not just linked in a footer three clicks away, a one-line summary plus a link to the full plain-language policy.
- **No dark patterns:** no pre-checked upsell add-ons, no fake urgency countdowns unless the scarcity is real (Funnel 3 slot limits are real, so that's fine, a fake "sale ends in 10 minutes" on the ₹799 Vault is not).
- **Post-payment:** immediate on-screen confirmation plus email receipt with a GST invoice if applicable, and immediate account access, no "check back in 24 hours."
- **EMI/installment option** for the ₹9999-14999 Funnel 3 tier specifically, Razorpay supports this, widens affordability for the premium tier without discounting the base price.
- **Failure handling:** a clear retry path if a payment fails, and don't silently drop the user, if UPI/card fails, show the specific reason where Razorpay provides one, not a generic error.

---

## Corner Cases and Loopholes to Close

**Performance on real target devices:** this audience is on mid-range Android phones and variable mobile networks, common in India, not high-end devices on fiber. Heavy WebGL/3D is a real risk here specifically.
- Ship a performance tier system: full 3D on capable devices/fast connections, a lighter static-image fallback on low-end devices or slow networks (detect via connection type/device memory where available, degrade gracefully rather than failing).
- Set an explicit performance budget (e.g. sub-3s meaningful paint on a throttled mobile profile) and treat it as a hard constraint, not an afterthought, this directly affects ad landing-page quality score and thus your actual CPC.
- Lazy-load all 3D/WebGL assets below the fold, never block the hero's text/CTA on 3D asset loading.

**Accessibility:**
- All glass-panel text passes WCAG AA contrast against worst-case background state, not just the average.
- Full keyboard navigation and screen-reader-readable content that doesn't depend on animation or 3D to convey meaning, the 3D layer is decoration, never the only carrier of information.
- Respect `prefers-reduced-motion` as specified above.

**Cross-browser/device reality:** Safari's WebGL and animation behavior differs from Chrome, and iOS throttles background/battery-saver animation aggressively. Test explicitly on Safari iOS and a mid-range Android Chrome browser, not just desktop Chrome.

**Conversion tracking:** Meta Pixel plus server-side Conversions API wired in from day one, this is not optional, every CAC/conversion-rate number discussed earlier depends on this actually being accurate. Track: page view, checkout initiated, purchase completed, per funnel tier.

**SEO for organic/comparison search:** even though the primary channel is paid ads, people will search "Interview Kickstart alternative India" or similar once the brand exists. Basic on-page SEO (title tags, meta descriptions, OG images per page) and a comparison-style page are worth having even if not the launch priority.

**Testimonial integrity:** every testimonial must be from a real user with explicit consent to publish, and there must be a documented process for someone to request removal. Do not fabricate or composite testimonials, that's both a trust risk and, given the aggressive-marketing complaints already documented against IK, exactly the kind of thing that would undercut the entire "we're the trustworthy alternative" positioning.

**Legal/compliance basics:** privacy policy covering what's collected (email, phone, payment metadata via Razorpay), and per India's e-commerce consumer protection rules, seller identity and a grievance contact should be visibly listed, not hidden.

**International/non-India visitors:** decide explicitly whether to auto-detect and show USD pricing to non-India visitors or keep everything in ₹ regardless of origin, don't leave this undefined, an undefined behavior here usually defaults to "confusing," which costs conversions.

**Abandoned checkout:** define what happens if someone starts checkout and doesn't finish, a single non-pushy follow-up (email/WhatsApp if opted in) is reasonable, repeated aggressive retargeting is not, keep this consistent with the trust-first positioning already established.

---

## Tech Stack

- Frontend: Next.js, hosted on Vercel.
- 3D/motion: React Three Fiber (Three.js) for the aero animations, Framer Motion for UI transitions.
- Styling: Tailwind CSS.
- Payments: Razorpay (hosted checkout, UPI-first).
- Analytics: Meta Pixel + Conversions API, plus a basic product analytics tool (PostHog or similar) for on-site funnel tracking.
- CMS/content: testimonials and copy manageable without a redeploy, a lightweight headless CMS or a simple Supabase-backed admin table is enough, doesn't need to be elaborate.

---

## Delivery Checklist

- [ ] Hero value prop legible and parseable within 3 seconds, tested against a "squint test" (blur the page, can you still tell what's for sale and roughly what it costs).
- [ ] All three funnel tiers have distinct pages with the section-specific 3D motif applied.
- [ ] Payment page built to the detailed spec above, including UPI-first, visible refund policy, and no dark patterns.
- [ ] Performance budget met on a throttled mid-range Android profile, not just desktop.
- [ ] Reduced-motion and screen-reader fallback verified, not just implemented.
- [ ] Meta Pixel + Conversions API firing correctly on all three funnel checkouts, verified with real test events before launch.
- [ ] Testimonials page sourced from real, consented users only.
- [ ] Legal pages (refund, terms, privacy) written in plain language, reviewed against IK's contested guarantee as the explicit negative example to not repeat.
- [ ] Cross-browser check completed on Safari iOS and a mid-range Android Chrome device.
