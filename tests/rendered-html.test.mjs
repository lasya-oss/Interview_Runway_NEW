import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
    /<title>Interview signal for remote (?:&amp;|&) AI-adjacent tech roles \| InterviewRunway<\/title>/i,
  );
  assert.match(html, /href=["'][^"']*\/favicon-32\.png["']/i);
  assert.match(html, /href=["'][^"']*\/apple-touch-icon\.png["']/i);
  assert.match(
    text,
    /Turn your experience into interview signal\./i,
  );
  assert.match(text, /₹799/);
  assert.match(text, /Check your interview signal/i);
  assert.match(text, /SECOND SEAT/i);
  assert.match(text, /ACCESS LOCKED/i);
  assert.match(text, /FOUNDATION CLEARANCE REQUIRED/i);
  assert.match(text, /How would you design a rate limiter\?/i);
  assert.match(text, /INTERVIEWER/i);
  assert.match(text, /SYSTEM DESIGNER/i);
  assert.match(text, /COMMUNICATION/i);
  assert.match(text, /The Second Seat is not sold separately/i);
  assert.match(html, /href=["'][^"']*\/diagnostic["'][^>]*data-analytics-event=["']hero_signal_cta_clicked["']/i);
  assert.match(text, /Baseline → intervention → signal change → outcome/i);
  assert.match(html, /data-testid=["']previous-evidence-record["']/i);
  assert.match(html, /data-testid=["']next-evidence-record["']/i);
  assert.match(html, /data-active-record=["']01["']/i);
  assert.doesNotMatch(text, /I stopped memorising solutions|One focused calibration session was more useful/i);

  assert.match(html, /<html[^>]*\blang=["']en-IN["']/i);
  assert.match(html, /<header\b/i);
  assert.match(html, /<nav[^>]*\baria-label=["']Primary navigation["']/i);
  assert.match(html, /<main\b/i);
  assert.match(html, /<h1[^>]*\bid=["']hero-title["']/i);
  assert.match(html, /<footer\b/i);

  const primaryNavigation = html.match(/<nav[^>]*aria-label=["']Primary navigation["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
  assert.match(visibleText(primaryNavigation), /Curriculum\s+Pricing\s+Demo/i);
  assert.doesNotMatch(visibleText(primaryNavigation), /Product|Coaching|About|Member demo/i);

  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Codex is working|Your site is taking shape/i,
  );
  assert.doesNotMatch(text, /GLM 4\.7|Cerebras|Groq|model hosting|inference infrastructure|token speed|custom model architecture/i);
});

const coreRoutes = [
  {
    pathname: "/vault",
    expected: [/Foundation/i, /₹799/, /flight plan/i],
  },
  {
    pathname: "/second-seat",
    expected: [/The Second Seat/i, /How would you design a rate limiter/i, /Foundation clearance/i],
  },
  {
    pathname: "/premium",
    expected: [/Human Calibration/i, /(?:capacity|₹9,999)/i],
  },
  {
    pathname: "/checkout/vault",
    expected: [/secure checkout/i, /₹799/, /Foundation/i],
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

test("legacy AI Prep route redirects to the canonical Second Seat page", async () => {
  const response = await render("/ai-prep", { redirect: "manual" });
  assert.ok([307, 308].includes(response.status));
  assert.match(response.headers.get("location") ?? "", /\/second-seat$/i);
});

const productRoutes = [
  ["/pricing", [/Foundation earns access/i, /FOUNDATION CLEARANCE REQUIRED/i, /₹2,499/i, /₹9,999/i]],
  ["/curriculum", [/Curriculum/i, /Five records below have been built as pilot outputs/i]],
  ["/demo-login", [/Choose a layer/i, /Enter the workspace/i, /The Second Seat/i, /Ananya Rao/i, /Rohan Mehta/i, /Meera Iyer/i, /Sliding Window Pattern Reference/i]],
  ["/diagnostic", [/Free interview signal check/i, /Find the gap that is hiding your experience/i, /Start the 7–10 minute scan/i, /No payment/i]],
  ["/proof", [/Flight recorder format/i, /Baseline/i, /Intervention/i, /Signal change/i, /No learner claims are live yet/i]],
];

for (const [pathname, expected] of productRoutes) {
  test(`server-renders product route ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const text = visibleText(await response.text());
    for (const pattern of expected) assert.match(text, pattern);
  });
}

test("pricing personalizes one mid-tier sample workspace action", async () => {
  const response = await render("/pricing", {
    headers: {
      accept: "text/html",
      "oai-authenticated-user-email": "pratheep@example.com",
      "oai-authenticated-user-full-name": "Pratheep%20BV",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
  });
  assert.equal(response.status, 200);

  const html = await response.text();
  const text = visibleText(html);
  assert.match(text, /Enter a populated cockpit/i);
  assert.match(text, /Good evening Pratheep\s*\./i);
  assert.match(text, /Enter the Second Seat demo/i);
  assert.doesNotMatch(text, /Enter the sample workspaces/i);
});

test("all three one-click demos issue protected tier sessions", async () => {
  for (const tier of ["foundation", "practice", "premium"]) {
    const preview = await request("/api/demo-session", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: "http://localhost",
      },
      body: JSON.stringify({ preview: tier }),
    });
    assert.equal(preview.status, 200);
    assert.deepEqual(await preview.json(), { ok: true, profile: tier });
    assert.match(preview.headers.get("set-cookie") ?? "", /ir_demo_session=.*HttpOnly/i);
  }
});

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
      password: "Seat2499!",
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
  assert.match(dashboardText, /Demo workspace · sample learner data/i);
  assert.match(dashboardText, /CLEARANCE COMPLETE · SECOND SEAT AVAILABLE/i);
  assert.doesNotMatch(dashboardText, /fictional learner data/i);
});

test("analytics contract is present on acquisition and payment surfaces", async () => {
  const homepage = await render();
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /data-analytics-event=["']hero_signal_cta_clicked["']/i);
  assert.match(homepageHtml, /pricing_tier_viewed/i);
  assert.match(homepageHtml, /second_seat_preview_started/i);

  const checkout = await render("/checkout/vault", {
    headers: {
      accept: "text/html",
      "oai-authenticated-user-email": "buyer@example.com",
    },
  });
  assert.equal(checkout.status, 200);
  assert.match(await checkout.text(), /Continue to secure checkout|Checkout configuration unavailable/i);
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
  assert.match(text, /Continue to secure checkout|Checkout configuration unavailable/i);
  assert.doesNotMatch(text, /prototype|simulation|₹0|no-charge/i);
  assert.doesNotMatch(text, /Paddle|buyer@example\.com|purchasing account/i);
});

test("checkout neither exposes nor prefills the signed-in account email", async () => {
  const source = await readFile(
    new URL("../app/checkout/[offer]/checkout-client.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /customer:\s*\{\s*email/);
  assert.doesNotMatch(source, /email you want on the receipt|purchasing account/i);
});

test("3D renderer uses Retina-class density and hardware antialiasing", async () => {
  const source = await readFile(new URL("../app/components/aero-canvases.tsx", import.meta.url), "utf8");
  assert.match(source, /dpr=\{tier === "full" \? \[1\.75, 2\.5\] : \[1\.25, 2\]\}/);
  assert.match(source, /antialias:\s*true/);
  assert.match(source, /precision:\s*"highp"/);
  assert.doesNotMatch(source, /antialias:\s*false/);
});

test("homepage 3D curve and wheel are mapped to their intended sections", async () => {
  const source = await readFile(
    new URL("../app/components/aero-canvases.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /SYSTEM_CURVE_WINDOW = \{ start: 0\.2, enterEnd: 0\.27, exitStart: 0\.485, end: 0\.5 \}/);
  assert.match(source, /plateauWeight\(p, SYSTEM_CURVE_WINDOW\.start, SYSTEM_CURVE_WINDOW\.enterEnd, SYSTEM_CURVE_WINDOW\.exitStart, SYSTEM_CURVE_WINDOW\.end\)/);
  assert.match(source, /routeRef\.current\.scale\.setScalar\(Math\.max\(0\.001, weight \* 1\.08\)\)/);
  assert.match(source, /LAYER_WHEEL_WINDOW = \{ start: 0\.5, peak: 0\.58, end: 0\.7 \}/);
  assert.match(source, /WORKSPACE_GIMBAL_WINDOW = \{ start: 0\.67, peak: 0\.74, end: 0\.9 \}/);
  assert.match(source, /turbineRef\.current\.position\.set\(1\.82/);
  assert.match(source, /gimbalRef\.current\.position\.set\(1\.76/);
  assert.match(source, /turbineRef[\s\S]*LAYER_WHEEL_WINDOW\.start[\s\S]*routeRef[\s\S]*SYSTEM_CURVE_WINDOW\.start/);
});

test("testimonial controls cannot be blocked by the decorative 3D canvas", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const component = await readFile(new URL("../app/components/testimonial-flight-deck.tsx", import.meta.url), "utf8");

  assert.match(styles, /\.home-aero-stage \*\s*\{\s*pointer-events:\s*none\s*!important;/);
  assert.match(component, /data-testid="previous-evidence-record"/);
  assert.match(component, /data-testid="next-evidence-record"/);
  assert.match(component, /data-active-record=\{story\.number\}/);
  assert.doesNotMatch(component, /scrollTo\s*\(/);
});

test("member demo typography has an explicit legibility floor", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /--member-micro:\s*11px/);
  assert.match(styles, /--member-body:\s*14px/);
  assert.match(styles, /\.member-nav a > b\s*\{\s*font-size:\s*14px/);
  assert.match(styles, /\.member-status-band strong,[\s\S]*font-size:\s*12px/);
  assert.match(styles, /\.mock-history-table strong\s*\{\s*font-size:\s*15px/);
  assert.match(styles, /\.member-material-card p\s*\{\s*font-size:\s*var\(--member-body\)/);
});

test("Second Seat instruments use body-copy sizing instead of microtype", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.second-seat-system-controls button strong\s*\{\s*font-size:\s*13\.5px/);
  assert.match(styles, /\.second-seat-system-readout p\s*\{\s*font-size:\s*16px/);
  assert.match(styles, /\.second-seat-live-boundary p\s*\{\s*font-size:\s*14px/);
  assert.match(styles, /\.foundation-route-map li strong\s*\{\s*font-size:\s*15px/);
});

test("prep system restores its animated orbit with readable benefit copy", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const component = await readFile(
    new URL("../app/components/prep-system-explorer.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /className="system-instrument system-instrument-orbital"/);
  assert.match(component, /className="instrument-orbit"/);
  assert.match(component, /className="instrument-rings"/);
  assert.match(component, /className="instrument-rotor"/);
  assert.match(component, /WHAT THIS SYSTEM UNLOCKS/);
  assert.match(styles, /\.system-instrument-orbital \.instrument-readout p[\s\S]*font-size:\s*22px/);
  assert.match(styles, /\.system-instrument-orbital \.instrument-readout li[\s\S]*font-size:\s*15\.5px/);
  assert.match(styles, /\.system-instrument-orbital \.instrument-status[\s\S]*font-size:\s*12px/);
});

test("diagnostic choices use presentation-scale typography", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.signal-answer-stack button\s*\{[\s\S]*min-height:\s*136px/);
  assert.match(styles, /\.signal-answer-stack button strong\s*\{[\s\S]*font-size:\s*clamp\(17px,\s*1\.22vw,\s*20px\)/);
  assert.match(styles, /\.signal-answer-stack button > span\s*\{[\s\S]*font-size:\s*12px/);
  assert.match(styles, /\.signal-report-readout p,[\s\S]*font-size:\s*15px/);
});

test("homepage pricing tiers use readable explanatory copy", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.home-pricing-section \.home-price-layer > p\s*\{[\s\S]*font-size:\s*12px/);
  assert.match(styles, /\.home-pricing-section \.home-price-layer dt\s*\{[\s\S]*font-size:\s*11px/);
  assert.match(styles, /\.home-pricing-section \.home-price-layer dd\s*\{[\s\S]*font-size:\s*16px/);
  assert.match(styles, /\.home-pricing-section \.home-price-layer > small\s*\{[\s\S]*font-size:\s*12px/);
  assert.match(styles, /\.home-pricing-section \.home-price-layer > a\s*\{[\s\S]*font-size:\s*16px/);
});

test("Second Seat pricing is visually dominant and cannot be bought directly", async () => {
  const response = await render("/pricing");
  assert.equal(response.status, 200);
  const html = await response.text();
  const text = visibleText(html);
  assert.match(text, /FOUNDATION CLEARANCE REQUIRED/i);
  assert.match(text, /Preview the Second Seat/i);
  assert.doesNotMatch(html, /href=["'][^"']*\/checkout\/ai-prep/i);

  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.pricing-layer-grid\s*\{[\s\S]*grid-template-columns:\s*\.82fr 1\.32fr \.82fr/);
  assert.match(styles, /\.pricing-layer-2\s*\{[\s\S]*min-height:\s*790px/);
});

test("member clearance is explicit sample state and independent of plan progress", async () => {
  const source = await readFile(new URL("../app/components/second-seat-clearance-panel.tsx", import.meta.url), "utf8");
  assert.match(source, /SECOND SEAT CLEARANCE/);
  assert.match(source, /CLEARANCE COMPLETE · SECOND SEAT AVAILABLE/);
  assert.match(source, /Controlled demo · sample clearance/);
  assert.match(source, /profile\.clearanceCompleted/);
  assert.doesNotMatch(source, /profile\.progress/);
  assert.match(source, /second_seat_eligibility_completed/);
  assert.match(source, /second_seat_unlock_started/);
});

test("controlled Second Seat demo contains one complete responsive loop", async () => {
  const source = await readFile(new URL("../app/learn/practice/practice-client.tsx", import.meta.url), "utf8");
  assert.match(source, /How would you design a rate limiter\?/);
  assert.match(source, /INTERVIEWER/);
  assert.match(source, /SYSTEM DESIGNER/);
  assert.match(source, /COMMUNICATION/);
  assert.match(source, /briefing.*answer.*perspectives.*followup.*complete/);
  assert.match(source, /briefing:\s*0[\s\S]*answer:\s*25[\s\S]*perspectives:\s*65[\s\S]*complete:\s*100/);
  assert.match(source, /CONTROLLED DEMO SAMPLE/);
  assert.match(source, /120 min/);
  assert.match(source, /Foundation learners can unlock the complete Second Seat after clearance/);
});

test("all Second Seat funnel events are declared and intentionally emitted", async () => {
  const analytics = await readFile(new URL("../app/lib/analytics.ts", import.meta.url), "utf8");
  const source = await Promise.all([
    readFile(new URL("../app/components/second-seat-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/second-seat-clearance-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/learn/practice/practice-client.tsx", import.meta.url), "utf8"),
  ]).then((files) => files.join("\n"));
  for (const event of [
    "second_seat_teaser_viewed",
    "second_seat_preview_started",
    "second_seat_preview_completed",
    "second_seat_perspective_changed",
    "foundation_clearance_viewed",
    "foundation_checkout_started",
    "second_seat_eligibility_completed",
    "second_seat_unlock_started",
    "practice_time_viewed",
    "practice_time_topup_started",
    "human_calibration_viewed",
  ]) {
    assert.match(analytics, new RegExp(event));
    assert.match(source, new RegExp(event));
  }
});

test("social metadata uses the Second Seat release artwork", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /og-second-seat-v1\.png/);
  assert.match(layout, /Build the flight plan\. Unlock the Second Seat\./);
});

test("demo chooser is not constrained by the member application shell", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.doesNotMatch(styles, /\.member-shell\s*,\s*\.demo-login-page\s*\{/);
  assert.match(styles, /\.member-shell\s*\{[\s\S]*grid-template-columns:\s*232px minmax\(0, 1fr\) 218px/);
  assert.match(styles, /\.demo-login-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(390px, \.76fr\) minmax\(0, 1\.24fr\)/);
});
