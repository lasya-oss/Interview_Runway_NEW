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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const closeViewer = useCallback(() => {
    if (document.fullscreenElement === viewerRef.current) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    setActiveGuide(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!activeGuide) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };
    syncFullscreenState();
    window.requestAnimationFrame(() => closeRef.current?.focus());
    document.addEventListener("fullscreenchange", syncFullscreenState);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (document.fullscreenElement === viewerRef.current) {
          void document.exitFullscreen?.().catch(() => undefined);
        } else {
          closeViewer();
        }
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
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [activeGuide, closeViewer]);

  const toggleFullscreen = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (document.fullscreenElement === viewer) {
      void document.exitFullscreen?.().catch(() => undefined);
      return;
    }

    if (typeof viewer.requestFullscreen === "function") {
      void viewer.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const openViewer = (guide: DrivePdfGuide, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger;
    setActiveGuide(guide);
  };

  return (
    <>
      <div className="library-record-list library-pdf-record-list">
        {guides.map((guide, index) => {
          const title = drivePdfTitle(guide.filename);
          const category = drivePdfCategory(guide.filename);

          return (
            <article className="library-record library-pdf-record" key={guide.id}>
              <span className="library-record-number">{String(startNumber + index).padStart(2, "0")}</span>
              <div className="library-record-copy">
                <small>{category} · PDF guide</small>
                <h2>{title}</h2>
                <p>Original {category.toLowerCase()} material connected to the InterviewRunway learning path.</p>
                <div><span>Original PDF</span><span>Read in workspace</span></div>
              </div>
              <div className="library-record-meta">
                <span>PDF · Original guide</span>
                <small>In-app reader</small>
                <b>Included in Library</b>
                <button
                  className="library-record-open"
                  type="button"
                  onClick={(event) => openViewer(guide, event.currentTarget)}
                  aria-haspopup="dialog"
                  aria-label={`Open ${title} context inside InterviewRunway`}
                >
                  Open Context <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {activeGuide ? (
        <div
          className={`library-pdf-dialog${isFullscreen ? " is-fullscreen" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <div
            ref={dialogRef}
            className="library-pdf-dialog__surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-pdf-viewer-title"
            aria-describedby="library-pdf-viewer-description"
          >
            <header className="library-pdf-dialog__header">
              <div>
                <span>{drivePdfCategory(activeGuide.filename)} · PDF GUIDE</span>
                <h2 id="library-pdf-viewer-title">{drivePdfTitle(activeGuide.filename)}</h2>
                <p id="library-pdf-viewer-description">Read the original guide here without leaving the InterviewRunway workspace.</p>
              </div>
              <div className="library-pdf-dialog__actions">
                <button
                  className="library-pdf-dialog__fullscreen"
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
                  title={isFullscreen ? "Exit full screen" : "Enter full screen"}
                >
                  <span aria-hidden="true">⛶</span>
                </button>
                <button className="library-pdf-dialog__close" ref={closeRef} type="button" onClick={closeViewer} aria-label="Close PDF viewer">
                  <span>CLOSE</span><b aria-hidden="true">×</b>
                </button>
              </div>
            </header>
            <div ref={viewerRef} className="library-pdf-dialog__viewer">
              <iframe
                key={activeGuide.id}
                src={drivePdfPreviewHref(activeGuide.id) ?? "about:blank"}
                title={`PDF viewer for ${drivePdfTitle(activeGuide.filename)}`}
                loading="eager"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
