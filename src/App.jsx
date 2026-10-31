import { useState, lazy, Suspense, useEffect } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import archiveService from './services/archiveService.js'
import gunService from './services/gunService.js'
import './App.css'

// ── Lazy-loaded pages & components ──────────────────────────────────────────
const Catalog         = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage   = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage     = lazy(() => import('./pages/ProfilePage.jsx'))
const CreateGunPage   = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage     = lazy(() => import('./pages/EditGunPage.jsx'))
const CartPage        = lazy(() => import('./pages/CartPage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const ArchivedPage    = lazy(() => import('./pages/ArchivedPage.jsx'))
const GunDetail       = lazy(() => import('./components/gun/GunDetail.jsx'))

// ── Suspense fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', gap: 12, color: 'var(--steel)'
    }}>
      <Loader size={24} className="spin" />
      <span>Loading…</span>
    </div>
  )
}

// ── Read ?gun=<id> from URL and return it (null if absent) ──────────────────
function getSharedGunId() {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('gun') || null
  } catch {
    return null
  }
}

// ── Remove ?gun= from URL without refreshing the page ───────────────────────
function clearGunParam() {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('gun')
    window.history.replaceState({}, '', url.toString())
  } catch { /* ignore */ }
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab]   = useState('Catalog')
  const [mode, setMode] = useState('list')
  // 'list' | 'create' | 'edit' | 'detail' | 'cart' | 'edit-profile' | 'archived'

  const [selectedGun, setSelectedGun]   = useState(null)
  const [editingGun, setEditingGun]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  // Bump this key to force ProfilePage remount (re-reads fresh localStorage data)
  const [profileKey, setProfileKey]     = useState(0)
  // Bump this to force Catalog remount so hiddenIds re-initializes from localStorage
  const [catalogKey, setCatalogKey]     = useState(0)
  // Shared link loading state
  const [sharedLinkLoading, setSharedLinkLoading] = useState(false)
  const [sharedLinkError, setSharedLinkError]     = useState('')

  // ── On mount: check if the URL has ?gun=<id> (share link) ─────────────────
  useEffect(() => {
    const sharedId = getSharedGunId()
    if (!sharedId) return

    // Clear the param from the URL immediately (clean URL)
    clearGunParam()

    // Fetch the gun and open its detail page
    setSharedLinkLoading(true)
    setSharedLinkError('')

    gunService.getGunById(sharedId)
      .then((response) => {
        if (response.success && response.data) {
          setSelectedGun(response.data)
          setMode('detail')
          setTab('Catalog')
          // Skip splash when navigating via share link
          setShowSplash(false)
        } else {
          setSharedLinkError(`Product not found (ID: ${sharedId})`)
          setShowSplash(false)
          setTimeout(() => setSharedLinkError(''), 4000)
        }
      })
      .catch(() => {
        setSharedLinkError('Could not load the shared product. Please try again.')
        setShowSplash(false)
        setTimeout(() => setSharedLinkError(''), 4000)
      })
      .finally(() => setSharedLinkLoading(false))
  }, []) // run once on mount

  // ── Unified navigation ─────────────────────────────────────────────────────
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
    } else if (target === 'Cart') {
      setMode('cart')
    } else if (target === 'EditProfile') {
      setMode('edit-profile')
    } else if (target === 'Archived') {
      setMode('archived')
    } else {
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  const handleBackToProfile = () => {
    setTab('Profile')
    setMode('list')
    // Increment key so ProfilePage remounts with fresh data from localStorage
    setProfileKey((k) => k + 1)
  }

  // Soft-delete: archive instead of hard-delete
  const handleSoftDelete = (gun) => {
    archiveService.archiveGun(gun)
    setDeleteTarget(null)
    if (mode === 'detail') handleBackToList()
    setTab('Catalog')
    // Force Catalog to remount so its hiddenIds state re-reads from localStorage
    setCatalogKey((k) => k + 1)
  }

  // Determine which tab label to show as active in Header
  const activeTab = mode === 'list' ? tab : ''

  return (
    <div className="shell">
      {showSplash && !sharedLinkLoading && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Shared link loading overlay */}
      {sharedLinkLoading && (
        <div className="share-loading-overlay">
          <Loader size={32} className="spin" />
          <p>Loading shared product…</p>
        </div>
      )}

      {/* Shared link error toast */}
      {sharedLinkError && (
        <div className="toast toast--error" style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          {sharedLinkError}
        </div>
      )}

      <Header
        tab={activeTab}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        onNavigateCart={() => handleNavigate('Cart')}
      />

      <main className="main">
        <Suspense fallback={<PageLoader />}>
          {/* ── Sub-page modes ─────────────────────────────────── */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => { handleBackToList(); setTab('Catalog') }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => { handleBackToList(); setTab('Catalog') }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {mode === 'cart' && (
            <CartPage onBack={handleBackToList} />
          )}

          {mode === 'edit-profile' && (
            <EditProfilePage onBack={handleBackToProfile} />
          )}

          {mode === 'archived' && (
            <ArchivedPage
              onBack={handleBackToProfile}
              onRestoreSelect={() => {
                // Bump catalogKey so Catalog remounts and hides/shows gun correctly
                setCatalogKey((k) => k + 1)
                setTab('Catalog')
                setMode('list')
              }}
              onAnyChange={() => {
                // Bump catalogKey after any archive change (restore or permanent delete)
                setCatalogKey((k) => k + 1)
              }}
            />
          )}

          {/* ── Top-level tabs ──────────────────────────────────── */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  key={catalogKey}
                  onNavigate={(dest, payload) => handleNavigate(dest, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  key={profileKey}
                  onReplaySplash={() => setShowSplash(true)}
                  onNavigate={(dest) => handleNavigate(dest)}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global soft-delete confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Archive Hardware Record"
        message={`Archive "${deleteTarget?.name}"? It will be moved to Archived and can be restored later.`}
        confirmLabel="Archive"
        danger
        loading={deleting}
        onConfirm={() => {
          if (!deleteTarget) return
          handleSoftDelete(deleteTarget)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
