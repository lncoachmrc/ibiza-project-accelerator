const RESEND_API_ORIGIN = "https://api.resend.com";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type FetchLike = typeof fetch;

type RateLimitOptions = {
  minIntervalMs?: number;
  max429Retries?: number;
  defaultRetryMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function requestUrl(input: FetchInput) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isResendRequest(input: FetchInput) {
  try {
    return new URL(requestUrl(input)).origin === RESEND_API_ORIGIN;
  } catch {
    return false;
  }
}

export function retryAfterMilliseconds(value: string | null, now = Date.now()) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000);
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, timestamp - now);
}

export function createResendRateLimitedFetch(
  baseFetch: FetchLike,
  options: RateLimitOptions = {},
): FetchLike {
  const minIntervalMs = Math.max(0, options.minIntervalMs ?? 160);
  const max429Retries = Math.max(0, options.max429Retries ?? 3);
  const defaultRetryMs = Math.max(0, options.defaultRetryMs ?? 1000);
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;

  let queue: Promise<void> = Promise.resolve();
  let nextAllowedAt = 0;

  const limitedFetch = async (input: FetchInput, init?: FetchInit) => {
    if (!isResendRequest(input)) {
      return baseFetch(input, init);
    }

    const run = async () => {
      const waitMs = Math.max(0, nextAllowedAt - now());
      if (waitMs > 0) await sleep(waitMs);
      nextAllowedAt = now() + minIntervalMs;

      for (let attempt = 0; ; attempt += 1) {
        const response = await baseFetch(input, init);
        if (response.status !== 429 || attempt >= max429Retries) {
          return response;
        }

        const retryMs = retryAfterMilliseconds(response.headers.get("retry-after"), now())
          ?? defaultRetryMs;
        await sleep(retryMs);
        nextAllowedAt = Math.max(nextAllowedAt, now() + minIntervalMs);
      }
    };

    const result = queue.then(run, run);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };

  return limitedFetch as FetchLike;
}
