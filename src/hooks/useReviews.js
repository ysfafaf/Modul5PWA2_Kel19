import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import { withCache, invalidateCache } from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product (with caching).
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const cacheKey = `reviews:${gunId}`

  const fetchReviews = useCallback(async (forceRefresh = false) => {
    if (!gunId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      let response
      if (forceRefresh) {
        await invalidateCache(cacheKey)
        response = await reviewService.getReviews(gunId)
      } else {
        response = await withCache(cacheKey, () => reviewService.getReviews(gunId), 30_000)
      }

      if (response.success) {
        setReviews(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch reviews.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reviews.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId, cacheKey])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const refetch = useCallback(() => fetchReviews(true), [fetchReviews])

  return { reviews, loading, error, refetch }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit a new review for a product.
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await reviewService.createReview(gunId, reviewData)

      if (response.success) {
        setSuccess(true)
        // Invalidate the review cache for this gun
        await invalidateCache(`reviews:${gunId}`)
        return response.data
      } else {
        setError(response.message || 'Failed to submit review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}

// ---------------------------------------------------------------------------
// useUpdateReview — update an existing review.
// ---------------------------------------------------------------------------

export function useUpdateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateReview = async (reviewId, gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.updateReview(reviewId, reviewData)

      if (response.success) {
        await invalidateCache(`reviews:${gunId}`)
        return response.data
      } else {
        setError(response.message || 'Failed to update review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { updateReview, loading, error }
}

// ---------------------------------------------------------------------------
// useDeleteReview — delete a review.
// ---------------------------------------------------------------------------

export function useDeleteReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteReview = async (reviewId, gunId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.deleteReview(reviewId)

      if (response.success) {
        await invalidateCache(`reviews:${gunId}`)
        return true
      } else {
        setError(response.message || 'Failed to delete review.')
        return false
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting review.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deleteReview, loading, error }
}
