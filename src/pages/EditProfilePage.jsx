import { useState } from 'react'
import { ArrowLeft, Save, User, FileText, Check } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — dedicated page to edit username and bio.
 * After a successful save, automatically navigates back to ProfilePage
 * so the updated name/bio is reflected immediately.
 */
export default function EditProfilePage({ onBack }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('success')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)

    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
    }

    const result = userService.saveUserProfile(updated)

    setTimeout(() => {
      setSaving(false)
      if (result.success) {
        setProfile(result.data)
        setSaved(true)
        setFeedback('Profile updated! Taking you back…')
        setFeedbackType('success')
        // Auto-navigate back after 1.2s so ProfilePage re-reads fresh data from localStorage
        setTimeout(() => onBack(), 1200)
      } else {
        setFeedback('Failed to save profile. Please try again.')
        setFeedbackType('error')
        setTimeout(() => setFeedback(''), 3000)
      }
    }, 400)
  }

  return (
    <div className="edit-profile-page">
      <button type="button" className="detail-back" onClick={onBack} disabled={saving}>
        <ArrowLeft size={18} /> Back to Profile
      </button>

      <div className="edit-profile-hero">
        <h1 className="display">Edit Profile</h1>
        <p className="lede">Update your operator callsign and armory bio.</p>
      </div>

      {feedback && (
        <div className={`toast toast--${feedbackType}`}>
          {feedbackType === 'success' && <Check size={16} />}
          {' '}{feedback}
        </div>
      )}

      <form onSubmit={handleSave} className="edit-profile-form">
        <div className="form-group">
          <label htmlFor="ep-name" className="form-label">
            <User size={14} style={{ display: 'inline', marginRight: 4 }} />
            Callsign / Operator Alias <span className="req">*</span>
          </label>
          <input
            id="ep-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            className="form-input"
            maxLength={50}
            required
            disabled={saved}
          />
          <span className="form-hint">{username.length}/50 characters</span>
        </div>

        <div className="form-group">
          <label htmlFor="ep-bio" className="form-label">
            <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
            Armory Notes / Station Bio
          </label>
          <textarea
            id="ep-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Qualifications, preferred calibers, unit assignment, specialization..."
            rows={5}
            className="form-textarea"
            maxLength={300}
            disabled={saved}
          />
          <span className="form-hint">{bio.length}/300 characters</span>
        </div>

        {bio && (
          <div className="bio-preview">
            <p className="form-label">Preview</p>
            <blockquote className="bio-preview-text">{bio}</blockquote>
          </div>
        )}

        <div className="form-actions-bar">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving || saved}
          >
            {saving ? (
              <>Saving…</>
            ) : saved ? (
              <><Check size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
