/**
 * Lightweight in-memory sliding-window rate limiter with lazy pruning (no background timers).
 */
function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'Too many requests, please try again later'
} = {}) {
  const hits = new Map();

  function pruneExpired(now) {
    for (const [key, timestamps] of hits.entries()) {
      const fresh = timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }

  function middleware(req, res, next) {
    const now = Date.now();
    if (hits.size > 5000) pruneExpired(now);

    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      hits.set(key, recent);
      return res.status(429).json({ message });
    }

    recent.push(now);
    hits.set(key, recent);
    return next();
  }

  middleware.reset = () => hits.clear();
  return middleware;
}

module.exports = { createRateLimiter };
