import { createTextPdf } from "@/app/lib/text-pdf";
import type { LibraryMaterialViewerSource } from "./library-material-source";

export type PdfPreviewInput = {
  filename: string;
  title: string;
  assetUrl?: string | null;
  mimeType?: string;
  source?: string;
};

export function isPdfAsset(filename: string, mimeType = "") {
  return /^application\/pdf$/i.test(mimeType) || /\.pdf$/i.test(filename);
}

export function previewInputForMaterial(material: LibraryMaterialViewerSource | null): PdfPreviewInput | null {
  if (!material) return null;
  const { filename, mimeType, title, content, assetUrl, fallbackAssetUrl } = material;
  if (content !== undefined && content !== null) return { filename, title, source: content };
  // Never prefetch original media, Drive authorizations, or account endpoints.
  if (/^(video|audio)\//i.test(mimeType) || /\.(mp4|m4a|mp3|wav|ogg)$/i.test(filename)) return null;
  const url = isPdfAsset(filename, mimeType) ? assetUrl : fallbackAssetUrl ?? assetUrl;
  if (!url || !/^\/(pdf-guides|drive-materials|demo-materials)\/[^?#]+$/i.test(url)) return null;
  if (!isPdfAsset(filename, mimeType) && !/\.(txt|md|csv|json|srt)$/i.test(url)) return null;
  return { filename, mimeType, title, assetUrl: url };
}

export function previewKey(input: PdfPreviewInput) {
  return input.source === undefined && isPdfAsset(input.filename, input.mimeType)
    ? JSON.stringify(["pdf", input.assetUrl])
    : JSON.stringify([input.assetUrl, input.filename, input.title, input.source]);
}

// Only public, supplied learning content is retained, never account data.
// Blobs (not object URLs/iframes) survive dialog closes. Each viewer owns and
// revokes its own URL. Reloading the document discards this bounded cache.
export function createPreviewCache(limit = 24, byteLimit = 4 * 1024 * 1024) {
  const entries = new Map<string, { promise: Promise<Blob>; blob?: Blob }>();
  const trim = () => {
    let bytes = [...entries.values()].reduce((total, item) => total + (item.blob?.size ?? 0), 0);
    for (const [key, entry] of entries) {
      if (entries.size <= limit && bytes <= byteLimit) break;
      if (!entry.blob) continue;
      bytes -= entry.blob.size;
      entries.delete(key);
    }
  };
  return {
    has(input: PdfPreviewInput) { return entries.has(previewKey(input)); },
    peek(input: PdfPreviewInput) { return entries.get(previewKey(input))?.blob; },
    prepare(input: PdfPreviewInput): Promise<Blob> {
      const key = previewKey(input);
      const existing = entries.get(key);
      if (existing) {
        entries.delete(key);
        entries.set(key, existing);
        return existing.promise;
      }
      const promise = (async () => {
        if (input.source === undefined && isPdfAsset(input.filename, input.mimeType)) throw new Error("Native PDFs use retained readers");
        if (input.source !== undefined) return new Blob([createTextPdf(input.title, input.filename, input.source)], { type: "application/pdf" });
        if (!input.assetUrl) throw new Error("Material unavailable");
        const response = await fetch(input.assetUrl);
        if (!response.ok) throw new Error("Material unavailable");
        return new Blob([createTextPdf(input.title, input.filename, await response.text())], { type: "application/pdf" });
      })();
      const entry: { promise: Promise<Blob>; blob?: Blob } = { promise };
      entries.set(key, entry);
      void promise.then((blob) => { entry.blob = blob; trim(); }, () => { entries.delete(key); });
      return promise;
    },
  };
}

export const materialPreviewCache = createPreviewCache();

// Retain at most two native PDF readers. Visible cards only take free slots;
// explicit intent/open can replace an idle reader, never an open one.
export function createNativePreviewSlots(limit = 2) {
  const slots = new Map<string, { active: boolean; evict: () => void }>();
  return {
    acquire(id: string, evict: () => void, active = false, replaceIdle = false) {
      const current = slots.get(id);
      if (current) {
        slots.delete(id);
        slots.set(id, { active: active || current.active, evict });
        return true;
      }
      if (slots.size >= limit) {
        const idle = [...slots].find(([, slot]) => !slot.active);
        if (!replaceIdle || !idle) return false;
        slots.delete(idle[0]);
        idle[1].evict();
      }
      slots.set(id, { active, evict });
      return true;
    },
    close(id: string) { const slot = slots.get(id); if (slot) slot.active = false; },
    release(id: string) { slots.delete(id); },
  };
}
export const nativePreviewSlots = createNativePreviewSlots();

export function canWarmMaterial() {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !connection?.saveData && connection?.effectiveType !== "2g" && connection?.effectiveType !== "slow-2g";
}

// Small visible/intent-only warm queue; never crawl the entire Library.
const warmQueue = new Map<string, PdfPreviewInput>();
let warming = 0;
export function warmMaterialPreview(input: PdfPreviewInput | null) {
  if (!input || !canWarmMaterial()) return;
  if (input.source === undefined && isPdfAsset(input.filename, input.mimeType)) return;
  if (materialPreviewCache.peek(input)) return;
  warmQueue.set(previewKey(input), input);
  if (warmQueue.size > 8) warmQueue.delete(warmQueue.keys().next().value!);
  while (warming < 2 && warmQueue.size) {
    const [key, next] = warmQueue.entries().next().value!;
    warmQueue.delete(key);
    warming++;
    void materialPreviewCache.prepare(next).catch(() => undefined).finally(() => {
      warming--;
      const queued = warmQueue.values().next().value;
      if (queued) warmMaterialPreview(queued);
    });
  }
}
