import { useState } from 'react'
import {
  Shield, Copy, Check, Heart, FileText, Camera, Play,
  Pencil, Archive, Info, Phone, BookOpen, ChevronRight,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import archiveService from '../services/archiveService'
import { getAllDraftIds, loadDraft, deleteDraft as deleteDraftStorage, formatDraftTime } from '../utils/draftStorage'

/**
 * Get all draft records using the correct gun_draft_ prefix from draftStorage.js
 */
const getDrafts = () => {
  try {
    const ids = getAllDraftIds()
    return ids.map((id) => {
      const data = loadDraft(id) || {}
      const formData = data.formData || {}
      return {
        key: id,
        name: formData.name || `Draft (${id})`,
        type: formData.type || '',
        caliber: formData.caliber || '',
        savedAt: data.savedAt || null,
      }
    })
  } catch {
    return []
  }
}

const deleteOneDraft = (key) => {
  deleteDraftStorage(key)
}

/**
 * ProfilePage — User identity, stats, and settings sections.
 * Sections: Profile Card, Stats, About, Contact, Drafts, Archive link.
 */
export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [activeSection, setActiveSection] = useState('overview')

  const { favorites } = useFavorites()
  const [drafts, setDrafts] = useState(getDrafts)
  const archivedCount = archiveService.getArchived().length

  // Re-read profile from storage whenever this component is focused
  // (e.g. after returning from EditProfilePage)
  const refreshProfile = () => {
    const fresh = userService.getUserProfile()
    setProfile(fresh)
    setAvatar(fresh.avatar || null)
    setDrafts(getDrafts())
  }

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      setFeedback('Avatar updated.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteDraft = (key) => {
    deleteOneDraft(key)
    setDrafts(getDrafts())
  }

  const SectionTab = ({ id, icon: Icon, label }) => (
    <button
      type="button"
      className={`profile-section-tab${activeSection === id ? ' profile-section-tab--active' : ''}`}
      onClick={() => setActiveSection(id)}
    >
      <Icon size={16} />
      {label}
    </button>
  )

  return (
    <div className="profile-page">
      {/* Masthead */}
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">Credentials, stats, and armorer details.</p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay intro"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          <div className="profile-identity" style={{ flex: 1 }}>
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            {profile.bio && (
              <p className="profile-bio-text">{profile.bio}</p>
            )}
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Edit profile button */}
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => {
              if (onNavigate) {
                // Refresh profile data when we come back
                onNavigate('EditProfile')
              }
            }}
            onFocus={refreshProfile}
            title="Edit name and bio"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archivedCount}</div>
            <div className="stat-label">Archived</div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="profile-section-tabs">
        <SectionTab id="overview" icon={Shield} label="Overview" />
        <SectionTab id="drafts" icon={BookOpen} label="Drafts" />
        <SectionTab id="about" icon={Info} label="About" />
        <SectionTab id="contact" icon={Phone} label="Contact" />
      </div>

      {/* Overview section */}
      {activeSection === 'overview' && (
        <div className="profile-section-content">
          <h3 className="section-title">Quick Actions</h3>
          <div className="profile-quick-actions">
            <button
              type="button"
              className="profile-action-link"
              onClick={() => onNavigate && onNavigate('EditProfile')}
            >
              <Pencil size={16} />
              <div>
                <p className="pal-title">Edit Name & Bio</p>
                <p className="pal-desc">Update your callsign and armory notes</p>
              </div>
              <ChevronRight size={16} className="pal-arrow" />
            </button>

            <button
              type="button"
              className="profile-action-link"
              onClick={() => onNavigate && onNavigate('Archived')}
            >
              <Archive size={16} />
              <div>
                <p className="pal-title">Archived Hardware</p>
                <p className="pal-desc">{archivedCount} item{archivedCount !== 1 ? 's' : ''} archived</p>
              </div>
              <ChevronRight size={16} className="pal-arrow" />
            </button>

            <button
              type="button"
              className="profile-action-link"
              onClick={() => setActiveSection('drafts')}
            >
              <BookOpen size={16} />
              <div>
                <p className="pal-title">Saved Drafts</p>
                <p className="pal-desc">{drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved locally</p>
              </div>
              <ChevronRight size={16} className="pal-arrow" />
            </button>
          </div>
        </div>
      )}

      {/* Drafts section */}
      {activeSection === 'drafts' && (
        <div className="profile-section-content">
          <h3 className="section-title">Saved Drafts</h3>
          <p className="lede" style={{ marginBottom: 16, fontSize: '0.9rem' }}>
            Gun entries saved locally that haven't been published yet.
          </p>
          {drafts.length === 0 ? (
            <div className="state-box" style={{ padding: '32px 24px' }}>
              <FileText size={28} />
              <p>No drafts saved. Create a gun and save as draft to see it here.</p>
            </div>
          ) : (
            <ul className="draft-list">
              {drafts.map((draft) => (
                <li key={draft.key} className="draft-item">
                  <div className="draft-info">
                    <p className="draft-name display">{draft.name || draft.key}</p>
                    {draft.type && <p className="draft-meta">{draft.type}{draft.caliber ? ` · ${draft.caliber}` : ''}</p>}
                    {draft.savedAt && (
                      <p className="draft-date">
                        {formatDraftTime(draft.savedAt)}
                        {' · '}{new Date(draft.savedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDeleteDraft(draft.key)}
                    title="Delete draft"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* About section */}
      {activeSection === 'about' && (
        <div className="profile-section-content">
          <h3 className="section-title">About Bore & Barrel</h3>
          <div className="about-content">
            <div className="about-badge">
              <Shield size={40} stroke="var(--brass)" />
            </div>
            <h4 className="about-headline display">A one-room armory.</h4>
            <p>
              Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
              from the bench — no markup theatre, no filler.
            </p>
            <p>
              We believe that a good catalog is a sparse catalog. Every hardware piece we carry
              has been chosen for its quality, reliability, and honest price. No artificial
              inflation, no hidden fees.
            </p>
            <div className="about-facts">
              <div className="about-fact">
                <span className="about-fact-val display">100%</span>
                <span className="about-fact-label">Verified Hardware</span>
              </div>
              <div className="about-fact">
                <span className="about-fact-val display">0</span>
                <span className="about-fact-label">Markup Theatre</span>
              </div>
              <div className="about-fact">
                <span className="about-fact-val display">PWA</span>
                <span className="about-fact-label">Works Offline</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact section */}
      {activeSection === 'contact' && (
        <div className="profile-section-content">
          <h3 className="section-title">Contact & Location</h3>
          <div className="contact-content">
            <div className="contact-item">
              <span className="contact-label">Address</span>
              <span className="contact-val">123 Range Road, Sector 7</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Hours</span>
              <span className="contact-val">Tuesday – Saturday, 10:00 – 18:00</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Phone</span>
              <span className="contact-val">
                <a href="tel:+6281326181500" className="link-btn">+62 813-2618-1500</a>
              </span>
            </div>
            <div className="contact-item">
              <span className="contact-label">WhatsApp</span>
              <span className="contact-val">
                <a
                  href="https://wa.me/6281326181500"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--wa btn--sm"
                >
                  Open WhatsApp
                </a>
              </span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Email</span>
              <span className="contact-val">
                <a href="mailto:info@boreandbarrel.id" className="link-btn">info@boreandbarrel.id</a>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
