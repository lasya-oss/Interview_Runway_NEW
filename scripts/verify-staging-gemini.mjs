import assert from "node:assert/strict";

const apiKey = required("GEMINI_API_KEY");
const model = "gemini-3.8-live";
const headers = {
  "x-goog-api-key": apiKey,
  accept: "application/json",
};

const modelResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}`, {
  headers,
  redirect: "error",
});
assert.equal(modelResponse.ok, true, await safeFailure("model access", modelResponse));

const tokenResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({
    uses: 1,
    liveConnectConstraints: {
      model: `models/${model}`,
      config: {
        responseModalities: ["AUDIO"],
        sessionResumption: {},
      },
    },
  }),
  redirect: "error",
});
const tokenBody = await tokenResponse.json().catch(() => null);
assert.equal(tokenResponse.ok, true, safeFailureFromBody("ephemeral token", tokenResponse, tokenBody));
assert.ok(
  typeof tokenBody?.name === "string" && tokenBody.name.length >= 16 && !/\s/.test(tokenBody.name),
  "Gemini ephemeral token response was malformed",
);

console.log("GEMINI_STAGING_PREFLIGHT=" + JSON.stringify({
  key: "accepted",
  model,
  modelAccess: "ok",
  ephemeralToken: "ok",
}));

async function safeFailure(label, response) {
  return safeFailureFromBody(label, response, await response.json().catch(() => null));
}

function safeFailureFromBody(label, response, body) {
  const status = typeof body?.error?.status === "string" ? body.error.status : "UNKNOWN";
  const reason = Array.isArray(body?.error?.details)
    ? body.error.details.find((detail) => typeof detail?.reason === "string")?.reason
    : null;
  return `${label} failed with HTTP ${response.status} (${reason ?? status})`;
}

function required(name) {
  const value = process.env[name]?.trim();
  assert.ok(value, `${name} is required`);
  return value;
}
