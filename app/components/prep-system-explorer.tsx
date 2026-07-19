"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { VAULT_MODULES } from "@/app/lib/site-data";

const MODULES = VAULT_MODULES.slice(0, 6);

export function PrepSystemExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const activeModule = MODULES[activeIndex];
  const angle = activeIndex * 60;
  const orbitPitch = [0, 3, 1, -2, 2, -1][activeIndex];
  const orbitYaw = [0, -3, 3, 0, -2, 2][activeIndex];
  const orbitRoll = [-4, -1, 2, 4, 1, -3][activeIndex];
  const explorerStyle = {
    "--active-angle": `${angle}deg`,
    "--orbit-pitch": `${orbitPitch}deg`,
    "--orbit-yaw": `${orbitYaw}deg`,
    "--orbit-roll": `${orbitRoll}deg`,
  } as CSSProperties;

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

  useEffect(() => {
    document.documentElement.dataset.activePrepSystem = String(activeIndex + 1);
    window.dispatchEvent(new CustomEvent("interviewrunway:prep-system-change", {
      detail: { index: activeIndex },
    }));
  }, [activeIndex]);

  return (
    <div className="prep-explorer" style={explorerStyle}>
      <div className="payload-sticky">
        <div className="section-heading">
          <p className="eyebrow">Foundation clearance</p>
          <h2 id="inside-title">Build the flight plan before the cockpit comes alive.</h2>
          <p>
            Patterns, systems, behavioural evidence, role context, and mock demonstrations
            create the baseline the Second Seat needs to test under pressure.
          </p>
        </div>

        <div className="payload-instrument-stick">
          <div
            className="system-instrument system-instrument-orbital"
            role="tabpanel"
            id="prep-system-panel"
            aria-labelledby={`prep-tab-${activeIndex}`}
            aria-live="polite"
            data-active-system={activeIndex + 1}
          >
            <div className="instrument-horizon" aria-hidden="true"><i /><i /><i /></div>

            <div className="instrument-status" aria-hidden="true">
              <span>SYSTEM 0{activeIndex + 1} / 06 READY</span><i /><b>SECOND SEAT ELIGIBILITY</b>
            </div>

            <div className="instrument-orbit" aria-hidden="true">
              <div className="instrument-rings"><i /><i /><i /></div>
              <div className="instrument-rotor"><i /><i /><i /></div>
              <AnimatePresence initial={false}>
                <motion.div
                  className="instrument-selection-pulse"
                  key={`pulse-${activeIndex}`}
                  initial={reduceMotion ? false : { opacity: 0.72, scale: 0.32 }}
                  animate={{ opacity: 0, scale: 1.75 }}
                  transition={{ duration: reduceMotion ? 0 : 0.82, ease: [0.16, 1, 0.3, 1] }}
                />
              </AnimatePresence>
              {MODULES.map((module, index) => (
                <span
                  className={index === activeIndex ? "is-active" : ""}
                  style={{
                    "--node-angle": `${index * 60}deg`,
                    "--node-counter-angle": `${index * -60}deg`,
                  } as CSSProperties}
                  key={module.kicker}
                >
                  0{index + 1}
                </span>
              ))}
              <div className="instrument-core">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`core-${activeModule.kicker}`}
                    initial={reduceMotion ? false : { opacity: 0, rotateY: 72, scale: 0.72 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, rotateY: -72, scale: 0.78 }}
                    transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <b>0{activeIndex + 1}</b>
                    <span>{activeModule.kicker}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="instrument-readout">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeModule.kicker}
                  initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="instrument-readout-label">WHAT THIS SYSTEM UNLOCKS</span>
                  <p>{activeModule.title}</p>
                  <ol>
                    {activeModule.facets.map((facet, index) => (
                      <li key={facet}><span>0{index + 1}</span>{facet}</li>
                    ))}
                  </ol>
                </motion.div>
              </AnimatePresence>
            </div>
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
