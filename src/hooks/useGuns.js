import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'
import { withCache, invalidateCache, setCached } from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, error, pagination, refetch }.
// Cache menggunakan Cache Storage API → terlihat di Network tab & DevTools
// Application → Cache Storage → "query-cache"
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)
  const cacheKey = `guns:list:${paramKey}`

  const fetchGuns = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Bypass cache if forceRefresh
      let response
      if (forceRefresh) {
        // invalidateCache sekarang async (Cache Storage API)
        await invalidateCache(cacheKey)
        response = await gunService.getGuns(params)
        // Simpan hasil baru ke cache
        await setCached(cacheKey, response)
      } else {
        response = await withCache(cacheKey, () => gunService.getGuns(params))
      }

      if (response.success) {
        setGuns(response.data || [])
        setPagination(response.pagination || null)
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      setGuns([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  const refetch = useCallback(() => fetchGuns(true), [fetchGuns])

  return { guns, loading, error, pagination, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID (with caching).
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const cacheKey = `guns:detail:${id}`

  const fetchGun = useCallback(async (forceRefresh = false) => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      let response
      if (forceRefresh) {
        // invalidateCache sekarang async
        await invalidateCache(cacheKey)
        response = await gunService.getGunById(id)
        await setCached(cacheKey, response)
      } else {
        response = await withCache(cacheKey, () => gunService.getGunById(id))
      }

      if (response.success) {
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id, cacheKey])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  const refetch = useCallback(() => fetchGun(true), [fetchGun])

  return { gun, loading, error, refetch }
}
