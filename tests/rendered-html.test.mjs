import assert from "node:assert/strict";
import test from "node:test";

let renderSequence = 0;
const testSessionSecret = "interviewrunway-test-session-secret-2026-07-17";
process.env.DEMO_SESSION_SECRET = testSessionSecret;

async function request(pathname = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${renderSequence++}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost"), {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      DEMO_SESSION_SECRET: testSessionSecret,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function render(pathname = "/", init = {}) {
  return request(pathname, init);
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
    expected: [/secure checkout/i, /₹799/, /Paddle/i],
    init: {
      headers: {
        accept: "text/html",
        "oai-authenticated-user-email": "buyer@example.com",
      },
    },
  },
];

for (const { pathname, expected, init } of coreRoutes) {
  test(`server-renders ${pathname}`, async () => {
    const response = await render(pathname, init);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

    const text = visibleText(await response.text());
    for (const pattern of expected) {
      assert.match(text, pattern);
    }
  });
}

const productRoutes = [
  ["/pricing", [/Three purposeful layers/i, /₹2,499/i, /₹9,999/i]],
  ["/curriculum", [/Curriculum/i, /Five records below have been built as pilot outputs/i]],
  ["/demo-login", [/Enter it/i, /Ananya Rao/i, /Rohan Mehta/i, /Meera Iyer/i]],
];

for (const [pathname, expected] of productRoutes) {
  test(`server-renders product route ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const text = visibleText(await response.text());
    for (const pattern of expected) assert.match(text, pattern);
  });
}

test("demo sign-in issues a protected session and opens the learner product", async () => {
  const login = await request("/api/demo-session", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      email: "practice@demo.interviewrunway.com",
      password: "AI2499!",
    }),
  });
  assert.equal(login.status, 200);
  const body = await login.json();
  assert.deepEqual(body, { ok: true, profile: "practice" });

  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /ir_demo_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.doesNotMatch(JSON.stringify(body), /token|secret|password/i);

  const sessionCookie = setCookie.split(";")[0];
  const dashboard = await request("/learn", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(dashboard.status, 200);
  const dashboardText = visibleText(await dashboard.text());
  assert.match(dashboardText, /Good evening, Rohan/i);
  assert.match(dashboardText, /Every attempt leaves evidence/i);
});

test("Paddle checkout requires an authenticated account", async () => {
  const checkout = await request("/api/checkout", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({ offer: "vault" }),
  });
  assert.equal(checkout.status, 401);
  assert.deepEqual(await checkout.json(), { error: "Authentication required" });
});

test("Paddle webhook rejects unsigned requests before fulfillment", async () => {
  const webhook = await request("/api/webhooks/paddle", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ event_type: "transaction.completed" }),
  });
  assert.equal(webhook.status, 400);
  assert.deepEqual(await webhook.json(), { error: "Missing Paddle signature" });
});

test("buyer-facing checkout contains no prototype or no-charge simulation", async () => {
  const response = await render("/checkout/vault", {
    headers: {
      accept: "text/html",
      "oai-authenticated-user-email": "buyer@example.com",
    },
  });
  assert.equal(response.status, 200);
  const text = visibleText(await response.text());
  assert.match(text, /Continue securely with Paddle|Checkout configuration unavailable/i);
  assert.doesNotMatch(text, /prototype|simulation|₹0|no-charge/i);
});
