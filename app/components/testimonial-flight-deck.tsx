"use client";

import Link from "next/link";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const manualNavigationUntilRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const [compact, setCompact] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const updateTrackProgress = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
    setTrackProgress(Math.min(1, viewport.scrollLeft / max));
    const viewportCenter = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    const cards = Array.from(viewport.querySelectorAll<HTMLElement>(".testimonial-card"));
    const closestIndex = cards.reduce((closest, card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter);
      return distance < closest.distance ? { index, distance } : closest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
    setActiveIndex((current) => current === closestIndex ? current : closestIndex);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    const viewport = viewportRef.current;
    const observer = new ResizeObserver(updateTrackProgress);
    if (viewport) {
      viewport.addEventListener("scroll", updateTrackProgress, { passive: true });
      observer.observe(viewport);
    }
    return () => {
      media.removeEventListener("change", update);
      viewport?.removeEventListener("scroll", updateTrackProgress);
      observer.disconnect();
    };
  }, [updateTrackProgress]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const viewport = viewportRef.current;
    if (
      !viewport
      || reduceMotion
      || compact
      || performance.now() < manualNavigationUntilRef.current
    ) return;
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = latest * max;
  });

  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const targetIndex = (activeIndex + direction + EVIDENCE_RECORDS.length) % EVIDENCE_RECORDS.length;
    const target = viewport.querySelectorAll<HTMLElement>(".testimonial-card")[targetIndex];
    if (!target) return;
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetContentLeft = targetRect.left - viewportRect.left + viewport.scrollLeft;
    const centeredLeft = targetContentLeft - (viewport.clientWidth - targetRect.width) / 2;
    manualNavigationUntilRef.current = performance.now() + 2400;
    setActiveIndex(targetIndex);
    setTrackProgress(targetIndex / (EVIDENCE_RECORDS.length - 1));
    viewport.scrollTo({
      left: Math.max(0, Math.min(max, centeredLeft)),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

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
          ref={viewportRef}
          tabIndex={0}
          aria-label="Evidence record formats. Scroll horizontally or use the arrow controls."
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
          <ol className="testimonial-flight-track">
            {EVIDENCE_RECORDS.map((story, index) => (
              <li
                className={`testimonial-card${index === activeIndex ? " is-active" : ""}`}
                aria-current={index === activeIndex ? "true" : undefined}
                key={story.number}
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
              </li>
            ))}
          </ol>
        </div>

        <footer className="container testimonial-flight-footer">
          <div className="testimonial-flight-progress" aria-hidden="true">
            <span style={{ width: `${Math.max(8, trackProgress * 100)}%` }} />
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
            <button type="button" onClick={() => move(-1)} aria-label={`Previous story, ${previousLabel}`}>
              <span className="testimonial-control-arrow" aria-hidden="true">←</span>
              <span className="testimonial-control-copy"><small>PREVIOUS</small><b>{previousLabel}</b></span>
            </button>
            <div className="testimonial-flight-position" aria-live="polite">
              <span>RECORD</span><b>{EVIDENCE_RECORDS[activeIndex].number}</b><small>/ 04</small>
            </div>
            <button type="button" onClick={() => move(1)} aria-label={`Next story, ${nextLabel}`}>
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
