import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'
import { withCache, invalidateCache } from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, error, pagination, refetch }.
// Now features query caching (1 min TTL) to avoid redundant network calls.
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
        invalidateCache(cacheKey)
        response = await gunService.getGuns(params)
        // Cache fresh result
        import('../utils/queryCache').then(({ setCached }) => {
          setCached(cacheKey, response)
        })
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
        invalidateCache(cacheKey)
        response = await gunService.getGunById(id)
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
