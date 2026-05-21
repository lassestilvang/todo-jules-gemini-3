// Simple in-memory rate limiter
// For a production app, use Redis or a proper KV store.

type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();
const MAX_STORE_SIZE = 10000;

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = store.get(ip);

  // Clean up expired records occasionally or when memory limit is reached to prevent DoS via memory exhaustion
  if (store.size >= MAX_STORE_SIZE || Math.random() < 0.01) {
    for (const [key, val] of store.entries()) {
      if (val.resetTime < now) {
        store.delete(key);
      }
    }

    // Fallback: If still too large after cleanup, clear the oldest entry to prevent OOM crash
    // SECURE: Do not use store.clear() to prevent attackers from clearing the rate limit state by sending thousands of requests from spoofed IPs.
    if (store.size >= MAX_STORE_SIZE) {
        const firstKey = store.keys().next().value;
        if (firstKey !== undefined) store.delete(firstKey);
    }
  }

  if (!record) {
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return true; // Allowed
  }

  if (now > record.resetTime) {
    // Window expired, reset
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count += 1;
  store.set(ip, record);
  return true; // Allowed
}
