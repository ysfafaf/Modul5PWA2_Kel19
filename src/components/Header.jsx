import { Plus, ShoppingCart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useCart } from '../hooks/useCart'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true, badgeType: 'favorites' },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate, onNavigateCart }) {
  const { favorites } = useFavorites()
  const favCount = favorites ? favorites.length : 0
  const { itemCount } = useCart()

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="header-right">
        {/* Cart button */}
        <button
          type="button"
          className="cart-nav-btn"
          onClick={onNavigateCart}
          title="Shopping Cart"
          aria-label={`Cart (${itemCount} items)`}
        >
          <ShoppingCart size={20} />
          {itemCount > 0 && (
            <span className="cart-nav-badge">{itemCount}</span>
          )}
        </button>

        {onNavigateCreate && (
          <button
            type="button"
            className="btn btn--primary btn--sm header-cta"
            onClick={onNavigateCreate}
            title="Register new hardware"
          >
            <Plus size={15} /> Add Hardware
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
