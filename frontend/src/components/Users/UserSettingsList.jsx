import { Pencil, Save, X } from 'lucide-react'
import { useState } from 'react'
import { usersApi } from '../../services/usersApi'
import { IconButton } from '../Cards/IconButton'

export function UserSettingsList({ currentUser, onUserChange }) {
  const [displayName, setDisplayName] = useState(currentUser.name || '')
  const [error, setError] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [role, setRole] = useState(currentUser.role || '')

  const saveUser = async (userInput) => {
    setIsSaving(true)
    setError('')

    try {
      const updatedUser = await usersApi.updateUser(currentUser.id, userInput)

      onUserChange(updatedUser)
      setDisplayName(updatedUser.name)
      setRole(updatedUser.role || '')
      setIsEditingName(false)
      setIsEditingRole(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameSubmit = async (event) => {
    event.preventDefault()

    const name = displayName.trim()

    if (!name) {
      setError('Display name is required.')
      return
    }

    await saveUser({ name })
  }

  const handleRoleSubmit = async (event) => {
    event.preventDefault()

    const nextRole = role.trim()

    if (!nextRole) {
      setError('Role is required.')
      return
    }

    await saveUser({ role: nextRole })
  }

  const cancelEdit = () => {
    setDisplayName(currentUser.name || '')
    setRole(currentUser.role || '')
    setError('')
    setIsEditingName(false)
    setIsEditingRole(false)
  }

  return (
    <div className="user-settings-list">
      <div className="profile-heading">
        {currentUser.avatarUrl ? (
          <img alt="" className="profile-avatar" src={currentUser.avatarUrl} />
        ) : (
          <span className="profile-avatar-fallback">{currentUser.initials}</span>
        )}
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
          <form className="user-setting-form" onSubmit={handleNameSubmit}>
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
          <p className="eyebrow">User ID</p>
          <h3>Account identifier</h3>
        </div>
        <div className="user-setting-value">
          <code>{currentUser.id}</code>
        </div>
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

      {currentUser.provider === 'local' ? (
        <>
          <article className="user-setting-row">
            <div>
              <p className="eyebrow">Email</p>
              <h3>Login email</h3>
            </div>
            <div className="user-setting-value">
              <strong>{currentUser.email}</strong>
            </div>
          </article>

          <article className="user-setting-row">
            <div>
              <p className="eyebrow">Verification</p>
              <h3>Email status</h3>
            </div>
            <div className="user-setting-value">
              <strong>{currentUser.emailVerified ? 'Verified' : 'Pending'}</strong>
            </div>
          </article>
        </>
      ) : null}

      <article className="user-setting-row">
        <div>
          <p className="eyebrow">Access</p>
          <h3>Role</h3>
        </div>
        {isEditingRole ? (
          <form className="user-setting-form" onSubmit={handleRoleSubmit}>
            <input
              aria-label="Role"
              autoFocus
              maxLength={60}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
            <button type="submit" disabled={isSaving}>
              <Save size={15} />
              {isSaving ? 'Saving' : 'Save'}
            </button>
            <IconButton label="Cancel role edit" onClick={cancelEdit}>
              <X size={15} />
            </IconButton>
          </form>
        ) : (
          <div className="user-setting-value">
            <strong>{currentUser.role || 'GitHub user'}</strong>
            <IconButton label="Edit role" onClick={() => setIsEditingRole(true)}>
              <Pencil size={15} />
            </IconButton>
          </div>
        )}
      </article>
    </div>
  )
}
