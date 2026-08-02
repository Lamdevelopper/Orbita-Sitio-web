/** Rate limiter en memoria con ventana deslizante. Cloudflare Workers (sin Redis). */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_KEYS = 5_000;

function pruneExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  // Workers cannot schedule timers in module scope. Clean lazily and keep the
  // isolate-local map bounded so arbitrary client keys cannot grow it forever.
  if (store.size >= MAX_KEYS) {
    pruneExpired();
    if (store.size >= MAX_KEYS) store.delete(store.keys().next().value as string);
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

export const limits = {
  subscribers: { maxRequests: 3, windowMs: 15 * 60 * 1000 },
  analytics: { maxRequests: 100, windowMs: 60 * 1000 },
  automation: { maxRequests: 20, windowMs: 60 * 1000 },
} as const;
