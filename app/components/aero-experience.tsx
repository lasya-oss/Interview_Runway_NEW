"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

const HomeAeroCanvas = dynamic(
  () => import("./aero-canvases").then((module) => module.HomeAeroCanvas),
  { ssr: false },
);

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

type SceneTier = "static" | "lite" | "full";

const PHASE_TIMELINE = [
  ["foundation", 0],
  ["path", 0.18],
  ["vault", 0.38],
  ["guidance", 0.6],
  ["fit", 0.76],
  ["proof", 0.88],
  ["start", 1],
] as const;

class AeroCanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    document.documentElement.dataset.aeroCanvas = "failed";
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function getSceneTier(): SceneTier {
  const nav = navigator as NavigatorWithHints;
  const connection = nav.connection;
  const cores = navigator.hardwareConcurrency;
  const slowConnection = connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
  const constrainedDevice = (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (cores > 0 && cores <= 2);

  if (slowConnection || constrainedDevice) return "static";

  const canvas = document.createElement("canvas");
  const webgl = canvas.getContext("webgl2", { powerPreference: "high-performance", failIfMajorPerformanceCaveat: true });
  webgl?.getExtension("WEBGL_lose_context")?.loseContext();

  if (!webgl) return "static";

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const moderateConnection = connection?.effectiveType === "3g";
  const moderateDevice = (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || (cores > 0 && cores <= 4);
  return coarsePointer || moderateConnection || moderateDevice || window.innerWidth <= 760 ? "lite" : "full";
}

export function HomeAeroStage() {
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();
  const [readyTier, setReadyTier] = useState<Exclude<SceneTier, "static"> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const nextTier = reducedMotion ? "static" : getSceneTier();
    root.dataset.motionTier = nextTier;
    root.dataset.aeroCanvas = "idle";

    if (nextTier === "static") {
      const frame = window.requestAnimationFrame(() => setReadyTier(null));
      return () => window.cancelAnimationFrame(frame);
    }

    const idleWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleCallback = idleWindow.requestIdleCallback;
    const hasIdleCallback = Boolean(idleCallback);
    const idleId = idleCallback
      ? idleCallback(() => setReadyTier(nextTier), { timeout: 900 })
      : window.setTimeout(() => setReadyTier(nextTier), 500);

    return () => {
      if (hasIdleCallback && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!readyTier) return;

    let anchors: Array<{ top: number; value: number }> = [];
    let resizeFrame = 0;

    const measure = () => {
      anchors = PHASE_TIMELINE.flatMap(([phase, value]) => {
        const element = document.querySelector<HTMLElement>(`[data-aero-phase="${phase}"]`);
        return element ? [{ top: element.getBoundingClientRect().top + window.scrollY, value }] : [];
      });
      onScroll();
    };

    const onScroll = () => {
      if (anchors.length < 2) return;
      const sample = window.scrollY + window.innerHeight * 0.38;
      const first = anchors[0];
      const last = anchors[anchors.length - 1];

      if (sample <= first.top) {
        progressRef.current = first.value;
        return;
      }
      if (sample >= last.top) {
        progressRef.current = last.value;
        return;
      }

      const index = anchors.findIndex((anchor) => anchor.top > sample);
      const previous = anchors[index - 1];
      const next = anchors[index];
      const local = (sample - previous.top) / Math.max(1, next.top - previous.top);
      progressRef.current = previous.value + (next.value - previous.value) * local;
    };
    const onPointer = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const onResize = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(document.documentElement);
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    if (readyTier === "full") window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      resizeObserver.disconnect();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    };
  }, [readyTier]);

  return (
    <div className="home-aero-stage" aria-hidden="true">
      <div className="aero-static-form"><i /><i /><i /></div>
      {readyTier ? <AeroCanvasBoundary><HomeAeroCanvas progressRef={progressRef} pointerRef={pointerRef} tier={readyTier} /></AeroCanvasBoundary> : null}
    </div>
  );
}

const CHAPTERS = [
  {
    number: "01",
    force: "FOUNDATION",
    title: "Build the knowledge base.",
    body: "The Vault turns scattered prep into a structured foundation across DSA, systems, behavioural communication, and remote-career context.",
    meta: "₹799 · ONE TIME",
    href: "/vault",
    cta: "Explore the Vault",
  },
  {
    number: "02",
    force: "PRACTICE",
    title: "Find the gaps before the interview.",
    body: "AI Prep adds responsive mocks, evidence-backed scoring, and a study plan that changes when your performance changes.",
    meta: "VAULT OWNERS · OPTIONAL",
    href: "/ai-prep",
    cta: "See the feedback loop",
  },
  {
    number: "03",
    force: "HUMAN CALIBRATION",
    title: "Use expert time only where it helps.",
    body: "Founder-led coaching is reserved for a specific, persistent gap—not bundled into the first purchase and not sold as unlimited access.",
    meta: "CAPACITY CAPPED · HUMAN",
    href: "/premium",
    cta: "Review 1:1 coaching",
  },
] as const;

type Chapter = (typeof CHAPTERS)[number];

function ChapterBody({ chapter }: { chapter: Chapter }) {
  return (
    <>
      <div className="chapter-index"><span>{chapter.number}</span><i />{chapter.force}</div>
      <h3>{chapter.title}</h3>
      <p>{chapter.body}</p>
      <div className="chapter-footer">
        <span>{chapter.meta}</span>
        <Link href={chapter.href}>{chapter.cta} <span aria-hidden="true">↗</span></Link>
      </div>
    </>
  );
}

function MotionChapter({ chapter, index }: { chapter: Chapter; index: number }) {
  const chapterRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: chapterRef, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 0.38, 0.68, 1], [index % 2 === 0 ? -140 : 140, 0, 0, index % 2 === 0 ? 34 : -34]);
  const scale = useTransform(scrollYProgress, [0, 0.38, 0.72, 1], [0.9, 1, 1, 0.97]);
  const rotateY = useTransform(scrollYProgress, [0, 0.4, 0.72, 1], [index % 2 === 0 ? -7 : 7, 0, 0, index % 2 === 0 ? 2 : -2]);

  return (
    <motion.article
      ref={chapterRef}
      className={`trajectory-chapter trajectory-chapter-${index + 1}`}
      style={{ x, scale, rotateY, transformPerspective: 900 }}
    >
      <ChapterBody chapter={chapter} />
    </motion.article>
  );
}

function SequenceFrame({ animated }: { animated: boolean }) {
  return (
    <section className="trajectory-sequence" aria-labelledby="trajectory-title" data-aero-phase="path">
      <div className="trajectory-atmosphere" aria-hidden="true" />
      <div className="trajectory-intro container">
        <p className="eyebrow">A staged prep path</p>
        <h2 id="trajectory-title">Three layers. Added when needed.</h2>
        <p>Start with the foundation. Add practice and human feedback only when your performance gives you a reason.</p>
      </div>
      <div className="trajectory-chapters container">
        {CHAPTERS.map((chapter, index) => animated ? (
          <MotionChapter chapter={chapter} index={index} key={chapter.number} />
        ) : (
          <article className={`trajectory-chapter trajectory-chapter-${index + 1}`} key={chapter.number}>
            <ChapterBody chapter={chapter} />
          </article>
        ))}
      </div>
      <div className="sequence-axis" aria-hidden="true"><i /><span>FOUNDATION</span><span>PRACTICE</span><span>CALIBRATION</span></div>
    </section>
  );
}

export function TrajectorySequence() {
  const reducedMotion = useReducedMotion();
  return <SequenceFrame animated={!reducedMotion} />;
}
