"use client";

import { useEffect, useState } from "react";

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

export function MaterialViewer({
  fileId,
  filename,
  mimeType,
  title,
  content,
  assetUrl,
  fallbackAssetUrl,
}: {
  fileId: string;
  filename: string;
  mimeType: string;
  title: string;
  content?: string | null;
  assetUrl?: string | null;
  fallbackAssetUrl?: string | null;
}) {
  const displayKind = materialDisplayKind(filename, mimeType);
  if (content !== null && content !== undefined) {
    return (
      <pre className="library-material-text" aria-label={`${title} content`}>
        {content}
      </pre>
    );
  }

  if (assetUrl && displayKind === "text") {
    return <TextMaterial assetUrl={assetUrl} fileId={fileId} title={title} />;
  }

  if (assetUrl && displayKind === "video") {
    return <video className="library-material-media" aria-label={`${title} video`} controls playsInline preload="metadata" src={assetUrl} />;
  }

  if (assetUrl && displayKind === "audio") {
    return (
      <div className="library-material-audio">
        <span aria-hidden="true">AUDIO</span>
        <strong>{title}</strong>
        <audio aria-label={`${title} audio`} controls preload="metadata" src={assetUrl} />
      </div>
    );
  }

  if (!assetUrl && fallbackAssetUrl && (displayKind === "video" || displayKind === "audio")) {
    return (
      <div className="library-material-companion">
        <span>Text companion preview</span>
        <p>The original media is preserved in the archive; this authorization-free preview opens its matching transcript here.</p>
        <TextMaterial assetUrl={fallbackAssetUrl} fileId={fileId} title={`${title} transcript`} />
      </div>
    );
  }

  if (assetUrl && displayKind === "document") {
    return (
      <div className="library-material-document">
        <span aria-hidden="true">DOC</span>
        <strong>{title}</strong>
        <p>This document is available inside InterviewRunway and ready to save for editing.</p>
        <a href={assetUrl} download={filename}>Save document <span aria-hidden="true">↓</span></a>
      </div>
    );
  }

  return (
    <div className="library-material-state" data-material-file-id={fileId} aria-live="polite">
      <span aria-hidden="true">{displayKind === "video" ? "VIDEO" : displayKind === "audio" ? "AUDIO" : "DOC"}</span>
      <p>This material is catalogued in InterviewRunway and will open here without a separate Drive sign-in.</p>
    </div>
  );
}

function TextMaterial({ assetUrl, fileId, title }: { assetUrl: string; fileId: string; title: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(assetUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Material unavailable");
        return response.text();
      })
      .then((value) => setText(value))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, [assetUrl]);

  if (text !== null) {
    return <pre className="library-material-text" aria-label={`${title} content`}>{text}</pre>;
  }

  return (
    <div className="library-material-state" data-material-file-id={fileId} aria-live="polite" aria-busy={!error}>
      <span aria-hidden="true">{error ? "!" : "···"}</span>
      <p>{error ? "This material could not be loaded." : "Loading the material inside InterviewRunway…"}</p>
    </div>
  );
}
