import assert from "node:assert/strict";
import test from "node:test";

let renderSequence = 0;

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${renderSequence++}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost"), {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

test("server-renders the finished InterviewRunway homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const text = visibleText(html);

  assert.match(
    html,
    /<title>Interview prep for remote (?:&amp;|&) AI-adjacent tech roles \| InterviewRunway<\/title>/i,
  );
  assert.match(
    text,
    /Get interview-ready for remote & AI-adjacent tech roles\./i,
  );
  assert.match(text, /₹799/);

  assert.match(html, /<html[^>]*\blang=["']en-IN["']/i);
  assert.match(html, /<header\b/i);
  assert.match(html, /<nav[^>]*\baria-label=["']Primary navigation["']/i);
  assert.match(html, /<main\b/i);
  assert.match(html, /<h1[^>]*\bid=["']hero-title["']/i);
  assert.match(html, /<footer\b/i);

  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Codex is working|Your site is taking shape/i,
  );
});

const coreRoutes = [
  {
    pathname: "/vault",
    expected: [/The Vault/i, /₹799/],
  },
  {
    pathname: "/ai-prep",
    expected: [/AI Prep/i, /(?:mock interviews?|Vault (?:buyers|owners))/i],
  },
  {
    pathname: "/premium",
    expected: [/(?:1:1 Coaching|1:1 Premium)/i, /(?:capacity|founder|₹9,999)/i],
  },
  {
    pathname: "/checkout/vault",
    expected: [/(?:checkout|review your order|complete your order)/i, /₹799/],
  },
];

for (const { pathname, expected } of coreRoutes) {
  test(`server-renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

    const text = visibleText(await response.text());
    for (const pattern of expected) {
      assert.match(text, pattern);
    }
  });
}
