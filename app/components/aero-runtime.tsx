"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { trackEvent, type AnalyticsEvent } from "@/app/lib/analytics";

export function AeroRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let pointerFrame = 0;
    let pointerX = 72;
    let pointerY = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasSpecularSurface = Boolean(document.querySelector(".home-v2, .page-hero"));

    const updateScroll = () => {
      frame = 0;
      const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      root.style.setProperty("--page-progress", `${Math.min(1, window.scrollY / range)}`);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };

    const onPointer = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth) * 100;
      pointerY = (event.clientY / window.innerHeight) * 100;
      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          root.style.setProperty("--light-x", `${pointerX}%`);
          root.style.setProperty("--light-y", `${pointerY}%`);
        });
      }
    };

    const onAnalyticsClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-analytics-event]")
        : null;
      const analyticsEvent = target?.dataset.analyticsEvent as AnalyticsEvent | undefined;
      if (!analyticsEvent) return;
      trackEvent(analyticsEvent, {
        label: target.dataset.analyticsLabel ?? target.textContent?.trim().slice(0, 120),
        href: target instanceof HTMLAnchorElement ? target.getAttribute("href") : undefined,
      });
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onAnalyticsClick);
    if (!reducedMotion && hasSpecularSurface) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onAnalyticsClick);
      window.removeEventListener("pointermove", onPointer);
      if (frame) window.cancelAnimationFrame(frame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    };
  }, []);

  return <div className="page-progress" aria-hidden="true"><span /></div>;
}

export function Reveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right" | "up";
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const offset = direction === "left" ? { x: -84, y: 0 } : direction === "right" ? { x: 84, y: 0 } : { x: 0, y: 46 };

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94, filter: "blur(8px)", ...offset }}
      whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
