import { useState, useEffect, useCallback } from 'react'
import cartService from '../services/cartService'

// ---------------------------------------------------------------------------
// useCart — reactive cart state backed by localStorage
// ---------------------------------------------------------------------------

export function useCart() {
  const [cart, setCart] = useState(() => cartService.getCart())

  const refresh = useCallback(() => {
    setCart(cartService.getCart())
  }, [])

  const addToCart = useCallback((gun) => {
    const result = cartService.addToCart(gun)
    if (result.success) setCart(result.data)
    return result
  }, [])

  const removeFromCart = useCallback((gunId) => {
    const result = cartService.removeFromCart(gunId)
    if (result.success) setCart(result.data)
    return result
  }, [])

  const updateQuantity = useCallback((gunId, qty) => {
    const result = cartService.updateQuantity(gunId, qty)
    if (result.success) setCart(result.data)
    return result
  }, [])

  const clearCart = useCallback(() => {
    const result = cartService.clearCart()
    if (result.success) setCart(result.data)
    return result
  }, [])

  const isInCart = useCallback((gunId) => {
    return cart.some((item) => String(item.id) === String(gunId))
  }, [cart])

  const itemCount = cart.reduce((s, i) => s + (i.quantity || 1), 0)
  const totalPrice = cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0)

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'bore_barrel_cart') refresh()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [refresh])

  return { cart, itemCount, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart, isInCart, refresh }
}
