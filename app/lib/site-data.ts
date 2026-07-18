export const OFFERS = {
  vault: {
    slug: "vault",
    eyebrow: "THE VAULT",
    name: "InterviewRunway Vault",
    price: 799,
    priceLabel: "₹799",
    description: "Founder-designed interview prep library with 4-week and 12-week roadmaps.",
    entitlement: "Lifetime access to the launch edition and included updates",
  },
  "ai-prep": {
    slug: "ai-prep",
    eyebrow: "AI PREP",
    name: "InterviewRunway AI Prep",
    price: 2499,
    priceLabel: "₹2,499",
    description: "Text-based mock interviews, scoring, and an adaptive study plan for Vault owners.",
    entitlement: "Vault-owner upgrade; launch usage limits shown before payment",
  },
  premium: {
    slug: "premium",
    eyebrow: "1:1 COACHING",
    name: "InterviewRunway 1:1 Coaching",
    price: 9999,
    priceLabel: "₹9,999",
    description: "Focused founder-led coaching for gaps that repeated practice has not fixed.",
    entitlement: "Final package scope confirmed before booking",
  },
} as const;

export type OfferKey = keyof typeof OFFERS;

export const VAULT_MODULES = [
  {
    kicker: "PATTERN LIBRARY",
    title: "DSA that starts with recognition",
    description: "Learn the signal behind two pointers, sliding windows, graphs, DP, heaps, intervals, and other recurring patterns.",
    meta: "15+ core patterns",
    facets: ["Recognise the shape", "Choose the pattern", "Explain complexity"],
  },
  {
    kicker: "SYSTEM THINKING",
    title: "Design trade-offs, not diagrams to memorise",
    description: "Build fluency in caching, queues, sharding, rate limits, consistency, and common end-to-end systems.",
    meta: "Fundamentals + walkthroughs",
    facets: ["Frame constraints", "Expose trade-offs", "Defend the design"],
  },
  {
    kicker: "STORY BANK",
    title: "Behavioural answers that travel well",
    description: "Use STAR without flattening your experience, and translate Indian company context for a US interviewer.",
    meta: "40+ prompts and frameworks",
    facets: ["Find the evidence", "Shape the arc", "Translate context"],
  },
  {
    kicker: "ROLE INTELLIGENCE",
    title: "Publicly sourced company patterns",
    description: "Original, paraphrased prep banks for companies with enough credible public interview information.",
    meta: "No leaked question sets",
    facets: ["Map the loop", "Read public signals", "Prepare role-first"],
  },
  {
    kicker: "CAREER SIGNAL",
    title: "Resume, LinkedIn, and outreach templates",
    description: "ATS-safe, editable templates that make your scope legible to remote-hiring recruiters.",
    meta: "Editable, not locked PDFs",
    facets: ["Clarify your scope", "Strengthen proof", "Start conversations"],
  },
  {
    kicker: "REMOTE REALITY",
    title: "Contracts, USD pay, tax basics, and negotiation",
    description: "Understand the practical layer of working remotely from India without visa mythology or vague advice.",
    meta: "Human review required",
    facets: ["Read the contract", "Model total pay", "Negotiate with context"],
  },
  {
    kicker: "REFERENCE SYSTEM",
    title: "Concise handouts for rapid review",
    description: "Technical and career-prep references organised around real interview decisions, with source review before release.",
    meta: "Quality-gated library",
    facets: ["Find it quickly", "Review the decision", "Verify the source"],
  },
  {
    kicker: "EXPLAINER SERIES",
    title: "Diagram-led lessons without talking heads",
    description: "Focused visual explainers for DSA, design, behavioural structure, and remote-work logistics.",
    meta: "No-face learning format",
    facets: ["See the model", "Follow the motion", "Recall the decision"],
  },
] as const;

export const HOME_FAQS = [
  {
    question: "Is this only for senior engineers?",
    answer: "No. The Vault is designed for roughly 1–8 years of experience. The roadmap helps you choose depth based on role and level instead of assuming everyone needs the same prep.",
  },
  {
    question: "Does ₹799 become a subscription?",
    answer: "No. The Vault is a one-time purchase. AI Prep and 1:1 coaching are separate, optional products and are never pre-selected at checkout.",
  },
  {
    question: "Will this get me a US visa or job?",
    answer: "No course can honestly promise that. The product helps you prepare for remote and US-company interview loops; it does not provide placement, sponsorship, or a job guarantee.",
  },
  {
    question: "Why is AI Prep not available to everyone?",
    answer: "It is designed as a practice layer for people already using the Vault. Keeping it gated makes the feedback loop more useful and avoids selling an AI tool cold without foundational context.",
  },
  {
    question: "Are the testimonials real?",
    answer: "Only consented outcomes with a source are published. If proof has not yet been supplied and verified, the site says so instead of filling the gap with anonymous quotes.",
  },
] as const;
