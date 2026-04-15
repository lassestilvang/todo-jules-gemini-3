// Simple in-memory rate limiter
// For a production app, use Redis or a proper KV store.

type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = store.get(ip);

  // Clean up expired records occasionally to prevent memory leaks in this simple implementation
  if (Math.random() < 0.01) {
    for (const [key, val] of store.entries()) {
      if (val.resetTime < now) {
        store.delete(key);
      }
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
