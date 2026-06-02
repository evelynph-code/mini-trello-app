import { Pencil, Save, X } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '../../services/authApi'
import { IconButton } from '../Cards/IconButton'

export function UserSettingsList({ currentUser, onUserChange }) {
  const [displayName, setDisplayName] = useState(currentUser.name || '')
  const [error, setError] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const name = displayName.trim()

    if (!name) {
      setError('Display name is required.')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      const updatedUser = await authApi.updateCurrentUser({ name })

      onUserChange(updatedUser)
      setDisplayName(updatedUser.name)
      setIsEditingName(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    setDisplayName(currentUser.name || '')
    setError('')
    setIsEditingName(false)
  }

  return (
    <div className="user-settings-list">
      <div className="profile-heading">
        <span>{currentUser.initials}</span>
        <div>
          <strong>{currentUser.name}</strong>
          <p>{currentUser.role}</p>
        </div>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}

      <article className="user-setting-row">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Display name</h3>
        </div>
        {isEditingName ? (
          <form className="user-setting-form" onSubmit={handleSubmit}>
            <input
              aria-label="Display name"
              autoFocus
              maxLength={60}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <button type="submit" disabled={isSaving}>
              <Save size={15} />
              {isSaving ? 'Saving' : 'Save'}
            </button>
            <IconButton label="Cancel display name edit" onClick={cancelEdit}>
              <X size={15} />
            </IconButton>
          </form>
        ) : (
          <div className="user-setting-value">
            <strong>{currentUser.name}</strong>
            <IconButton label="Edit display name" onClick={() => setIsEditingName(true)}>
              <Pencil size={15} />
            </IconButton>
          </div>
        )}
      </article>

      <article className="user-setting-row">
        <div>
          <p className="eyebrow">Account</p>
          <h3>Provider</h3>
        </div>
        <div className="user-setting-value">
          <strong>{currentUser.provider || 'github'}</strong>
        </div>
      </article>

      <article className="user-setting-row">
        <div>
          <p className="eyebrow">Access</p>
          <h3>Role</h3>
        </div>
        <div className="user-setting-value">
          <strong>{currentUser.role || 'GitHub user'}</strong>
        </div>
      </article>

      <article className="user-setting-row">
        <div>
          <p className="eyebrow">Avatar</p>
          <h3>Profile image</h3>
        </div>
        <div className="user-setting-value">
          {currentUser.avatarUrl ? (
            <img alt="" className="settings-avatar" src={currentUser.avatarUrl} />
          ) : (
            <span className="settings-avatar-fallback">{currentUser.initials}</span>
          )}
        </div>
      </article>
    </div>
  )
}
