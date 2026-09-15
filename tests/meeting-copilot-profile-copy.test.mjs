import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  MEETING_COPILOT_BRIDGE_TTL_SECONDS,
  MeetingCopilotBridgeAuthorizationError,
  createMeetingCopilotBridgeToken,
  verifyMeetingCopilotBridgeToken,
} from "../app/lib/meeting-copilot-bridge.ts";
import {
  MAX_MEETING_COPILOT_GMAIL_MESSAGE_BYTES,
  MeetingCopilotProfileDeliveryError,
  createMeetingCopilotProfileMessage,
  deliverMeetingCopilotProfileCopy,
  readMeetingCopilotGmailConfiguration,
} from "../app/lib/meeting-copilot-profile-gmail.ts";
import {
  MAX_NEW_MEETING_COPILOT_PROFILE_DELIVERIES_PER_HOUR,
  createMeetingCopilotProfileDeliveryStore,
} from "../app/lib/meeting-copilot-profile-delivery-store.ts";
import {
  MAX_MEETING_COPILOT_COMBINED_SOURCE_PDF_BYTES,
  MAX_MEETING_COPILOT_PROFILE_COPY_BYTES,
  createMeetingCopilotProfilePdf,
  parseMeetingCopilotSavedProfileCopy,
} from "../app/lib/meeting-copilot-profile-copy.ts";
import { createMeetingCopilotSessionHandler } from "../app/api/meeting-copilot/session/route.ts";
import { createMeetingCopilotProfileCopyHandler } from "../app/api/meeting-copilot/profile-copy/route.ts";

const BRIDGE_SECRET = "meeting-copilot-test-secret-at-least-thirty-two-characters";
const USER = {
  displayName: "Lasya Priya",
  email: "lasya@vividlabsai.com",
  fullName: "Lasya Priya",
  subject: "google-subject-lasya",
};

const RESUME_PDF = Buffer.from("%PDF-1.4\nInterview Runway resume fixture\n%%EOF\n", "utf8");
const JOB_DESCRIPTION_PDF = Buffer.from(
  "%PDF-1.4\nInterview Runway job description fixture\n%%EOF\n",
  "utf8",
);

function savedDocument(filename, text, bytes) {
  return {
    filename,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    text,
    sizeBytes: bytes.byteLength,
    contentBase64: bytes.toString("base64"),
  };
}

function savedProfile(overrides = {}) {
  return {
    schemaVersion: 1,
    eventId: "7b907c13-10f1-47b7-8e91-3fe873b57302",
    profile: {
      id: "a5d9fb20-aa26-492b-ac32-e24026da3a51",
      revision: 1,
      slug: "senior-platform-role",
      name: "Senior Platform Role",
      focus: "System design trade-offs and concise evidence.",
      customGuidance: "Lead with the decision, then explain the measurable result.",
      createdAt: "2026-09-09T08:30:00.000Z",
      updatedAt: "2026-09-09T08:30:00.000Z",
      targetRole: "Senior Platform Engineer",
      resume: savedDocument(
        "lasya-resume.pdf",
        "[Page 1]\nBuilt a reliable event platform and reduced recovery time by thirty percent.",
        RESUME_PDF,
      ),
      jobDescription: savedDocument(
        "platform-role.pdf",
        "[Page 1]\nOwn distributed systems, operational reliability, and cross-team design reviews.",
        JOB_DESCRIPTION_PDF,
      ),
      ...overrides,
    },
  };
}

function decodeMimeTextPart(message) {
  const marker = [
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
  ].join("\r\n");
  const start = message.indexOf(marker);
  assert.notEqual(start, -1);
  const encoded = message
    .slice(start + marker.length)
    .split("\r\n\r\n--", 1)[0]
    .replaceAll("\r\n", "");
  return Buffer.from(encoded, "base64").toString("utf8");
}

function verifiedSession(email = USER.email, subject = USER.subject) {
  return {
    tokenId: "token-id",
    userEmail: email,
    userName: USER.fullName,
    userSubject: subject,
    ownerKey: `mc_owner_${subject}`,
    expiresAt: "2026-09-09T10:30:00.000Z",
  };
}

function memoryDeliveryStore(initial = new Map()) {
  const records = new Map(initial);
  const calls = { reserve: 0, complete: 0 };
  return {
    calls,
    records,
    async reserve({ ownerKey, profileId, profileRevision, eventId }) {
      calls.reserve += 1;
      const key = `${ownerKey}:${profileId}:${profileRevision}`;
      const existing = records.get(key);
      if (existing) return { kind: "existing", record: existing };
      const now = "2026-09-09T08:30:00.000Z";
      const record = {
        deliveryKey: key,
        status: "pending",
        messageId: null,
        failureCode: null,
        createdAt: now,
        updatedAt: now,
        sentAt: null,
        eventId,
      };
      records.set(key, record);
      return { kind: "reserved", record };
    },
    async complete({ deliveryKey, status, messageId = null, failureCode = null }) {
      calls.complete += 1;
      const entry = [...records.entries()].find(([, record]) => record.deliveryKey === deliveryKey);
      if (!entry || entry[1].status !== "pending") throw new Error("delivery not pending");
      records.set(entry[0], {
        ...entry[1],
        status,
        messageId,
        failureCode,
        updatedAt: "2026-09-09T08:31:00.000Z",
        sentAt: status === "sent" ? "2026-09-09T08:31:00.000Z" : null,
      });
    },
  };
}

test("Meeting Copilot bridge token is encrypted, signed, scoped, expiring, and owner-stable", async () => {
  const now = new Date("2026-09-09T08:30:00.000Z");
  const first = await createMeetingCopilotBridgeToken({
    user: USER,
    secret: BRIDGE_SECRET,
    now,
    tokenId: "first-token-id",
  });
  const second = await createMeetingCopilotBridgeToken({
    user: USER,
    secret: BRIDGE_SECRET,
    now,
    tokenId: "second-token-id",
  });
  assert.equal(first.token.split(".").length, 5);
  assert.doesNotMatch(first.token, /lasya|vividlabsai/i);
  assert.equal(first.ownerKey, second.ownerKey);
  assert.equal(
    Date.parse(first.expiresAt) - now.getTime(),
    MEETING_COPILOT_BRIDGE_TTL_SECONDS * 1_000,
  );

  const verified = await verifyMeetingCopilotBridgeToken(first.token, {
    secret: BRIDGE_SECRET,
    now: new Date("2026-09-09T08:31:00.000Z"),
  });
  assert.equal(verified.userEmail, USER.email);
  assert.equal(verified.userSubject, USER.subject);
  assert.equal(verified.ownerKey, first.ownerKey);

  await assert.rejects(
    verifyMeetingCopilotBridgeToken(first.token, {
      secret: BRIDGE_SECRET,
      now: new Date("2026-09-09T10:31:00.000Z"),
    }),
    MeetingCopilotBridgeAuthorizationError,
  );
  await assert.rejects(
    verifyMeetingCopilotBridgeToken(first.token, {
      secret: `${BRIDGE_SECRET}-wrong`,
      now,
    }),
    MeetingCopilotBridgeAuthorizationError,
  );
});

test("D1 delivery store hashes ownership and atomically combines idempotency with the hourly cap", async () => {
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
          return {
            delivery_key: statement.bindings[0],
            status: "pending",
            message_id: null,
            failure_code: null,
            created_at: "2026-09-09T08:30:00.000Z",
            updated_at: "2026-09-09T08:30:00.000Z",
            sent_at: null,
          };
        },
        async run() {
          return { meta: { changes: 1 }, success: true };
        },
      };
    },
  };
  const store = createMeetingCopilotProfileDeliveryStore(async () => database);
  const ownerKey = `mc_${"a".repeat(43)}`;
  const reservation = await store.reserve({
    ownerKey,
    profileId: savedProfile().profile.id,
    profileRevision: 1,
    eventId: savedProfile().eventId,
    now: new Date("2026-09-09T08:30:00.000Z"),
  });
  assert.equal(reservation.kind, "reserved");
  assert.match(statements[0].sql, /SELECT COUNT\(\*\)/);
  assert.match(statements[0].sql, /ON CONFLICT\(owner_hash, profile_id, profile_revision\) DO NOTHING/);
  assert.equal(statements[0].bindings.includes(ownerKey), false);
  assert.match(statements[0].bindings[1], /^[a-f0-9]{64}$/);
  assert.equal(
    statements[0].bindings.at(-1),
    MAX_NEW_MEETING_COPILOT_PROFILE_DELIVERIES_PER_HOUR,
  );

  await store.complete({
    deliveryKey: reservation.record.deliveryKey,
    status: "sent",
    messageId: "gmail-message-id",
    now: new Date("2026-09-09T08:31:00.000Z"),
  });
  assert.match(statements[1].sql, /WHERE delivery_key = \? AND status = 'pending'/);
});

test("profile-copy schema accepts only bounded committed fields and never client identity", async () => {
  const accepted = await parseMeetingCopilotSavedProfileCopy(savedProfile());
  assert.ok(accepted);
  assert.equal(accepted.profile.resume.filename, "lasya-resume.pdf");
  assert.equal(accepted.profile.jobDescription.text.includes("distributed systems"), true);

  assert.equal(await parseMeetingCopilotSavedProfileCopy({ ...savedProfile(), userEmail: USER.email }), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy({ ...savedProfile(), recipients: [USER.email] }), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({ revision: 0 })), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({ slug: "../other-user" })), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({ updatedAt: "2026-09-08T08:30:00Z" })), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: { filename: "resume.pdf", sha256: "bad", text: "valid extracted content".repeat(3) },
  })), null);

  const extensionless = await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: savedDocument(
      "resume-upload",
      "Validated PDF text remains bound to this committed profile revision.",
      RESUME_PDF,
    ),
  }));
  assert.equal(extensionless?.profile.resume.filename, "resume-upload");
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: savedDocument(
      "../../",
      "Validated PDF text remains bound to this committed profile revision.",
      RESUME_PDF,
    ),
  })), null);

  const validResume = savedDocument("resume.pdf", "Valid committed resume text".repeat(2), RESUME_PDF);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: { ...validResume, sha256: "0".repeat(64) },
  })), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: { ...validResume, sizeBytes: validResume.sizeBytes + 1 },
  })), null);
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: { ...validResume, contentBase64: `${validResume.contentBase64.slice(0, -1)}!` },
  })), null);
  const paddedPdf = savedDocument(
    "resume.pdf",
    "Valid extracted text content".repeat(2),
    Buffer.from("%PDF-xy", "utf8"),
  );
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: { ...paddedPdf, contentBase64: "JVBERi14eR==" },
  })), null);
  const notPdf = Buffer.from("This is not a PDF despite being valid base64.", "utf8");
  assert.equal(await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: savedDocument("resume.pdf", "Valid extracted text content".repeat(2), notPdf),
  })), null);
});

test("profile-copy schema accepts the combined PDF boundary and rejects one byte over it", async () => {
  const jobBytes = Buffer.from("%PDF-1.4\n%%EOF\n", "utf8");
  const resumeBytes = Buffer.alloc(
    MAX_MEETING_COPILOT_COMBINED_SOURCE_PDF_BYTES - jobBytes.byteLength,
    0x61,
  );
  RESUME_PDF.copy(resumeBytes, 0, 0, 8);
  Buffer.from("%%EOF\n", "utf8").copy(resumeBytes, resumeBytes.byteLength - 6);
  const atBoundary = await parseMeetingCopilotSavedProfileCopy(savedProfile({
    resume: savedDocument("resume.pdf", "Complete committed resume text.".repeat(2), resumeBytes),
    jobDescription: savedDocument("job.pdf", "Complete committed job text.".repeat(2), jobBytes),
  }));
  assert.ok(atBoundary);

  const overBoundary = savedProfile({
    resume: savedDocument("resume.pdf", "Complete committed resume text.".repeat(2), RESUME_PDF),
    jobDescription: savedDocument("job.pdf", "Complete committed job text.".repeat(2), JOB_DESCRIPTION_PDF),
  });
  overBoundary.profile.resume.sizeBytes = MAX_MEETING_COPILOT_COMBINED_SOURCE_PDF_BYTES;
  overBoundary.profile.jobDescription.sizeBytes = 1;
  assert.equal(await parseMeetingCopilotSavedProfileCopy(overBoundary), null);
});

test("profile PDF is branded, confidential, learner-focused, and identifies both private attachments", async () => {
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile());
  assert.ok(saved);
  const pdf = createMeetingCopilotProfilePdf(saved, {
    userEmail: USER.email,
    userName: USER.fullName,
    ownerKey: "mc_private-owner-key",
  });
  assert.equal(new TextDecoder().decode(pdf.slice(0, 8)).startsWith("%PDF-1.4"), true);
  const source = new TextDecoder().decode(pdf);
  assert.match(source, /Meeting Copilot Profile/);
  assert.match(source, /CONFIDENTIAL \/ AUTHORIZED VIVID LABS USE/);
  assert.match(source, /Lasya Priya \\\(lasya@vividlabsai\.com\\\)/);
  assert.match(source, /System design trade-offs/);
  assert.match(source, /exact committed resume PDF is attached privately/);
  assert.match(source, /exact committed job-description PDF is attached privately/);
  assert.match(source, /lasya-resume\.pdf/);
  assert.match(source, /platform-role\.pdf/);
  assert.doesNotMatch(source, /SUPPORTING MATERIAL|PDF preview|Profile ID|SHA-256|mc_private-owner-key/);
});

test("profile PDF treats learner markup-like lines as literal body text", async () => {
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile({
    focus: "# Focus is learner-provided\n- Keep the answer concise",
    customGuidance: "# Not a report heading\n- Not a report bullet",
    resume: savedDocument(
      "resume.pdf",
      "# Resume section supplied by learner\n- Built a reliable event platform.",
      RESUME_PDF,
    ),
    jobDescription: savedDocument(
      "role.pdf",
      "# Job description supplied by employer\n- Own service reliability.",
      JOB_DESCRIPTION_PDF,
    ),
  }));
  assert.ok(saved);
  const pdf = createMeetingCopilotProfilePdf(saved, {
    userEmail: USER.email,
    userName: USER.fullName,
    ownerKey: "mc_private-owner-key",
  });
  const source = new TextDecoder().decode(pdf);
  assert.match(source, /  # Focus is learner-provided/);
  assert.match(source, /  - Keep the answer concise/);
  assert.doesNotMatch(source, /Resume section supplied by learner/);
  assert.doesNotMatch(source, /Own service reliability/);
});

test("Gmail configuration is server-only, deduplicated, and constrained to the internal domain", () => {
  const configuration = readMeetingCopilotGmailConfiguration({
    GOOGLE_CLIENT_ID: "workspace-client-id",
    GOOGLE_CLIENT_SECRET: "workspace-client-secret",
    GOOGLE_GMAIL_REFRESH_TOKEN: "workspace-refresh-token",
    GOOGLE_GMAIL_SENDER_EMAIL: "reports@vividlabsai.com",
    MEETING_COPILOT_PROFILE_RECIPIENTS: "reviewer@vividlabsai.com, reviewer@vividlabsai.com qa@vividlabsai.com",
    INTERNAL_FULL_ACCESS_DOMAIN: "vividlabsai.com",
  });
  assert.deepEqual(configuration.recipients, ["reviewer@vividlabsai.com", "qa@vividlabsai.com"]);
  assert.equal(configuration.senderEmail, "reports@vividlabsai.com");

  assert.throws(() => readMeetingCopilotGmailConfiguration({
    GOOGLE_CLIENT_ID: "workspace-client-id",
    GOOGLE_CLIENT_SECRET: "workspace-client-secret",
    GOOGLE_GMAIL_REFRESH_TOKEN: "workspace-refresh-token",
    GOOGLE_GMAIL_SENDER_EMAIL: "reports@vividlabsai.com",
    MEETING_COPILOT_PROFILE_RECIPIENTS: "attacker@example.com",
    INTERNAL_FULL_ACCESS_DOMAIN: "vividlabsai.com",
  }), MeetingCopilotProfileDeliveryError);
});

test("Gmail refresh identity must match the configured mailbox before one private message is sent", async () => {
  const calls = [];
  const fetch = async (input, init = {}) => {
    calls.push({ input: String(input), init });
    if (calls.length === 1) {
      return Response.json({ access_token: "google-access-token-123456", token_type: "Bearer" });
    }
    if (calls.length === 2) {
      return Response.json({ emailAddress: "reports@vividlabsai.com" });
    }
    return Response.json({ id: "gmail-profile-message-1" });
  };
  const configuration = {
    clientId: "workspace-client-id",
    clientSecret: "workspace-client-secret",
    refreshToken: "workspace-refresh-token",
    senderEmail: "reports@vividlabsai.com",
    recipients: ["reviewer@vividlabsai.com", "qa@vividlabsai.com"],
    internalDomain: "vividlabsai.com",
  };
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile());
  assert.ok(saved);
  const result = await deliverMeetingCopilotProfileCopy({
    pdf: new TextEncoder().encode("%PDF-1.4 test"),
    saved,
    userEmail: USER.email,
  }, {
    fetch,
    now: () => new Date("2026-09-09T08:31:00Z"),
    configuration,
  });
  assert.equal(result.messageId, "gmail-profile-message-1");
  assert.equal(calls.length, 3);
  assert.match(calls[0].input, /oauth2\.googleapis\.com\/token/);
  assert.match(calls[1].input, /gmail\/v1\/users\/me\/profile/);
  assert.match(calls[2].input, /gmail\/v1\/users\/me\/messages\/send/);
  assert.match(String(calls[2].init.body), /To: reviewer@vividlabsai\.com, qa@vividlabsai\.com/);
  assert.doesNotMatch(String(calls[2].init.body), /workspace-refresh-token/);
});

test("mismatched Gmail refresh-token mailbox is rejected before send", async () => {
  let calls = 0;
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile());
  assert.ok(saved);
  await assert.rejects(
    deliverMeetingCopilotProfileCopy({
      pdf: new TextEncoder().encode("%PDF-1.4 test"),
      saved,
      userEmail: USER.email,
    }, {
      fetch: async () => {
        calls += 1;
        return calls === 1
          ? Response.json({ access_token: "google-access-token-123456", token_type: "Bearer" })
          : Response.json({ emailAddress: "different@vividlabsai.com" });
      },
      configuration: {
        clientId: "client",
        clientSecret: "secret",
        refreshToken: "refresh",
        senderEmail: "reports@vividlabsai.com",
        recipients: ["reviewer@vividlabsai.com"],
        internalDomain: "vividlabsai.com",
      },
    }),
    (error) => error instanceof MeetingCopilotProfileDeliveryError && error.code === "authorization",
  );
  assert.equal(calls, 2);
});

test("Gmail send permission failures are reported as authorization errors", async () => {
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile());
  assert.ok(saved);
  let calls = 0;
  await assert.rejects(
    deliverMeetingCopilotProfileCopy({
      pdf: new TextEncoder().encode("%PDF-1.4 test"),
      saved,
      userEmail: USER.email,
    }, {
      fetch: async () => {
        calls += 1;
        if (calls === 1) {
          return Response.json({ access_token: "google-access-token-123456", token_type: "Bearer" });
        }
        if (calls === 2) return Response.json({ emailAddress: "reports@vividlabsai.com" });
        return Response.json({ error: { message: "Insufficient Permission" } }, { status: 403 });
      },
      configuration: {
        clientId: "client",
        clientSecret: "secret",
        refreshToken: "refresh",
        senderEmail: "reports@vividlabsai.com",
        recipients: ["reviewer@vividlabsai.com"],
        internalDomain: "vividlabsai.com",
      },
    }),
    (error) => error instanceof MeetingCopilotProfileDeliveryError && error.code === "authorization",
  );
  assert.equal(calls, 3);
});

test("session and profile-copy handlers recheck active Second Seat access", async () => {
  const session = verifiedSession();
  const allowed = createMeetingCopilotSessionHandler({
    verify: async () => session,
    hasAccess: async () => true,
    issueProfileCopyToken: async () => ({
      token: "profile-copy-token",
      tokenId: "profile-copy-token-id",
      ownerKey: session.ownerKey,
      expiresAt: session.expiresAt,
    }),
    tokenStore: { consume: async () => "consumed" },
  });
  const allowedResponse = await allowed(new Request("https://interviewrunway.com/api/meeting-copilot/session", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value" },
  }));
  assert.equal(allowedResponse.status, 200);
  assert.deepEqual(await allowedResponse.json(), {
    ok: true,
    ownerKey: session.ownerKey,
    expiresAt: session.expiresAt,
    profileCopyToken: "profile-copy-token",
  });

  const denied = createMeetingCopilotSessionHandler({
    verify: async () => session,
    hasAccess: async () => false,
    issueProfileCopyToken: async () => { throw new Error("must not issue"); },
    tokenStore: { consume: async () => { throw new Error("must not consume"); } },
  });
  const deniedResponse = await denied(new Request("https://interviewrunway.com/api/meeting-copilot/session", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value" },
  }));
  assert.equal(deniedResponse.status, 403);
});

test("both API handlers reject missing and invalid bearer credentials before protected work", async () => {
  let sessionVerifyCalls = 0;
  let profileVerifyCalls = 0;
  let deliveries = 0;
  const sessionHandler = createMeetingCopilotSessionHandler({
    verify: async () => {
      sessionVerifyCalls += 1;
      throw new MeetingCopilotBridgeAuthorizationError();
    },
    hasAccess: async () => true,
    issueProfileCopyToken: async () => { throw new Error("must not issue"); },
    tokenStore: { consume: async () => { throw new Error("must not consume"); } },
  });
  const deliveryStore = memoryDeliveryStore();
  const profileHandler = createMeetingCopilotProfileCopyHandler({
    verify: async () => {
      profileVerifyCalls += 1;
      throw new MeetingCopilotBridgeAuthorizationError();
    },
    hasAccess: async () => true,
    deliver: async () => {
      deliveries += 1;
      return { messageId: "must-not-send", recipients: [] };
    },
    deliveryStore,
  });

  for (const handler of [sessionHandler, profileHandler]) {
    const missing = await handler(new Request("https://interviewrunway.com/api/meeting-copilot/test", {
      method: "POST",
    }));
    assert.equal(missing.status, 401);
    const malformedScheme = await handler(new Request("https://interviewrunway.com/api/meeting-copilot/test", {
      method: "POST",
      headers: { authorization: "Basic not-a-bridge-token" },
    }));
    assert.equal(malformedScheme.status, 401);
    const invalid = await handler(new Request("https://interviewrunway.com/api/meeting-copilot/test", {
      method: "POST",
      headers: { authorization: "Bearer invalid-but-shaped" },
    }));
    assert.equal(invalid.status, 401);
  }
  assert.equal(sessionVerifyCalls, 1);
  assert.equal(profileVerifyCalls, 1);
  assert.equal(deliveryStore.calls.reserve, 0);
  assert.equal(deliveries, 0);
});

test("profile-copy entitlement denial and oversized bodies never reserve or deliver", async () => {
  let deliveries = 0;
  const deniedStore = memoryDeliveryStore();
  const denied = createMeetingCopilotProfileCopyHandler({
    verify: async () => verifiedSession(),
    hasAccess: async () => false,
    deliver: async () => {
      deliveries += 1;
      return { messageId: "must-not-send", recipients: [] };
    },
    deliveryStore: deniedStore,
  });
  const deniedResponse = await denied(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: JSON.stringify(savedProfile()),
  }));
  assert.equal(deniedResponse.status, 403);
  assert.equal(deniedStore.calls.reserve, 0);

  const oversizedStore = memoryDeliveryStore();
  const oversized = createMeetingCopilotProfileCopyHandler({
    verify: async () => verifiedSession(),
    hasAccess: async () => true,
    deliver: async () => {
      deliveries += 1;
      return { messageId: "must-not-send", recipients: [] };
    },
    deliveryStore: oversizedStore,
  });
  const declared = await oversized(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: {
      authorization: "Bearer valid-token-value",
      "content-length": String(MAX_MEETING_COPILOT_PROFILE_COPY_BYTES + 1),
      "content-type": "application/json",
    },
    body: "{}",
  }));
  assert.equal(declared.status, 413);

  const streamed = await oversized(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: `{"oversized":"${"x".repeat(MAX_MEETING_COPILOT_PROFILE_COPY_BYTES)}"}`,
  }));
  assert.equal(streamed.status, 413);
  assert.equal(oversizedStore.calls.reserve, 0);
  assert.equal(deliveries, 0);
});

test("profile-copy handler derives identity from bearer and never mixes two users", async () => {
  const userAResume = Buffer.from("%PDF-1.4\nPrivate resume bytes for learner A.\n%%EOF\n", "utf8");
  const userAJob = Buffer.from("%PDF-1.4\nPrivate job bytes for learner A.\n%%EOF\n", "utf8");
  const userBResume = Buffer.from("%PDF-1.4\nPrivate resume bytes for learner B.\n%%EOF\n", "utf8");
  const userBJob = Buffer.from("%PDF-1.4\nPrivate job bytes for learner B.\n%%EOF\n", "utf8");
  const profiles = {
    "token-user-a": savedProfile({
      name: "Learner A profile",
      resume: savedDocument("learner-a-resume.pdf", "Learner A committed resume evidence.".repeat(2), userAResume),
      jobDescription: savedDocument("learner-a-job.pdf", "Learner A committed job evidence.".repeat(2), userAJob),
    }),
    "token-user-b": savedProfile({
      name: "Learner B profile",
      resume: savedDocument("learner-b-resume.pdf", "Learner B committed resume evidence.".repeat(2), userBResume),
      jobDescription: savedDocument("learner-b-job.pdf", "Learner B committed job evidence.".repeat(2), userBJob),
    }),
  };
  const delivered = [];
  const deliveryStore = memoryDeliveryStore();
  const handler = createMeetingCopilotProfileCopyHandler({
    verify: async (token) => token === "token-user-a"
      ? verifiedSession("user-a@vividlabsai.com", "subject-a")
      : verifiedSession("user-b@vividlabsai.com", "subject-b"),
    hasAccess: async () => true,
    deliver: async (input) => {
      delivered.push({
        userEmail: input.userEmail,
        profileName: input.saved.profile.name,
        resume: Buffer.from(input.saved.profile.resume.contentBase64, "base64"),
        jobDescription: Buffer.from(input.saved.profile.jobDescription.contentBase64, "base64"),
        pdf: new TextDecoder().decode(input.pdf),
      });
      return { messageId: "sent", recipients: ["reviewer@vividlabsai.com"] };
    },
    deliveryStore,
  });

  for (const token of ["token-user-a", "token-user-b"]) {
    const response = await handler(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(profiles[token]),
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      delivered: true,
      delivery: "gmail",
    });
  }
  assert.deepEqual(delivered.map((item) => item.userEmail), [
    "user-a@vividlabsai.com",
    "user-b@vividlabsai.com",
  ]);
  assert.deepEqual(delivered.map((item) => item.profileName), [
    "Learner A profile",
    "Learner B profile",
  ]);
  assert.deepEqual(delivered[0].resume, userAResume);
  assert.deepEqual(delivered[0].jobDescription, userAJob);
  assert.notDeepEqual(delivered[0].resume, userBResume);
  assert.notDeepEqual(delivered[0].jobDescription, userBJob);
  assert.deepEqual(delivered[1].resume, userBResume);
  assert.deepEqual(delivered[1].jobDescription, userBJob);
  assert.notDeepEqual(delivered[1].resume, userAResume);
  assert.notDeepEqual(delivered[1].jobDescription, userAJob);
  assert.match(delivered[0].pdf, /user-a@vividlabsai\.com/);
  assert.doesNotMatch(delivered[0].pdf, /user-b@vividlabsai\.com/);
  assert.match(delivered[1].pdf, /user-b@vividlabsai\.com/);
  assert.doesNotMatch(delivered[1].pdf, /user-a@vividlabsai\.com/);
});

test("profile-copy sends once per owner/profile/revision and never retries terminal states", async () => {
  const deliveryStore = memoryDeliveryStore();
  let deliveries = 0;
  const handler = createMeetingCopilotProfileCopyHandler({
    verify: async () => verifiedSession(),
    hasAccess: async () => true,
    deliver: async () => {
      deliveries += 1;
      return { messageId: "gmail-message-one", recipients: ["reviewer@vividlabsai.com"] };
    },
    deliveryStore,
  });
  const request = () => new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: JSON.stringify(savedProfile()),
  });

  const first = await handler(request());
  assert.equal(first.status, 200);
  assert.equal(deliveries, 1);
  assert.equal([...deliveryStore.records.values()][0].status, "sent");

  const replay = await handler(request());
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), {
    ok: true,
    delivered: true,
    delivery: "gmail",
    replayed: true,
  });
  assert.equal(deliveries, 1);

  for (const terminalStatus of ["pending", "failed", "indeterminate"]) {
    const key = `${verifiedSession().ownerKey}:${savedProfile().profile.id}:1`;
    const blockedStore = memoryDeliveryStore(new Map([[key, {
      deliveryKey: key,
      status: terminalStatus,
      messageId: null,
      failureCode: terminalStatus === "pending" ? null : "test",
      createdAt: "2026-09-09T08:30:00.000Z",
      updatedAt: "2026-09-09T08:30:00.000Z",
      sentAt: null,
    }]]));
    const blockedHandler = createMeetingCopilotProfileCopyHandler({
      verify: async () => verifiedSession(),
      hasAccess: async () => true,
      deliver: async () => {
        deliveries += 1;
        return { messageId: "must-not-send", recipients: [] };
      },
      deliveryStore: blockedStore,
    });
    const blocked = await blockedHandler(request());
    assert.equal(blocked.status, 409);
  }
  assert.equal(deliveries, 1);
});

test("profile-copy enforces the owner hourly admission limit and records indeterminate sends", async () => {
  let deliveries = 0;
  const rateLimited = createMeetingCopilotProfileCopyHandler({
    verify: async () => verifiedSession(),
    hasAccess: async () => true,
    deliver: async () => {
      deliveries += 1;
      return { messageId: "must-not-send", recipients: [] };
    },
    deliveryStore: {
      reserve: async () => ({ kind: "rate-limited" }),
      complete: async () => { throw new Error("must not complete"); },
    },
  });
  const limited = await rateLimited(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: JSON.stringify(savedProfile()),
  }));
  assert.equal(limited.status, 429);
  assert.equal(deliveries, 0);

  const indeterminateStore = memoryDeliveryStore();
  const indeterminate = createMeetingCopilotProfileCopyHandler({
    verify: async () => verifiedSession(),
    hasAccess: async () => true,
    deliver: async () => {
      deliveries += 1;
      throw new MeetingCopilotProfileDeliveryError("indeterminate");
    },
    deliveryStore: indeterminateStore,
  });
  const response = await indeterminate(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: JSON.stringify(savedProfile()),
  }));
  assert.equal(response.status, 502);
  assert.equal([...indeterminateStore.records.values()][0].status, "indeterminate");
  assert.equal([...indeterminateStore.records.values()][0].failureCode, "indeterminate");
});

test("malformed payload and delivery failure are safe and never expose profile contents", async () => {
  let deliveries = 0;
  const deliveryStore = memoryDeliveryStore();
  const handler = createMeetingCopilotProfileCopyHandler({
    verify: async () => verifiedSession(),
    hasAccess: async () => true,
    deliver: async () => {
      deliveries += 1;
      throw new MeetingCopilotProfileDeliveryError("configuration");
    },
    deliveryStore,
  });
  const malformed = await handler(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: JSON.stringify({ ...savedProfile(), userEmail: "attacker@example.com" }),
  }));
  assert.equal(malformed.status, 400);
  assert.equal(deliveries, 0);

  const failed = await handler(new Request("https://interviewrunway.com/api/meeting-copilot/profile-copy", {
    method: "POST",
    headers: { authorization: "Bearer valid-token-value", "content-type": "application/json" },
    body: JSON.stringify(savedProfile()),
  }));
  assert.equal(failed.status, 503);
  const body = await failed.json();
  assert.match(body.error, /^Profile saved, but /);
  assert.doesNotMatch(JSON.stringify(body), /System design trade-offs|Built a reliable event platform/);
  assert.equal([...deliveryStore.records.values()][0].status, "failed");
  assert.equal([...deliveryStore.records.values()][0].failureCode, "configuration");
});

test("profile MIME marks updates and attaches the exact committed report, resume, and job description", async () => {
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile({
    revision: 2,
    updatedAt: "2026-09-09T09:30:00.000Z",
  }));
  assert.ok(saved);
  const message = createMeetingCopilotProfileMessage({
    configuration: {
      clientId: "client",
      clientSecret: "secret",
      refreshToken: "refresh",
      senderEmail: "reports@vividlabsai.com",
      recipients: ["reviewer@vividlabsai.com"],
      internalDomain: "vividlabsai.com",
    },
    messageId: saved.eventId,
    pdf: new TextEncoder().encode("%PDF-1.4 private-profile"),
    saved,
    sentAt: new Date("2026-09-09T09:31:00Z"),
    userEmail: USER.email,
  });
  assert.match(message, /Subject: Interview Runway Meeting Copilot profile updated/);
  assert.match(message, /Content-Disposition: attachment; filename="meeting-copilot-profile-report\.pdf"/);
  assert.match(message, /Content-Description: Resume PDF/);
  assert.match(message, /Content-Disposition: attachment; filename="resume\.pdf"/);
  assert.match(message, /Content-Description: Job description PDF/);
  assert.match(message, /Content-Disposition: attachment; filename="job-description\.pdf"/);
  const text = decodeMimeTextPart(message);
  assert.match(text, /Resume source file: lasya-resume\.pdf/);
  assert.match(text, /Job-description source file: platform-role\.pdf/);
  assert.match(message, new RegExp(saved.profile.resume.contentBase64));
  assert.match(message, new RegExp(saved.profile.jobDescription.contentBase64));
  assert.deepEqual(Buffer.from(saved.profile.resume.contentBase64, "base64"), RESUME_PDF);
  assert.deepEqual(Buffer.from(saved.profile.jobDescription.contentBase64, "base64"), JOB_DESCRIPTION_PDF);
  assert.ok(Buffer.byteLength(message, "utf8") < MAX_MEETING_COPILOT_GMAIL_MESSAGE_BYTES);
  assert.doesNotMatch(message, new RegExp(saved.profile.id));
  assert.doesNotMatch(message, /workspace-refresh-token/);
});

test("profile email preserves non-ASCII form data and exact source-document bytes", async () => {
  const resumeBytes = Buffer.from("%PDF-1.4\nRésumé — José 東京\n%%EOF\n", "utf8");
  const jobBytes = Buffer.from("%PDF-1.4\nRôle ingénieur — München\n%%EOF\n", "utf8");
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile({
    name: "Profil José 東京",
    focus: "Architecture distribuée — fiabilité et 性能",
    customGuidance: "Préserver mes faits; expliquer clairement le pourquoi.",
    resume: savedDocument(
      "résumé-josé-東京.pdf",
      "Résumé evidence with enough learner detail for the profile copy.",
      resumeBytes,
    ),
    jobDescription: savedDocument(
      "rôle-münchen.pdf",
      "Rôle evidence with enough employer detail for the profile copy.",
      jobBytes,
    ),
  }));
  assert.ok(saved);
  const message = createMeetingCopilotProfileMessage({
    configuration: {
      clientId: "client",
      clientSecret: "secret",
      refreshToken: "refresh",
      senderEmail: "reports@vividlabsai.com",
      recipients: ["reviewer@vividlabsai.com"],
      internalDomain: "vividlabsai.com",
    },
    messageId: saved.eventId,
    pdf: new TextEncoder().encode("%PDF-1.4 private-profile"),
    saved,
    sentAt: new Date("2026-09-09T09:31:00Z"),
    userEmail: USER.email,
  });
  const text = decodeMimeTextPart(message);
  assert.match(text, /Profile: Profil José 東京/);
  assert.match(text, /Architecture distribuée — fiabilité et 性能/);
  assert.match(text, /Préserver mes faits; expliquer clairement le pourquoi\./);
  assert.match(text, /Resume source file: résumé-josé-東京\.pdf/);
  assert.match(text, /Job-description source file: rôle-münchen\.pdf/);
  assert.match(message, /Content-Disposition: attachment; filename="resume\.pdf"/);
  assert.match(message, /Content-Disposition: attachment; filename="job-description\.pdf"/);
  assert.match(message, new RegExp(resumeBytes.toString("base64")));
  assert.match(message, new RegExp(jobBytes.toString("base64")));
  assert.deepEqual(Buffer.from(saved.profile.resume.contentBase64, "base64"), resumeBytes);
  assert.deepEqual(Buffer.from(saved.profile.jobDescription.contentBase64, "base64"), jobBytes);
});

test("profile delivery rejects an oversized generated report before any Google request", async () => {
  const saved = await parseMeetingCopilotSavedProfileCopy(savedProfile());
  assert.ok(saved);
  let calls = 0;
  await assert.rejects(
    deliverMeetingCopilotProfileCopy({
      pdf: new Uint8Array(3_000_001),
      saved,
      userEmail: USER.email,
    }, {
      fetch: async () => {
        calls += 1;
        throw new Error("must not call Google");
      },
    }),
    (error) => error instanceof MeetingCopilotProfileDeliveryError && error.code === "rejected",
  );
  assert.equal(calls, 0);
});
