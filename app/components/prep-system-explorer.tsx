"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties } from "react";
import { VAULT_MODULES } from "@/app/lib/site-data";

const MODULES = VAULT_MODULES.slice(0, 6);

export function PrepSystemExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const activeModule = MODULES[activeIndex];
  const angle = activeIndex * 60;
  const explorerStyle = { "--active-angle": `${angle}deg` } as CSSProperties;

  return (
    <div className="prep-explorer" style={explorerStyle}>
      <div className="payload-sticky">
        <div className="section-heading">
          <p className="eyebrow">Inside the ₹799 Vault</p>
          <h2 id="inside-title">Six systems.<br />One flight plan.</h2>
          <p>
            Move across the systems to see how each one turns scattered practice
            into a repeatable interview signal.
          </p>
        </div>

        <div
          className="system-instrument"
          role="tabpanel"
          id="prep-system-panel"
          aria-labelledby={`prep-tab-${activeIndex}`}
          aria-live="polite"
        >
          <div className="instrument-horizon" aria-hidden="true"><i /><i /><i /></div>
          <div className="instrument-orbit" aria-hidden="true">
            <div className="instrument-rings"><i /><i /><i /></div>
            <div className="instrument-rotor"><i /><i /><i /></div>
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
              <b>0{activeIndex + 1}</b>
              <span>{activeModule.kicker}</span>
            </div>
          </div>

          <div className="instrument-readout">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeModule.kicker}
                initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -7, filter: "blur(4px)" }}
                transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <p>{activeModule.title}</p>
                <ol>
                  {activeModule.facets.map((facet, index) => (
                    <li key={facet}><span>0{index + 1}</span>{facet}</li>
                  ))}
                </ol>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="instrument-status" aria-hidden="true">
            <span>ACTIVE SYSTEM</span><i /><b>{activeModule.meta}</b>
          </div>
        </div>

        <Link className="payload-link" href="/vault">
          Open the full manifest <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="payload-manifest" role="tablist" aria-label="Interview preparation systems">
        {MODULES.map((module, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.button
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
