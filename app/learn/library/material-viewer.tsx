"use client";

import { useEffect, useState } from "react";
import { DriveReplayPlayer } from "../practice/replays/drive-replay-player";
import { createTextPdf } from "@/app/lib/text-pdf";

function isTextMaterial(filename: string, mimeType: string) {
  return (
    /^text\//i.test(mimeType) ||
    /application\/(json|javascript)/i.test(mimeType) ||
    /\.(csv|json|md|srt|txt)$/i.test(filename)
  );
}

function materialDisplayKind(filename: string, mimeType: string) {
  if (isTextMaterial(filename, mimeType)) return "text" as const;
  if (/^video\//i.test(mimeType) || /\.mp4$/i.test(filename)) return "video" as const;
  if (/^audio\//i.test(mimeType) || /\.(m4a|mp3|wav|ogg)$/i.test(filename)) return "audio" as const;
  return "document" as const;
}

function isPdfAsset(filename: string, mimeType: string) {
  return /^application\/pdf$/i.test(mimeType) || /\.pdf$/i.test(filename);
}

export function MaterialViewer({
  fileId,
  filename,
  mimeType,
  title,
  content,
  assetUrl,
  fallbackAssetUrl,
  googleClientId = "",
  loginHint = null,
}: {
  fileId: string;
  filename: string;
  mimeType: string;
  title: string;
  content?: string | null;
  assetUrl?: string | null;
  fallbackAssetUrl?: string | null;
  googleClientId?: string;
  loginHint?: string | null;
}) {
  const displayKind = materialDisplayKind(filename, mimeType);

  if (content !== null && content !== undefined) {
    return <PdfMaterialPreview fileId={fileId} filename={filename} source={content} title={title} />;
  }

  if (assetUrl && displayKind === "video") {
    return <video className="library-material-media" aria-label={`${title} video`} controls playsInline preload="metadata" src={assetUrl} />;
  }

  if (assetUrl && displayKind === "audio") {
    return <audio className="library-material-audio-player" aria-label={`${title} audio`} controls preload="metadata" src={assetUrl} />;
  }

  const pdfSourceUrl = isPdfAsset(filename, mimeType)
    ? assetUrl
    : displayKind === "video" || displayKind === "audio"
      ? null
      : fallbackAssetUrl ?? (isTextMaterial(filename, mimeType) ? assetUrl : null);

  // Narrated explainers have a first-party transcript companion even though
  // their original MP4 masters remain in Drive. Prefer that companion so the
  // Library always opens usable context without a Drive OAuth prompt.
  const companionPdfUrl = fallbackAssetUrl && (displayKind === "video" || displayKind === "audio")
    ? fallbackAssetUrl
    : null;

  if (companionPdfUrl) {
    return <PdfMaterialPreview assetUrl={companionPdfUrl} fileId={fileId} filename={filename.replace(/\.mp4$/i, ".md")} mimeType="text/markdown" title={title} />;
  }

  if (pdfSourceUrl && (fallbackAssetUrl || isTextMaterial(filename, mimeType) || isPdfAsset(filename, mimeType))) {
    return <PdfMaterialPreview assetUrl={pdfSourceUrl} fileId={fileId} filename={filename} mimeType={mimeType} title={title} />;
  }

  if (!assetUrl && googleClientId && (displayKind === "video" || displayKind === "audio")) {
    return <DriveReplayPlayer clientId={googleClientId} fileId={fileId} loginHint={loginHint} mediaType={displayKind} title={title} />;
  }

  return (
    <div className="library-material-state" data-material-file-id={fileId} aria-live="polite">
      <span aria-hidden="true">PREVIEW</span>
      <p>{displayKind === "video" ? "Original video playback is not configured for this workspace." : displayKind === "audio" ? "Original audio playback is not configured for this workspace." : "This material’s in-app PDF preview is temporarily unavailable."}</p>
    </div>
  );
}

function PdfMaterialPreview({
  assetUrl,
  fileId,
  filename,
  mimeType,
  source,
  title,
}: {
  assetUrl?: string | null;
  fileId: string;
  filename: string;
  mimeType?: string;
  source?: string;
  title: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const controller = new AbortController();
    const makePdf = (value: string) => {
      const nextObjectUrl = URL.createObjectURL(new Blob([createTextPdf(title, filename, value)], { type: "application/pdf" }));
      if (cancelled) {
        URL.revokeObjectURL(nextObjectUrl);
        return;
      }
      objectUrl = nextObjectUrl;
      setPdfUrl(nextObjectUrl);
    };

    if (source !== undefined) {
      queueMicrotask(() => makePdf(source));
    } else if (assetUrl && isPdfAsset(filename, mimeType ?? "")) {
      queueMicrotask(() => {
        if (!cancelled) setPdfUrl(assetUrl);
      });
    } else if (assetUrl) {
      void fetch(assetUrl, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Material unavailable");
          return response.text();
        })
        .then(makePdf)
        .catch((reason: unknown) => {
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          if (!cancelled) setError(true);
        });
    } else {
      queueMicrotask(() => {
        if (!cancelled) setError(true);
      });
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetUrl, filename, mimeType, source, title]);

  if (pdfUrl) {
    return (
      <div className="library-material-pdf-frame">
        <iframe src={pdfUrl} title={`PDF preview for ${title}`} allow="fullscreen" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="library-material-pdf-state library-material-state" data-material-file-id={fileId} aria-live="polite" aria-busy={!error}>
      <span aria-hidden="true">{error ? "!" : "PDF"}</span>
      <p>{error ? "This material’s PDF preview could not be loaded." : "Preparing the PDF preview inside InterviewRunway…"}</p>
    </div>
  );
}
