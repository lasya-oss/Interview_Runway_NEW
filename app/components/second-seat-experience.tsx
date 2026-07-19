"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnalyticsView } from "@/app/components/analytics-view";
import { trackEvent } from "@/app/lib/analytics";

const HERO_SCAN = [
  ["01", "Pattern signal"],
  ["02", "Trade-off judgment"],
  ["03", "Communication evidence"],
] as const;

const PERSPECTIVES = [
  {
    code: "INTERVIEWER",
    prompt: "What constraint is still missing?",
    detail: "Clarify traffic shape, burst tolerance, fairness, and the consequence of rejecting a request.",
  },
  {
    code: "SYSTEM DESIGNER",
    prompt: "State the trade-off before choosing the algorithm.",
    detail: "Compare accuracy, storage, coordination, and failure behaviour before naming a mechanism.",
  },
  {
    code: "COMMUNICATION",
    prompt: "Explain why the choice fits the traffic pattern.",
    detail: "Make the decision legible in one sequence: constraint, choice, trade-off, consequence.",
  },
] as const;

const LIVE_SYSTEMS = [
  {
    code: "01",
    name: "Perspective Practice",
    line: "See the question from every seat that matters.",
    detail: "Interviewer, hiring-manager, technical-expert, and communication perspectives inspect the same response without taking command away from you.",
  },
  {
    code: "02",
    name: "Responsive Mock Interviews",
    line: "The next question changes because your last answer changed.",
    detail: "A practice path recalculates around the commitment you made, the constraint you missed, and the evidence you exposed.",
  },
  {
    code: "03",
    name: "Agent Guidance",
    line: "Guidance stays connected through WhatsApp.",
    detail: "A restrained Ground Support channel keeps preparation, reminders, and next actions connected outside the cockpit.",
  },
  {
    code: "04",
    name: "Specialist Training Systems",
    line: "Dock the system that matches the interview ahead.",
    detail: "DSA, System Design, Backend Engineering, Data Engineering, and AI-adjacent systems add specialist practice without fragmenting the flight plan.",
  },
  {
    code: "05",
    name: "Included Practice Time",
    line: "Know the allowance before you activate it.",
    detail: "Practice time is measured in minutes. Additional time is never added automatically; the operating cost appears before confirmation.",
  },
] as const;

const CLEARANCE_CHECKS = [
  "Required Foundation systems",
  "Baseline signal diagnostic",
  "Pattern and systems checkpoints",
  "Behavioural evidence checkpoint",
  "Mock demonstration",
  "Initial learner signal profile",
] as const;

export function SecondSeatHeroInstrument() {
  const instrumentRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const [awake, setAwake] = useState(Boolean(reduceMotion));

  const wake = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAwake(true);
    if (!reduceMotion) timeoutRef.current = setTimeout(() => setAwake(false), 4300);
  };

  useEffect(() => {
    if (reduceMotion) return;
    const instrument = instrumentRef.current;
    if (!instrument) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      wake();
      interval ??= setInterval(wake, 9000);
    }, { threshold: 0.62 });
    observer.observe(instrument);
    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // Wake cycles are intentionally keyed only to the motion preference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return (
    <aside
      ref={instrumentRef}
      className={`second-seat-hero-instrument${awake ? " is-awake" : ""}`}
      aria-label="Interview signal scan with a locked Second Seat preview"
      onPointerEnter={wake}
      onFocus={wake}
    >
      <AnalyticsView event="second_seat_teaser_viewed" payload={{ surface: "hero" }} />
      <div className="second-seat-hero-head"><span>INTERVIEW SIGNAL / SCAN</span><b>SECOND SEAT</b></div>
      <div className="second-seat-lock-state"><span>ACCESS LOCKED</span><b>FOUNDATION CLEARANCE REQUIRED</b></div>

      <div className="second-seat-dormant-core" aria-hidden="true">
        <i /><i /><i />
        <span className="second-seat-core-wave"><b /><b /><b /><b /><b /></span>
        <span className="second-seat-core-label">SS</span>
        <span className="second-seat-perspective-point point-one" />
        <span className="second-seat-perspective-point point-two" />
        <span className="second-seat-perspective-point point-three" />
      </div>

      <div className="second-seat-hero-wake" aria-live="polite">
        <span>SAMPLE QUESTION</span>
        <strong>How would you design a rate limiter?</strong>
        <ol>{PERSPECTIVES.map((item) => <li key={item.code}><b>{item.code}</b><span>{item.prompt}</span></li>)}</ol>
      </div>

      <ol className="second-seat-hero-scan">
        {HERO_SCAN.map(([code, label]) => <li key={code}><span>{code}</span><strong>{label}</strong><i /></li>)}
      </ol>
      <div className="second-seat-hero-output"><span>OUTPUT</span><strong>One gap. One exercise. One next layer.</strong></div>
      <Link
        href="#second-seat-preview"
        className="second-seat-hero-link"
        onClick={() => trackEvent("second_seat_preview_started", { surface: "hero_teaser" })}
      >
        Preview the Second Seat <span aria-hidden="true">↘</span>
      </Link>
    </aside>
  );
}

export function SecondSeatPreview() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "sweep" | "resolved">("idle");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (phase !== "sweep" || reduceMotion) return;
    const timer = setTimeout(() => {
      if (activeIndex < PERSPECTIVES.length - 1) setActiveIndex((value) => value + 1);
      else {
        setPhase("resolved");
        trackEvent("second_seat_preview_completed", { surface: "homepage_preview" });
      }
    }, 1450);
    return () => clearTimeout(timer);
  }, [activeIndex, phase, reduceMotion]);

  const start = () => {
    setActiveIndex(0);
    setPhase(reduceMotion ? "resolved" : "sweep");
    trackEvent("second_seat_preview_started", { surface: "homepage_preview" });
    if (reduceMotion) trackEvent("second_seat_preview_completed", { surface: "homepage_preview" });
  };

  const selectPerspective = (index: number) => {
    setActiveIndex(index);
    if (phase === "idle") setPhase("sweep");
    trackEvent("second_seat_perspective_changed", { perspective: PERSPECTIVES[index].code, surface: "homepage_preview" });
  };

  return (
    <section className="second-seat-preview-section" id="second-seat-preview" aria-labelledby="second-seat-preview-title" data-aero-phase="second-seat-preview">
      <div className="container second-seat-preview-layout">
        <div className="second-seat-preview-copy">
          <p className="eyebrow">Controlled Second Seat preview</p>
          <h2 id="second-seat-preview-title">One question. Three perspectives. <em>One clearer response.</em></h2>
          <p>You remain in command. The Second Seat helps you see what pressure makes easy to miss.</p>
          <div className="second-seat-preview-question"><span>SAMPLE QUESTION</span><strong>How would you design a rate limiter?</strong></div>
          {phase === "idle" ? <button type="button" onClick={start}>Run the perspective sweep <span aria-hidden="true">↗</span></button> : null}
        </div>

        <div className={`second-seat-perspective-board is-${phase}`}>
          <div className="second-seat-perspective-core" aria-hidden="true"><i /><i /><span /></div>
          <div className="second-seat-perspective-tabs" role="tablist" aria-label="Second Seat perspectives">
            {PERSPECTIVES.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeIndex === index}
                aria-controls="second-seat-perspective-readout"
                className={activeIndex === index ? "is-active" : ""}
                onClick={() => selectPerspective(index)}
                key={item.code}
              >
                <span>0{index + 1}</span><strong>{item.code}</strong><small>{item.prompt}</small>
              </button>
            ))}
          </div>
          <motion.div
            className="second-seat-perspective-readout"
            id="second-seat-perspective-readout"
            role="tabpanel"
            key={PERSPECTIVES[activeIndex].code}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{PERSPECTIVES[activeIndex].code} / ACTIVE PERSPECTIVE</span>
            <strong>{PERSPECTIVES[activeIndex].prompt}</strong>
            <p>{PERSPECTIVES[activeIndex].detail}</p>
          </motion.div>
          {phase === "resolved" ? (
            <div className="second-seat-preview-resolution">
              <span>RESOLVED THOUGHT STRUCTURE</span>
              <strong>Traffic shape → fairness constraint → algorithm trade-off → failure behaviour</strong>
            </div>
          ) : null}
        </div>
      </div>
      <div className="container second-seat-preview-gate">
        <p>The Second Seat is not sold separately. Complete Foundation clearance to unlock access.</p>
        <div><Link className="primary-cta" href="/checkout/vault" data-analytics-event="foundation_checkout_started">Start Foundation — ₹799 <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/demo-login">Enter the Second Seat demo <span aria-hidden="true">→</span></Link></div>
      </div>
    </section>
  );
}

export function SecondSeatJourney() {
  const reduceMotion = useReducedMotion();
  const foundationRef = useRef<HTMLElement>(null);
  const foundationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [foundationReady, setFoundationReady] = useState(Boolean(reduceMotion));
  const [activeSystem, setActiveSystem] = useState(0);
  const [topupOpen, setTopupOpen] = useState(false);

  useEffect(() => {
    const section = foundationRef.current;
    if (!section || reduceMotion) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      foundationTimerRef.current = setTimeout(() => setFoundationReady(true), 1150);
      observer.disconnect();
    }, { threshold: 0.46 });
    observer.observe(section);
    return () => {
      observer.disconnect();
      if (foundationTimerRef.current) clearTimeout(foundationTimerRef.current);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => setActiveSystem((value) => (value + 1) % LIVE_SYSTEMS.length), 3800);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const current = LIVE_SYSTEMS[activeSystem];
  const clearanceStyle = { "--clearance-angle": foundationReady ? "360deg" : "238deg" } as CSSProperties;

  return (
    <section className="second-seat-journey" aria-labelledby="second-seat-journey-title">
      <div className="container second-seat-journey-intro">
        <p className="eyebrow">One continuous flight</p>
        <h2 id="second-seat-journey-title">Learn the terrain. Unlock live intelligence. <em>Complete the landing.</em></h2>
        <p>The Foundation builds the flight plan. The Second Seat brings it alive. Human Calibration joins only when the remaining gap needs judgment.</p>
        <ol><li><b>01</b><span>FOUNDATION</span></li><li className="is-primary"><b>02</b><span>THE SECOND SEAT</span></li><li><b>03</b><span>HUMAN CALIBRATION</span></li></ol>
      </div>

      <article ref={foundationRef} className={`second-seat-phase foundation-clearance-phase${foundationReady ? " is-ready" : ""}`} data-aero-phase="clearance">
        <AnalyticsView event="foundation_clearance_viewed" payload={{ surface: "homepage_journey" }} />
        <div className="container foundation-clearance-layout">
          <div className="foundation-clearance-copy">
            <p className="eyebrow">Foundation / Flight Plan</p>
            <h3>Build the flight plan before the cockpit comes alive.</h3>
            <p>Every checkpoint adds usable context to the live system. The gate is measurable preparation—not arbitrary scarcity.</p>
            <div className="foundation-clearance-status"><span>FOUNDATION CLEARANCE · ILLUSTRATIVE SEQUENCE</span><strong>{foundationReady ? "CLEARANCE COMPLETE" : "SYSTEM 04 / 06 READY"}</strong><small>{foundationReady ? "SECOND SEAT ELIGIBILITY ESTABLISHED" : "BASELINE INCOMPLETE"}</small></div>
          </div>
          <div className="foundation-route-map">
            <ol>{CLEARANCE_CHECKS.map((item, index) => <motion.li initial={reduceMotion ? false : { opacity: 0, x: index % 2 ? 28 : -28 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.11 }} viewport={{ once: true }} key={item}><span>0{index + 1}</span><strong>{item}</strong><b>{foundationReady || index < 4 ? "READY" : "PENDING"}</b></motion.li>)}</ol>
            <div className="foundation-clearance-ring" style={clearanceStyle}><i /><span><b>{foundationReady ? "06" : "04"}</b> / 06<small>SECOND SEAT<br />CLEARANCE</small></span></div>
            <div className="foundation-current" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>
      </article>

      <article className="second-seat-phase second-seat-active-phase" data-aero-phase="second-seat">
        <div className="container second-seat-active-layout">
          <div className="second-seat-active-copy">
            <p className="eyebrow">The system comes alive</p>
            <h3>Meet the Second Seat.</h3>
            <p>Practice dynamically, see the question from several expert perspectives, stay connected to guidance, and use live intelligence that keeps pace with the conversation.</p>
            <div className="second-seat-active-status"><span>SECOND SEAT ACTIVE</span><b>Available after Foundation clearance</b></div>
            <Link className="primary-cta" href="#second-seat-preview" data-analytics-event="second_seat_preview_started">Preview the Second Seat <span aria-hidden="true">↗</span></Link>
          </div>

          <div className="second-seat-core-console">
            <div className="second-seat-engine-core" aria-hidden="true"><i /><i /><i /><span><b /></span></div>
            <div className="second-seat-console-head"><span>LIVE INTELLIGENCE / 05 SYSTEMS</span><b>COMMUNICATION CONNECTED</b></div>
            <div className="second-seat-system-controls" role="tablist" aria-label="Second Seat systems">
              {LIVE_SYSTEMS.map((system, index) => <button type="button" role="tab" aria-selected={index === activeSystem} className={index === activeSystem ? "is-active" : ""} onPointerEnter={() => setActiveSystem(index)} onFocus={() => setActiveSystem(index)} onClick={() => setActiveSystem(index)} key={system.code}><span>{system.code}</span><strong>{system.name}</strong></button>)}
            </div>
            <motion.div className="second-seat-system-readout" key={current.code} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="tabpanel">
              <span>{current.code} / {current.name}</span><strong>{current.line}</strong><p>{current.detail}</p>
            </motion.div>
            <div className="second-seat-specialists"><span>DOCKED SYSTEMS</span><b>DSA</b><b>SYSTEM DESIGN</b><b>BACKEND</b><b>DATA</b><b>AI-ADJACENT</b></div>
            <div className="second-seat-time-gauge">
              <AnalyticsView event="practice_time_viewed" payload={{ surface: "homepage_journey", allowance: "sample" }} />
              <div><span>AI PRACTICE TIME INCLUDED</span><strong>120 <small>MIN · CONTROLLED DEMO</small></strong></div>
              <dl><div><dt>USED</dt><dd>34 min</dd></div><div><dt>REMAINING</dt><dd>86 min</dd></div></dl>
              <button type="button" aria-expanded={topupOpen} onClick={() => { setTopupOpen((value) => { const next = !value; if (next) trackEvent("practice_time_topup_started", { surface: "homepage_journey", mode: "information" }); return next; }); }}>ADD PRACTICE TIME <span aria-hidden="true">+</span></button>
              {topupOpen ? <p>Additional time is never added automatically. The exact operating cost appears before confirmation.</p> : null}
            </div>
            <div className="second-seat-live-boundary"><span>PERMITTED LIVE INTERVIEW SUPPORT</span><p>For mocks, preparation, open-tool or explicitly permitted settings, approved accessibility use, and post-interview analysis. You remain responsible for the reasoning and response.</p></div>
          </div>
        </div>
      </article>

      <article className="second-seat-phase human-calibration-phase" data-aero-phase="human">
        <AnalyticsView event="human_calibration_viewed" payload={{ surface: "homepage_journey" }} />
        <div className="container human-calibration-layout">
          <div className="human-calibration-copy">
            <p className="eyebrow">Human Calibration</p>
            <h3>When the remaining gap becomes personal, a person steps in.</h3>
            <p>Your practice evidence becomes a focused mentor packet, so the conversation begins with your actual gap—not a generic coaching script.</p>
            <Link className="text-link" href="/premium">Review Human Calibration <span aria-hidden="true">→</span></Link>
          </div>
          <div className="human-approach-instrument" aria-label="Flight recorder evidence converging on a human instructor">
            <div className="flight-recorder-packet"><span>FLIGHT RECORDER / PACKET</span><strong>Repeated gap</strong><strong>Practice transcripts</strong><strong>Progress + target role</strong><strong>Previous corrections</strong></div>
            <div className="human-approach-path" aria-hidden="true"><i /><i /><i /><i /><span>INSTRUCTOR</span><b>RUNWAY</b></div>
            <div className="human-approach-result"><span>FINAL APPROACH</span><strong>One evidenced gap. One mentor. One focused correction plan.</strong></div>
          </div>
        </div>
      </article>
    </section>
  );
}
