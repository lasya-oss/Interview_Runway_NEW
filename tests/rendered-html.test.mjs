import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SignJWT } from "jose";

let renderSequence = 0;
const testSessionSecret = "interviewrunway-test-session-secret-2026-07-17";
const testAuthSessionSecret =
  "interviewrunway-google-auth-test-session-secret-2026-07-26";
const testGoogleClientId = "test-client.apps.googleusercontent.com";
const testReplayChunk = "static replay chunk";
process.env.DEMO_SESSION_SECRET = testSessionSecret;
process.env.AUTH_ALLOWED_DOMAIN = "vividlabsai.com";
process.env.AUTH_SESSION_SECRET = testAuthSessionSecret;
process.env.GOOGLE_CLIENT_ID = testGoogleClientId;

let workspaceSessionCookie;

async function getWorkspaceSessionCookie() {
  if (workspaceSessionCookie) return workspaceSessionCookie;

  const token = await new SignJWT({
    email: "pratheep@vividlabsai.com",
    hd: "vividlabsai.com",
    name: "Pratheep Venkataiah",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("test-vivid-labs-user")
    .setIssuer("interviewrunway")
    .setAudience("interviewrunway-web")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(testAuthSessionSecret));

  workspaceSessionCookie = `interviewrunway_session=${token}`;
  return workspaceSessionCookie;
}

async function request(pathname = "/", init = {}, authenticated = true) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${renderSequence++}`,
  );
  const { default: worker } = await import(workerUrl.href);
  const headers = new Headers({ accept: "text/html" });
  if (authenticated) {
    headers.set("cookie", await getWorkspaceSessionCookie());
  }
  for (const [key, value] of new Headers(init.headers).entries()) {
    if (key === "cookie" && headers.has("cookie")) {
      headers.set("cookie", `${headers.get("cookie")}; ${value}`);
    } else {
      headers.set(key, value);
    }
  }

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost"), {
      ...init,
      headers,
    }),
    {
      ASSETS: {
        fetch: async (assetRequest) => {
          const assetPath = new URL(assetRequest.url).pathname;
          if (assetPath.startsWith("/drive-materials/")) {
            const filename = decodeURIComponent(assetPath.slice("/drive-materials/".length));
            if (!filename.includes("/")) {
              try {
                const body = await readFile(new URL(`../public/drive-materials/${filename}`, import.meta.url));
                return new Response(body, {
                  headers: { "content-type": filename.endsWith(".txt") ? "text/plain" : "text/markdown" },
                });
              } catch {
                // Fall through to the normal missing-asset response.
              }
            }
          }
          if (assetPath === "/pdf-guides/sysdesign_url-shortener-walkthrough.pdf") {
            return new Response("%PDF-test", {
              headers: { "content-type": "application/octet-stream", "content-length": "9" },
            });
          }
          return new Response("Not found", { status: 404 });
        },
      },
      REPLAY_ASSETS: {
        list: async ({ prefix }) => {
          const parts = {
            "mock_behavioral_customer-integrity_05.mp4.part-00": testReplayChunk,
            "mock_behavioral_customer-integrity_05.mp4.part-01": "second replay chunk",
          };
          return {
            objects: Object.entries(parts)
              .filter(([name]) => name.startsWith(prefix))
              .map(([key, value]) => ({ key, size: value.length })),
          };
        },
        get: async (name, options = {}) => {
          const parts = {
            "mock_behavioral_customer-integrity_05.mp4.part-00": testReplayChunk,
            "mock_behavioral_customer-integrity_05.mp4.part-01": "second replay chunk",
          };
          const value = parts[name];
          if (!value) return null;
          const offset = options.range?.offset ?? 0;
          const length = options.range?.length ?? value.length - offset;
          const body = new Blob([value.slice(offset, offset + length)]);
          return {
            body: body.stream(),
            size: body.size,
            httpEtag: '"test-replay-etag"',
          };
        },
      },
      AUTH_ALLOWED_DOMAIN: "vividlabsai.com",
      AUTH_SESSION_SECRET: testAuthSessionSecret,
      DEMO_SESSION_SECRET: testSessionSecret,
      GOOGLE_CLIENT_ID: testGoogleClientId,
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
  assert.match(text, /One system · three connected stages/i);
  assert.match(text, /AI practice that changes with your answers/i);
  assert.match(text, /WhatsApp guidance from engineers with FAANG and leading-tech experience/i);
  assert.match(text, /Why capable candidates still get overlooked/i);
  assert.match(text, /How InterviewRunway closes the gap/i);
  assert.match(text, /Check your interview signal/i);
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
});

test("anonymous visitors are sent to the Vivid Labs Google sign-in", async () => {
  const response = await request("/", {}, false);
  assert.equal(response.status, 307);
  assert.match(
    response.headers.get("location") ?? "",
    /\/sign-in\?return_to=%2F$/,
  );

  const signIn = await request("/sign-in", {}, false);
  assert.equal(signIn.status, 200);
  const signInText = visibleText(await signIn.text());
  assert.match(signInText, /Authorized crew only/i);
  assert.match(signInText, /@vividlabsai\.com/i);
});

test("www traffic uses the Google-enabled apex domain", async () => {
  const response = await request(
    "/pricing?source=www",
    { headers: { host: "www.interviewrunway.com" } },
    false,
  );
  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "http://interviewrunway.com/pricing?source=www",
  );
});

test("application pages stay protected", async () => {
  const protectedPage = await request("/learn/practice", {}, false);
  assert.equal(protectedPage.status, 307);
  assert.match(protectedPage.headers.get("location") ?? "", /\/sign-in\?/i);
});

test("R2 replay assets are served without a separate Drive permission", async () => {
  const response = await request(
    "/api/replay-assets/mock_behavioral_customer-integrity_05.mp4.part-00",
    {},
    false,
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), testReplayChunk);
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
});

test("R2 replay videos stream as one range-capable MP4 without buffering every chunk", async () => {
  const response = await request(
    "/api/replay-assets/mock_behavioral_customer-integrity_05.mp4",
    { headers: { range: "bytes=7-18" } },
    false,
  );
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-type"), "video/mp4");
  assert.equal(response.headers.get("content-range"), "bytes 7-18/38");
  assert.equal(await response.text(), "replay chunk");
});

test("PDF guides are served inline from first-party assets without Drive authorization", async () => {
  const response = await request(
    "/pdf-guides/sysdesign_url-shortener-walkthrough.pdf",
    {},
    false,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.equal(response.headers.get("content-disposition"), "inline");
  assert.equal(await response.text(), "%PDF-test");
});

test("Vault template and explainer actions open first-party inline PDF previews", async () => {
  const libraryStartHere = await readFile(
    new URL("../app/learn/library/library-start-here.tsx", import.meta.url),
    "utf8",
  );
  const previewRoute = await readFile(
    new URL("../app/api/learn/library/material-preview/[slug]/route.ts", import.meta.url),
    "utf8",
  );
  const materialViewer = await readFile(
    new URL("../app/learn/library/material-viewer.tsx", import.meta.url),
    "utf8",
  );

  assert.match(libraryStartHere, /driveMaterialPreviewHref\(material\)/i);
  assert.match(libraryStartHere, /target=\{record\.external \? "_blank"/i);
  assert.match(previewRoute, /Content-Type.*application\/pdf/i);
  assert.match(previewRoute, /Content-Disposition.*inline/i);
  assert.match(previewRoute, /readFirstPartyText/i);
  assert.match(materialViewer, /createTextPdf/i);

  const login = await request("/api/demo-session", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({ preview: "foundation" }),
  });
  assert.equal(login.status, 200);
  const demoSessionCookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
  assert.match(demoSessionCookie, /^ir_demo_session=/i);

  for (const slug of [
    "template-weekly-prep-tracker-docx-yzovxjy1",
    "dsa-binary-search-01-mp4-k8sh5_uz",
  ]) {
    const response = await request(`/api/learn/library/material-preview/${slug}`, {
      headers: { accept: "application/pdf", cookie: demoSessionCookie },
    });
    assert.equal(response.status, 200, slug);
    assert.equal(response.headers.get("content-type"), "application/pdf", slug);
    assert.match(response.headers.get("content-disposition") ?? "", /^inline;/i, slug);
    assert.equal((await response.text()).slice(0, 8), "%PDF-1.4", slug);
  }
});

test("PDF viewer shows a record header and user-controlled fullscreen option", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const pdfShelf = await readFile(
    new URL("../app/learn/library/pdf-guide-shelf.tsx", import.meta.url),
    "utf8",
  );
  const driveShelf = await readFile(
    new URL("../app/learn/library/drive-material-shelf.tsx", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.library-pdf-dialog\s*\{[^}]*inset:\s*0;[^}]*padding:\s*0;/);
  assert.match(styles, /\.library-pdf-dialog__surface\s*\{[^}]*width:\s*100%;[^}]*height:\s*100dvh;[^}]*border:\s*0;[^}]*border-radius:\s*0;/);
  assert.match(styles, /\.library-pdf-dialog__header\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between;/);
  assert.match(styles, /\.library-pdf-dialog__viewer\s*\{[^}]*min-height:\s*0;[^}]*padding:\s*14px;/);
  assert.match(styles, /\.library-pdf-dialog__viewer iframe\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*border:/);
  assert.match(pdfShelf, /library-pdf-dialog__header/);
  assert.match(pdfShelf, /library-pdf-dialog__fullscreen/);
  assert.match(pdfShelf, /viewer\.requestFullscreen\(\)/);
  assert.match(pdfShelf, /viewerRef/);
  assert.match(styles, /\.library-pdf-dialog__viewer:fullscreen\s*\{[^}]*padding:\s*0;/);
  assert.match(pdfShelf, /library-pdf-dialog\$\{isFullscreen/);
  assert.match(styles, /\.library-pdf-dialog\.is-fullscreen \.library-pdf-dialog__header\s*\{[^}]*display:\s*none;/);
  assert.doesNotMatch(pdfShelf, /document\.documentElement\.requestFullscreen\(\)/);
  assert.match(styles, /\.library-material-dialog\s*\{[^}]*inset:\s*0;[^}]*padding:\s*0;/);
  assert.match(styles, /\.library-material-dialog__surface\s*\{[^}]*width:\s*100%;[^}]*height:\s*100dvh;[^}]*border:\s*0;[^}]*border-radius:\s*0;/);
  assert.match(styles, /\.library-material-dialog__body\s*>\s*\.library-material-pdf-frame\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*0;/);
  assert.match(styles, /\.library-material-dialog__body:fullscreen\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100dvh;/);
  assert.match(driveShelf, /<div ref=\{viewerRef\} className="library-material-dialog__body">\s*<MaterialViewer/);
  assert.doesNotMatch(driveShelf, /<div className="library-material-viewer">/);
});

test("Library categories expose filtered records and real content viewers", async () => {
  const libraryClient = await readFile(
    new URL("../app/learn/library/library-client.tsx", import.meta.url),
    "utf8",
  );
  const libraryStartHere = await readFile(
    new URL("../app/learn/library/library-start-here.tsx", import.meta.url),
    "utf8",
  );
  const materialViewer = await readFile(
    new URL("../app/learn/library/material-viewer.tsx", import.meta.url),
    "utf8",
  );
  const driveReplayPlayer = await readFile(
    new URL("../app/learn/practice/replays/drive-replay-player.tsx", import.meta.url),
    "utf8",
  );

  assert.match(libraryClient, /<strong>1000\+<\/strong>/i);
  assert.match(libraryClient, /aria-expanded=\{category === item\}/i);
  assert.match(libraryClient, /id="library-category-results"/i);
  assert.match(libraryClient, /className="library-category-view"/i);
  assert.match(libraryClient, /Back to categories/i);
  assert.match(libraryClient, /onClick=\{\(\) => setCategory\(item\)\}/i);
  assert.match(libraryClient, /library-category-view__records">\{renderResults\(false\)\}/i);
  assert.match(libraryClient, /import\("\.\/library-catalog"\)/i);
  assert.match(libraryClient, /Choose a category to open its records/i);
  assert.match(libraryClient, /library-catalog-loading/i);
  assert.match(libraryStartHere, /Not sure where to start\? Build your preparation from the right foundation\./i);
  assert.match(libraryStartHere, /<span>Choose your focus<\/span>/i);
  assert.match(libraryStartHere, /record\.domain === domain/i);
  assert.match(libraryStartHere, /normalizedFilename\.startsWith\("dsa_"\)/i);
  assert.match(libraryStartHere, /normalizedFilename\.startsWith\("sysdesign_"\)/i);
  assert.match(libraryStartHere, /selectedLevel/);
  assert.match(libraryStartHere, /className="library-start-here__level-card/);
  assert.match(libraryStartHere, /onClick=\{\(\) => setSelectedLevel\(level\.id\)\}/i);
  assert.match(libraryStartHere, /matchingRecords\.filter\(\(record\) => record\.level === selectedLevel\)/i);
  assert.match(libraryStartHere, /scrollIntoView/);
  assert.doesNotMatch(libraryStartHere, /VAULT_START_HERE_ROLES|StartHereRole|setRole/i);
  assert.doesNotMatch(libraryStartHere, /Select a role or domain/i);
  assert.match(libraryClient, /material\.demoAsset\.href/i);
  assert.match(libraryClient, /Open actual content/i);
  assert.match(materialViewer, /DriveReplayPlayer/i);
  assert.match(materialViewer, /mediaType=\{displayKind\}/i);
  assert.match(materialViewer, /displayKind === "video" \|\| displayKind === "audio"/i);
  assert.match(materialViewer, /companionPdfUrl/i);
  assert.match(materialViewer, /Prefer that companion/i);
  assert.match(libraryStartHere, /action: material\.kind === "template" \? "Open template" : "Open explainer",\s*external: true,/i);
  assert.match(driveReplayPlayer, /mediaType\?: "video" \| "audio"/i);
  assert.match(driveReplayPlayer, /<audio className="library-material-audio-player"/i);
});

const coreRoutes = [
  {
    pathname: "/vault",
    expected: [/The Vault/i, /₹799/],
  },
  {
    pathname: "/second-seat",
    expected: [/The Second Seat/i, /(?:mock interviews?|Vault (?:buyers|owners))/i],
  },
  {
    pathname: "/premium",
    expected: [/(?:1:1 Coaching|Human Calibration)/i, /(?:capacity|qualification|evidence review)/i],
  },
  {
    pathname: "/checkout/vault",
    expected: [/secure checkout/i, /₹799/, /one-time purchase/i],
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
  ["/pricing", [/One continuous flight path/i, /The Second Seat/i, /Human Calibration/i, /₹2,499/i, /By qualification/i]],
  ["/qualify", [/Phase 03 · Human Calibration/i, /Check if I qualify/i, /Foundation complete/i, /Second Seat evidence/i]],
  ["/curriculum", [/Curriculum/i, /Five records below have been built as pilot outputs/i]],
  ["/demo-login", [/Choose a layer/i, /Enter the workspace/i, /Ananya Rao/i, /Rohan Mehta/i, /Meera Iyer/i, /Sliding Window Pattern Reference/i]],
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
  assert.match(text, /Controlled Second Seat demo/i);
  assert.match(text, /Good evening Pratheep\s*\./i);
  assert.match(text, /Enter the Second Seat demo/i);
  assert.doesNotMatch(text, /Enter the sample workspaces/i);
});

test("legacy AI Prep URL redirects to the canonical Second Seat route", async () => {
  const response = await render("/ai-prep");
  assert.ok([301, 302, 303, 307, 308].includes(response.status));
  assert.match(response.headers.get("location") ?? "", /\/second-seat$/);
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
  const dashboardHtml = await dashboard.text();
  const dashboardText = visibleText(dashboardHtml);
  assert.match(dashboardText, /Start here · Week 1 of 4/i);
  assert.match(dashboardText, /Choose your first practice round/i);
  assert.match(dashboardText, /Demo workspace/i);
  assert.match(dashboardText, /0 \/ 12/i);
  assert.match(dashboardText, /Second Seat \/ Today/i);
  assert.match(dashboardText, /The Second Seat workspace/i);
  assert.doesNotMatch(dashboardHtml, /member-ops-rail(?:\b|-)/i);
  assert.doesNotMatch(dashboardText, /Good evening, Rohan|Every attempt leaves evidence|4h 38m|Adaptive mock 08/i);
  assert.doesNotMatch(dashboardText, /fictional learner data/i);

  const secondSeatSidebar = dashboardHtml.match(/<aside\b[^>]*member-sidebar[^>]*>[\s\S]*?<\/aside>/i)?.[0] ?? "";
  assert.doesNotMatch(secondSeatSidebar, /member-plan-card|Current access/i);
  assert.match(dashboardHtml, /<section\b[^>]*ops-current-access[^>]*>[\s\S]*?Current access[\s\S]*?<\/section>/i);
  assert.equal((dashboardHtml.match(/<div\b[^>]*class=["'][^"']*member-plan-card member-plan-card-status["']/gi) ?? []).length, 1);

  const library = await request("/learn/library", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(library.status, 200);
  const libraryHtml = await library.text();
  assert.match(visibleText(libraryHtml), /1000\+\s+Resources\s+Available/i);
  assert.match(visibleText(libraryHtml), /Choose a category to open its records/i);
  assert.match(visibleText(libraryHtml), /All\s+1,\d{3}/i);
  assert.doesNotMatch(visibleText(libraryHtml), /Drive PDF guides/i);
  assert.doesNotMatch(libraryHtml, /class="library-record-list library-pdf-record-list"/i);
  assert.doesNotMatch(libraryHtml, /class="library-record library-pdf-record"/i);
  assert.doesNotMatch(visibleText(libraryHtml), /sysdesign_url-shortener-walkthrough\.pdf/i);
  assert.doesNotMatch(libraryHtml, /<a[^>]+drive\.google\.com/i);

  for (const pathname of ["/learn/roadmap", "/learn/practice", "/learn/feedback", "/learn/coaching"]) {
    const sectionResponse = await request(pathname, {
      headers: { accept: "text/html", cookie: sessionCookie },
    });
    assert.equal(sectionResponse.status, 200, pathname);
    const sectionHtml = await sectionResponse.text();
    const sectionSidebar = sectionHtml.match(/<aside\b[^>]*member-sidebar[^>]*>[\s\S]*?<\/aside>/i)?.[0] ?? "";
    assert.doesNotMatch(sectionSidebar, /member-plan-card|Current access/i, pathname);
    assert.match(sectionHtml, /<section\b[^>]*ops-current-access[^>]*>[\s\S]*?Current access[\s\S]*?<\/section>/i, pathname);
  }

  const driveShelf = await readFile(
    new URL("../app/learn/library/drive-material-shelf.tsx", import.meta.url),
    "utf8",
  );
  assert.match(driveShelf, /className="library-record-open"/i);
  assert.match(driveShelf, /aria-haspopup="dialog"/i);
  assert.match(driveShelf, /library-material-dialog/i);
  assert.match(driveShelf, /DRIVE_MATERIAL_CONTENT/i);
  assert.match(driveShelf, /driveMaterialCompanionAssetHref/i);
  assert.doesNotMatch(driveShelf, /<Link\b/i);
  const pdfShelf = await readFile(
    new URL("../app/learn/library/pdf-guide-shelf.tsx", import.meta.url),
    "utf8",
  );
  assert.match(pdfShelf, /aria-haspopup="dialog"/i);
  assert.match(pdfShelf, /role="dialog"/i);
  assert.match(pdfShelf, /drivePdfPreviewHref\(activeGuide\.id\)/i);
  assert.match(pdfShelf, /<article className="library-record library-pdf-record"/i);
  assert.match(pdfShelf, /className="library-record-open"/i);
  assert.doesNotMatch(pdfShelf, /<button\s+className="library-record library-pdf-record"/i);
  assert.doesNotMatch(pdfShelf, /Read inside InterviewRunway/i);
  assert.doesNotMatch(pdfShelf, /drive\.google\.com/i);
  assert.match(pdfShelf, /pdf-guides/);

  const driveMaterial = await request("/learn/library/material/template-weekly-prep-tracker-docx-yzovxjy1", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(driveMaterial.status, 200);
  const driveMaterialHtml = await driveMaterial.text();
  assert.match(visibleText(driveMaterialHtml), /Weekly Prep Tracker/i);
  assert.match(visibleText(driveMaterialHtml), /Editable Word templates/i);
  assert.match(visibleText(driveMaterialHtml), /Open material/i);
  assert.match(visibleText(driveMaterialHtml), /PDF Preparing the PDF preview inside InterviewRunway/i);
  assert.match(driveMaterialHtml, /class="library-material-viewer"/i);
  assert.match(driveMaterialHtml, /class="library-material-pdf-state library-material-state"/i);
  assert.doesNotMatch(visibleText(driveMaterialHtml), /Open in Drive/i);
  assert.doesNotMatch(driveMaterialHtml, /drive\.google\.com/i);
  assert.match(driveMaterialHtml, /Original file preserved/i);
  assert.doesNotMatch(visibleText(driveMaterialHtml), /Material context/i);
  assert.doesNotMatch(driveMaterialHtml, /class="material-next-step"/i);

  const vaultReadme = await request("/learn/library/material/vault-readme-md-nqbojpax", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(vaultReadme.status, 200);
  const vaultReadmeHtml = await vaultReadme.text();
  assert.match(visibleText(vaultReadmeHtml), /PDF Preparing the PDF preview inside InterviewRunway/i);
  assert.match(vaultReadmeHtml, /class="library-material-pdf-state library-material-state"/i);
  assert.doesNotMatch(vaultReadmeHtml, /class="library-material-text"/i);
  assert.doesNotMatch(visibleText(vaultReadmeHtml), /catalogued in InterviewRunway/i);

  const materialViewer = await readFile(
    new URL("../app/learn/library/material-viewer.tsx", import.meta.url),
    "utf8",
  );
  assert.match(materialViewer, /content\?: string \| null/i);
  assert.match(materialViewer, /fallbackAssetUrl\?: string \| null/i);
  assert.match(materialViewer, /createTextPdf/i);
  assert.match(materialViewer, /application\/pdf/i);
  assert.match(materialViewer, /library-material-pdf-frame/i);
  assert.match(materialViewer, /PDF preview for/i);
  assert.doesNotMatch(materialViewer, /catalogued in InterviewRunway and will open here/i);
  assert.match(materialViewer, /in-app PDF preview/i);
  assert.doesNotMatch(materialViewer, /Allow material access/i);
  assert.doesNotMatch(materialViewer, /requestAccessToken|accounts\.oauth2|Authorization:.*Bearer/i);
  assert.doesNotMatch(materialViewer, /drive\.google\.com/i);
  assert.match(driveShelf, /library-pdf-dialog__fullscreen/i);
  assert.match(driveShelf, /requestFullscreen\(\)/i);
  assert.match(driveShelf, /fullscreenchange/i);

  const roadmap = await request("/learn/roadmap", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(roadmap.status, 200);
  const roadmapHtml = await roadmap.text();
  const roadmapText = visibleText(roadmapHtml);
  assert.match(roadmapText, /Open learning content/i);
  assert.match(roadmapText, /View learning brief/i);
  assert.match(roadmapHtml, /href=["'][^"']*\/learn\/material\/notification-mock["']/i);
  assert.match(roadmapHtml, /href=["'][^"']*\/learn\/roadmap\/task\/4w-3-correct["']/i);

  const material = await request("/learn/material/notification-mock", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(material.status, 200);
  assert.match(visibleText(await material.text()), /Design a notification service/i);

  const planned = await request("/learn/roadmap/task/4w-3-correct", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(planned.status, 200);
  const plannedText = visibleText(await planned.text());
  assert.match(plannedText, /The destination exists; the reviewed lesson does not yet/i);
  assert.match(plannedText, /Scored feedback loop and re-test worksheet/i);

  const practice = await request("/learn/practice", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(practice.status, 200);
  const practiceHtml = await practice.text();
  assert.match(visibleText(practiceHtml), /Mock interview replays/i);
  assert.match(visibleText(practiceHtml), /30 replays/i);
  assert.match(practiceHtml, /href=["'][^"']*\/learn\/practice\/replays\/coding-dynamic-programming-05["']/i);

  const replay = await request("/learn/practice/replays/coding-dynamic-programming-05", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(replay.status, 200);
  const replayHtml = await replay.text();
  const replayText = visibleText(replayHtml);
  assert.match(replayText, /Dynamic programming mock interview/i);
  assert.match(replayText, /Source unchanged/i);
  assert.match(replayText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(replayHtml, /data-replay-part-count=["']4["']/i);
  assert.match(
    replayHtml,
    /\/api\/replay-assets\/mock_coding_dynamic-programming_05\.mp4/i,
  );
  assert.doesNotMatch(replayHtml, /data-google-drive-file-id=/i);
  assert.doesNotMatch(replayHtml, /Allow replay access|Preparing the protected replay/i);
  assert.doesNotMatch(replayHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(replayHtml, /href=["'][^"']*\/learn\/roadmap\/task\/4w-1-patterns["']/i);

  const behavioralReplay = await request("/learn/practice/replays/behavioural-prioritizing-under-product-ambiguity-03", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(behavioralReplay.status, 200);
  const behavioralHtml = await behavioralReplay.text();
  const behavioralText = visibleText(behavioralHtml);
  assert.match(behavioralText, /Prioritizing under product ambiguity/i);
  assert.match(behavioralText, /Source unchanged/i);
  assert.match(behavioralText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(behavioralHtml, /data-replay-part-count=["']3["']/i);
  assert.doesNotMatch(behavioralHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(behavioralHtml, /href=["'][^"']*\/learn\/material\/scope-stories["']/i);

  const bfsReplay = await request("/learn/practice/replays/coding-bfs-debugging-06", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(bfsReplay.status, 200);
  const bfsHtml = await bfsReplay.text();
  const bfsText = visibleText(bfsHtml);
  assert.match(bfsText, /BFS debugging mock interview/i);
  assert.match(bfsText, /Replay 03/i);
  assert.match(bfsText, /Source unchanged/i);
  assert.match(bfsHtml, /data-replay-part-count=["']4["']/i);
  assert.doesNotMatch(bfsHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(bfsHtml, /href=["'][^"']*\/learn\/material\/graph-traversal["']/i);

  const remoteCollaborationReplay = await request("/learn/practice/replays/behavioural-remote-collaboration-06", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(remoteCollaborationReplay.status, 200);
  const remoteCollaborationHtml = await remoteCollaborationReplay.text();
  const remoteCollaborationText = visibleText(remoteCollaborationHtml);
  assert.match(remoteCollaborationText, /Remote collaboration mock interview/i);
  assert.match(remoteCollaborationText, /Replay 04/i);
  assert.match(remoteCollaborationText, /Source unchanged/i);
  assert.match(remoteCollaborationText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(remoteCollaborationHtml, /data-replay-part-count=["']3["']/i);
  assert.doesNotMatch(remoteCollaborationHtml, /data-google-drive-file-id=["']1UdJnFdWLB1jPSLXW3biHcBGFomeCCyxQ["']/i);
  assert.doesNotMatch(remoteCollaborationHtml, /Allow replay access|Preparing the protected replay/i);
  assert.doesNotMatch(remoteCollaborationHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(remoteCollaborationHtml, /href=["'][^"']*\/learn\/material\/scope-stories["']/i);

  const ownershipFailureReplay = await request("/learn/practice/replays/behavioural-ownership-after-failure-01", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(ownershipFailureReplay.status, 200);
  const ownershipFailureHtml = await ownershipFailureReplay.text();
  const ownershipFailureText = visibleText(ownershipFailureHtml);
  assert.match(ownershipFailureText, /Ownership after failure mock interview/i);
  assert.match(ownershipFailureText, /Replay 05/i);
  assert.match(ownershipFailureText, /Source unchanged/i);
  assert.match(ownershipFailureText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(ownershipFailureHtml, /data-replay-part-count=["']3["']/i);
  assert.doesNotMatch(ownershipFailureHtml, /data-google-drive-file-id=["']10uxp_B7ia6Zx1JZ7vZODNds7LPpovN3Z["']/i);
  assert.doesNotMatch(ownershipFailureHtml, /Allow replay access|Preparing the protected replay/i);
  assert.doesNotMatch(ownershipFailureHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(ownershipFailureHtml, /href=["'][^"']*\/learn\/material\/outage-story["']/i);

  const influenceReplay = await request("/learn/practice/replays/behavioural-leadership-without-manager-title-04", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(influenceReplay.status, 200);
  const influenceHtml = await influenceReplay.text();
  const influenceText = visibleText(influenceHtml);
  assert.match(influenceText, /Leadership without a manager title mock interview/i);
  assert.match(influenceText, /Replay 06/i);
  assert.match(influenceText, /Source unchanged/i);
  assert.match(influenceText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(influenceHtml, /data-replay-part-count=["']4["']/i);
  assert.doesNotMatch(influenceHtml, /data-google-drive-file-id=["']1lA7PeRlyBNBKaTCAVBTS6JwpqxWT0Y74["']/i);
  assert.doesNotMatch(influenceHtml, /Allow replay access|Preparing the protected replay/i);
  assert.doesNotMatch(influenceHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(influenceHtml, /href=["'][^"']*\/learn\/material\/scope-stories["']/i);

  const customerIntegrityReplay = await request("/learn/practice/replays/behavioural-customer-integrity-05", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(customerIntegrityReplay.status, 200);
  const customerIntegrityHtml = await customerIntegrityReplay.text();
  const customerIntegrityText = visibleText(customerIntegrityHtml);
  assert.match(customerIntegrityText, /Customer integrity mock interview/i);
  assert.match(customerIntegrityText, /Replay 07/i);
  assert.match(customerIntegrityText, /Source unchanged/i);
  assert.match(customerIntegrityText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(customerIntegrityHtml, /data-replay-part-count=["']4["']/i);
  assert.match(
    customerIntegrityHtml,
    /\/api\/replay-assets\/mock_behavioral_customer-integrity_05\.mp4/i,
  );
  assert.doesNotMatch(customerIntegrityHtml, /data-google-drive-file-id=["']1E8Ikzlbc2dlulNURVvijiy3MFojrzlIO["']/i);
  assert.doesNotMatch(customerIntegrityHtml, /Allow replay access|Preparing the protected replay/i);
  assert.doesNotMatch(customerIntegrityHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(customerIntegrityHtml, /href=["'][^"']*\/learn\/material\/scope-stories["']/i);

  const conflictResolutionReplay = await request("/learn/practice/replays/behavioural-conflict-resolution-02", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(conflictResolutionReplay.status, 200);
  const conflictResolutionHtml = await conflictResolutionReplay.text();
  const conflictResolutionText = visibleText(conflictResolutionHtml);
  assert.match(conflictResolutionText, /Conflict resolution mock interview/i);
  assert.match(conflictResolutionText, /Replay 08/i);
  assert.match(conflictResolutionText, /Source unchanged/i);
  assert.match(conflictResolutionText, /Transcript \/ captions\s+Not supplied/i);
  assert.match(conflictResolutionHtml, /data-replay-part-count=["']4["']/i);
  assert.match(
    conflictResolutionHtml,
    /\/api\/replay-assets\/mock_behavioral_conflict_02\.mp4/i,
  );
  assert.doesNotMatch(conflictResolutionHtml, /data-google-drive-file-id=["']1MTv2BG_lIO8lM3ee0DMykRd26n5G2hRq["']/i);
  assert.doesNotMatch(conflictResolutionHtml, /Allow replay access|Preparing the protected replay/i);
  assert.doesNotMatch(conflictResolutionHtml, /<iframe[^>]+drive\.google\.com/i);
  assert.match(conflictResolutionHtml, /href=["'][^"']*\/learn\/material\/scope-stories["']/i);

  const newlyIntegratedReplays = [
    ["coding-heap-stream-04", "mock_coding_heap-stream_04.mp4", 4],
    ["coding-intervals-02", "mock_coding_intervals_02.mp4", 3],
    ["coding-sliding-window-01", "mock_coding_sliding-window_01.mp4", 4],
    ["coding-topological-sort-03", "mock_coding_topological-sort_03.mp4", 4],
    ["manager-api-migration-03", "mock_manager_api-migration_03.mp4", 4],
    ["manager-async-execution-06", "mock_manager_async-execution_06.mp4", 4],
    ["manager-backend-project-01", "mock_manager_backend-project_01.mp4", 4],
    ["manager-frontend-performance-04", "mock_manager_frontend-performance_04.mp4", 4],
    ["manager-incident-02", "mock_manager_incident_02.mp4", 4],
    ["manager-quality-mentoring-05", "mock_manager_quality-mentoring_05.mp4", 5],
    ["recruiter-data-short-tenure-05", "mock_recruiter_data-short-tenure_05.mp4", 3],
    ["recruiter-frontend-growth-02", "mock_recruiter_frontend-growth_02.mp4", 2],
    ["recruiter-fullstack-contractor-06", "mock_recruiter_fullstack-contractor_06.mp4", 3],
    ["recruiter-platform-eor-03", "mock_recruiter_platform-eor_03.mp4", 3],
    ["recruiter-remote-saas-backend-01", "mock_recruiter_remote-saas-backend_01.mp4", 3],
    ["recruiter-services-to-product-04", "mock_recruiter_services-to-product_04.mp4", 2],
    ["system-design-chat-04", "mock_sysdesign_chat_04.mp4", 4],
    ["system-design-file-storage-06", "mock_sysdesign_file-storage_06.mp4", 5],
    ["system-design-job-scheduler-05", "mock_sysdesign_job-scheduler_05.mp4", 5],
    ["system-design-notification-platform-02", "mock_sysdesign_notification-platform_02.mp4", 5],
    ["system-design-url-shortener-01", "mock_sysdesign_url-shortener_01.mp4", 5],
    ["system-design-webhook-delivery-03", "mock_sysdesign_webhook-delivery_03.mp4", 4],
  ];

  for (const [slug, filename, partCount] of newlyIntegratedReplays) {
    const integratedReplay = await request(`/learn/practice/replays/${slug}`, {
      headers: { accept: "text/html", cookie: sessionCookie },
    });
    assert.equal(integratedReplay.status, 200, slug);
    const integratedHtml = await integratedReplay.text();
    assert.match(integratedHtml, new RegExp(`data-replay-part-count=["']${partCount}["']`, "i"), slug);
    assert.ok(integratedHtml.includes(`/api/replay-assets/${filename}"`), slug);
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.doesNotMatch(integratedHtml, new RegExp(`/api/replay-assets/${escapedFilename}\\.part-00`, "i"), slug);
    assert.doesNotMatch(integratedHtml, /data-google-drive-file-id=/i, slug);
    assert.doesNotMatch(integratedHtml, /Allow replay access|Preparing the protected replay/i, slug);
    assert.doesNotMatch(integratedHtml, /<iframe[^>]+drive\.google\.com/i, slug);
  }

  const vaultLogin = await request("/api/demo-session", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      email: "foundation@demo.interviewrunway.com",
      password: "Vault799!",
    }),
  });
  assert.equal(vaultLogin.status, 200);
  const vaultCookie = (vaultLogin.headers.get("set-cookie") ?? "").split(";")[0];
  const vaultDashboard = await request("/learn", {
    headers: { accept: "text/html", cookie: vaultCookie },
  });
  assert.equal(vaultDashboard.status, 200);
  const vaultDashboardHtml = await vaultDashboard.text();
  const vaultDashboardText = visibleText(vaultDashboardHtml);
  assert.match(vaultDashboardHtml, /data-member-layout=["']vault["']/i);
  const statusDrawer = vaultDashboardHtml.match(/<details\b[^>]*member-status-drawer[^>]*>/i)?.[0] ?? "";
  assert.match(statusDrawer, /class=["'][^"']*member-status-drawer/i);
  assert.doesNotMatch(statusDrawer, /\bopen\b/i);
  assert.match(vaultDashboardHtml, /<summary\b[^>]*member-status-drawer-toggle/i);
  assert.doesNotMatch(vaultDashboardHtml, /member-ops-rail-collapsible|member-ops-rail-content/i);
  assert.match(vaultDashboardText, /Learner data\s+Sample profile/i);
  const vaultSidebar = vaultDashboardHtml.match(/<aside\b[^>]*member-sidebar[^>]*>[\s\S]*?<\/aside>/i)?.[0] ?? "";
  assert.doesNotMatch(vaultSidebar, /member-plan-card|Current access/i);
  assert.doesNotMatch(vaultDashboardHtml, /Current tasks/i);
  assert.match(vaultDashboardHtml, /<section\b[^>]*ops-current-access[^>]*>[\s\S]*?Current access[\s\S]*?<\/section>/i);
  assert.equal((vaultDashboardHtml.match(/<div\b[^>]*class=["']member-plan-card member-plan-card-status["']/gi) ?? []).length, 1);

  for (const [pathname, section] of [
    ["/learn/roadmap", "Roadmap"],
    ["/learn/library", "Library"],
    ["/learn/practice", "Practice"],
    ["/learn/feedback", "Feedback"],
    ["/learn/coaching", "Coach room"],
  ]) {
    const sectionResponse = await request(pathname, {
      headers: { accept: "text/html", cookie: vaultCookie },
    });
    assert.equal(sectionResponse.status, 200, pathname);
    const sectionHtml = await sectionResponse.text();
    assert.match(sectionHtml, /data-member-layout=["']vault["']/i, pathname);
    assert.match(sectionHtml, /class=["'][^"']*member-topbar-vault/i, pathname);
    assert.match(sectionHtml, new RegExp(`Vault(?:\\s*<!-- -->\\s*)* \/(?:\\s*<!-- -->\\s*)*${section}`, "i"), pathname);
    assert.doesNotMatch(sectionHtml, /member-ops-rail(?:\b|-)/i, pathname);
  }

  const lockedReplay = await request("/learn/practice/replays/coding-dynamic-programming-05", {
    headers: { accept: "text/html", cookie: vaultCookie },
  });
  assert.equal(lockedReplay.status, 200);
  assert.match(visibleText(await lockedReplay.text()), /This replay belongs to the practice layer/i);
});

test("Foundation demo Today renders the clean starting values", async () => {
  const login = await request("/api/demo-session", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({ preview: "foundation" }),
  });
  assert.equal(login.status, 200);

  const sessionCookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
  const dashboard = await request("/learn", {
    headers: { accept: "text/html", cookie: sessionCookie },
  });
  assert.equal(dashboard.status, 200);
  const dashboardText = visibleText(await dashboard.text());
  assert.match(dashboardText, /Start here · Week 1 of 12/i);
  assert.match(dashboardText, /0 Plan complete/i);
  assert.match(dashboardText, /Create the target-role map/i);
  assert.match(dashboardText, /0 \/ 24/i);
  assert.match(dashboardText, /Starts at 0m/i);
  assert.match(dashboardText, /After first study step/i);
  assert.doesNotMatch(dashboardText, /Friday · Week 2|18 Plan complete|5 \/ 9|2h 14m|Next review Sunday/i);
});

test("analytics contract is present on acquisition and payment surfaces", async () => {
  const homepage = await render();
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /data-analytics-event=["']hero_signal_cta_clicked["']/i);
  assert.match(homepageHtml, /pricing_tier_viewed/i);

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
  }, false);
  assert.equal(checkout.status, 401);
  assert.deepEqual(await checkout.json(), {
    ok: false,
    message: "Google sign-in is required.",
  });
});

test("Phase 3 qualification rejects incomplete submissions before persistence", async () => {
  const response = await request("/api/qualification", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({ accountEmail: "not-an-email" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /email address/i);
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

test("checkout collects the receipt email instead of prefilling the signed-in account", async () => {
  const source = await readFile(
    new URL("../app/checkout/[offer]/checkout-client.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /customer:\s*\{\s*email/);
  assert.match(source, /email you want on the receipt/i);
});

test("3D renderer uses Retina-class density and hardware antialiasing", async () => {
  const source = await readFile(new URL("../app/components/aero-canvases.tsx", import.meta.url), "utf8");
  assert.match(source, /dpr=\{tier === "full" \? \[1\.75, 2\.5\] : \[1\.25, 2\]\}/);
  assert.match(source, /antialias:\s*true/);
  assert.match(source, /precision:\s*"highp"/);
  assert.doesNotMatch(source, /antialias:\s*false/);
});

test("original 3D choreography is restored byte-for-byte", async () => {
  const source = await readFile(new URL("../app/components/aero-canvases.tsx", import.meta.url));
  const digest = createHash("sha256").update(source).digest("hex");
  assert.equal(digest, "71a38f0d35da7f75138021cead9daa8a8275ef68a36de12ab704e0744c3d36c0");
});

test("homepage uses the original trajectory sequence instead of the rejected Second Seat composition", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(source, /HomeAeroStage, TrajectorySequence/);
  assert.match(source, /<TrajectorySequence\s*\/>/);
  assert.match(source, /className="hero-signal-console"/);
  assert.doesNotMatch(source, /SecondSeatJourney|SecondSeatPreview|SecondSeatHeroInstrument/);
});

test("homepage adds the approved two-part briefing without replacing restored aero choreography", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const component = await readFile(
    new URL("../app/components/opening-flight-path.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const approvedVideo = await readFile(
    new URL("../app/components/approved-video-briefing.tsx", import.meta.url),
    "utf8",
  );
  const problemVideo = await readFile(
    new URL("../public/video/interviewrunway-part-1-problem-reframed.mp4", import.meta.url),
  );
  const solutionVideo = await readFile(
    new URL("../public/video/interviewrunway-part-2-three-phases.mp4", import.meta.url),
  );
  const audio = await readFile(
    new URL("../public/audio/interviewrunway-three-stage-pavitra2.mp3", import.meta.url),
  );
  const cueData = JSON.parse(
    await readFile(
      new URL("../public/audio/interviewrunway-three-stage-pavitra2.json", import.meta.url),
      "utf8",
    ),
  );
  const whatsappMark = await readFile(
    new URL("../public/brand/whatsapp.svg", import.meta.url),
    "utf8",
  );

  assert.match(page, /<OpeningFlightPath\s*\/>/);
  assert.match(page, /<HomeAeroStage\s*\/>[\s\S]*<OpeningFlightPath\s*\/>[\s\S]*<TrajectorySequence\s*\/>/);
  assert.match(component, /THE SECOND SEAT/);
  assert.match(component, /WhatsApp guidance from engineers with FAANG and leading-tech experience/);
  assert.match(component, /const FILM_BEATS/);
  assert.match(component, /flight-film__stage-map/);
  assert.match(component, /flight-film__stage-block--foundation/);
  assert.match(component, /flight-film__stage-block--second-seat/);
  assert.match(component, /flight-film__stage-block--calibration/);
  assert.match(component, /flight-film__live-caption/);
  assert.match(component, /flight-film__opening-sequence/);
  assert.match(component, /flight-film__foundation-scatter/);
  assert.match(component, /flight-film__finale-actions/);
  assert.match(component, /Start Foundation · ₹799 once/);
  assert.match(component, /<ApprovedVideoBriefing\s*\/>/);
  assert.match(approvedVideo, /interviewrunway-part-1-problem-reframed\.mp4/);
  assert.match(approvedVideo, /interviewrunway-part-2-three-phases\.mp4/);
  assert.match(approvedVideo, /<video[\s\S]*controls[\s\S]*playsInline/);
  assert.match(approvedVideo, /role="dialog"/);
  assert.match(approvedVideo, /Continue to Part 2/);
  assert.match(approvedVideo, /Check Phase 3 eligibility/);
  assert.match(component, /if \(isFinale\) return "is-final"/);
  assert.match(component, /if \(beat\.stage === "overview"\) return "is-unrevealed"/);
  assert.match(component, /if \(activeOrder > order\) return "is-complete is-revealed"/);
  assert.match(component, /data-phase=\{phase\}/);
  assert.match(component, /flight-film__whatsapp-mark/);
  assert.doesNotMatch(component, /<b>WA<\/b>/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /second_seat_preview_completed/);
  assert.match(styles, /\.opening-flight-path__instrument\s*\{[\s\S]*grid-template-columns:\s*minmax\(235px, \.82fr\) minmax\(500px, 1\.7fr\) minmax\(235px, \.82fr\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.opening-flight-path__loop-rotor/);
  assert.match(styles, /@media \(min-width: 901px\)[\s\S]*\.opening-flight-path \.opening-flight-path__inner\s*\{[\s\S]*width:\s*min\(1160px, calc\(100% - 64px\)\)/);
  assert.match(styles, /@media \(min-width: 901px\)[\s\S]*\.opening-flight-path \.opening-flight-path__instrument\s*\{[\s\S]*min-height:\s*clamp\(420px, 50vh, 510px\)/);
  assert.match(styles, /@media \(min-width: 901px\) and \(max-width: 1180px\)[\s\S]*grid-template-columns:\s*minmax\(180px, \.86fr\) minmax\(360px, 1\.5fr\) minmax\(180px, \.86fr\)/);
  assert.match(styles, /\.flight-film__value-annunciator/);
  assert.match(styles, /\.flight-film__live-caption[\s\S]*font-size:\s*clamp\(1rem, 1\.3vw, 1\.35rem\)/);
  assert.match(styles, /\.flight-film__stage-block\.is-unrevealed[\s\S]*visibility:\s*hidden/);
  assert.match(styles, /\.flight-film__visual\[data-phase="second-seat"\][\s\S]*\.flight-film__stage-block--foundation[\s\S]*opacity:\s*\.25/);
  assert.match(styles, /\.flight-film__visual\[data-phase="finale"\][\s\S]*\.flight-film__stage-block[\s\S]*opacity:\s*1/);
  assert.match(styles, /data-beat="seat-adaptive"[\s\S]*\.flight-film__perspective-lenses span:nth-child\(2\)/);
  assert.match(styles, /data-beat="calibration-brief"[\s\S]*\.flight-film__human-reticle/);
  assert.doesNotMatch(styles, /data-beat="signal-connected"[^\{]*\.flight-film__stage-block\.is-overview/);
  assert.match(styles, /mask:\s*url\("\/brand\/whatsapp\.svg"\)/);
  assert.match(whatsappMark, /<title>WhatsApp<\/title>/);
  assert.match(whatsappMark, /fill="#25D366"/);
  assert.ok(audio.byteLength > 1_000_000, "Pavitra2 narration should be a real mastered audio asset");
  assert.ok(problemVideo.byteLength > 8_000_000, "Part 1 should be a real web video asset");
  assert.ok(solutionVideo.byteLength > 8_000_000, "Part 2 should be a real web video asset");
  assert.ok(problemVideo.byteLength < 25 * 1024 * 1024, "Part 1 should stay below the static asset limit");
  assert.ok(solutionVideo.byteLength < 25 * 1024 * 1024, "Part 2 should stay below the static asset limit");
  assert.equal(cueData.voice.name, "Pavitra2");
  assert.equal(cueData.voice.id, "2e4f5fed-e691-4d6a-bdbe-82880007ad4b");
  assert.equal(cueData.scenes.length, 6);
  assert.ok(cueData.duration > 110 && cueData.duration < 120);
});

test("pricing keeps the accepted dominant Second Seat hierarchy", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = await readFile(new URL("../app/pricing/page.tsx", import.meta.url), "utf8");

  assert.match(styles, /\.pricing-layer-grid\s*\{[\s\S]*grid-template-columns:\s*\.82fr 1\.32fr \.82fr/);
  assert.match(styles, /\.pricing-layer-2\s*\{[\s\S]*min-height:\s*790px/);
  assert.match(source, /displayName:\s*"The Second Seat"/);
  assert.match(source, /href:\s*"\/second-seat"/);
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
  assert.match(source, /firstCrossing = smooth\(\(pathLocal - 0\.38\) \/ 0\.12\)/);
  assert.match(source, /secondCrossing = smooth\(\(pathLocal - 0\.62\) \/ 0\.12\)/);
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

  assert.match(styles, /--member-micro:\s*9px/);
  assert.match(styles, /--member-body:\s*12\.5px/);
  assert.match(styles, /\.member-nav a > b\s*\{\s*font-size:\s*13px/);
  assert.match(styles, /\.member-status-band strong\s*\{\s*font-size:\s*11px/);
  assert.match(styles, /\.mock-history-table strong\s*\{\s*font-size:\s*13\.5px/);
  assert.match(styles, /\.member-material-card p\s*\{\s*font-size:\s*var\(--member-body\)/);
});

test("Second Seat keeps the learner profile anchored at the bottom of the sidebar", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.member-shell\[data-member-layout="second-seat"\] \.member-profile-card\s*\{\s*margin-top:\s*auto/);
});

test("three-layer evidence readouts use body-copy sizing", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.trajectory-sequence \.chapter-readout dt[\s\S]*font-size:\s*10px/);
  assert.match(styles, /\.trajectory-sequence \.chapter-readout dd[\s\S]*font-size:\s*15\.5px/);
  assert.match(styles, /\.trajectory-sequence \.chapter-footer[\s\S]*font-size:\s*13\.5px/);
  assert.match(styles, /\.trajectory-sequence \.chapter-footer a\s*\{\s*font-size:\s*14px/);
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

test("demo chooser is not constrained by the member application shell", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.doesNotMatch(styles, /\.member-shell\s*,\s*\.demo-login-page\s*\{/);
  assert.match(styles, /\.member-shell\s*\{[\s\S]*grid-template-columns:\s*232px minmax\(0, 1fr\)/);
  assert.match(styles, /\.demo-login-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(390px, \.76fr\) minmax\(0, 1\.24fr\)/);
});

test("Vault roadmap destinations are complete Foundation lessons", async () => {
  const roadmap = await readFile(new URL("../app/lib/roadmap-data.ts", import.meta.url), "utf8");
  const vaultStart = roadmap.indexOf("export const TWELVE_WEEK_PLAN");
  assert.notEqual(vaultStart, -1);

  const vaultPlan = roadmap.slice(vaultStart);
  assert.doesNotMatch(vaultPlan, /\bplanned\s*\(/);
  assert.match(vaultPlan, /\blesson\s*\(/);
  assert.doesNotMatch(vaultPlan, /queue-backlog-mock|interview-day-run-sheet/);
});

test("Vault review materials do not point at legacy demo PDFs", async () => {
  const data = await readFile(new URL("../app/lib/demo-data.ts", import.meta.url), "utf8");
  const libraryPage = await readFile(new URL("../app/learn/library/page.tsx", import.meta.url), "utf8");
  const libraryCatalog = await readFile(new URL("../app/learn/library/library-catalog.ts", import.meta.url), "utf8");
  assert.doesNotMatch(data, /\/demo-materials\/(?:roadmap_4week|dsa_sliding-window)\.(?:pdf|png)/i);
  assert.match(data, /\/pdf-guides\/roadmap_12week\.pdf/i);
  assert.match(data, /\/pdf-guides\/dsa_sliding-window\.pdf/i);
  assert.match(data, /Qualified review required/i);
  assert.match(libraryPage, /getLibraryCategorySummary\(isLive\)/);
  assert.match(libraryCatalog, /isLive\s*\n?\s*\? DRIVE_PDF_GUIDES\.filter/);
  assert.match(libraryCatalog, /roadmap_4week\.pdf/);
  assert.doesNotMatch(libraryCatalog, /new Set\(\["roadmap_4week\.pdf",\s*"dsa_sliding-window\.pdf"\]\)/);
  assert.equal(existsSync(new URL("../public/demo-materials/roadmap_4week.pdf", import.meta.url)), false);
  assert.equal(existsSync(new URL("../public/demo-materials/dsa_sliding-window.pdf", import.meta.url)), false);
});

test("live Foundation cannot open four-week unpublished briefs", async () => {
  const taskPage = await readFile(new URL("../app/learn/roadmap/task/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(taskPage, /const isProfileRoadmapTask = profile\.roadmapWeeks === 12/);
  assert.match(taskPage, /if \(!isProfileRoadmapTask\)/);
  assert.match(taskPage, /four-week brief remains unpublished and gated/i);
});

test("pending Foundation previews cannot be recorded as completed lessons", async () => {
  const materialPage = await readFile(new URL("../app/learn/material/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(materialPage, /material\.availability === "included" && linkedTask/);
  assert.match(materialPage, /remote-offer-matrix/);
  assert.match(materialPage, /qualified review before publication/i);
});

test("live Foundation access takes precedence over a seeded demo cookie", async () => {
  const session = await readFile(new URL("../app/lib/demo-session.ts", import.meta.url), "utf8");

  assert.match(session, /const state = await resolveWorkspaceProfile\(\);/);
  assert.match(session, /const \[profile, user\] = await Promise\.all\(\[getDemoProfile\(\), getChatGPTUser\(\)\]\);/);
  assert.match(session, /if \(profile\) return profile;/);
  assert.match(session, /getLearnerAccess\(user\.email\)/);
  assert.match(session, /profile: createFoundationProfile\(\s*user,\s*await getLearnerProgress\(user\.email\),/s);
});

test("Foundation demo starts Today with a clean learner state", async () => {
  const data = await readFile(new URL("../app/lib/demo-data.ts", import.meta.url), "utf8");
  const todayPage = await readFile(new URL("../app/learn/page.tsx", import.meta.url), "utf8");
  const todayDashboard = await readFile(new URL("../app/learn/today-dashboard.tsx", import.meta.url), "utf8");
  const memberShell = await readFile(new URL("../app/components/member-shell.tsx", import.meta.url), "utf8");
  const roadmapClient = await readFile(new URL("../app/learn/roadmap/roadmap-client.tsx", import.meta.url), "utf8");

  const foundationProfile = data.slice(
    data.indexOf('id: "foundation"'),
    data.indexOf('id: "practice"'),
  );
  assert.match(foundationProfile, /progress: 0/);
  assert.match(foundationProfile, /streak: 0/);
  assert.match(foundationProfile, /week: 1/);
  assert.match(foundationProfile, /completedTaskIds: \[\]/);
  assert.match(foundationProfile, /nextActionHref: "\/learn\/roadmap\/task\/12w-1-map"/);
  assert.doesNotMatch(foundationProfile, /progress: 18|week: 2|2h 14m/);

  assert.match(todayPage, /TodayDashboard/);
  assert.match(todayDashboard, /const isFreshLearner = progress === 0/);
  assert.match(todayDashboard, /isFreshLearner\s*\?\s*`Start here · Week 1 of \$\{profile\.roadmapWeeks\}`/);
  assert.match(todayDashboard, /const weeklyActivity = isTracked[\s\S]*?roadmap\.weeklyActivity/);
  assert.match(todayDashboard, /const totalPlanTasks = roadmap\.totalTaskCount;/);
  assert.match(todayDashboard, /Build the first signal from your own work/);
  assert.match(memberShell, /const isFreshLearner = profile\.progress === 0 && \(profile\.completedTaskIds\?\.length \?\? 0\) === 0;/);
  assert.match(memberShell, /event: isFreshLearner \? "First study step"/);
  assert.match(roadmapClient, /roadmapStorageKey\(profileId\)/);
});

test("fresh Vault learners derive Today and Roadmap state from account progress", async () => {
  const todayPage = await readFile(new URL("../app/learn/page.tsx", import.meta.url), "utf8");
  const todayDashboard = await readFile(new URL("../app/learn/today-dashboard.tsx", import.meta.url), "utf8");
  const paidAccess = await readFile(new URL("../app/lib/paid-access.ts", import.meta.url), "utf8");
  const roadmapClient = await readFile(new URL("../app/learn/roadmap/roadmap-client.tsx", import.meta.url), "utf8");

  assert.match(todayPage, /TodayDashboard/);
  assert.match(todayDashboard, /const roadmap = useRoadmapProgress\(\);/);
  assert.match(todayDashboard, /const progress = isTracked \? roadmap\.progressPercent : profile\.progress;/);
  assert.match(
    todayDashboard,
    /const todayKicker = isFreshLearner[\s\S]*?`Start here · Week 1 of \$\{profile\.roadmapWeeks\}`/,
  );
  assert.match(todayDashboard, /const weeklyActivity = isTracked[\s\S]*?roadmap\.weeklyActivity/);

  assert.match(paidAccess, /const currentWeek = currentFoundationWeek\(progress\.completedTaskIds\);/);
  assert.match(
    paidAccess,
    /export function currentFoundationWeek\(completedTaskIds: readonly string\[\]\)[\s\S]*?roadmapProgressFor\(TWELVE_WEEK_PLAN, completedTaskIds\)\.currentWeek/,
  );
  assert.doesNotMatch(paidAccess, /Math\.floor\(progress\.progressPercent/);

  const statusFunction = roadmapClient.slice(
    roadmapClient.indexOf("function getWeekStatus"),
    roadmapClient.indexOf("function formatWeekStatus"),
  );
  assert.match(statusFunction, /if \(weekCompleted === week\.tasks\.length\) return "completed";/);
  assert.match(statusFunction, /if \(week\.week === activeWeek\) return "in-progress";/);
  assert.match(statusFunction, /return "upcoming";/);
  assert.doesNotMatch(statusFunction, /return "in-progress";[\s\S]*return "in-progress";/);
});

test("Today and Status consume the Roadmap snapshot for both learner tiers", async () => {
  const progress = await readFile(new URL("../app/lib/learner-progress.ts", import.meta.url), "utf8");
  const provider = await readFile(new URL("../app/learn/roadmap/learner-progress-client.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../app/learn/today-dashboard.tsx", import.meta.url), "utf8");
  const accessCard = await readFile(new URL("../app/components/current-access-card.tsx", import.meta.url), "utf8");
  const roadmap = await readFile(new URL("../app/learn/roadmap/roadmap-client.tsx", import.meta.url), "utf8");
  const studyButton = await readFile(new URL("../app/learn/study-progress-button.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../app/components/member-shell.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/learn/layout.tsx", import.meta.url), "utf8");
  const loading = await readFile(new URL("../app/learn/loading.tsx", import.meta.url), "utf8");

  assert.match(progress, /roadmapStorageKey\(profileId: string\)/);
  assert.match(progress, /roadmapProgressFor\([\s\S]*?completedCount[\s\S]*?progressPercent[\s\S]*?currentWeek/);
  assert.match(provider, /if \(!isLive\)[\s\S]*?window\.localStorage\.getItem\(storageKey\)/);
  assert.match(provider, /fetch\(`\/api\/learner\/progress\?roadmapWeeks=\$\{roadmapWeeks\}`,[\s\S]*?cache: "no-store"/);
  assert.match(dashboard, /const completedLabel = isTracked[\s\S]*?roadmap\.completedCount/);
  assert.match(dashboard, /const weeklyActivity = isTracked[\s\S]*?roadmap\.weeklyActivity/);
  assert.match(dashboard, /data-activity-count=\{value\}/);
  assert.match(accessCard, /progress\.synchronized \? progress\.progressPercent : fallbackProgress/);
  assert.match(roadmap, /emitRoadmapProgressUpdated\(profileId, \[\.\.\.next\]\)/);
  assert.match(studyButton, /emitRoadmapProgressUpdated\(\s*profileId,/);
  assert.match(shell, /<RoadmapProgressProvider[\s\S]*?initialCompleted=\{profile\.completedTaskIds\}/);
  assert.match(shell, /usePathname\(\)/);
  assert.match(layout, /<MemberShell profile=\{profile\}>\{children\}<\/MemberShell>/);
  assert.match(loading, /aria-busy="true"/);
});

test("learner progress persistence is scoped to the selected roadmap", async () => {
  const paidAccess = await readFile(new URL("../app/lib/paid-access.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/learner/progress/route.ts", import.meta.url), "utf8");
  const roadmap = await readFile(new URL("../app/learn/roadmap/roadmap-client.tsx", import.meta.url), "utf8");
  const studyButton = await readFile(new URL("../app/learn/study-progress-button.tsx", import.meta.url), "utf8");

  assert.match(paidAccess, /export type RoadmapWeeks = 4 \| 12;/);
  assert.match(paidAccess, /getLearnerProgress\([\s\S]*?roadmapWeeks: RoadmapWeeks = 12/);
  assert.match(paidAccess, /saveLearnerProgress\([\s\S]*?roadmapWeeks: RoadmapWeeks = 12/);
  assert.match(paidAccess, /const selectedPlan = roadmapPlanForWeeks\(roadmapWeeks\);/);
  assert.match(paidAccess, /const preservedTaskIds = storedTaskIds\.filter/);
  assert.match(paidAccess, /completedTaskIds: JSON\.stringify\(storedTaskIdsForAllPlans\)/);
  assert.match(route, /searchParams\.get\("roadmapWeeks"\)/);
  assert.match(route, /roadmapWeeks\?: unknown/);
  assert.match(route, /roadmapWeeks === 4 && !\(await hasSecondSeatAccess\(user\.email\)\)/);
  assert.match(roadmap, /completedTaskIds: \[\.\.\.next\], roadmapWeeks/);
  assert.match(studyButton, /learner\/progress\?roadmapWeeks=\$\{roadmapWeeks\}/);
  assert.match(studyButton, /completedTaskIds: \[\.\.\.new Set\(\[\.\.\.currentIds, taskId\]\)\],/);
});

test("Vault weekly activity is persisted from dated roadmap completions", async () => {
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0004_true_kang.sql", import.meta.url), "utf8");
  const focusMigration = await readFile(new URL("../drizzle/0005_perpetual_human_cannonball.sql", import.meta.url), "utf8");
  const progress = await readFile(new URL("../app/lib/learner-progress.ts", import.meta.url), "utf8");
  const paidAccess = await readFile(new URL("../app/lib/paid-access.ts", import.meta.url), "utf8");
  const provider = await readFile(new URL("../app/learn/roadmap/learner-progress-client.tsx", import.meta.url), "utf8");
  const roadmap = await readFile(new URL("../app/learn/roadmap/roadmap-client.tsx", import.meta.url), "utf8");
  const studyButton = await readFile(new URL("../app/learn/study-progress-button.tsx", import.meta.url), "utf8");
  const focusRoute = await readFile(new URL("../app/api/learner/focus/route.ts", import.meta.url), "utf8");
  const focusTracker = await readFile(new URL("../app/learn/focus-time-tracker.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../app/learn/today-dashboard.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../app/components/member-shell.tsx", import.meta.url), "utf8");

  assert.match(schema, /completionActivity: text\("completion_activity"\)/);
  assert.match(schema, /focusedSeconds: integer\("focused_seconds"\)/);
  assert.match(migration, /ADD `completion_activity` text DEFAULT '\{\}' NOT NULL/);
  assert.match(focusMigration, /ADD `focused_seconds` integer DEFAULT 0 NOT NULL/);
  assert.match(paidAccess, /completionActivity: learnerProgress\.completionActivity/);
  assert.match(paidAccess, /updatedAt: learnerProgress\.updatedAt/);
  assert.match(paidAccess, /repairLegacyCompletionActivity\(/);
  assert.match(paidAccess, /hasNewCompletionActivity\(/);
  assert.match(paidAccess, /completionActivity: JSON\.stringify\(completionActivity\)/);
  assert.match(paidAccess, /completedTaskIds\.length !== 1/);
  assert.match(paidAccess, /dateKeyForTimeZone\(new Date\(\)\)/);
  assert.match(paidAccess, /roadmapWeeks === 12 && !storedTaskIds\.includes\(taskId\)/);
  assert.match(paidAccess, /completionActivity: JSON\.stringify\(nextCompletionActivity\)/);
  assert.match(progress, /export function weeklyActivityCounts\(/);
  assert.match(progress, /LEARNER_ACTIVITY_EVENT/);
  assert.match(paidAccess, /export async function recordFocusedTime\(/);
  assert.match(paidAccess, /focusedSeconds: sql`\$\{learnerProgress\.focusedSeconds\} \+ \$\{seconds\}`/);
  assert.match(focusRoute, /hasVaultAccess\(user\.email\)/);
  assert.match(focusRoute, /body\.seconds < 1 \|\| body\.seconds > 300/);
  assert.match(focusTracker, /FLUSH_INTERVAL_MS = 30_000/);
  assert.match(focusTracker, /visibilityState/);
  assert.match(dashboard, /formatFocusedTime\(roadmap\.focusedSeconds\)/);
  assert.match(dashboard, /roadmap\.nextTask \? "After next study step"/);
  assert.match(dashboard, /week-strip-status/);
  assert.match(progress, /LEARNER_TIME_ZONE = "Asia\/Kolkata"/);
  assert.match(progress, /weeklyActivity: weeklyActivityCounts\(normalizedCompletionActivity\)/);
  assert.match(provider, /initialCompletionActivity/);
  assert.match(provider, /readCompletionActivity\(value\.completionActivity\)/);
  assert.match(roadmap, /readCompletionActivity\(saved\.completionActivity\)/);
  assert.match(studyButton, /readCompletionActivity\(saved\.completionActivity\)/);
  assert.match(shell, /FocusTimeTracker profileId=\{profile\.id\}/);
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.week-strip i \{ display: block;/);
});

test("Second Seat practice is durable, entitlement-gated, and transcript-backed", async () => {
  const engine = await readFile(new URL("../app/lib/second-seat-engine.ts", import.meta.url), "utf8");
  const store = await readFile(new URL("../app/lib/second-seat-store.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const practice = await readFile(new URL("../app/learn/practice/practice-client.tsx", import.meta.url), "utf8");
  const feedback = await readFile(new URL("../app/learn/feedback/page.tsx", import.meta.url), "utf8");
  const sessionRoute = await readFile(new URL("../app/api/second-seat/sessions/[id]/route.ts", import.meta.url), "utf8");

  assert.match(engine, /SECOND_SEAT_MOCKS/);
  assert.match(engine, /evaluateSecondSeatSession/);
  assert.match(engine, /problemFraming|technicalDepth|tradeoffClarity|communication/);
  assert.match(store, /secondSeatSessions/);
  assert.match(store, /evaluateSecondSeatSession\(mock, answers\)/);
  assert.match(schema, /second_seat_sessions/);
  assert.match(schema, /second_seat_sessions_user_updated_idx/);
  assert.match(practice, /response is saved only for your Second Seat transcript/i);
  assert.match(practice, /api\/second-seat\/sessions/);
  assert.doesNotMatch(practice, /fixed three-turn sequence|No AI evaluation occurred|Use a sample response/i);
  assert.match(feedback, /getLatestCompletedSecondSeatSession/);
  assert.match(feedback, /feedback-empty/);
  assert.match(sessionRoute, /hasSecondSeatAccess/);
  assert.match(sessionRoute, /answers\.length > mock\.turns\.length/);
  assert.match(sessionRoute, /saveSecondSeatAnswers/);
});
