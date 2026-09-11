"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialViewer } from "./material-viewer";
import type { LibraryMaterialViewerSource } from "./library-material-source";
import { canWarmMaterial, isPdfAsset, nativePreviewSlots, previewInputForMaterial, previewKey, warmMaterialPreview } from "./material-preview-cache";

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
  initialOpen = false,
  returnTo = null,
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
  initialOpen?: boolean;
  returnTo?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previewInput = useMemo(() => previewInputForMaterial(source), [source]);
  const titleId = useId();
  const descriptionId = useId();
  const nativePdf = !!previewInput && previewInput.source === undefined && isPdfAsset(previewInput.filename, previewInput.mimeType);
  const nativeKey = nativePdf ? previewKey(previewInput!) : null;
  const [retention, setRetention] = useState({ sourceKey: nativeKey, retained: initialOpen && nativeKey !== null });
  // A changed source must not inherit the old reader's lease, including A ->
  // B -> A changes while closed. Adjust only this component's derived state.
  if (retention.sourceKey !== nativeKey) setRetention({ sourceKey: nativeKey, retained: open && nativeKey !== null });
  const retainNative = nativeKey !== null && retention.sourceKey === nativeKey && retention.retained;
  const preparePreview = useCallback((intent = false, active = false) => {
    if (!active && !canWarmMaterial()) return;
    if (nativeKey) {
      if (nativePreviewSlots.acquire(titleId, () => setRetention({ sourceKey: nativeKey, retained: false }), active, intent || active)) {
        setRetention((current) => current.sourceKey === nativeKey && current.retained ? current : { sourceKey: nativeKey, retained: true });
      }
    } else {
      warmMaterialPreview(previewInput);
    }
  }, [nativeKey, previewInput, titleId]);

  useEffect(() => () => nativePreviewSlots.release(titleId), [nativeKey, titleId]);
  useEffect(() => {
    if (open && nativeKey) nativePreviewSlots.acquire(titleId, () => setRetention({ sourceKey: nativeKey, retained: false }), true, true);
    else nativePreviewSlots.close(titleId);
  }, [nativeKey, open, titleId]);

  useEffect(() => {
    const button = buttonRef.current;
    if (open || retainNative || !button || !previewInput || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      preparePreview();
      observer.disconnect();
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, [open, preparePreview, previewInput, retainNative]);

  const closeViewer = useCallback(() => {
    if (document.fullscreenElement === viewerRef.current) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    setIsFullscreen(false);
    setOpen(false);
    if (returnTo) {
      router.replace(returnTo, { scroll: false });
      return;
    }
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, [returnTo, router]);

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
        ref={buttonRef}
        className={buttonClassName}
        type="button"
        onPointerEnter={() => preparePreview(true)}
        onFocus={() => preparePreview(true)}
        onClick={(event) => {
          preparePreview(true, true);
          returnFocusRef.current = event.currentTarget;
          setIsFullscreen(false);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={buttonAriaLabel}
      >
        {buttonLabel} <span aria-hidden="true">↗</span>
      </button>

      {open || retainNative ? (
        <div
          hidden={!open}
          style={open ? undefined : { display: "none" }}
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
              <div className="library-material-dialog__actions">
                <button
                  className="library-material-dialog__fullscreen"
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit full screen" : "Open material in full screen"}
                  title={isFullscreen ? "Exit full screen" : "Open material in full screen"}
                >
                  <span aria-hidden="true">⛶</span>
                </button>
                <button className="library-material-dialog__close" ref={closeRef} type="button" onClick={closeViewer} aria-label="Close material viewer">
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
