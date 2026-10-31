// ---------------------------------------------------------------------------
// queryCache.js — Simple in-memory query cache with TTL
// ---------------------------------------------------------------------------

const cache = new Map()
const DEFAULT_TTL = 60 * 1000 // 1 minute

/**
 * Get a cached value by key.
 * Returns undefined if expired or not found.
 */
export function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

/**
 * Set a value in the cache with optional TTL (ms).
 */
export function setCached(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  })
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix) {
  for (const key of cache.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      cache.delete(key)
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearCache() {
  cache.clear()
}

/**
 * Higher-order fetch with caching:
 * - Returns cached data immediately if fresh
 * - Fetches fresh data and caches it otherwise
 */
export async function withCache(key, fetcher, ttl = DEFAULT_TTL) {
  const cached = getCached(key)
  if (cached !== undefined) return cached
  const result = await fetcher()
  setCached(key, result, ttl)
  return result
}
