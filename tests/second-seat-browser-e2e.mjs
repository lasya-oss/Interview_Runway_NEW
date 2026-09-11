import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { SignJWT } from "jose";

const baseUrl = process.env.SECOND_SEAT_E2E_BASE_URL ?? "http://localhost:3000";
const sessionSecret = process.env.AUTH_SESSION_SECRET ?? "";
const playwrightModuleDirectory = process.env.PLAYWRIGHT_MODULE_DIRECTORY;
const browserExecutable = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE;
assert.ok(sessionSecret.length >= 24, "AUTH_SESSION_SECRET is required");
assert.ok(playwrightModuleDirectory, "PLAYWRIGHT_MODULE_DIRECTORY is required");

const { chromium } = await import(pathToFileURL(join(playwrightModuleDirectory, "index.mjs")).href);
const e2eEmail = `second-seat-browser-${Date.now()}@vividlabsai.com`;
const token = await new SignJWT({
  email: e2eEmail,
  hd: "vividlabsai.com",
  name: "Second Seat Browser E2E",
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(`second-seat-browser-${Date.now()}`)
  .setIssuer("interviewrunway")
  .setAudience("interviewrunway-web")
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(new TextEncoder().encode(sessionSecret));

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});
const browserErrors = [];
const answers = [
  "I would clarify latency, peak volume, channel preferences, and ordering, then separate transactional from marketing traffic because their priority and delivery promises differ.",
  "I would choose at-least-once delivery, use an idempotency key and durable ledger for each provider attempt, and treat a timeout as ambiguous before retrying.",
  "I would apply backpressure, bound exponential retries with jitter, prioritise transactional work, shed marketing traffic first, and watch queue age and recovery throughput.",
];

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addCookies([
    { name: "interviewrunway_session", value: token, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    { name: "ir_active_learner_plan", value: "practice", url: baseUrl, sameSite: "Lax" },
  ]);
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()} @ ${message.location().url}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`page: ${error.message}`));

  await page.goto(`${baseUrl}/learn/practice`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Design a notification service/i }).click();
  await page.getByText("About this round", { exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Begin practice/i }).click();
  const responseBox = page.locator(".practice-response-panel textarea");
  for (let index = 0; index < answers.length; index += 1) {
    await responseBox.fill(answers[index]);
    await page.getByRole("button", {
      name: index === answers.length - 1 ? /Finish and get feedback/i : /Submit and continue/i,
    }).click();
    if (index < answers.length - 1) {
      await page.locator(".practice-turn-complete").nth(index).waitFor({ state: "visible" });
    }
  }

  const openFeedback = page.getByRole("link", { name: /Open your feedback/i });
  await openFeedback.waitFor({ state: "visible", timeout: 25_000 });
  await openFeedback.click();
  await page.getByRole("heading", { name: /Why this score/i }).waitFor({ state: "visible" });
  assert.equal(await page.getByText("Evaluation rubric", { exact: true }).isVisible(), true);

  const answerReview = page.getByRole("tab", { name: /Answer review/i });
  await answerReview.click();
  await page.getByText("Your original answer", { exact: true }).first().waitFor({ state: "visible" });
  assert.equal(await page.getByText("Improved answer", { exact: true }).first().isVisible(), true);
  assert.equal(await page.getByText("Why this would score higher", { exact: true }).first().isVisible(), true);
  assert.equal(await page.getByText(answers[0], { exact: false }).isVisible(), true);
  assert.equal(await page.getByRole("tab").count(), 2);
  assert.equal(await page.getByRole("tab", { name: /Summary/i }).getAttribute("aria-selected"), "false");
  assert.equal(await page.getByRole("tab", { name: /Plan changes/i }).count(), 0);

  await answerReview.focus();
  await answerReview.press("ArrowRight");
  assert.equal(await page.getByRole("tab", { name: /Summary/i }).getAttribute("aria-selected"), "true");
  await page.getByRole("tab", { name: /Summary/i }).press("End");
  assert.equal(await page.getByRole("tab", { name: /Answer review/i }).getAttribute("aria-selected"), "true");

  const feedbackUrl = page.url();
  await page.goBack({ waitUntil: "domcontentloaded" });
  assert.match(page.url(), /\/learn\/practice/);
  await page.goForward({ waitUntil: "domcontentloaded" });
  assert.equal(page.url(), feedbackUrl);
  await page.getByRole("tab", { name: /Answer review/i }).waitFor({ state: "visible" });
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(desktopOverflow <= 1, `desktop horizontal overflow: ${desktopOverflow}px`);

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.addCookies([
    { name: "interviewrunway_session", value: token, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    { name: "ir_active_learner_plan", value: "practice", url: baseUrl, sameSite: "Lax" },
  ]);
  const mobilePage = await mobile.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`mobile console: ${message.text()} @ ${message.location().url}`);
  });
  mobilePage.on("pageerror", (error) => browserErrors.push(`mobile page: ${error.message}`));
  await mobilePage.goto(feedbackUrl, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.getByRole("tab", { name: /Answer review/i }).click();
  await mobilePage.getByText("Your original answer", { exact: true }).first().waitFor({ state: "visible" });
  const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(mobileOverflow <= 1, `mobile horizontal overflow: ${mobileOverflow}px`);
  await mobile.close();
  await context.close();

  const localFontWarnings = browserErrors.filter((message) => /\/@fs\/.*node_modules\/@fontsource/i.test(message));
  const applicationErrors = browserErrors.filter((message) => !/\/@fs\/.*node_modules\/@fontsource/i.test(message));
  assert.deepEqual(applicationErrors, []);
  console.log(JSON.stringify({
    status: "passed",
    desktop: "1280x800",
    mobile: "390x844",
    feedbackUrl: new URL(feedbackUrl).pathname + new URL(feedbackUrl).search,
    consoleErrors: applicationErrors.length,
    localDevFontWarnings: localFontWarnings.length,
  }));
} finally {
  await browser.close();
}
