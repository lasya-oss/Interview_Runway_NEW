"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  driveMaterialCategory,
  driveMaterialCompanionAssetHref,
  driveMaterialKindLabel,
  driveMaterialPrimaryAssetHref,
  driveMaterialTitle,
  formatMaterialSize,
  type DriveMaterial,
} from "@/app/lib/drive-materials";
import { DRIVE_MATERIAL_CONTENT } from "@/app/lib/drive-material-content";
import { MaterialViewer } from "./material-viewer";

export function DriveMaterialShelf({
  materials,
  startNumber,
}: {
  materials: readonly DriveMaterial[];
  startNumber: number;
}) {
  const [activeMaterial, setActiveMaterial] = useState<DriveMaterial | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const closeViewer = useCallback(() => {
    if (document.fullscreenElement === viewerRef.current) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    setIsFullscreen(false);
    setActiveMaterial(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!activeMaterial) return;

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
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
  }, [activeMaterial, closeViewer]);

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

  const openViewer = (material: DriveMaterial, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger;
    setIsFullscreen(false);
    setActiveMaterial(material);
  };

  return (
    <>
    <section className="library-drive-material-section" aria-labelledby="library-drive-material-title">
      <div className="member-section-heading">
        <div>
          <p className="member-kicker">Drive material archive</p>
          <h2 id="library-drive-material-title">Every supporting file, in its proper place.</h2>
        </div>
        <span>{materials.length} source records available</span>
      </div>
      <p className="library-drive-material-intro">
        Templates, explainers, transcripts, captions, storyboards, mock audio, scripts, and evidence packs from the supplied course folder.
      </p>

      <div className="library-record-list library-drive-record-list">
        {materials.map((material, index) => {
          const category = driveMaterialCategory(material.filename);
          const kind = driveMaterialKindLabel(material.kind);
          const title = driveMaterialTitle(material.filename);

          return (
            <article className="library-record library-drive-record" key={material.id}>
              <span className="library-record-number">{String(startNumber + index).padStart(3, "0")}</span>
              <div className="library-record-copy">
                <small>{category} · {kind}</small>
                <h2>{title}</h2>
                <p>Original {kind.toLowerCase()} from the {material.collection.toLowerCase()} collection.</p>
                <div>
                  <span>{formatMaterialSize(material.bytes)}</span>
                  <span>Source preserved</span>
                </div>
              </div>
              <div className="library-record-meta">
                <span>{kind} · {formatMaterialSize(material.bytes)}</span>
                  <small>InterviewRunway material</small>
                  <b>Included in Library</b>
                <button
                  className="library-record-open"
                  type="button"
                  onClick={(event) => openViewer(material, event.currentTarget)}
                  aria-haspopup="dialog"
                  aria-label={`Open ${title} inside InterviewRunway`}
                >
                  Open <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
    {activeMaterial ? (
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
          aria-labelledby="library-material-dialog-title"
          aria-describedby="library-material-dialog-description"
        >
          <header className="library-material-dialog__header">
            <div>
              <span>{driveMaterialCategory(activeMaterial.filename)} · {driveMaterialKindLabel(activeMaterial.kind)}</span>
              <h2 id="library-material-dialog-title">{driveMaterialTitle(activeMaterial.filename)}</h2>
              <p id="library-material-dialog-description">Open the material here without leaving InterviewRunway or authorizing Google Drive.</p>
            </div>
            <div className="library-pdf-dialog__actions">
              <button
                className="library-pdf-dialog__fullscreen"
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit full screen" : "Open PDF in full screen"}
                title={isFullscreen ? "Exit full screen" : "Open PDF in full screen"}
              >
                <span aria-hidden="true">⛶</span>
              </button>
              <button className="library-pdf-dialog__close" ref={closeRef} type="button" onClick={closeViewer} aria-label="Close material viewer">
                <span>CLOSE</span><b aria-hidden="true">×</b>
              </button>
            </div>
          </header>
          <div ref={viewerRef} className="library-material-dialog__body">
            <MaterialViewer
              fileId={activeMaterial.id}
              filename={activeMaterial.filename}
              mimeType={activeMaterial.mimeType}
              title={driveMaterialTitle(activeMaterial.filename)}
              content={DRIVE_MATERIAL_CONTENT[activeMaterial.id]}
              assetUrl={driveMaterialPrimaryAssetHref(activeMaterial)}
              fallbackAssetUrl={driveMaterialCompanionAssetHref(activeMaterial)}
            />
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
