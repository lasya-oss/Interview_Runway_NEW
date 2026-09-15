import assert from "node:assert/strict";
import test from "node:test";

import {
  MEETING_COPILOT_PROBE_TIMEOUT_MS,
  meetingCopilotProbeUrls,
} from "../app/lib/meeting-copilot-probe.ts";

test("loopback probe covers both 127.0.0.1 and localhost spellings", () => {
  assert.deepEqual(meetingCopilotProbeUrls("http://127.0.0.1:8123/"), [
    "http://127.0.0.1:8123/",
    "http://localhost:8123/",
  ]);
  assert.deepEqual(meetingCopilotProbeUrls("http://localhost:8123/"), [
    "http://localhost:8123/",
    "http://127.0.0.1:8123/",
  ]);
});

test("non-loopback probe urls are left untouched", () => {
  assert.deepEqual(meetingCopilotProbeUrls("https://example.com/"), [
    "https://example.com/",
  ]);
  assert.deepEqual(meetingCopilotProbeUrls("not a url"), ["not a url"]);
});

test("probe timeout gives a slow-starting companion room to answer", () => {
  assert.ok(MEETING_COPILOT_PROBE_TIMEOUT_MS >= 2_000);
});
