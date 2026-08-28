"use client";

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
}: {
  fileId: string;
  filename: string;
  mimeType: string;
  title: string;
  content?: string | null;
}) {
  const displayKind = materialDisplayKind(filename, mimeType);
  if (content !== null && content !== undefined) {
    return (
      <pre className="library-material-text" aria-label={`${title} content`}>
        {content}
      </pre>
    );
  }

  return (
    <div className="library-material-state" data-material-file-id={fileId} aria-live="polite">
      <span aria-hidden="true">{displayKind === "video" ? "VIDEO" : displayKind === "audio" ? "AUDIO" : "DOC"}</span>
      <p>This material is catalogued in InterviewRunway and will open here without a separate Drive sign-in.</p>
    </div>
  );
}
