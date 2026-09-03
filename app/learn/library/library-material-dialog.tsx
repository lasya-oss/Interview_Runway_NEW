"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MaterialViewer } from "./material-viewer";
import type { LibraryMaterialViewerSource } from "./library-material-source";

export function LibraryMaterialDialog({
  source,
  title,
  eyebrow,
  description = "Open the material here without leaving InterviewRunway.",
  buttonLabel,
  buttonClassName = "library-record-action-button",
  buttonAriaLabel = `Open ${title} inside InterviewRunway`,
  googleClientId = "",
  loginHint = null,
  emptyState,
}: {
  source: LibraryMaterialViewerSource | null;
  title: string;
  eyebrow: string;
  description?: string;
  buttonLabel: ReactNode;
  buttonClassName?: string;
  buttonAriaLabel?: string;
  googleClientId?: string;
  loginHint?: string | null;
  emptyState?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const closeViewer = useCallback(() => {
    if (document.fullscreenElement === viewerRef.current) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    setIsFullscreen(false);
    setOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

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
          'button:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])',
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
  }, [closeViewer, open]);

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

  return (
    <>
      <button
        className={buttonClassName}
        type="button"
        onClick={(event) => {
          returnFocusRef.current = event.currentTarget;
          setIsFullscreen(false);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={buttonAriaLabel}
      >
        {buttonLabel} <span aria-hidden="true">↗</span>
      </button>

      {open ? (
        <div
          className={`library-material-dialog${isFullscreen ? " is-fullscreen" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <div
            ref={dialogRef}
            className="library-material-dialog__surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <header className="library-material-dialog__header">
              <div>
                <span>{eyebrow}</span>
                <h2 id={titleId}>{title}</h2>
                <p id={descriptionId}>{description}</p>
              </div>
              <div className="library-pdf-dialog__actions">
                <button
                  className="library-pdf-dialog__fullscreen"
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit full screen" : "Open material in full screen"}
                  title={isFullscreen ? "Exit full screen" : "Open material in full screen"}
                >
                  <span aria-hidden="true">⛶</span>
                </button>
                <button className="library-pdf-dialog__close" ref={closeRef} type="button" onClick={closeViewer} aria-label="Close material viewer">
                  <span>CLOSE</span><b aria-hidden="true">×</b>
                </button>
              </div>
            </header>
            <div ref={viewerRef} className="library-material-dialog__body">
              {source ? <MaterialViewer {...source} googleClientId={googleClientId} loginHint={loginHint} /> : emptyState ?? (
                <div className="library-material-state library-material-content-unavailable" role="status">
                  <strong>Content unavailable</strong>
                  <p>The source material for this preview is not connected yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
