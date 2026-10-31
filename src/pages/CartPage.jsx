import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, MessageCircle, PackageOpen } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/helpers'

const WA_NUMBER = '6281326181500'

function buildWAMessage(cart, total) {
  const lines = cart.map(
    (item) =>
      `• ${item.name} (${item.type}${item.caliber ? `, ${item.caliber}` : ''}) × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`,
  )
  return (
    `Hi, aku mau pesan ini:\n\n` +
    lines.join('\n') +
    `\n\nTotal: ${formatPrice(total)}\n\nMohon konfirmasi ketersediaan dan detail pengiriman. Terima kasih! 🙏`
  )
}

export default function CartPage({ onBack }) {
  const { cart, itemCount, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart()

  const handleCheckout = () => {
    if (cart.length === 0) return
    const message = buildWAMessage(cart, totalPrice)
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${WA_NUMBER}?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="display cart-title">
          <ShoppingCart size={28} /> Shopping Cart
          {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="state-box">
          <PackageOpen size={40} />
          <p>Your cart is empty. Add some hardware first!</p>
          <button type="button" className="btn btn--primary" onClick={onBack}>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items list */}
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  className="cart-item-img"
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="cart-item-info">
                  <p className="cart-item-name display">{item.name}</p>
                  <p className="cart-item-meta">
                    {item.type}
                    {item.caliber ? ` · ${item.caliber}` : ''}
                  </p>
                  <p className="cart-item-price">{formatPrice(item.price)}</p>
                </div>

                <div className="cart-item-controls">
                  <div className="qty-control">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-val">{item.quantity || 1}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="cart-item-subtotal">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                  <button
                    type="button"
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={clearCart}
              style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>

          {/* Order summary */}
          <div className="cart-summary">
            <h2 className="section-title">Order Summary</h2>

            <div className="summary-rows">
              {cart.map((item) => (
                <div key={item.id} className="summary-row">
                  <span>{item.name} × {item.quantity || 1}</span>
                  <span>{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <span className="price">{formatPrice(totalPrice)}</span>
            </div>

            <button
              type="button"
              className="btn btn--wa"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              <MessageCircle size={18} />
              Checkout via WhatsApp
            </button>

            <p className="cart-wa-note">
              Tombol akan membuka WhatsApp dengan detail pesanan kamu otomatis terisi.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
