import assert from "node:assert/strict";
import test from "node:test";

import {
  MeetingCopilotBridgeAuthorizationError,
  createMeetingCopilotBridgeToken,
  createMeetingCopilotProfileCopyToken,
  verifyMeetingCopilotBridgeToken,
  verifyMeetingCopilotProfileCopyToken,
} from "../app/lib/meeting-copilot-bridge.ts";
import {
  createMeetingCopilotBridgeTokenStore,
} from "../app/lib/meeting-copilot-bridge-token-store.ts";
import {
  createMeetingCopilotSessionHandler,
} from "../app/api/meeting-copilot/session/route.ts";

const FIRST_SECRET = "meeting-copilot-first-test-secret-at-least-32-characters";
const ROTATED_SECRET = "meeting-copilot-rotated-test-secret-at-least-32-characters";
const USER = {
  displayName: "Lasya Priya",
  email: "lasya@vividlabsai.com",
  fullName: "Lasya Priya",
  subject: "google-subject-lasya",
};
const NOW = new Date("2026-09-09T08:30:00.000Z");

test("owner namespace survives bridge-secret rotation and launch/report capabilities cannot be interchanged", async () => {
  const first = await createMeetingCopilotBridgeToken({
    user: USER,
    secret: FIRST_SECRET,
    now: NOW,
    tokenId: "launch-token-one",
  });
  const rotated = await createMeetingCopilotBridgeToken({
    user: USER,
    secret: ROTATED_SECRET,
    now: NOW,
    tokenId: "launch-token-two",
  });
  assert.equal(first.ownerKey, rotated.ownerKey);

  const launchSession = await verifyMeetingCopilotBridgeToken(first.token, {
    secret: FIRST_SECRET,
    now: new Date("2026-09-09T08:31:00.000Z"),
  });
  const report = await createMeetingCopilotProfileCopyToken({
    session: launchSession,
    secret: FIRST_SECRET,
    now: new Date("2026-09-09T08:31:00.000Z"),
    tokenId: "profile-copy-token-one",
  });
  const reportSession = await verifyMeetingCopilotProfileCopyToken(report.token, {
    secret: FIRST_SECRET,
    now: new Date("2026-09-09T08:32:00.000Z"),
  });
  assert.equal(reportSession.ownerKey, first.ownerKey);
  assert.equal(reportSession.userEmail, USER.email);
  assert.equal(report.expiresAt, first.expiresAt, "exchange must not extend the launch expiry");

  await assert.rejects(
    verifyMeetingCopilotProfileCopyToken(first.token, { secret: FIRST_SECRET, now: NOW }),
    MeetingCopilotBridgeAuthorizationError,
  );
  await assert.rejects(
    verifyMeetingCopilotBridgeToken(report.token, { secret: FIRST_SECRET, now: NOW }),
    MeetingCopilotBridgeAuthorizationError,
  );
});

test("D1 token ledger atomically consumes only a SHA-256 token identifier", async () => {
  const statements = [];
  const database = {
    prepare(sql) {
      const statement = { sql, bindings: [] };
      statements.push(statement);
      return {
        bind(...bindings) {
          statement.bindings = bindings;
          return this;
        },
        async first() {
          return statements.length === 1 ? { token_hash: statement.bindings[0] } : null;
        },
      };
    },
  };
  const store = createMeetingCopilotBridgeTokenStore(async () => database);
  const input = {
    tokenId: "raw-private-jti",
    ownerKey: "mc_private-owner-key",
    expiresAt: "2026-09-09T10:30:00.000Z",
    now: NOW,
  };
  assert.equal(await store.consume(input), "consumed");
  assert.equal(await store.consume(input), "replayed");
  assert.match(statements[0].sql, /ON CONFLICT\(token_hash\) DO NOTHING/);
  assert.match(statements[0].sql, /RETURNING token_hash/);
  assert.match(statements[0].bindings[0], /^[a-f0-9]{64}$/);
  assert.match(statements[0].bindings[1], /^[a-f0-9]{64}$/);
  assert.equal(statements.flatMap((statement) => statement.bindings).includes(input.tokenId), false);
  assert.equal(statements.flatMap((statement) => statement.bindings).includes(input.ownerKey), false);
});

test("session exchange rechecks entitlement, consumes once, and returns a distinct report bearer", async () => {
  const launch = await createMeetingCopilotBridgeToken({
    user: USER,
    secret: FIRST_SECRET,
    now: NOW,
    tokenId: "one-time-launch-token",
  });
  let consumed = false;
  let entitlementChecks = 0;
  const handler = createMeetingCopilotSessionHandler({
    verify: (token) => verifyMeetingCopilotBridgeToken(token, {
      secret: FIRST_SECRET,
      now: new Date("2026-09-09T08:31:00.000Z"),
    }),
    hasAccess: async () => {
      entitlementChecks += 1;
      return true;
    },
    issueProfileCopyToken: ({ session }) => createMeetingCopilotProfileCopyToken({
      session,
      secret: FIRST_SECRET,
      now: new Date("2026-09-09T08:31:00.000Z"),
      tokenId: "issued-report-token",
    }),
    tokenStore: {
      async consume() {
        if (consumed) return "replayed";
        consumed = true;
        return "consumed";
      },
    },
  });
  const request = () => new Request("https://interviewrunway.com/api/meeting-copilot/session", {
    method: "POST",
    headers: { authorization: `Bearer ${launch.token}` },
  });

  const first = await handler(request());
  assert.equal(first.status, 200);
  const body = await first.json();
  assert.equal(body.ok, true);
  assert.equal(body.ownerKey, launch.ownerKey);
  assert.equal(typeof body.profileCopyToken, "string");
  assert.notEqual(body.profileCopyToken, launch.token);
  await verifyMeetingCopilotProfileCopyToken(body.profileCopyToken, {
    secret: FIRST_SECRET,
    now: new Date("2026-09-09T08:32:00.000Z"),
  });

  const replay = await handler(request());
  assert.equal(replay.status, 401);
  assert.equal(entitlementChecks, 2, "every exchange attempt must recheck current access");
});

test("denied access and token-ledger failures never return a report bearer", async () => {
  const session = {
    tokenId: "launch-token",
    userEmail: USER.email,
    userName: USER.fullName,
    userSubject: USER.subject,
    ownerKey: "mc_owner-key",
    expiresAt: "2026-09-09T10:30:00.000Z",
  };
  let issueCalls = 0;
  let consumeCalls = 0;
  const dependencies = (hasAccess, consume) => ({
    verify: async () => session,
    hasAccess,
    issueProfileCopyToken: async () => {
      issueCalls += 1;
      return { token: "private-report-token", expiresAt: session.expiresAt };
    },
    tokenStore: {
      async consume() {
        consumeCalls += 1;
        return consume();
      },
    },
  });

  const denied = createMeetingCopilotSessionHandler(dependencies(async () => false, () => "consumed"));
  const deniedResponse = await denied(new Request("https://interviewrunway.com/api/meeting-copilot/session", {
    method: "POST",
    headers: { authorization: "Bearer valid-token" },
  }));
  assert.equal(deniedResponse.status, 403);
  assert.equal(issueCalls, 0);
  assert.equal(consumeCalls, 0);

  const unavailable = createMeetingCopilotSessionHandler(dependencies(
    async () => true,
    () => { throw new Error("D1 unavailable"); },
  ));
  const unavailableResponse = await unavailable(new Request("https://interviewrunway.com/api/meeting-copilot/session", {
    method: "POST",
    headers: { authorization: "Bearer valid-token" },
  }));
  assert.equal(unavailableResponse.status, 503);
  const unavailableBody = await unavailableResponse.json();
  assert.equal(Object.hasOwn(unavailableBody, "profileCopyToken"), false);
});
