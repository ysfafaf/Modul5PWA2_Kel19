import { useState } from 'react'
import { ArrowLeft, ArchiveRestore, Trash2, PackageOpen, Clock } from 'lucide-react'
import archiveService from '../services/archiveService'
import { formatPrice } from '../utils/helpers'
import ConfirmModal from '../components/modals/ConfirmModal'

/**
 * ArchivedPage — shows all soft-deleted (archived) guns.
 * Allows restoring or permanently deleting archived items.
 *
 * Props:
 *   onBack         — navigate back to profile
 *   onRestoreSelect — called after restore (to go back to catalog)
 *   onAnyChange    — called after any archive mutation (restore OR permanent delete)
 *                    so the catalog can re-read the updated hiddenIds from localStorage
 */
export default function ArchivedPage({ onBack, onRestoreSelect, onAnyChange }) {
  const [archived, setArchived] = useState(() => archiveService.getArchived())
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // 'restore' | 'delete'

  const handleRestore = (gun) => {
    archiveService.restoreGun(gun.id)
    // Remove the restored gun from this page's list immediately
    setArchived((prev) => prev.filter((g) => String(g.id) !== String(gun.id)))
    setConfirmTarget(null)
    setConfirmAction(null)
    // Notify parent so it can refresh catalog hiddenIds
    if (onAnyChange) onAnyChange()
    if (onRestoreSelect) onRestoreSelect(gun)
  }

  const handlePermanentDelete = (gunId) => {
    // Removes from archive AND writes to permanently-deleted list in localStorage
    archiveService.permanentDelete(gunId)
    // Remove from this page's list immediately
    setArchived((prev) => prev.filter((g) => String(g.id) !== String(gunId)))
    setConfirmTarget(null)
    setConfirmAction(null)
    // Notify parent so Catalog re-reads hiddenIds (which now includes this deleted ID)
    if (onAnyChange) onAnyChange()
  }

  // Single confirm handler — captures current target/action before state resets
  const handleConfirm = () => {
    if (!confirmTarget) return
    const target = confirmTarget
    const action = confirmAction
    if (action === 'restore') {
      handleRestore(target)
    } else {
      handlePermanentDelete(target.id ?? target.name)
    }
  }

  return (
    <div className="archived-page">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Profile
      </button>

      <div className="edit-profile-hero">
        <h1 className="display">Archived Hardware</h1>
        <p className="lede">
          Soft-deleted items. Restore them to the catalog or permanently remove them.
        </p>
      </div>

      {archived.length === 0 ? (
        <div className="state-box" style={{ marginTop: 24 }}>
          <PackageOpen size={36} />
          <p>No archived items. Archive a gun from the catalog to see it here.</p>
        </div>
      ) : (
        <ul className="archived-list">
          {archived.map((gun) => (
            <li key={String(gun.id ?? gun.name)} className="archived-item">
              <img
                className="archived-img"
                src={gun.image_url || gun.image || '/guns/pistol.svg'}
                alt={gun.name}
                loading="lazy"
              />
              <div className="archived-info">
                <p className="archived-name display">{gun.name}</p>
                <p className="archived-meta">
                  {gun.type || gun.category || '—'}
                  {gun.caliber ? ` · ${gun.caliber}` : ''}
                  {' · '}
                  <span className="price">{formatPrice(gun.price ?? 0)}</span>
                </p>
                {gun.archivedAt && (
                  <p className="archived-date">
                    <Clock size={12} />
                    {' '}Archived {new Date(gun.archivedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="archived-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => {
                    setConfirmAction('restore')
                    setConfirmTarget(gun)
                  }}
                  title="Restore to catalog"
                >
                  <ArchiveRestore size={14} /> Restore
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => {
                    setConfirmAction('delete')
                    setConfirmTarget(gun)
                  }}
                  title="Permanently delete"
                >
                  <Trash2 size={14} /> Delete Forever
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title={confirmAction === 'restore' ? 'Restore Hardware' : 'Permanently Delete'}
        message={
          confirmAction === 'restore'
            ? `Restore "${confirmTarget?.name}" back to the catalog?`
            : `Permanently delete "${confirmTarget?.name}"? This cannot be undone — the gun will never appear in the catalog again.`
        }
        confirmLabel={confirmAction === 'restore' ? 'Restore' : 'Delete Forever'}
        danger={confirmAction === 'delete'}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmTarget(null)
          setConfirmAction(null)
        }}
      />
    </div>
  )
}
