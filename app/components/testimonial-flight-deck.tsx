"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useCallback, useRef, useState } from "react";

const EVIDENCE_RECORDS = [
  {
    number: "01",
    system: "Pattern recognition",
    baseline: "Codes before naming the pattern or invariant",
    intervention: "Timed recognition pass + rationale rehearsal",
    change: "Pattern, invariant, and complexity stated before code",
    outcome: "Awaiting verified learner evidence",
    timeframe: "Measured across repeated attempts",
  },
  {
    number: "02",
    system: "Systems judgment",
    baseline: "Architecture appears before constraints and trade-offs",
    intervention: "Constraint-first mock + transcript correction",
    change: "Decisions become explicit before diagram detail",
    outcome: "Awaiting verified learner evidence",
    timeframe: "Measured across repeated attempts",
  },
  {
    number: "03",
    system: "Behavioural evidence",
    baseline: "Team activity obscures individual judgment",
    intervention: "Evidence-led story reconstruction + follow-up probes",
    change: "Decision, ownership, proof, and consequence remain visible",
    outcome: "Awaiting verified learner evidence",
    timeframe: "Measured across rehearsed stories",
  },
  {
    number: "04",
    system: "Career signal",
    baseline: "Strong work reads as tasks and internal shorthand",
    intervention: "Evidence-led resume and scope translation",
    change: "Technical decisions and impact become recruiter-readable",
    outcome: "Awaiting verified learner evidence",
    timeframe: "Measured before and after revision",
  },
] as const;

export function TestimonialFlightDeck() {
  const sectionRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef(0);
  const manualNavigationUntilRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const showRecord = useCallback((index: number, travelDirection: 1 | -1) => {
    activeIndexRef.current = index;
    setDirection(travelDirection);
    setActiveIndex(index);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (reduceMotion || performance.now() < manualNavigationUntilRef.current) return;
    const scrollIndex = Math.min(
      EVIDENCE_RECORDS.length - 1,
      Math.floor(latest * EVIDENCE_RECORDS.length),
    );
    if (scrollIndex === activeIndexRef.current) return;
    showRecord(scrollIndex, scrollIndex > activeIndexRef.current ? 1 : -1);
  });

  const move = (direction: -1 | 1) => {
    const targetIndex = (
      activeIndexRef.current + direction + EVIDENCE_RECORDS.length
    ) % EVIDENCE_RECORDS.length;
    manualNavigationUntilRef.current = performance.now() + 2800;
    showRecord(targetIndex, direction);
  };

  const story = EVIDENCE_RECORDS[activeIndex];
  const previousLabel = EVIDENCE_RECORDS[(activeIndex - 1 + EVIDENCE_RECORDS.length) % EVIDENCE_RECORDS.length].number;
  const nextLabel = EVIDENCE_RECORDS[(activeIndex + 1) % EVIDENCE_RECORDS.length].number;

  return (
    <section
      className="testimonial-flight-deck"
      id="learner-stories"
      ref={sectionRef}
      aria-labelledby="testimonial-title"
      data-aero-phase="proof"
    >
      <div className="testimonial-flight-pin">
        <div className="testimonial-flight-field" aria-hidden="true"><i /><i /><i /><span /></div>

        <header className="container testimonial-flight-header">
          <div>
            <p className="eyebrow">The flight recorder</p>
            <h2 id="testimonial-title">How progress will be proven.</h2>
          </div>
          <div className="testimonial-flight-intro">
            <strong>Baseline → intervention → signal change → outcome.</strong>
            <p>No invented customer claims. These are evidence-record structures; outcomes stay empty until a learner, timeframe, consent, and source are verified.</p>
          </div>
        </header>

        <div
          className="testimonial-flight-viewport"
          tabIndex={0}
          data-active-record={story.number}
          aria-label="Evidence record formats. Use the left and right arrow controls to change records."
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              move(1);
            }
          }}
        >
          <ol className="testimonial-flight-track" aria-live="polite">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.li
                className="testimonial-card is-active"
                aria-current="true"
                key={story.number}
                custom={direction}
                initial={reduceMotion ? { opacity: 0 } : {
                  opacity: 0,
                  x: direction * 150,
                  rotateY: direction * 5,
                  filter: "blur(4px)",
                }}
                animate={{ opacity: 1, x: 0, rotateY: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : {
                  opacity: 0,
                  x: direction * -120,
                  rotateY: direction * -4,
                  filter: "blur(3px)",
                }}
                transition={{ duration: reduceMotion ? 0.01 : 0.42, ease: [0.16, 1, 0.3, 1] }}
              >
                <article aria-label={`${story.system} evidence record`}>
                  <div className="testimonial-card-topline">
                    <span>RUNWAY RECORD</span><i /><b>{story.number} / 04</b>
                  </div>
                  <div className="testimonial-record-title"><span>ACTIVE SYSTEM</span><h3>{story.system}</h3><p>Illustrative record structure · not a customer testimonial</p></div>
                  <div className="testimonial-record">
                    <div><span>BASELINE</span><strong>{story.baseline}</strong></div>
                    <div><span>INTERVENTION</span><strong>{story.intervention}</strong></div>
                    <div><span>SIGNAL CHANGE</span><strong>{story.change}</strong></div>
                    <div><span>OUTCOME</span><strong>{story.outcome}</strong></div>
                  </div>
                  <p className="testimonial-timeframe">TIMEFRAME · {story.timeframe}</p>
                  <div className="testimonial-engine-mark" aria-hidden="true"><i /><i /><span /></div>
                </article>
              </motion.li>
            </AnimatePresence>
          </ol>
        </div>

        <footer className="container testimonial-flight-footer">
          <div className="testimonial-flight-progress" aria-hidden="true">
            <span style={{ width: `${((activeIndex + 1) / EVIDENCE_RECORDS.length) * 100}%` }} />
          </div>
          <div
            className="testimonial-flight-controls"
            aria-label="Testimonial navigation console"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(1);
              }
            }}
          >
            <button type="button" data-testid="previous-evidence-record" onClick={() => move(-1)} aria-label={`Previous story, ${previousLabel}`}>
              <span className="testimonial-control-arrow" aria-hidden="true">←</span>
              <span className="testimonial-control-copy"><small>PREVIOUS</small><b>{previousLabel}</b></span>
            </button>
            <div className="testimonial-flight-position" aria-live="polite">
              <span>RECORD</span><b>{EVIDENCE_RECORDS[activeIndex].number}</b><small>/ 04</small>
            </div>
            <button type="button" data-testid="next-evidence-record" onClick={() => move(1)} aria-label={`Next story, ${nextLabel}`}>
              <span className="testimonial-control-copy"><small>NEXT</small><b>{nextLabel}</b></span>
              <span className="testimonial-control-arrow" aria-hidden="true">→</span>
            </button>
          </div>
          <Link href="/proof">Read the evidence standard <span aria-hidden="true">↗</span></Link>
        </footer>
      </div>
    </section>
  );
}
