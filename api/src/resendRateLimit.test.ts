import assert from "node:assert/strict";
import test from "node:test";
import { createResendRateLimitedFetch, retryAfterMilliseconds } from "./resendRateLimit.js";

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
