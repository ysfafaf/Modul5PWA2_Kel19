// ---------------------------------------------------------------------------
// cartService.js — localStorage-based shopping cart
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // quota exceeded — silently fail
  }
}

const cartService = {
  getCart() {
    return readCart()
  },

  addToCart(gun) {
    const cart = readCart()
    const existing = cart.find((item) => String(item.id) === String(gun.id))
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1
    } else {
      cart.push({
        id: gun.id,
        name: gun.name,
        price: gun.price ?? 0,
        image_url: gun.image_url || gun.image || '/guns/pistol.svg',
        type: gun.type || gun.category || '',
        caliber: gun.caliber || '',
        quantity: 1,
      })
    }
    writeCart(cart)
    return { success: true, data: cart }
  },

  removeFromCart(gunId) {
    const cart = readCart().filter((item) => String(item.id) !== String(gunId))
    writeCart(cart)
    return { success: true, data: cart }
  },

  updateQuantity(gunId, quantity) {
    if (quantity < 1) return this.removeFromCart(gunId)
    const cart = readCart().map((item) =>
      String(item.id) === String(gunId) ? { ...item, quantity } : item,
    )
    writeCart(cart)
    return { success: true, data: cart }
  },

  clearCart() {
    writeCart([])
    return { success: true, data: [] }
  },

  getItemCount() {
    return readCart().reduce((sum, item) => sum + (item.quantity || 1), 0)
  },

  isInCart(gunId) {
    return readCart().some((item) => String(item.id) === String(gunId))
  },
}

export default cartService
