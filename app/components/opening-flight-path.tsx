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

const FOUNDATION_SYSTEMS = ["DSA", "Systems", "Stories", "Role", "Career", "Remote"] as const;
const EVIDENCE_PACKET = ["Transcripts", "Recurring gap", "Target role", "Mentor review", "Correction plan"] as const;

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
      <div className="opening-flight-path__wa-channel"><b>WA</b><span>FOCUSED QUESTION</span></div>
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

function FilmVisual({ scene }: { scene: FilmScene }) {
  return (
    <div className="flight-film__visual" data-scene={scene.id} aria-hidden="true">
      <div className="flight-film__horizon"><i /><i /><i /></div>

      <section className="flight-film__scene flight-film__scene--signal">
        <p>EXPERIENCE</p>
        <div className="flight-film__signal-beam"><i /><i /><i /><i /></div>
        <strong>INTERVIEW SIGNAL</strong>
        <span>PRESSURE / NOISE / LOST EVIDENCE</span>
      </section>

      <section className="flight-film__scene flight-film__scene--foundation">
        <div><span>STAGE 01</span><strong>FOUNDATION</strong><small>₹799 once</small></div>
        <FoundationRoute compact />
      </section>

      <section className="flight-film__scene flight-film__scene--second-seat">
        <div><span>STAGE 02</span><strong>THE SECOND SEAT</strong><small>LIVE PRACTICE LOOP</small></div>
        <SecondSeatLoop compact />
      </section>

      <section className="flight-film__scene flight-film__scene--whatsapp">
        <div><span>SECOND SEAT / EXPERT CHANNEL</span><strong>THE LOOP DOESN’T END AT FEEDBACK.</strong></div>
        <WhatsAppGuidance compact />
        <p>ASYNCHRONOUS · FOCUSED · CONNECTED TO YOUR EVIDENCE</p>
      </section>

      <section className="flight-film__scene flight-film__scene--calibration">
        <div><span>STAGE 03</span><strong>HUMAN CALIBRATION</strong><small>₹9,999 · SCOPE CONFIRMED</small></div>
        <CalibrationPacket compact />
      </section>

      <section className="flight-film__scene flight-film__scene--runway">
        <div className="flight-film__runway-line"><i /><i /><i /></div>
        <ol><li><span>01</span><strong>BUILD</strong></li><li><span>02</span><strong>PRESSURE-TEST</strong></li><li><span>03</span><strong>CALIBRATE</strong></li></ol>
        <p>TURN EXPERIENCE INTO INTERVIEW SIGNAL.</p>
      </section>
    </div>
  );
}

export function OpeningFlightPath() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(NOMINAL_DURATION);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
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
  const progress = Math.min(100, Math.max(0, (currentTime / Math.max(1, duration)) * 100));

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

          <ol className="opening-flight-path__instrument" aria-label="The three InterviewRunway stages">
            <li className="opening-flight-path__panel opening-flight-path__panel--foundation">
              <article aria-labelledby="opening-foundation-title">
                <header><p><span>01</span> FOUNDATION</p><strong>₹799 once</strong></header>
                <h3 id="opening-foundation-title">Stop guessing what to prepare.</h3>
                <p>A clear 4- or 12-week path for what to learn, practise, and prove.</p>
                <FoundationRoute />
                <footer><span>FLIGHT PLAN</span><b>BASELINE CREATED</b></footer>
              </article>
            </li>

            <li className="opening-flight-path__panel opening-flight-path__panel--second-seat">
              <article aria-labelledby="opening-second-seat-title">
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

            <li className="opening-flight-path__panel opening-flight-path__panel--calibration">
              <article aria-labelledby="opening-calibration-title">
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
          className={`flight-film${isPlaying ? " is-playing" : " is-paused"}${isReducedMotion ? " is-reduced-motion" : ""}`}
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

            <FilmVisual scene={activeScene} />

            <div className="flight-film__caption-deck">
              <p><span>{String(activeSceneIndex + 1).padStart(2, "0")}</span><strong>{activeScene.label}</strong></p>
              <blockquote id="flight-film-caption" aria-live="polite">{activeScene.caption}</blockquote>
              <p id="flight-film-transcript" className="flight-film__spoken-copy">{activeScene.narration}</p>
            </div>

            <nav className="flight-film__chapters" aria-label="Film chapters">
              {FILM_SCENES.map((scene, index) => (
                <button
                  key={scene.id}
                  type="button"
                  className={index === activeSceneIndex ? "is-active" : ""}
                  onClick={() => seekToScene(scene)}
                  aria-current={index === activeSceneIndex ? "step" : undefined}
                  aria-label={`Jump to ${scene.label}, ${formatTime(scene.start)}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span><i />
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
