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
const PDF_MAX_CHARS = 88;
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

type PdfLine = {
  kind: "body" | "bullet" | "heading" | "blank";
  text: string;
};

function pdfContentLines(source: string): PdfLine[] {
  return pdfSafeText(source)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .flatMap((line): PdfLine[] => {
      const trimmed = line.trimEnd();
      if (!trimmed.trim()) return [{ kind: "blank", text: "" }];

      const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        return wrapPdfLine(heading[1].trim()).map((text) => ({ kind: "heading", text }));
      }

      const bullet = trimmed.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        return wrapPdfLine(`- ${bullet[1].trim()}`).map((text) => ({ kind: "bullet", text }));
      }

      return wrapPdfLine(trimmed).map((text) => ({ kind: "body", text }));
    });
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfText(font: "F1" | "F2", size: number, x: number, y: number, color: string, value: string) {
  return `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfString(value)}) Tj ET`;
}

function pdfLineMetrics(line: PdfLine) {
  if (line.kind === "heading") return { size: 14, leading: 23 };
  if (line.kind === "blank") return { size: 1, leading: 10 };
  return { size: 9.5, leading: 15 };
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
  const lines = pdfContentLines(source);
  const pages: PdfLine[][] = [];
  let page: PdfLine[] = [];
  let usedHeight = 0;
  const pushPage = () => {
    if (page.length) pages.push(page);
    page = [];
    usedHeight = 0;
  };

  for (const line of lines.length ? lines : [{ kind: "blank", text: "" } as PdfLine]) {
    const { leading } = pdfLineMetrics(line);
    const pageHeight = pages.length === 0 ? 518 : 626;
    if (page.length && usedHeight + leading > pageHeight) pushPage();
    page.push(line);
    usedHeight += leading;
  }
  pushPage();

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  const pageObjectNumbers: number[] = [];
  for (const [pageIndex, pageLines] of pages.entries()) {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    pageObjectNumbers.push(pageObjectNumber);
    const commands = [
      "q",
      "0.027 0.078 0.11 rg",
      `0 0 ${PDF_WIDTH} ${PDF_HEIGHT} re`,
      "f",
      "Q",
      "0.96 0.98 0.99 rg",
      "0.42 0.65 0.71 rg",
      pdfText("F2", 8.5, PDF_MARGIN, 754, "0.96 0.98 0.99", "INTERVIEWRUNWAY"),
      pdfText("F1", 7.5, 430, 754, "0.42 0.65 0.71", "SUPPORTING MATERIAL"),
      "1 0.42 0.17 rg",
      `46 736 ${PDF_WIDTH - PDF_MARGIN * 2} 2 re`,
      "f",
    ];

    let y = 690;
    if (pageIndex === 0) {
      commands.push(
        pdfText("F2", 24, PDF_MARGIN, 690, "0.96 0.98 0.99", title),
        pdfText("F1", 9, PDF_MARGIN, 654, "0.62 0.72 0.76", "PDF preview · readable inside InterviewRunway"),
        pdfText("F1", 7.5, PDF_MARGIN, 633, "0.42 0.65 0.71", `SOURCE · ${filename}`),
      );
      y = 594;
    } else {
      commands.push(pdfText("F2", 16, PDF_MARGIN, 704, "0.96 0.98 0.99", title));
      y = 670;
    }

    for (const line of pageLines) {
      const { size, leading } = pdfLineMetrics(line);
      const font = line.kind === "heading" ? "F2" : "F1";
      const color = line.kind === "heading" ? "1 0.45 0.23" : line.kind === "bullet" ? "0.78 0.87 0.89" : "0.84 0.9 0.91";
      if (line.text) commands.push(pdfText(font, size, PDF_MARGIN, y, color, line.text));
      y -= leading;
    }

    commands.push(
      "0.18 0.32 0.38 rg",
      `46 40 ${PDF_WIDTH - PDF_MARGIN * 2} 1 re`,
      "f",
      pdfText("F1", 7, PDF_MARGIN, 25, "0.42 0.65 0.71", `INTERVIEWRUNWAY · PAGE ${pageIndex + 1} / ${pages.length}`),
    );

    const stream = commands.join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
      `<< /Length ${bytesFor(stream).length} >>\nstream\n${stream}\nendstream`,
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>`;

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
