/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  REPLAY_ASSETS: R2Bucket;
  REPLAY_UPLOAD_SECRET?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const REPLAY_ASSET_PATH = "/api/replay-assets/";
const REPLAY_ASSET_NAME = /^[a-z0-9-]+(?:_[a-z0-9-]+)*\.mp4\.part-\d{2}$/i;

function replayAssetName(pathname: string): string | null {
  if (!pathname.startsWith(REPLAY_ASSET_PATH)) return null;
  const name = decodeURIComponent(pathname.slice(REPLAY_ASSET_PATH.length));
  return REPLAY_ASSET_NAME.test(name) ? name : null;
}

async function handleReplayAsset(request: Request, env: Env, name: string): Promise<Response> {
  if (request.method === "PUT") {
    const expected = env.REPLAY_UPLOAD_SECRET?.trim();
    if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (!request.body) return new Response("A request body is required.", { status: 400 });

    await env.REPLAY_ASSETS.put(name, request.body, {
      httpMetadata: { contentType: "application/octet-stream" },
    });
    return new Response(null, { status: 204 });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD, PUT" } });
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

    const assetName = replayAssetName(url.pathname);
    if (assetName) return handleReplayAsset(request, env, assetName);

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
