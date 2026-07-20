"use client";

import Link from "next/link";
import { trackEvent } from "@/app/lib/analytics";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const AUDIO_URL = "/audio/interviewrunway-three-stage-pavitra2.mp3";
const NOMINAL_DURATION = 115.44;

type FilmScene = {
  id: "signal" | "foundation" | "second-seat" | "whatsapp" | "calibration" | "runway";
  start: number;
  end: number;
  label: string;
  narration: string;
  caption: string;
};

type FilmStage = "overview" | "foundation" | "second-seat" | "calibration";
type OpeningPanel = Exclude<FilmStage, "overview">;

type FilmBeat = {
  id: string;
  start: number;
  end: number;
  stage: FilmStage;
  visual: string;
  caption: string;
  value: string;
};

const FILM_SCENES: readonly FilmScene[] = [
  {
    id: "signal",
    start: 0,
    end: 12.04,
    label: "The signal",
    narration:
      "Most engineers don’t lack experience. They lose signal when an interview puts that experience under pressure. InterviewRunway turns scattered preparation into a three-stage flight path.",
    caption: "TURN EXPERIENCE INTO INTERVIEW SIGNAL.",
  },
  {
    id: "foundation",
    start: 12.04,
    end: 33.84,
    label: "Foundation",
    narration:
      "First, Foundation. ₹799 once. Structured flight plans connect DSA patterns, system design, behavioural evidence, role intelligence, and remote-career decisions. Diagnostics and checkpoints turn disconnected study into a baseline you can test. Complete Foundation clearance—and the cockpit comes alive.",
    caption: "01 · FOUNDATION · ₹799 ONCE.",
  },
  {
    id: "second-seat",
    start: 33.84,
    end: 67.2,
    label: "The Second Seat",
    narration:
      "Meet the Second Seat—the primary product. For ₹2,499 after clearance, its live AI practice system responds to each answer. One question is examined from interviewer, system-designer, and communication perspectives. The next question changes because your last answer changed. Practice evidence, progress, specialist training systems, and included practice time stay connected, so you can see the gap, correct it, and run the loop again. You remain in command.",
    caption: "02 · THE SECOND SEAT · ₹2,499 AFTER CLEARANCE.",
  },
  {
    id: "whatsapp",
    start: 67.2,
    end: 82.16,
    label: "Expert guidance",
    narration:
      "Between sessions, asynchronous expert guidance can continue through WhatsApp—so questions and next-step direction do not have to wait for a scheduled call. This is preparation guidance, not covert help during a restricted interview.",
    caption: "ASYNCHRONOUS EXPERT GUIDANCE · WHATSAPP.",
  },
  {
    id: "calibration",
    start: 82.16,
    end: 107.44,
    label: "Human calibration",
    narration:
      "When repeated evidence reveals a gap that needs human judgment, Human Calibration joins the final approach. For ₹9,999, a scheduled one-to-one session begins with your practice record, focuses on the specific pattern holding you back, and produces a clear correction plan—not a generic coaching script. Evidence first. Human time where it matters.",
    caption: "03 · HUMAN CALIBRATION · ₹9,999.",
  },
  {
    id: "runway",
    start: 107.44,
    end: 115.44,
    label: "Your runway",
    narration:
      "Learn the terrain. Unlock live AI. Calibrate with a person. Start Foundation. Build the flight plan. Bring the Second Seat alive.",
    caption: "START FOUNDATION · ₹799.",
  },
] as const;

const FILM_BEATS: readonly FilmBeat[] = [
  { id: "experience", start: 0, end: 2.95, stage: "overview", visual: "signal-scattered", caption: "Most engineers don’t lack experience.", value: "YOU HAVE THE EXPERIENCE." },
  { id: "pressure", start: 2.95, end: 6.62, stage: "overview", visual: "signal-pressure", caption: "They lose signal when an interview puts that experience under pressure.", value: "PRESSURE HIDES THE SIGNAL." },
  { id: "flight-path", start: 6.62, end: 12.04, stage: "overview", visual: "signal-connected", caption: "InterviewRunway turns scattered preparation into a three-stage flight path.", value: "TURN EXPERIENCE INTO INTERVIEW SIGNAL." },
  { id: "foundation-price", start: 12.04, end: 15.26, stage: "foundation", visual: "foundation-price", caption: "First, Foundation. ₹799 once.", value: "STOP GUESSING WHAT TO PREPARE." },
  { id: "foundation-systems", start: 15.26, end: 23.96, stage: "foundation", visual: "foundation-systems", caption: "Structured flight plans connect DSA patterns, system design, behavioural evidence, role intelligence, and remote-career decisions.", value: "STOP GUESSING WHAT TO PREPARE." },
  { id: "foundation-baseline", start: 23.96, end: 29.45, stage: "foundation", visual: "foundation-baseline", caption: "Diagnostics and checkpoints turn disconnected study into a baseline you can test.", value: "BUILD A BASELINE YOU CAN TEST." },
  { id: "foundation-clearance", start: 29.45, end: 33.84, stage: "foundation", visual: "foundation-clearance", caption: "Complete Foundation clearance—and the cockpit comes alive.", value: "BUILD A BASELINE YOU CAN TEST." },
  { id: "seat-intro", start: 33.84, end: 36.57, stage: "second-seat", visual: "seat-intro", caption: "Meet the Second Seat—the primary product.", value: "PRACTICE THAT RESPONDS TO YOU." },
  { id: "seat-price", start: 36.57, end: 44.28, stage: "second-seat", visual: "seat-answer", caption: "For ₹2,499 after clearance, its live AI practice system responds to each answer.", value: "PRACTICE THAT RESPONDS TO YOU." },
  { id: "seat-perspectives", start: 44.28, end: 51.72, stage: "second-seat", visual: "seat-perspectives", caption: "One question is examined from interviewer, system-designer, and communication perspectives.", value: "SEE HOW AN INTERVIEWER HEARS YOUR ANSWER." },
  { id: "seat-adaptive", start: 51.72, end: 57.07, stage: "second-seat", visual: "seat-adaptive", caption: "The next question changes because your last answer changed.", value: "YOUR LAST ANSWER CHANGES THE NEXT QUESTION." },
  { id: "seat-evidence", start: 57.07, end: 63.01, stage: "second-seat", visual: "seat-evidence", caption: "Practice evidence, progress, specialist training systems, and included practice time stay connected.", value: "LEAVE EACH SESSION KNOWING WHAT TO FIX." },
  { id: "seat-correct", start: 63.01, end: 65.83, stage: "second-seat", visual: "seat-correct", caption: "See the gap, correct it, and run the loop again.", value: "LEAVE EACH SESSION KNOWING WHAT TO FIX." },
  { id: "seat-command", start: 65.83, end: 67.2, stage: "second-seat", visual: "seat-command", caption: "You remain in command.", value: "LEAVE EACH SESSION KNOWING WHAT TO FIX." },
  { id: "whatsapp-channel", start: 67.2, end: 72.4, stage: "second-seat", visual: "whatsapp-channel", caption: "Between sessions, asynchronous expert guidance can continue through WhatsApp.", value: "AN EXPERT UNBLOCKS YOUR NEXT PRACTICE." },
  { id: "whatsapp-exchange", start: 72.4, end: 76.8, stage: "second-seat", visual: "whatsapp-exchange", caption: "Questions and next-step direction do not have to wait for a scheduled call.", value: "AN EXPERT UNBLOCKS YOUR NEXT PRACTICE." },
  { id: "whatsapp-material", start: 76.8, end: 79.5, stage: "second-seat", visual: "whatsapp-material", caption: "Experts can return material selected for the gap your practice exposed.", value: "YOUR GAP DECIDES THE MATERIAL." },
  { id: "whatsapp-boundary", start: 79.5, end: 82.16, stage: "second-seat", visual: "whatsapp-boundary", caption: "This is preparation guidance, not covert help during a restricted interview.", value: "YOUR GAP DECIDES THE MATERIAL." },
  { id: "calibration-gap", start: 82.16, end: 88.95, stage: "calibration", visual: "calibration-gap", caption: "When repeated evidence reveals a gap that needs human judgment, Human Calibration joins the final approach.", value: "USE HUMAN TIME ONLY WHERE IT MATTERS." },
  { id: "calibration-price", start: 88.95, end: 96.2, stage: "calibration", visual: "calibration-brief", caption: "For ₹9,999, a scheduled one-to-one session begins with your practice record.", value: "USE HUMAN TIME ONLY WHERE IT MATTERS." },
  { id: "calibration-focus", start: 96.2, end: 102.15, stage: "calibration", visual: "calibration-focus", caption: "It focuses on the specific pattern holding you back and produces a clear correction plan—not a generic coaching script.", value: "FIX THE PATTERN—NOT EVERYTHING." },
  { id: "calibration-evidence", start: 102.15, end: 104.76, stage: "calibration", visual: "calibration-evidence", caption: "Evidence first.", value: "FIX THE PATTERN—NOT EVERYTHING." },
  { id: "calibration-human", start: 104.76, end: 107.44, stage: "calibration", visual: "calibration-human", caption: "Human time where it matters.", value: "FIX THE PATTERN—NOT EVERYTHING." },
  { id: "runway-learn", start: 107.44, end: 109.45, stage: "overview", visual: "runway-learn", caption: "Learn the terrain.", value: "KNOW WHAT TO PREPARE. KNOW WHAT BREAKS. KNOW WHAT TO FIX." },
  { id: "runway-practice", start: 109.45, end: 110.7, stage: "overview", visual: "runway-practice", caption: "Unlock live AI.", value: "KNOW WHAT TO PREPARE. KNOW WHAT BREAKS. KNOW WHAT TO FIX." },
  { id: "runway-calibrate", start: 110.7, end: 111.95, stage: "overview", visual: "runway-calibrate", caption: "Calibrate with a person.", value: "KNOW WHAT TO PREPARE. KNOW WHAT BREAKS. KNOW WHAT TO FIX." },
  { id: "runway-start", start: 111.95, end: 113.1, stage: "overview", visual: "runway-start", caption: "Start Foundation.", value: "ONE PATH. THE RIGHT HELP AT THE RIGHT TIME." },
  { id: "runway-plan", start: 113.1, end: 114.15, stage: "overview", visual: "runway-plan", caption: "Build the flight plan.", value: "ONE PATH. THE RIGHT HELP AT THE RIGHT TIME." },
  { id: "runway-seat", start: 114.15, end: 115.45, stage: "overview", visual: "runway-seat", caption: "Bring the Second Seat alive.", value: "ONE PATH. THE RIGHT HELP AT THE RIGHT TIME." },
] as const;

const FILM_STAGE_CHAPTERS = [
  { stage: "foundation" as const, scene: FILM_SCENES[1], label: "Foundation" },
  { stage: "second-seat" as const, scene: FILM_SCENES[2], label: "Second Seat" },
  { stage: "calibration" as const, scene: FILM_SCENES[4], label: "Calibration" },
] as const;

const FOUNDATION_SYSTEMS = ["DSA", "Systems", "Stories", "Role", "Career", "Remote"] as const;
const EVIDENCE_PACKET = ["Transcripts", "Recurring gap", "Target role", "Mentor review", "Correction plan"] as const;

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getStoryProgress(currentTime: number) {
  const segment = (start: number, end: number, from: number, to: number) => {
    const ratio = Math.min(1, Math.max(0, (currentTime - start) / Math.max(0.01, end - start)));
    return from + (to - from) * ratio;
  };
  if (currentTime < 12.04) return segment(0, 12.04, 0, 16.5);
  if (currentTime < 33.84) return segment(12.04, 33.84, 16.5, 50);
  if (currentTime < 82.16) return segment(33.84, 82.16, 50, 83.5);
  if (currentTime < 107.44) return segment(82.16, 107.44, 83.5, 100);
  return 100;
}

function FoundationRoute({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`opening-flight-path__foundation-route${compact ? " is-compact" : ""}`} aria-hidden="true">
      <span className="opening-flight-path__route-origin">01</span>
      <ol>
        {FOUNDATION_SYSTEMS.map((system, index) => (
          <li key={system} style={{ "--route-index": index } as React.CSSProperties}>
            <i />
            <span>{system}</span>
          </li>
        ))}
      </ol>
      <span className="opening-flight-path__route-baseline">BASELINE READY</span>
    </div>
  );
}

function SecondSeatLoop({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`opening-flight-path__second-seat-loop${compact ? " is-compact" : ""}`} aria-hidden="true">
      <div className="opening-flight-path__loop-answer"><span>YOUR</span><strong>ANSWER</strong></div>
      <i className="opening-flight-path__loop-line opening-flight-path__loop-line--one" />
      <div className="opening-flight-path__loop-engine">
        <i className="opening-flight-path__loop-rotor" />
        <i className="opening-flight-path__loop-ring opening-flight-path__loop-ring--one" />
        <i className="opening-flight-path__loop-ring opening-flight-path__loop-ring--two" />
        <b>AI</b>
      </div>
      <i className="opening-flight-path__loop-line opening-flight-path__loop-line--two" />
      <div className="opening-flight-path__loop-perspectives">
        <span>INTERVIEWER</span><span>TECHNICAL</span><span>COMMUNICATION</span>
      </div>
      <i className="opening-flight-path__loop-line opening-flight-path__loop-line--three" />
      <div className="opening-flight-path__loop-gap"><span>VISIBLE GAP</span><strong>07</strong></div>
      <i className="opening-flight-path__loop-line opening-flight-path__loop-line--four" />
      <div className="opening-flight-path__loop-next"><span>NEXT</span><strong>PRACTICE</strong></div>
    </div>
  );
}

function WhatsAppGuidance({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`opening-flight-path__whatsapp-flow${compact ? " is-compact" : ""}`} aria-hidden="true">
      <div className="opening-flight-path__wa-gap"><span>RECURRING</span><strong>GAP</strong></div>
      <i />
      <div className="opening-flight-path__wa-channel"><b className="opening-flight-path__wa-mark" /><span>FOCUSED QUESTION</span></div>
      <i />
      <div className="opening-flight-path__wa-expert"><span>EXPERT</span><strong>GUIDANCE</strong></div>
      <i />
      <div className="opening-flight-path__wa-material"><span>TAILORED</span><strong>MATERIAL</strong></div>
    </div>
  );
}

function CalibrationPacket({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`opening-flight-path__calibration-packet${compact ? " is-compact" : ""}`} aria-hidden="true">
      <div className="opening-flight-path__packet-stack">
        {EVIDENCE_PACKET.slice(0, 3).map((item, index) => (
          <span key={item} style={{ "--packet-index": index } as React.CSSProperties}>{item}</span>
        ))}
      </div>
      <i className="opening-flight-path__packet-lock" />
      <div className="opening-flight-path__packet-review"><span>1:1</span><strong>MENTOR REVIEW</strong></div>
      <i className="opening-flight-path__packet-arrow" />
      <div className="opening-flight-path__packet-output"><span>CLEAR</span><strong>CORRECTION PLAN</strong></div>
    </div>
  );
}

const PANEL_TELEMETRY: Record<OpeningPanel, readonly string[]> = {
  foundation: ["LEARN THE MAP", "CHECK YOUR RECALL", "HEAR THE INTERVIEW"],
  "second-seat": ["ANSWER", "READ THE SIGNAL", "ADAPT THE NEXT ROUND"],
  calibration: ["REVIEW THE EVIDENCE", "ISOLATE THE GAP", "LEAVE WITH A PLAN"],
};

function PanelHoverTelemetry({ panel }: { panel: OpeningPanel }) {
  return (
    <div className={`opening-flight-path__hover-telemetry opening-flight-path__hover-telemetry--${panel}`} aria-hidden="true">
      <div className="opening-flight-path__telemetry-orbit">
        <i /><i /><i />
        <b>{panel === "foundation" ? "30+" : panel === "second-seat" ? "AI" : "1:1"}</b>
      </div>
      <ol>
        {PANEL_TELEMETRY[panel].map((label, index) => (
          <li key={label} style={{ "--telemetry-index": index } as React.CSSProperties}>
            <i />
            <span>{label}</span>
          </li>
        ))}
      </ol>
      <div className="opening-flight-path__telemetry-sweep"><i /><i /><i /><i /></div>
    </div>
  );
}

function FilmVisual({ beat, storyProgress }: { beat: FilmBeat; storyProgress: number }) {
  const isFinale = beat.visual.startsWith("runway-");
  const isScaffold = beat.visual === "signal-connected";
  const activeOrder = beat.stage === "foundation" ? 1 : beat.stage === "second-seat" ? 2 : beat.stage === "calibration" ? 3 : 0;
  const stageClass = (stage: Exclude<FilmStage, "overview">, order: number) => {
    if (isFinale) return "is-final";
    if (beat.stage === "overview") return "is-unrevealed";
    if (beat.stage === stage) return "is-active is-revealed";
    if (activeOrder > order) return "is-complete is-revealed";
    return "is-unrevealed";
  };
  const phase = isFinale ? "finale" : isScaffold ? "scaffold" : beat.stage === "overview" ? "intro" : beat.stage;

  return (
    <div className="flight-film__visual" data-stage={beat.stage} data-phase={phase} data-beat={beat.visual} aria-hidden="true">
      <div className="flight-film__horizon"><i /><i /><i /></div>

      <div className="flight-film__opening-sequence">
        <div className="flight-film__opening-source"><span>WHAT YOU KNOW</span><strong>EXPERIENCE</strong></div>
        <div className="flight-film__opening-signal"><i /><i /><i /><i /><b>PRESSURE</b></div>
        <div className="flight-film__opening-target"><span>WHAT THEY CAN SEE</span><strong>INTERVIEW SIGNAL</strong></div>
        <ol aria-hidden="true"><li>01</li><li>02</li><li>03</li></ol>
      </div>

      <div className="flight-film__value-annunciator" key={`value-${beat.value}`}>
        <span>{phase === "intro" ? "THE PROBLEM" : phase === "scaffold" ? "THE FLIGHT PATH" : phase === "finale" ? "THE COMPLETE SYSTEM" : beat.stage.replace("-", " ")}</span>
        <strong>{beat.value}</strong>
      </div>

      <div
        className="flight-film__stage-map"
        style={{ "--film-story-progress": `${storyProgress}%` } as React.CSSProperties}
      >
        <div className="flight-film__signal-track"><i /><b /></div>

        <article className={`flight-film__stage-block flight-film__stage-block--foundation ${stageClass("foundation", 1)}`}>
          <header><span>01</span><div><small>FOUNDATION</small><strong>₹799 ONCE</strong></div></header>
          <div className="flight-film__foundation-system">
            <section className="flight-film__foundation-scatter">
              <span><small>RANDOM PROBLEM LIST</small><b>38 saved links</b></span>
              <span><small>DESIGN VIDEOS</small><b>No sequence</b></span>
              <span><small>STORY NOTES</small><b>7 loose drafts</b></span>
              <i aria-hidden="true">→</i>
              <strong>ONE DATED PLAN</strong>
            </section>
            <ol>
              {FOUNDATION_SYSTEMS.map((system) => <li key={system}><i /><span>{system === "Stories" ? "Behavioural" : system}</span></li>)}
            </ol>
            <div><span>DIAGNOSTIC</span><b>TESTABLE BASELINE</b><i /></div>
          </div>
          <div className="flight-film__stage-summary"><span>FOUNDATION RESULT</span><strong>BASELINE READY</strong></div>
          <footer>FLIGHT PLAN · CLEARANCE</footer>
        </article>

        <article className={`flight-film__stage-block flight-film__stage-block--second-seat ${stageClass("second-seat", 2)}`}>
          <header><span>02</span><div><small>THE SECOND SEAT</small><strong>₹2,499 AFTER CLEARANCE</strong></div></header>
          <div className="flight-film__second-seat-system">
            <div className="flight-film__pilot-marker"><i /><span>YOU</span><small>IN COMMAND</small></div>
            <div className="flight-film__answer-signal"><span>ANSWER 01</span><strong>Token bucket in Redis.</strong><i /></div>
            <div className="flight-film__ai-core"><i /><i /><b>AI</b><small>LIVE</small></div>
            <div className="flight-film__perspective-lenses">
              <span><small>INTERVIEWER</small><b>Decision not justified</b></span>
              <span><small>SYSTEM DESIGN</small><b>Regional failure missing</b></span>
              <span><small>COMMUNICATION</small><b>Trade-off stays implicit</b></span>
            </div>
            <div className="flight-film__adaptive-question"><span>NEXT QUESTION</span><b>How does this design fail during a regional outage?</b></div>
            <div className="flight-film__evidence-loop"><span>TRANSCRIPT</span><i /><span>VISIBLE GAP</span><i /><span>NEXT PRACTICE</span></div>

            <div className="flight-film__whatsapp-exchange">
              <div className="flight-film__whatsapp-head"><span className="flight-film__whatsapp-mark" /><div><b>EXPERT CHANNEL</b><small>FAANG / LEADING-TECH EXPERIENCE</small></div></div>
              <p className="flight-film__whatsapp-question">I know the pattern, but I miss the trade-off under pressure.</p>
              <p className="flight-film__whatsapp-reply"><span>EXPERT DIRECTION</span> Frame constraint → failure mode → decision.</p>
              <p className="flight-film__whatsapp-material"><span>TAILORED MATERIAL</span> 2 targeted exercises · 18 min</p>
              <small>PREPARATION GUIDANCE · NOT LIVE INTERVIEW HELP</small>
            </div>
          </div>
          <div className="flight-film__stage-summary"><span>PRACTICE RESULT</span><strong>EVIDENCE CAPTURED</strong></div>
          <footer>LIVE AI LOOP · ASYNC EXPERT GUIDANCE</footer>
        </article>

        <article className={`flight-film__stage-block flight-film__stage-block--calibration ${stageClass("calibration", 3)}`}>
          <header><span>03</span><div><small>HUMAN CALIBRATION</small><strong>₹9,999</strong></div></header>
          <div className="flight-film__calibration-system">
            <div className="flight-film__evidence-stack"><span>MOCK 05 · TRADE-OFF</span><span>MOCK 06 · TRADE-OFF</span><span>MOCK 07 · TRADE-OFF</span></div>
            <i />
            <div className="flight-film__human-reticle"><span>1:1</span><b>REPEATED GAP</b></div>
            <i />
            <div className="flight-film__correction-plan"><span>CORRECTION PLAN</span><b>Constraint → failure → decision</b></div>
          </div>
          <div className="flight-film__stage-summary"><span>HUMAN RESULT</span><strong>CORRECTION PLAN READY</strong></div>
          <footer>EVIDENCE FIRST · TARGETED REVIEW</footer>
        </article>
      </div>
    </div>
  );
}

export function OpeningFlightPath() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(NOMINAL_DURATION);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [activePanel, setActivePanel] = useState<OpeningPanel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeSceneIndex = useMemo(() => {
    const index = FILM_SCENES.findIndex((scene) => currentTime >= scene.start && currentTime < scene.end);
    if (index >= 0) return index;
    return currentTime >= FILM_SCENES[FILM_SCENES.length - 1].end ? FILM_SCENES.length - 1 : 0;
  }, [currentTime]);
  const activeScene = FILM_SCENES[activeSceneIndex];
  const activeBeatIndex = useMemo(() => {
    const index = FILM_BEATS.findIndex((beat) => currentTime >= beat.start && currentTime < beat.end);
    return index >= 0 ? index : FILM_BEATS.length - 1;
  }, [currentTime]);
  const activeBeat = FILM_BEATS[activeBeatIndex];
  const isFinale = activeBeat.visual.startsWith("runway-");
  const progress = Math.min(100, Math.max(0, (currentTime / Math.max(1, duration)) * 100));
  const storyProgress = getStoryProgress(currentTime);
  const revealedChapterCount = activeBeat.visual.startsWith("runway-")
    ? 3
    : activeBeat.stage === "calibration"
      ? 3
      : activeBeat.stage === "second-seat"
        ? 2
        : activeBeat.stage === "foundation"
          ? 1
          : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setIsReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const closeFilm = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.secondSeatFilm = "open";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFilm();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.secondSeatFilm;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeFilm, isOpen]);

  const openFilm = () => {
    const audio = audioRef.current;
    setCurrentTime(0);
    setIsOpen(true);
    if (!audio || isReducedMotion) return;
    audio.currentTime = 0;
    const playback = audio.play();
    if (playback) playback.catch(() => setIsPlaying(false));
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ended || audio.currentTime >= duration - 0.15) audio.currentTime = 0;
    if (audio.paused) {
      const playback = audio.play();
      if (playback) playback.catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  const replayFilm = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    const playback = audio.play();
    if (playback) playback.catch(() => setIsPlaying(false));
  };

  const seekFilm = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    if (!Number.isFinite(nextTime)) return;
    if (audioRef.current) audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const seekToScene = (scene: FilmScene) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = scene.start;
    setCurrentTime(scene.start);
    if (audio.paused) {
      const playback = audio.play();
      if (playback) playback.catch(() => setIsPlaying(false));
    }
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " && event.target === dialogRef.current) {
      event.preventDefault();
      togglePlayback();
    }
  };

  return (
    <>
      <section
        className={`opening-flight-path${isReducedMotion ? " is-reduced-motion" : " is-motion-enabled"}`}
        aria-labelledby="opening-flight-path-title"
        data-aero-phase="flight-path"
      >
        <div className="container opening-flight-path__inner">
          <header className="opening-flight-path__header">
            <p className="opening-flight-path__eyebrow">ONE SYSTEM · THREE CONNECTED STAGES</p>
            <h2 id="opening-flight-path-title">Build the signal. Pressure-test it. Calibrate what remains.</h2>
          </header>

          <ol
            className="opening-flight-path__instrument"
            aria-label="The three InterviewRunway stages"
            data-active-panel={activePanel ?? "none"}
            onMouseLeave={() => setActivePanel(null)}
            onPointerLeave={() => setActivePanel(null)}
          >
            <li
              className="opening-flight-path__panel opening-flight-path__panel--foundation"
              tabIndex={0}
              data-panel="foundation"
              onPointerEnter={() => setActivePanel("foundation")}
              onPointerMove={() => setActivePanel("foundation")}
              onFocus={() => setActivePanel("foundation")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setActivePanel(null);
              }}
            >
              <article aria-labelledby="opening-foundation-title">
                <PanelHoverTelemetry panel="foundation" />
                <header><p><span>01</span> FOUNDATION</p><strong>₹799 once</strong></header>
                <h3 id="opening-foundation-title">Stop guessing what to prepare.</h3>
                <p>A clear 4- or 12-week path for what to learn, practise, and prove.</p>
                <FoundationRoute />
                <footer><span>FLIGHT PLAN</span><b>BASELINE CREATED</b></footer>
              </article>
            </li>

            <li
              className="opening-flight-path__panel opening-flight-path__panel--second-seat"
              tabIndex={0}
              data-panel="second-seat"
              onPointerEnter={() => setActivePanel("second-seat")}
              onPointerMove={() => setActivePanel("second-seat")}
              onFocus={() => setActivePanel("second-seat")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setActivePanel(null);
              }}
            >
              <article aria-labelledby="opening-second-seat-title">
                <PanelHoverTelemetry panel="second-seat" />
                <header><p><span>02</span> THE SECOND SEAT</p><strong>₹2,499</strong></header>
                <h3 id="opening-second-seat-title">AI practice that changes with your answers.</h3>
                <p>Expert guidance stays connected to your plan.</p>
                <SecondSeatLoop />
                <div className="opening-flight-path__expert-band">
                  <WhatsAppGuidance />
                  <p>WhatsApp guidance from engineers with FAANG and leading-tech experience—focused questions and study material selected for the gap your practice exposes.</p>
                </div>
                <footer><span>AFTER FOUNDATION CLEARANCE</span><b>AI LOOP + ASYNC EXPERT GUIDANCE</b></footer>
              </article>
            </li>

            <li
              className="opening-flight-path__panel opening-flight-path__panel--calibration"
              tabIndex={0}
              data-panel="calibration"
              onPointerEnter={() => setActivePanel("calibration")}
              onPointerMove={() => setActivePanel("calibration")}
              onFocus={() => setActivePanel("calibration")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setActivePanel(null);
              }}
            >
              <article aria-labelledby="opening-calibration-title">
                <PanelHoverTelemetry panel="calibration" />
                <header><p><span>03</span> HUMAN CALIBRATION</p><strong>₹9,999</strong></header>
                <h3 id="opening-calibration-title">Use human time on the gap practice could not fix.</h3>
                <p>A focused 1:1 review begins with your evidence—not a generic coaching agenda.</p>
                <CalibrationPacket />
                <footer><span>SCOPE CONFIRMED BEFORE BOOKING</span><b>CORRECTION PLAN</b></footer>
              </article>
            </li>
          </ol>

          <div className="opening-flight-path__footer">
            <p><span>01</span><i /><span>02</span><i /><span>03</span></p>
            <button
              ref={triggerRef}
              className="opening-flight-path__film-trigger"
              type="button"
              onClick={openFilm}
              aria-haspopup="dialog"
              data-analytics-event="second_seat_preview_started"
              data-analytics-label="Watch the three-stage film"
            >
              <span>Watch how the three stages work</span><small>1:55</small><b aria-hidden="true">↗</b>
            </button>
          </div>
        </div>
      </section>

      <audio
        ref={audioRef}
        src={AUDIO_URL}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : NOMINAL_DURATION)}
        onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : NOMINAL_DURATION)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(duration);
          trackEvent("second_seat_preview_completed", { duration_seconds: Math.round(duration) });
        }}
      />

      {isOpen ? (
        <div
          className={`flight-film${isPlaying ? " is-playing" : " is-paused"}${isReducedMotion ? " is-reduced-motion" : ""}${isFinale ? " is-finale" : ""}`}
          data-active-scene={activeScene.id}
          onPointerMove={(event) => event.stopPropagation()}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeFilm();
          }}
        >
          <div
            ref={dialogRef}
            className="flight-film__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flight-film-title"
            aria-describedby="flight-film-caption flight-film-transcript"
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
          >
            <header className="flight-film__header">
              <div><span>INTERVIEWRUNWAY / FLIGHT BRIEFING</span><h2 id="flight-film-title">Three stages. One connected signal.</h2></div>
              <button ref={closeRef} type="button" onClick={closeFilm} aria-label="Close the film"><span>CLOSE</span><b aria-hidden="true">×</b></button>
            </header>

            <FilmVisual beat={activeBeat} storyProgress={storyProgress} />

            {isFinale ? (
              <div className="flight-film__finale-actions">
                <Link href="/checkout/vault">Start Foundation · ₹799 once <span aria-hidden="true">→</span></Link>
                <Link href="/diagnostic">Check your signal first <span aria-hidden="true">↗</span></Link>
              </div>
            ) : null}

            <div className="flight-film__live-caption" key={`caption-${activeBeat.id}`} aria-hidden="true">
              <span>LIVE TRANSCRIPT</span><p>{activeBeat.caption}</p>
            </div>
            <p id="flight-film-caption" className="sr-only" role="status" aria-live="polite" aria-atomic="true">{activeBeat.caption}</p>
            <p id="flight-film-transcript" className="sr-only">{activeScene.narration}</p>

            <nav className="flight-film__chapters" aria-label="Film chapters">
              {FILM_STAGE_CHAPTERS.map(({ stage, scene, label }, index) => (
                <button
                  key={stage}
                  type="button"
                  className={`${activeBeat.stage === stage ? "is-active " : ""}${index < revealedChapterCount ? "is-revealed" : "is-unrevealed"}`}
                  onClick={() => seekToScene(scene)}
                  aria-current={activeBeat.stage === stage ? "step" : undefined}
                  aria-label={`Jump to ${label}, ${formatTime(scene.start)}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><i />
                </button>
              ))}
            </nav>

            <footer className="flight-film__controls">
              <div className="flight-film__transport">
                <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause film" : "Play film"}>
                  <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span><b>{isPlaying ? "Pause" : "Play"}</b>
                </button>
                <button type="button" onClick={replayFilm} aria-label="Replay film from the beginning"><span aria-hidden="true">↺</span><b>Replay</b></button>
              </div>
              <label className="flight-film__progress">
                <span className="sr-only">Film progress</span>
                <input type="range" min="0" max={Math.max(1, duration)} step="0.1" value={Math.min(currentTime, duration)} onChange={seekFilm} />
                <i style={{ "--film-progress": `${progress}%` } as React.CSSProperties} aria-hidden="true" />
              </label>
              <output className="flight-film__time" aria-label={`${formatTime(currentTime)} of ${formatTime(duration)}`}>
                <span>{formatTime(currentTime)}</span><i>/</i><span>{formatTime(duration)}</span>
              </output>
              <div className="flight-film__actions">
                <Link href="/diagnostic">Check your signal <span aria-hidden="true">↗</span></Link>
                <Link href="/checkout/vault">Start Foundation · ₹799 <span aria-hidden="true">→</span></Link>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
