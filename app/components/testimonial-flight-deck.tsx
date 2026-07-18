"use client";

import Link from "next/link";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_STORIES = [
  {
    number: "01",
    initials: "AR",
    name: "Ananya Rao",
    role: "Backend engineer · Bengaluru",
    outcome: "Sample outcome · Remote SaaS team",
    path: "12-week Vault path",
    quote: "I stopped memorising solutions and began explaining why a pattern fit. The interview finally felt like a technical conversation, not a recall test.",
  },
  {
    number: "02",
    initials: "RM",
    name: "Rohan Menon",
    role: "Platform engineer · Hyderabad",
    outcome: "Sample outcome · Global infrastructure role",
    path: "Vault + AI Prep",
    quote: "The practice loop showed me that my design knowledge was fine—my real gap was making trade-offs visible before the interviewer had to ask.",
  },
  {
    number: "03",
    initials: "MI",
    name: "Meera Iyer",
    role: "Data engineer · Chennai",
    outcome: "Sample outcome · Product data team",
    path: "4-week accelerated path",
    quote: "The story bank helped me translate work that sounded ordinary internally into clear evidence of ownership, scale, and cross-team judgment.",
  },
  {
    number: "04",
    initials: "VD",
    name: "Vikram Desai",
    role: "ML infrastructure engineer · Pune",
    outcome: "Sample outcome · AI-adjacent engineering role",
    path: "Vault + human calibration",
    quote: "One focused calibration session was more useful than weeks of generic coaching because it targeted the communication pattern my practice data kept exposing.",
  },
] as const;

export function TestimonialFlightDeck() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [compact, setCompact] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const updateTrackProgress = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
    setTrackProgress(Math.min(1, viewport.scrollLeft / max));
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
    if (!viewport || reduceMotion || compact) return;
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = latest * max;
  });

  const currentIndex = Math.min(
    SAMPLE_STORIES.length - 1,
    Math.round(trackProgress * (SAMPLE_STORIES.length - 1)),
  );

  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const targetIndex = Math.max(0, Math.min(SAMPLE_STORIES.length - 1, currentIndex + direction));
    const target = viewport.querySelectorAll<HTMLElement>(".testimonial-card")[targetIndex];
    if (!target) return;
    viewport.scrollTo({
      left: target.offsetLeft - (viewport.clientWidth - target.clientWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const previousLabel = currentIndex === 0 ? "START" : SAMPLE_STORIES[currentIndex - 1].number;
  const nextLabel = currentIndex === SAMPLE_STORIES.length - 1 ? "END" : SAMPLE_STORIES[currentIndex + 1].number;

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
            <p className="eyebrow">Learner outcomes · design preview</p>
            <h2 id="testimonial-title">Stories from the runway.</h2>
          </div>
          <div className="testimonial-flight-intro">
            <strong>Previewing the finished evidence experience.</strong>
            <p>These named profiles and outcomes are fictional layout placeholders—not customer claims. Replace each card only after the learner, consent, and source are verified.</p>
          </div>
        </header>

        <div
          className="testimonial-flight-viewport"
          ref={viewportRef}
          tabIndex={0}
          aria-label="Fictional testimonial design previews. Scroll horizontally or use the arrow controls."
        >
          <ol className="testimonial-flight-track">
            {SAMPLE_STORIES.map((story) => (
              <li className="testimonial-card" key={story.number}>
                <article aria-label={`${story.name}, fictional testimonial design preview`}>
                  <div className="testimonial-card-topline">
                    <span>FICTIONAL DESIGN PREVIEW</span><i /><b>{story.number} / 04</b>
                  </div>
                  <div className="testimonial-person">
                    <div aria-hidden="true">{story.initials}</div>
                    <p><strong>{story.name}</strong><span>{story.role}</span></p>
                  </div>
                  <blockquote>“{story.quote}”</blockquote>
                  <div className="testimonial-record">
                    <div><span>ILLUSTRATIVE RESULT</span><strong>{story.outcome}</strong></div>
                    <div><span>PREP CONFIGURATION</span><strong>{story.path}</strong></div>
                    <div><span>EVIDENCE STATUS</span><strong>Awaiting real learner · consent · source</strong></div>
                  </div>
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
          <div className="testimonial-flight-controls" aria-label="Testimonial navigation console">
            <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial" disabled={currentIndex === 0}>
              <span className="testimonial-control-arrow" aria-hidden="true">←</span>
              <span className="testimonial-control-copy"><small>PREVIOUS</small><b>{previousLabel}</b></span>
            </button>
            <div className="testimonial-flight-position" aria-live="polite">
              <span>STORY</span><b>{SAMPLE_STORIES[currentIndex].number}</b><small>/ 04</small>
            </div>
            <button type="button" onClick={() => move(1)} aria-label="Next testimonial" disabled={currentIndex === SAMPLE_STORIES.length - 1}>
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
