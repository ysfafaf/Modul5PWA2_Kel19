// ---------------------------------------------------------------------------
// archiveService.js — soft-delete / archive for guns (localStorage-based)
//
// Two separate lists:
//   ARCHIVE_KEY  — guns that are "archived" (can be restored)
//   DELETED_KEY  — guns that are "permanently deleted" (never return to catalog)
// ---------------------------------------------------------------------------

const ARCHIVE_KEY  = 'bore_barrel_archive'
const DELETED_KEY  = 'bore_barrel_permanently_deleted'

function readArchive() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeArchive(items) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items))
  } catch {
    // quota exceeded
  }
}

function readDeletedIds() {
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeDeletedIds(ids) {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(ids))
  } catch {}
}

const archiveService = {
  /** Return list of archived gun records (objects, not just IDs) */
  getArchived() {
    return readArchive()
  },

  /** Return Set of archived IDs for fast lookup */
  getArchivedIds() {
    return new Set(readArchive().map((g) => String(g.id)))
  },

  /** Return Set of permanently-deleted IDs for fast lookup */
  getDeletedIds() {
    return new Set(readDeletedIds().map((id) => String(id)))
  },

  /**
   * Return combined Set of IDs that should be hidden from the catalog:
   * archived + permanently deleted.
   */
  getHiddenIds() {
    const archived  = new Set(readArchive().map((g) => String(g.id)))
    const deleted   = new Set(readDeletedIds().map((id) => String(id)))
    return new Set([...archived, ...deleted])
  },

  /** Archive (soft-delete) a gun record */
  archiveGun(gun) {
    const current = readArchive()
    const alreadyArchived = current.some((g) => String(g.id) === String(gun.id))
    if (!alreadyArchived) {
      current.push({ ...gun, archivedAt: new Date().toISOString() })
      writeArchive(current)
    }
    return { success: true }
  },

  /** Restore an archived gun (remove from archive list) */
  restoreGun(gunId) {
    const updated = readArchive().filter((g) => String(g.id) !== String(gunId))
    writeArchive(updated)
    return { success: true }
  },

  /**
   * Permanently delete: remove from archive AND add to deleted list.
   * The gun will never re-appear in the catalog, even if the API still returns it.
   */
  permanentDelete(gunId) {
    // Remove from archive list
    const updatedArchive = readArchive().filter((g) => String(g.id) !== String(gunId))
    writeArchive(updatedArchive)

    // Add to permanently-deleted list (if not already there)
    const deletedIds = readDeletedIds()
    const alreadyDeleted = deletedIds.some((id) => String(id) === String(gunId))
    if (!alreadyDeleted) {
      deletedIds.push(String(gunId))
      writeDeletedIds(deletedIds)
    }

    return { success: true }
  },

  isArchived(gunId) {
    return readArchive().some((g) => String(g.id) === String(gunId))
  },

  isPermanentlyDeleted(gunId) {
    return readDeletedIds().some((id) => String(id) === String(gunId))
  },

  isHidden(gunId) {
    return this.isArchived(gunId) || this.isPermanentlyDeleted(gunId)
  },
}

export default archiveService
