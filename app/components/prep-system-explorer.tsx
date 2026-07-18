"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { VAULT_MODULES } from "@/app/lib/site-data";

const MODULES = VAULT_MODULES.slice(0, 6);

export function PrepSystemExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const activeModule = MODULES[activeIndex];

  useEffect(() => {
    let animationFrame = 0;

    const syncSystemToScroll = () => {
      animationFrame = 0;
      const rows = rowRefs.current.filter((row): row is HTMLButtonElement => Boolean(row));
      if (!rows.length) return;

      const firstRect = rows[0].getBoundingClientRect();
      const lastRect = rows[rows.length - 1].getBoundingClientRect();
      if (firstRect.top > window.innerHeight || lastRect.bottom < 0) return;

      const aeroFocusLine = window.innerHeight * 0.38;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      rows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - aeroFocusLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => current === closestIndex ? current : closestIndex);
    };

    const requestSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncSystemToScroll);
    };

    syncSystemToScroll();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync, { passive: true });
    return () => {
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="prep-explorer">
      <div className="payload-sticky">
        <div className="section-heading">
          <p className="eyebrow">Inside the ₹799 Vault</p>
          <h2 id="inside-title">Six systems.<br />One flight plan.</h2>
          <p>
            Move across the systems to see how each one turns scattered practice
            into a repeatable interview signal.
          </p>
        </div>

        <div className="payload-instrument-stick">
          <div
            className="system-instrument"
            role="tabpanel"
            id="prep-system-panel"
            aria-labelledby={`prep-tab-${activeIndex}`}
            aria-live="polite"
            data-active-system={activeIndex + 1}
          >
          <div className="instrument-status" aria-hidden="true">
            <span>SYSTEM 0{activeIndex + 1} / 06</span><i /><b>{activeModule.meta}</b>
          </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="instrument-flight-plan"
                key={activeModule.kicker}
                initial={reduceMotion ? false : { opacity: 0, y: 18, rotateX: 6, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12, rotateX: -4, filter: "blur(4px)" }}
                transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
              >
              <div className="flight-plan-heading">
                <span>{activeModule.kicker}</span>
                <strong>{activeModule.title}</strong>
              </div>

              <div className="flight-plan-stages">
                {activeModule.flow.map((stage, index) => (
                  <div key={stage}>
                    <span>0{index + 1}</span>
                    <small>{["INPUT", "SYSTEM", "INTERVIEW SIGNAL"][index]}</small>
                    <strong>{stage}</strong>
                  </div>
                ))}
                <i className="flight-plan-line" aria-hidden="true"><b /><b /><b /></i>
              </div>

              <div className="flight-plan-value">
                <span>WHAT THIS UNLOCKS</span>
                <p>{activeModule.outcome}</p>
              </div>

              <div className="instrument-capabilities">
                <span>THE LEARNER CAN NOW</span>
                <ol>
                  {activeModule.facets.map((facet, index) => (
                    <li key={facet}><b>0{index + 1}</b><span>{facet}</span></li>
                  ))}
                </ol>
              </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <Link className="payload-link" href="/vault">
            Open the full manifest <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className="payload-manifest" role="tablist" aria-label="Interview preparation systems">
        {MODULES.map((module, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.button
              ref={(node) => { rowRefs.current[index] = node; }}
              type="button"
              role="tab"
              id={`prep-tab-${index}`}
              aria-selected={isActive}
              aria-controls="prep-system-panel"
              tabIndex={isActive ? 0 : -1}
              className={`manifest-row${isActive ? " is-active" : ""}`}
              onPointerEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                let nextIndex: number | null = null;
                if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % MODULES.length;
                if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + MODULES.length) % MODULES.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = MODULES.length - 1;
                if (nextIndex === null) return;
                event.preventDefault();
                setActiveIndex(nextIndex);
                document.getElementById(`prep-tab-${nextIndex}`)?.focus();
              }}
              whileHover={reduceMotion ? undefined : { x: 7 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              key={module.kicker}
            >
              <span className="manifest-index">0{index + 1}</span>
              <span className="manifest-copy">
                <strong>{module.kicker}</strong>
                <b>{module.title}</b>
                <span>{module.description}</span>
              </span>
              <span className="manifest-meta">{module.meta}</span>
              <span className="manifest-select" aria-hidden="true">{isActive ? "ACTIVE" : "EXPLORE"} ↗</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
