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

const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;
const PDF_MARGIN = 46;
const PDF_FONT_SIZE = 10;
const PDF_LEADING = 14;
const PDF_MAX_CHARS = 96;
const PDF_REPLACEMENTS: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2022": "-",
  "\u2192": "->",
  "\u00d7": "x",
  "\u00a0": " ",
};

function pdfSafeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e\n\t]/g, (character) => PDF_REPLACEMENTS[character] ?? "?");
}

function wrapPdfLine(line: string) {
  if (line.length <= PDF_MAX_CHARS) return [line];

  const wrapped: string[] = [];
  let remainder = line;
  while (remainder.length > PDF_MAX_CHARS) {
    const boundary = remainder.lastIndexOf(" ", PDF_MAX_CHARS);
    const splitAt = boundary > PDF_MAX_CHARS * 0.55 ? boundary : PDF_MAX_CHARS;
    wrapped.push(remainder.slice(0, splitAt));
    remainder = remainder.slice(splitAt).trimStart();
  }
  wrapped.push(remainder);
  return wrapped;
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function bytesFor(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks: readonly Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function createTextPdf(title: string, filename: string, source: string) {
  const lines = [
    title,
    "InterviewRunway PDF preview",
    "",
    `Source: ${filename}`,
    "",
    ...pdfSafeText(source).split("\n").flatMap(wrapPdfLine),
  ];
  const linesPerPage = Math.floor((PDF_HEIGHT - PDF_MARGIN * 2) / PDF_LEADING);
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  for (const page of pages) {
    const stream = [
      "BT",
      `/F1 ${PDF_FONT_SIZE} Tf`,
      `${PDF_MARGIN} ${PDF_HEIGHT - PDF_MARGIN} Td`,
      `${PDF_LEADING} TL`,
      ...page.flatMap((line) => [`(${escapePdfString(line)}) Tj`, "T*"]),
      "ET",
    ].join("\n");
    const contentObjectNumber = objects.length + 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${bytesFor(stream).length} >>\nstream\n${stream}\nendstream`,
    );
  }

  const chunks: Uint8Array[] = [bytesFor("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n")];
  const offsets = [0];
  let offset = chunks[0].length;
  objects.forEach((object, index) => {
    offsets[index + 1] = offset;
    const chunk = bytesFor(`${index + 1} 0 obj\n${object}\nendobj\n`);
    chunks.push(chunk);
    offset += chunk.length;
  });
  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join("\n");
  chunks.push(bytesFor(xref));
  return concatBytes(chunks);
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
  const pdfSourceUrl = isPdfAsset(filename, mimeType)
    ? assetUrl
    : fallbackAssetUrl ?? (isTextMaterial(filename, mimeType) ? assetUrl : null);

  if (content !== null && content !== undefined) {
    return <PdfMaterialPreview fileId={fileId} filename={filename} source={content} title={title} />;
  }

  if (pdfSourceUrl && (fallbackAssetUrl || isTextMaterial(filename, mimeType) || isPdfAsset(filename, mimeType))) {
    return <PdfMaterialPreview assetUrl={pdfSourceUrl} fileId={fileId} filename={filename} mimeType={mimeType} title={title} />;
  }

  if (assetUrl && displayKind === "video") {
    return <video className="library-material-media" aria-label={`${title} video`} controls playsInline preload="metadata" src={assetUrl} />;
  }

  if (assetUrl && displayKind === "audio") {
    return <audio className="library-material-audio-player" aria-label={`${title} audio`} controls preload="metadata" src={assetUrl} />;
  }

  return (
    <div className="library-material-state" data-material-file-id={fileId} aria-live="polite">
      <span aria-hidden="true">PREVIEW</span>
      <p>This material’s in-app PDF preview is temporarily unavailable.</p>
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
      const nextObjectUrl = URL.createObjectURL(new Blob([createTextPdf(title, filename, value).buffer as ArrayBuffer], { type: "application/pdf" }));
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
