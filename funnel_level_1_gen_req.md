# Funnel Level 1 (Vault) Content Generation Requirements

## Context

RemoteRunway (interviewrunway.com) sells interview prep for Indian software engineers targeting US/remote tech roles. Funnel level 1 is a ₹799 digital "Vault" product sold cold via Instagram ads, no live human time involved. This doc specs the 5 content types in that Vault that are fully AI-generatable. Two other Vault items (real mock interview recordings, real student interview debriefs) are explicitly NOT in scope here, they must come from real people, do not generate or fake them.

Target buyer: Indian software engineer, 1-8 years experience, applying to remote-first or US-based companies (Google, Amazon, Meta, Stripe, GitLab, and similar), preparing for DSA + system design + behavioral interviews.

Brand constraint: no human faces anywhere in generated content. Voice-only or diagram-only visuals.

---

## 1. Explainer Videos

**Target count:** 100+
**Format:** No faces. Auto-generated block diagrams / slides + AI voiceover (ElevenLabs or equivalent TTS). 5-15 minutes each.

**Topic coverage required:**
- DSA patterns (~15-20 topics): two pointers, sliding window, fast/slow pointers, binary search variants, DFS/BFS, backtracking, dynamic programming (1D and 2D), greedy, union-find, trie, heap/priority queue, intervals, topological sort, bit manipulation, graph shortest path.
- System design fundamentals (~15-20 topics): load balancing, caching, database sharding/replication, CAP theorem, message queues, rate limiting, CDN, consistent hashing, microservices vs monolith, API gateway, and applied walkthroughs of 8-10 common designs (URL shortener, rate limiter, chat system, news feed, ride-sharing dispatch, notification system, file storage service, search autocomplete).
- Behavioral interview: STAR method, how to frame Indian company/title context for a US interviewer, common behavioral questions and how to structure answers.
- Remote work logistics: getting paid in USD from India (Deel, Remote.com, Wise), basic tax obligations for India-based remote income, common contract red flags, visa/relocation myth-busting (most remote roles do not require relocation or a US visa), negotiating comp as an India-based remote hire.

**Production pipeline per video:**
1. Script generation (LLM-drafted from the topic + a short outline, target 800-1800 words per script depending on video length).
2. Visual generation: block diagrams / flowcharts / bullet slides matching the script's structure, no stock photography, no faces, no avatars.
3. Voiceover generation via TTS (ElevenLabs or equivalent), one consistent voice across all videos for brand continuity.
4. Assembly into final video file, synced timing between voiceover and visual transitions.

**Output spec:**
- Format: MP4, 1080p, one file per video.
- File naming: `<category>_<topic-slug>_<sequence>.mp4` (e.g. `dsa_sliding-window_01.mp4`, `sysdesign_rate-limiter_01.mp4`, `remote_visa-myths_01.mp4`).
- Deliver a manifest CSV/JSON listing: filename, title, category, topic, duration, script source file.

---

## 2. PDF Handouts / Cheat Sheets

**Target count:** 300-500+
**Process:** LLM-drafted, then flagged for a human review pass before publishing (do not auto-publish without review).

**Content categories required:**
- One cheat sheet per DSA pattern (~15-20 sheets): pattern recognition cues, template code, 5-8 example problems per pattern with links/references.
- One cheat sheet per system design topic (~15-20 sheets) and per common design walkthrough (~8-10 sheets): key tradeoffs, a reference architecture diagram, common follow-up questions.
- Company-specific question bank handouts (see Section 3, one PDF per company).
- Behavioral prep handouts: STAR template, a bank of 40-60 common questions with answer-structuring guidance.
- Remote logistics handouts: one each for USD payment setup, tax basics, contract red-flag checklist, visa myth-busting, remote comp negotiation playbook.
- Resume and LinkedIn handouts (coordinate with Section 4 to avoid duplication).

**Output spec:**
- Format: PDF, single consistent branded template (logo, consistent fonts/colors, no orphan headings, adequate margins/whitespace, this must be visually checked before delivery, not just generated and shipped).
- File naming: `<category>_<topic-slug>.pdf`.
- Deliver a manifest listing every PDF with category, topic, and a one-line description for the sales page bullet list.

---

## 3. Company-Specific Question Banks

**Target count:** 50+ companies, limited strictly to companies with sufficient public information available to compile from.

**Sourcing constraint (important):** Compile and paraphrase patterns/themes of publicly discussed interview questions from public sources. Do not scrape or reproduce verbatim question sets from any single proprietary source (e.g. do not bulk-copy from Glassdoor, LeetCode Discuss, Blind) without rewriting into original phrasing. Attribute the company and role level, not the source site. Flag any company where public information is too thin to compile a credible bank, exclude it rather than pad it with generic content.

**Per-company deliverable:**
- 15-30 questions, tagged by topic (DSA / system design / behavioral) and observed frequency/recency if known.
- A short "what this company tends to emphasize" summary (e.g. heavy on system design at senior level, bar-raiser round structure, etc.) where that pattern is well-documented publicly.

**Priority company list (start here, expand as sourcing allows):**
Amazon, Google, Meta, Microsoft, Apple, Netflix, Stripe, GitLab, Atlassian, Shopify, Airbnb, Uber, LinkedIn, Salesforce, Adobe, Twilio, Doordash, Coinbase, Databricks, Zoom, plus any other companies with a consistent track record of remote or India-based hiring.

**Output spec:**
- Format: one PDF per company (feeds into Section 2's file set) plus a master index handout listing all covered companies.
- File naming: `company_<company-slug>.pdf`.

---

## 4. Templates

**Target count:** 15-20

**Required templates:**
- Resume template built for US ATS parsing (clean single-column layout, standard section headers, no graphics/tables that break ATS parsing).
- A companion guide: how to translate Indian job titles, company names, and scope of work into terms a US recruiter/ATS will recognize.
- LinkedIn profile template/checklist optimized for being found by remote-hiring recruiters (headline, About section, skills section guidance).
- Cover letter template (short, remote-role-specific).
- Negotiation email templates: initial counter-offer, multiple-offer leverage, timeline extension request.
- Outreach/networking message templates for cold LinkedIn outreach to recruiters or hiring managers at target companies.

**Output spec:**
- Format: editable (Google Docs link or .docx), not locked PDFs, since buyers need to fill these in themselves.
- File naming: `template_<type-slug>.docx`.

---

## 5. Master Roadmap / Checklist

**Target count:** 1-2 flagship documents

**Requirement:**
- A week-by-week prep roadmap from day 1 to interview-ready, in at least two timeline variants: a 4-week accelerated track and a 12-week standard track.
- Each week specifies: which Vault videos/PDFs to consume, practice targets (e.g. number of DSA problems by pattern, number of system design write-ups), and a checkpoint self-assessment.
- Must explicitly route the reader to the AI Prep tier (mock interview AI tool) and the 1:1 Premium tier at natural checkpoints (e.g. "by week 3 you should be ready for your first AI mock interview," "if you're not passing AI mocks by week 6, consider a 1:1 session"), this document is also the internal upsell mechanism, not just a study plan.
- Output as both a PDF (for the Vault) and a simple checklist format (for progress tracking, e.g. a Notion template or checkbox-style PDF).

**Output spec:**
- File naming: `roadmap_4week.pdf`, `roadmap_12week.pdf`.

---

## Delivery Checklist for the Generating Agent

- [ ] All 100+ videos generated, manifest delivered, no faces present in any file, spot-check a sample for voice/diagram sync quality before bulk delivery.
- [ ] All 300-500+ PDFs generated, human review pass completed, consistent branded template applied, no orphan headings, checked for visual breathing room before final delivery.
- [ ] Company question banks completed only for companies with sufficient public sourcing, thin-source companies explicitly excluded and listed as such.
- [ ] All templates delivered in editable format, not locked PDFs.
- [ ] Both roadmap variants completed and cross-link to the AI Prep and 1:1 Premium upsell tiers.
- [ ] Full manifest (CSV or JSON) of every asset produced: filename, category, topic, format, one-line sales-page description.
