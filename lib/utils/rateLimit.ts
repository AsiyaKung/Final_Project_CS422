// In-memory rate limiter – suitable for single-instance deployments.
// For multi-instance / serverless, replace with Upstash Redis (@upstash/ratelimit).

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodically purge expired entries to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (now > rec.resetAt) store.delete(key);
  }
}, 60_000);

/**
 * Returns `true` if the request is allowed, `false` if rate-limited.
 *
 * @param key        Unique key (e.g. IP address or `uid:route`)
 * @param maxRequests Max requests per window
 * @param windowMs   Window size in milliseconds (default: 60 s)
 */
export function rateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const rec = store.get(key);

  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (rec.count >= maxRequests) return false;

  rec.count++;
  return true;
}

/** Get the IP address from a Next.js request (header or socket). */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    (req.headers.get("x-real-ip") ?? "") ||
    "unknown"
  );
}
