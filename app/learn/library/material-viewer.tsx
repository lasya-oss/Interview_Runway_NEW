"use client";

import { useEffect, useState } from "react";
import { DriveReplayPlayer } from "../practice/replays/drive-replay-player";
import { isPdfAsset, materialPreviewCache, previewKey } from "./material-preview-cache";

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

function isMediaKind(kind: ReturnType<typeof materialDisplayKind>): kind is "video" | "audio" {
  return kind === "video" || kind === "audio";
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
    return <PdfMaterialPreview key={previewKey({ filename, source: content, title })} fileId={fileId} filename={filename} source={content} title={title} />;
  }

  if (assetUrl && displayKind === "video") {
    return <video className="library-material-media" aria-label={`${title} video`} controls playsInline preload="metadata" src={assetUrl} />;
  }

  if (assetUrl && displayKind === "audio") {
    return <audio className="library-material-audio-player" aria-label={`${title} audio`} controls preload="metadata" src={assetUrl} />;
  }

  // The original narrated media lives in Drive rather than the static asset
  // bundle. When the protected viewer is configured, use it so a video record
  // can still play its original source.
  if (!assetUrl && googleClientId && isMediaKind(displayKind)) {
    return <DriveReplayPlayer clientId={googleClientId} fileId={fileId} loginHint={loginHint} mediaType={displayKind} title={title} />;
  }

  // A transcript is useful study context, but it is not the narrated lesson.
  // Never make a Drive-only video or audio record look playable by rendering a
  // different companion file when the original media is not connected.
  if (isMediaKind(displayKind)) {
    return (
      <div className="library-material-state library-material-content-unavailable" data-material-file-id={fileId} aria-live="polite">
        <span aria-hidden="true">!</span>
        <strong>Content unavailable</strong>
        <p>The original {displayKind} is not connected to this workspace yet.</p>
      </div>
    );
  }

  const pdfSourceUrl = isPdfAsset(filename, mimeType)
    ? assetUrl
    : fallbackAssetUrl ?? (isTextMaterial(filename, mimeType) ? assetUrl : null);

  if (pdfSourceUrl && (fallbackAssetUrl || isTextMaterial(filename, mimeType) || isPdfAsset(filename, mimeType))) {
    return <PdfMaterialPreview key={previewKey({ assetUrl: pdfSourceUrl, filename, mimeType, title })} assetUrl={pdfSourceUrl} fileId={fileId} filename={filename} mimeType={mimeType} title={title} />;
  }

  return (
    <div className="library-material-state library-material-content-unavailable" data-material-file-id={fileId} aria-live="polite">
      <span aria-hidden="true">PREVIEW</span>
      <strong>Content unavailable</strong>
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
  const key = previewKey({ assetUrl, filename, mimeType, source, title });
  const [prepared, setPrepared] = useState<{ key: string; url: string } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  // Original PDFs always use their real URL and native progressive reader.
  // The dialog retains a bounded number of these readers between opens.
  const directUrl = source === undefined && assetUrl && isPdfAsset(filename, mimeType) ? assetUrl : null;
  const pdfUrl = prepared?.key === key ? prepared.url : directUrl;
  const error = failedKey === key;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    if (directUrl) return;
    void materialPreviewCache.prepare({ assetUrl, filename, mimeType, source, title })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPrepared({ key, url: objectUrl });
      }).catch(() => {
        if (!cancelled) setFailedKey(key);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetUrl, directUrl, filename, key, mimeType, source, title]);

  if (pdfUrl || (!error && source === undefined && assetUrl && isPdfAsset(filename, mimeType))) {
    return (
      <div className="library-material-pdf-frame">
        <iframe key={pdfUrl ?? "pending"} src={pdfUrl ?? undefined} title={`PDF preview for ${title}`} allow="fullscreen" allowFullScreen />
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
