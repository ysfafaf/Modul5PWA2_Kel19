// ---------------------------------------------------------------------------
// queryCache.js — Query cache menggunakan Cache Storage API
//
// Berbeda dengan in-memory Map, Cache Storage API bekerja di level network:
//   ✅ Terlihat di Network tab DevTools (kolom "Size" → "(ServiceWorker)")
//   ✅ Terlihat di Application → Cache Storage → "query-cache"
//   ✅ Persistent antar page refresh (sampai TTL habis)
//   ✅ Bisa di-inspect dan dihapus manual dari DevTools
//
// Strategi: Cache-first dengan TTL custom lewat header X-Cache-Expires.
// ---------------------------------------------------------------------------

const CACHE_NAME = 'query-cache'
const DEFAULT_TTL = 60 * 1000 // 1 menit

// Fallback ke in-memory jika Cache API tidak tersedia (SSR / test env)
const memoryFallback = new Map()

function isCacheSupported() {
  return typeof caches !== 'undefined'
}

/**
 * Buat URL sintetis untuk request non-HTTP (misal: key berbasis string).
 * Cache API hanya menerima Request/URL valid.
 */
function toRequestUrl(key) {
  // Encode key agar aman sebagai URL path
  return `https://query-cache.local/${encodeURIComponent(key)}`
}

// ---------------------------------------------------------------------------
// getCached — ambil nilai dari cache jika belum expired
// ---------------------------------------------------------------------------
export async function getCached(key) {
  if (!isCacheSupported()) {
    const entry = memoryFallback.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) { memoryFallback.delete(key); return undefined }
    return entry.value
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(toRequestUrl(key))
    if (!cached) return undefined

    // Cek TTL via header custom X-Cache-Expires
    const expiresAt = Number(cached.headers.get('X-Cache-Expires') || 0)
    if (Date.now() > expiresAt) {
      await cache.delete(toRequestUrl(key))
      return undefined
    }

    const data = await cached.json()
    console.log(`[QueryCache] HIT → ${key}`)
    return data
  } catch (err) {
    console.warn('[QueryCache] getCached error:', err)
    return undefined
  }
}

// ---------------------------------------------------------------------------
// setCached — simpan nilai ke cache dengan TTL
// ---------------------------------------------------------------------------
export async function setCached(key, value, ttl = DEFAULT_TTL) {
  if (!isCacheSupported()) {
    memoryFallback.set(key, { value, expiresAt: Date.now() + ttl })
    return
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const expiresAt = Date.now() + ttl

    // Bungkus value dalam Response agar bisa disimpan di Cache Storage
    const response = new Response(JSON.stringify(value), {
      headers: {
        'Content-Type': 'application/json',
        // Header custom untuk menyimpan waktu expired
        'X-Cache-Expires': String(expiresAt),
        'X-Cache-Key': key,
        'X-Cache-Stored-At': new Date().toISOString(),
      },
    })

    await cache.put(toRequestUrl(key), response)
    console.log(`[QueryCache] SET → ${key} (expires in ${ttl / 1000}s)`)
  } catch (err) {
    console.warn('[QueryCache] setCached error:', err)
  }
}

// ---------------------------------------------------------------------------
// invalidateCache — hapus key tertentu atau semua key dengan prefix
// ---------------------------------------------------------------------------
export async function invalidateCache(keyOrPrefix) {
  if (!isCacheSupported()) {
    for (const key of memoryFallback.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        memoryFallback.delete(key)
      }
    }
    return
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    const prefix = toRequestUrl(keyOrPrefix)

    await Promise.all(
      keys
        .filter(req => req.url === prefix || req.url.startsWith(prefix))
        .map(req => cache.delete(req))
    )
    console.log(`[QueryCache] INVALIDATED → ${keyOrPrefix}`)
  } catch (err) {
    console.warn('[QueryCache] invalidateCache error:', err)
  }
}

// ---------------------------------------------------------------------------
// clearCache — hapus seluruh isi cache
// ---------------------------------------------------------------------------
export async function clearCache() {
  if (!isCacheSupported()) { memoryFallback.clear(); return }

  try {
    await caches.delete(CACHE_NAME)
    console.log('[QueryCache] CLEARED all entries')
  } catch (err) {
    console.warn('[QueryCache] clearCache error:', err)
  }
}

// ---------------------------------------------------------------------------
// withCache — helper utama: cache-first fetch dengan TTL
// ---------------------------------------------------------------------------
export async function withCache(key, fetcher, ttl = DEFAULT_TTL) {
  const cached = await getCached(key)
  if (cached !== undefined) return cached

  console.log(`[QueryCache] MISS → ${key} — fetching from network...`)
  const result = await fetcher()
  await setCached(key, result, ttl)
  return result
}
