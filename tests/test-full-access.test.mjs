import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedGoogleIdentity } from "../app/lib/google-auth.ts";
import { isInternalFullAccessEmail } from "../app/lib/internal-access.ts";
import {
  getLearnerAccess,
  hasSecondSeatAccess,
  hasVoiceAccess,
  hasVaultAccess,
  isConfiguredTestFoundationEmail,
  isConfiguredTestFullAccessEmail,
  isConfiguredTestSecondSeatEmail,
} from "../app/lib/paid-access.ts";
import { isAuthorizedUserHistoryOperator } from "../app/lib/user-history-access.ts";

const TEST_EMAIL = "learner.runway@gmail.com";

async function withAllowlist(value, fn) {
  const previous = process.env.TEST_FULL_ACCESS_EMAILS;
  if (value === undefined) delete process.env.TEST_FULL_ACCESS_EMAILS;
  else process.env.TEST_FULL_ACCESS_EMAILS = value;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.TEST_FULL_ACCESS_EMAILS;
    else process.env.TEST_FULL_ACCESS_EMAILS = previous;
  }
}

test("only the exact allowlisted address matches, on any domain", async () => {
  await withAllowlist("learner.runway@gmail.com", async () => {
    assert.equal(isConfiguredTestFullAccessEmail(TEST_EMAIL), true);
    assert.equal(isConfiguredTestFullAccessEmail("Learner.Runway@Gmail.com"), true);
    assert.equal(isConfiguredTestFullAccessEmail("other@gmail.com"), false);
    assert.equal(isConfiguredTestFullAccessEmail("learner.runway@vividlabsai.com"), false);
  });
  await withAllowlist(undefined, async () => {
    assert.equal(isConfiguredTestFullAccessEmail(TEST_EMAIL), false);
  });
});

test("verified Google identities can sign in while unverified or malformed identities cannot", async () => {
  await withAllowlist(TEST_EMAIL, async () => {
    assert.equal(
      isAllowedGoogleIdentity({ email: TEST_EMAIL, emailVerified: true, hostedDomain: null }),
      true,
    );
    assert.equal(
      isAllowedGoogleIdentity({ email: TEST_EMAIL, emailVerified: false, hostedDomain: null }),
      false,
    );
    assert.equal(
      isAllowedGoogleIdentity({ email: "other@gmail.com", emailVerified: true, hostedDomain: null }),
      true,
    );
    assert.equal(
      isAllowedGoogleIdentity({
        email: "teammate@vividlabsai.com",
        emailVerified: true,
        hostedDomain: "vividlabsai.com",
      }),
      true,
    );
    assert.equal(
      isAllowedGoogleIdentity({ email: "not-an-email", emailVerified: true, hostedDomain: null }),
      false,
    );
  });
});

test("test address receives the full user-level plan stack", async () => {
  await withAllowlist(TEST_EMAIL, async () => {
    assert.deepEqual(await getLearnerAccess(TEST_EMAIL), {
      vault: true,
      secondSeat: true,
      humanCalibration: true,
      voice: true,
    });
    assert.equal(await hasVaultAccess(TEST_EMAIL), true);
    assert.equal(await hasSecondSeatAccess(TEST_EMAIL), true);
    assert.equal(await hasVoiceAccess(TEST_EMAIL), true);
  });
});

test("test address gains no internal or admin-only access", async () => {
  await withAllowlist(TEST_EMAIL, async () => {
    assert.equal(isInternalFullAccessEmail(TEST_EMAIL), false);
    assert.equal(isAuthorizedUserHistoryOperator(TEST_EMAIL), false);
    assert.equal(isConfiguredTestFoundationEmail(TEST_EMAIL), false);
    assert.equal(isConfiguredTestSecondSeatEmail(TEST_EMAIL), false);
  });
});
