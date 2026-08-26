import assert from "node:assert/strict";
import test from "node:test";
import {
  createResendRateLimitedFetch,
  fitResendName,
  retryAfterMilliseconds,
} from "./resendRateLimit.js";

test("retry-after supports seconds and HTTP dates", () => {
  assert.equal(retryAfterMilliseconds("1.5", 0), 1500);
  assert.equal(retryAfterMilliseconds("Thu, 01 Jan 1970 00:00:02 GMT", 1000), 1000);
  assert.equal(retryAfterMilliseconds("invalid", 0), null);
});

test("Resend 429 responses are retried automatically", async () => {
  let calls = 0;
  const waits: number[] = [];
  const baseFetch = (async () => {
    calls += 1;
    if (calls === 1) {
      return new Response("rate limited", {
        status: 429,
        headers: { "retry-after": "0" },
      });
    }
    return new Response("ok", { status: 200 });
  }) as typeof fetch;

  const limitedFetch = createResendRateLimitedFetch(baseFetch, {
    minIntervalMs: 0,
    defaultRetryMs: 0,
    sleep: async (ms) => { waits.push(ms); },
  });

  const response = await limitedFetch("https://api.resend.com/contacts");
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(waits, [0]);
});

test("non-Resend requests bypass the limiter", async () => {
  let calls = 0;
  const baseFetch = (async () => {
    calls += 1;
    return new Response("ok", { status: 200 });
  }) as typeof fetch;

  const limitedFetch = createResendRateLimitedFetch(baseFetch, {
    minIntervalMs: 1000,
    sleep: async () => { throw new Error("should not sleep"); },
  });

  const response = await limitedFetch("https://example.com/test");
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
});

test("Resend resource names are clamped to 70 characters", () => {
  const longName = "ES | Agencias y arquitectos | Inmuebles a reformar | Apoyo profesional durante visitas comerciales";
  const fitted = fitResendName(longName);
  assert.equal(fitted.length <= 70, true);
  assert.equal(longName.startsWith(fitted), true);
});

test("long segment names preserve their stable id suffix", () => {
  const suffix = " — a62d2451";
  const longSegmentName = `Eivitech — ES | Agencias y arquitectos | Inmuebles a reformar | Apoyo en visitas${suffix}`;
  const fitted = fitResendName(longSegmentName);
  assert.equal(fitted.length <= 70, true);
  assert.equal(fitted.endsWith(suffix), true);
});

test("Resend JSON request bodies clamp top-level name before sending", async () => {
  let sentBody = "";
  const baseFetch = (async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    sentBody = typeof init?.body === "string" ? init.body : "";
    return new Response("ok", { status: 200 });
  }) as typeof fetch;

  const limitedFetch = createResendRateLimitedFetch(baseFetch, { minIntervalMs: 0 });
  const originalName = "Campaign name ".repeat(8);
  await limitedFetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: originalName, subject: "Subject" }),
  });

  const payload = JSON.parse(sentBody) as { name: string; subject: string };
  assert.equal(payload.name.length <= 70, true);
  assert.equal(payload.name.length > 0, true);
  assert.equal(payload.subject, "Subject");
});
