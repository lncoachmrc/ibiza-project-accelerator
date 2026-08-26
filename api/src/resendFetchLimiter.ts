import { createResendRateLimitedFetch } from "./resendRateLimit.js";

const configuredInterval = Number(process.env.RESEND_MIN_REQUEST_INTERVAL_MS || 160);
const minIntervalMs = Number.isFinite(configuredInterval)
  ? Math.min(Math.max(configuredInterval, 110), 5000)
  : 160;

const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = createResendRateLimitedFetch(nativeFetch, {
  minIntervalMs,
  max429Retries: 3,
  defaultRetryMs: 1000,
});

console.info(`[api] Resend request pacing enabled at ${minIntervalMs}ms minimum interval`);
