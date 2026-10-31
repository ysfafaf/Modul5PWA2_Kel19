import { useState, useCallback } from 'react'
import {
  ArrowLeft, Star, Send, Loader, Share2, Check, Link,
  ShoppingCart, ThumbsUp, ThumbsDown, Pencil, Trash2, X, Plus,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from '../../hooks/useReviews'
import { useCart } from '../../hooks/useCart'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view.
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const currentUserId = getUserIdentifier()

  // ─── Share ────────────────────────────────────────────────────────────────
  const [shareCopied, setShareCopied] = useState(false)
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${gun.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: gun.name, text: `Check out ${gun.name}`, url: shareUrl })
        return
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    } catch {
      prompt('Copy this link:', shareUrl)
    }
  }

  // ─── Cart ────────────────────────────────────────────────────────────────
  const { addToCart, isInCart, removeFromCart } = useCart()
  const inCart = isInCart(gun.id || gun.name)
  const [cartToast, setCartToast] = useState('')

  const handleCartToggle = () => {
    if (inCart) {
      removeFromCart(gun.id || gun.name)
      setCartToast('Removed from cart')
    } else {
      addToCart(gun)
      setCartToast('Added to cart!')
    }
    setTimeout(() => setCartToast(''), 2000)
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const { updateReview, loading: updating } = useUpdateReview()
  const { deleteReview, loading: deleting } = useDeleteReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Edit state
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  // Thumbs (localStorage)
  const getThumbsKey = (reviewId) => `bore_barrel_thumb_${reviewId}`
  const getThumb = (reviewId) => {
    try { return localStorage.getItem(getThumbsKey(reviewId)) } catch { return null }
  }
  const setThumb = (reviewId, vote) => {
    try { localStorage.setItem(getThumbsKey(reviewId), vote) } catch {}
  }
  const [thumbStates, setThumbStates] = useState(() => {
    const obj = {}
    return obj
  })

  const handleThumb = useCallback((reviewId, vote) => {
    const current = getThumb(reviewId)
    const newVote = current === vote ? null : vote
    if (newVote) setThumb(reviewId, newVote)
    else try { localStorage.removeItem(getThumbsKey(reviewId)) } catch {}
    setThumbStates((prev) => ({ ...prev, [reviewId]: newVote }))
  }, [])

  const getThumbState = (reviewId) =>
    thumbStates[reviewId] !== undefined ? thumbStates[reviewId] : getThumb(reviewId)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')
    if (rating < 1 || rating > 5) { setReviewError('Rating must be 1–5.'); return }
    const result = await createReview(gun.id, {
      user_identifier: currentUserId,
      rating,
      comment: comment.trim(),
    })
    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const startEdit = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleUpdateReview = async (rev) => {
    const result = await updateReview(rev.id, gun.id, {
      rating: editRating,
      comment: editComment.trim(),
    })
    if (result) {
      setEditingReviewId(null)
      refetchReviews()
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    await deleteReview(reviewId, gun.id)
    refetchReviews()
  }

  return (
    <div className="detail">
      {/* Back */}
      <div className="detail-top-bar">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Catalog
        </button>

        {/* Share */}
        <button
          type="button"
          className={`btn btn--outline btn--sm share-btn${shareCopied ? ' share-btn--copied' : ''}`}
          onClick={handleShare}
          title="Share this product"
        >
          {shareCopied ? <><Check size={15} /> Link Copied!</> : <><Share2 size={15} /> Share</>}
        </button>
      </div>

      {/* Cart toast */}
      {cartToast && (
        <div className="toast toast--success" style={{ marginBottom: 0 }}>
          <ShoppingCart size={16} /> {cartToast}
        </div>
      )}

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />

            {/* Add to cart */}
            <button
              type="button"
              className={`btn ${inCart ? 'btn--outline' : 'btn--cart'}`}
              onClick={handleCartToggle}
            >
              {inCart ? (
                <><X size={15} /> Remove from Cart</>
              ) : (
                <><ShoppingCart size={15} /> Add to Cart</>
              )}
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit new review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <p className="form-label" style={{ margin: 0 }}>
            <Plus size={13} style={{ display: 'inline' }} /> Write a Review
          </p>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const isOwn =
                  // Supabase: compare raw UUID stored in user_id field
                  (rev.user_id && String(rev.user_id) === String(currentUserId)) ||
                  // Fallback API: user_identifier may store the UUID directly
                  (rev.user_identifier && String(rev.user_identifier) === String(currentUserId))
              const thumbState = getThumbState(rev.id)

              return (
                <li key={rev.id} className="review-item">
                  {editingReviewId === rev.id ? (
                    // ── Inline edit form ──
                    <div className="review-edit-form">
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={500}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleUpdateReview(rev)}
                          disabled={updating}
                        >
                          {updating ? 'Saving…' : <><Check size={13} /> Save</>}
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingReviewId(null)}
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="review-head">
                        <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                        <span className="review-stars-display">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? 'var(--brass)' : 'none'}
                              stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                            />
                          ))}
                        </span>
                      </div>

                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Thumbs + CRUD row */}
                      <div className="review-footer">
                        <div className="review-thumbs">
                          <button
                            type="button"
                            className={`thumb-btn${thumbState === 'up' ? ' thumb-btn--active-up' : ''}`}
                            onClick={() => handleThumb(rev.id, 'up')}
                            title="Helpful"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            type="button"
                            className={`thumb-btn${thumbState === 'down' ? ' thumb-btn--active-down' : ''}`}
                            onClick={() => handleThumb(rev.id, 'down')}
                            title="Not helpful"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>

                        {isOwn && (
                          <div className="review-owner-actions">
                            <button
                              type="button"
                              className="review-action-btn"
                              onClick={() => startEdit(rev)}
                              title="Edit review"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="review-action-btn review-action-btn--danger"
                              onClick={() => handleDeleteReview(rev.id)}
                              disabled={deleting}
                              title="Delete review"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
