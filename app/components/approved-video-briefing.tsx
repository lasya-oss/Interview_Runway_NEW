"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_PARTS = [
  {
    id: "problem",
    eyebrow: "PART 01 · THE PROBLEM",
    title: "Why capable candidates still get overlooked",
    body: "See why knowledge alone can disappear under interview pressure—and why more random preparation does not fix it.",
    duration: "3:37",
    src: "/video/interviewrunway-part-1-problem-reframed.mp4",
    poster: "/video/interviewrunway-part-1-poster.jpg",
  },
  {
    id: "system",
    eyebrow: "PART 02 · THE SYSTEM",
    title: "How InterviewRunway closes the gap",
    body: "Walk through Foundation, the guided Second Seat, and qualification-based Human Calibration as one connected path.",
    duration: "4:47",
    src: "/video/interviewrunway-part-2-three-phases.mp4",
    poster: "/video/interviewrunway-part-2-poster.jpg",
  },
] as const;

type VideoPart = (typeof VIDEO_PARTS)[number];

export function ApprovedVideoBriefing() {
  const [activeVideo, setActiveVideo] = useState<VideoPart | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const closeVideo = useCallback(() => {
    videoRef.current?.pause();
    setActiveVideo(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!activeVideo) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeVideo();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], video[controls], [tabindex]:not([tabindex="-1"])',
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
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeVideo, closeVideo]);

  const openVideo = (part: VideoPart, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger;
    setActiveVideo(part);
  };

  const switchVideo = (part: VideoPart) => {
    videoRef.current?.pause();
    setActiveVideo(part);
  };

  return (
    <>
      <div className="approved-video-briefing" aria-label="InterviewRunway video briefing">
        {VIDEO_PARTS.map((part) => (
          <button
            className="approved-video-briefing__part"
            key={part.id}
            type="button"
            onClick={(event) => openVideo(part, event.currentTarget)}
            aria-haspopup="dialog"
          >
            <span>{part.eyebrow}</span>
            <strong>{part.title}</strong>
            <small>{part.duration}</small>
            <b aria-hidden="true">▶</b>
          </button>
        ))}
      </div>

      {activeVideo ? (
        <div
          className="approved-video-dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeVideo();
          }}
        >
          <div
            ref={dialogRef}
            className="approved-video-dialog__surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approved-video-title"
            aria-describedby="approved-video-description"
          >
            <header className="approved-video-dialog__header">
              <div>
                <span>INTERVIEWRUNWAY / TWO-PART BRIEFING</span>
                <h2 id="approved-video-title">{activeVideo.title}</h2>
                <p id="approved-video-description">{activeVideo.body}</p>
              </div>
              <button ref={closeRef} type="button" onClick={closeVideo} aria-label="Close video">
                <span>CLOSE</span><b aria-hidden="true">×</b>
              </button>
            </header>

            <div className="approved-video-dialog__player">
              <video
                key={activeVideo.src}
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                autoPlay
                src={activeVideo.src}
                poster={activeVideo.poster}
              >
                Your browser does not support embedded video.
              </video>
            </div>

            <footer className="approved-video-dialog__footer">
              <nav aria-label="Video parts">
                {VIDEO_PARTS.map((part) => (
                  <button
                    className={part.id === activeVideo.id ? "is-active" : ""}
                    key={part.id}
                    type="button"
                    onClick={() => switchVideo(part)}
                    aria-current={part.id === activeVideo.id ? "page" : undefined}
                  >
                    <span>{part.eyebrow}</span><strong>{part.title}</strong><small>{part.duration}</small>
                  </button>
                ))}
              </nav>
              <div>
                {activeVideo.id === "problem" ? (
                  <button type="button" onClick={() => switchVideo(VIDEO_PARTS[1])}>
                    Continue to Part 2 <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <>
                    <Link href="/checkout/vault">Start Foundation · ₹799 <span aria-hidden="true">↗</span></Link>
                    <Link href="/qualify">Check Phase 3 eligibility <span aria-hidden="true">→</span></Link>
                  </>
                )}
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
