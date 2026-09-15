/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  REPLAY_ASSETS: R2Bucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const REPLAY_ASSET_PATH = "/api/replay-assets/";
const PDF_GUIDE_PATH = "/pdf-guides/";
const REPLAY_ASSET_NAME = /^[a-z0-9-]+(?:_[a-z0-9-]+)*\.mp4\.part-\d{2}$/i;
const REPLAY_VIDEO_NAME = /^[a-z0-9-]+(?:_[a-z0-9-]+)*\.mp4$/i;
const PDF_GUIDE_NAME = /^[a-z0-9-]+(?:_[a-z0-9-]+)*\.pdf$/i;

type ReplayPart = {
  key: string;
  size: number;
};

type ReplayByteRange = {
  start: number;
  end: number;
};

function replayAssetName(pathname: string): string | null {
  if (!pathname.startsWith(REPLAY_ASSET_PATH)) return null;
  let name: string;
  try {
    name = decodeURIComponent(pathname.slice(REPLAY_ASSET_PATH.length));
  } catch {
    return null;
  }
  return REPLAY_ASSET_NAME.test(name) ? name : null;
}

function replayVideoName(pathname: string): string | null {
  if (!pathname.startsWith(REPLAY_ASSET_PATH)) return null;
  let name: string;
  try {
    name = decodeURIComponent(pathname.slice(REPLAY_ASSET_PATH.length));
  } catch {
    return null;
  }
  return REPLAY_VIDEO_NAME.test(name) ? name : null;
}

function pdfGuideName(pathname: string): string | null {
  if (!pathname.startsWith(PDF_GUIDE_PATH)) return null;
  let name: string;
  try {
    name = decodeURIComponent(pathname.slice(PDF_GUIDE_PATH.length));
  } catch {
    return null;
  }
  return PDF_GUIDE_NAME.test(name) ? name : null;
}

async function handlePdfGuide(request: Request, env: Env | undefined, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  // vinext's local production server does not provide Cloudflare bindings;
  // let its asset handler serve the copied PDF during local verification.
  if (!env?.ASSETS) return handler.fetch(request, env, ctx);

  const assetResponse = await env.ASSETS.fetch(request);
  if (!assetResponse.ok) return assetResponse;

  const headers = new Headers(assetResponse.headers);
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", "inline");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(request.method === "HEAD" ? null : assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}

async function listReplayParts(env: Env, filename: string): Promise<readonly ReplayPart[]> {
  const prefix = `${filename}.part-`;
  const listing = await env.REPLAY_ASSETS.list({ prefix });
  const parts = listing.objects
    .filter((object) => object.key.startsWith(prefix) && REPLAY_ASSET_NAME.test(object.key))
    .sort((left, right) => left.key.localeCompare(right.key, "en"))
    .map((object) => ({ key: object.key, size: object.size }));

  if (parts.length === 0) return [];

  const isContiguous = parts.every(
    (part, index) => part.key === `${filename}.part-${String(index).padStart(2, "0")}`,
  );
  return isContiguous ? parts : [];
}

function parseReplayRange(value: string | null, totalSize: number): ReplayByteRange | "unsatisfiable" | null {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return "unsatisfiable";

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return "unsatisfiable";
    start = Math.max(totalSize - suffixLength, 0);
    end = totalSize - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : totalSize - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= totalSize) {
      return "unsatisfiable";
    }
    end = Math.min(end, totalSize - 1);
  }

  return { start, end };
}

function streamReplayParts(
  env: Env,
  parts: readonly ReplayPart[],
  range: ReplayByteRange | null,
): ReadableStream<Uint8Array> {
  const selectedParts: Array<{ part: ReplayPart; offset: number; length: number }> = [];
  let fileOffset = 0;

  for (const part of parts) {
    const partStart = fileOffset;
    const partEnd = fileOffset + part.size - 1;
    const start = range ? Math.max(range.start, partStart) : partStart;
    const end = range ? Math.min(range.end, partEnd) : partEnd;
    if (start <= end) {
      selectedParts.push({
        part,
        offset: start - partStart,
        length: end - start + 1,
      });
    }
    fileOffset += part.size;
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const selected of selectedParts) {
          const object = range
            ? await env.REPLAY_ASSETS.get(selected.part.key, {
                range: { offset: selected.offset, length: selected.length },
              })
            : await env.REPLAY_ASSETS.get(selected.part.key);
          if (!object) throw new Error("Replay asset disappeared while it was being read.");

          const reader = object.body.getReader();
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            controller.enqueue(chunk.value);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

async function handleReplayVideo(request: Request, env: Env, filename: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  const parts = await listReplayParts(env, filename);
  if (parts.length === 0) return new Response("Not found", { status: 404 });

  const totalSize = parts.reduce((sum, part) => sum + part.size, 0);
  const parsedRange = parseReplayRange(request.headers.get("range"), totalSize);
  if (parsedRange === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: {
        "accept-ranges": "bytes",
        "content-range": `bytes */${totalSize}`,
      },
    });
  }

  const range = parsedRange;
  const responseStart = range?.start ?? 0;
  const responseEnd = range?.end ?? totalSize - 1;
  const headers = new Headers({
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
    "content-length": String(responseEnd - responseStart + 1),
    "content-type": "video/mp4",
  });
  if (range) headers.set("content-range", `bytes ${range.start}-${range.end}/${totalSize}`);

  return new Response(
    request.method === "HEAD" ? null : streamReplayParts(env, parts, range),
    { status: range ? 206 : 200, headers },
  );
}

async function handleReplayAsset(request: Request, env: Env, name: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  const object = await env.REPLAY_ASSETS.get(name);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(request.method === "HEAD" ? null : object.body, {
    headers: {
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": String(object.size),
      "content-type": "application/octet-stream",
      etag: object.httpEtag,
    },
  });
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const replayVideo = replayVideoName(url.pathname);
    if (replayVideo) return handleReplayVideo(request, env, replayVideo);

    const assetName = replayAssetName(url.pathname);
    if (assetName) return handleReplayAsset(request, env, assetName);

    if (pdfGuideName(url.pathname)) return handlePdfGuide(request, env, ctx);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
