"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  drivePdfCategory,
  drivePdfPreviewHref,
  drivePdfTitle,
  type DrivePdfGuide,
} from "@/app/lib/drive-pdf-guides";

export function PdfGuideShelf({
  guides,
  startNumber,
}: {
  guides: readonly DrivePdfGuide[];
  startNumber: number;
}) {
  const [activeGuide, setActiveGuide] = useState<DrivePdfGuide | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const closeViewer = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    setActiveGuide(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!activeGuide) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
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
  }, [activeGuide, closeViewer]);

  const openViewer = (guide: DrivePdfGuide, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger;
    setActiveGuide(guide);

    // Enter the browser's native fullscreen mode from the row's click gesture.
    // The viewport-sized dialog remains the fallback for browsers that reject it.
    if (!document.fullscreenElement && typeof document.documentElement.requestFullscreen === "function") {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <>
      <div className="library-record-list library-pdf-record-list">
        {guides.map((guide, index) => {
          const title = drivePdfTitle(guide.filename);
          const category = drivePdfCategory(guide.filename);

          return (
            <button
              className="library-record library-pdf-record"
              key={guide.id}
              type="button"
              onClick={(event) => openViewer(guide, event.currentTarget)}
              aria-haspopup="dialog"
              aria-label={`Read ${title} inside InterviewRunway`}
            >
              <span className="library-record-number">{String(startNumber + index).padStart(2, "0")}</span>
              <div className="library-record-copy">
                <small>{category} · PDF guide</small>
                <h2>{title}</h2>
                <p>Original {category.toLowerCase()} material connected to the InterviewRunway learning path.</p>
                <div><span>Original PDF</span><span>Read in workspace</span></div>
              </div>
              <div className="library-record-meta">
                <span>PDF · Original guide</span>
                <small>{guide.filename}<br />In-app reader</small>
                <b>Included in Library</b>
                <b className="library-record-open">Read inside InterviewRunway <span aria-hidden="true">→</span></b>
              </div>
            </button>
          );
        })}
      </div>

      {activeGuide ? (
        <div
          className="library-pdf-dialog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <div
            ref={dialogRef}
            className="library-pdf-dialog__surface"
            role="dialog"
            aria-modal="true"
            aria-label={`PDF viewer for ${drivePdfTitle(activeGuide.filename)}`}
          >
            <div className="library-pdf-dialog__viewer">
              <iframe
                key={activeGuide.id}
                src={drivePdfPreviewHref(activeGuide.id) ?? "about:blank"}
                title={`PDF viewer for ${drivePdfTitle(activeGuide.filename)}`}
                loading="eager"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
            <button className="library-pdf-dialog__close" ref={closeRef} type="button" onClick={closeViewer} aria-label="Close PDF viewer">
              <span>CLOSE</span><b aria-hidden="true">×</b>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
