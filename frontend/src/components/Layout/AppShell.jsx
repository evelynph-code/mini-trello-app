import { Bell } from 'lucide-react'
import { useState } from 'react'

export function AppShell({
  authError,
  children,
  currentUser,
  isAuthenticated,
  isSignInDisabled,
  activePage,
  invitations = [],
  onNavigate,
  onRespondToInvitation,
  onToggleAuth,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="topbar" aria-label="Application navigation">
        <div className="brand-block">
          <p className="eyebrow">Mini Trello</p>
          <h1>Dashboard</h1>
        </div>
        <nav className="side-nav" aria-label="Primary">
          <button
            type="button"
            className={activePage === 'dashboard' ? 'active' : ''}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={activePage === 'settings' ? 'active' : ''}
            onClick={() => onNavigate('settings')}
          >
            Settings
          </button>
        </nav>
        <div className="auth-panel">
          {isAuthenticated ? (
            <div className="notification-menu">
              <button
                type="button"
                className="notification-button"
                onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
              >
                <Bell size={16} />
                Invitations
                {invitations.length > 0 ? <span>{invitations.length}</span> : null}
              </button>
              {isNotificationsOpen ? (
                <div className="notification-popover">
                  <h3>Pending invitations</h3>
                  {invitations.length === 0 ? (
                    <p>No pending invitations.</p>
                  ) : (
                    invitations.map((invitation) => (
                      <article key={invitation.id}>
                        <p>
                          <strong>{invitation.inviterName}</strong> invited you to{' '}
                          <strong>{invitation.boardName}</strong>
                        </p>
                        <div className="form-actions">
                          <button
                            type="button"
                            onClick={() => onRespondToInvitation(invitation.id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => onRespondToInvitation(invitation.id, 'declined')}
                          >
                            Decline
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          {isAuthenticated ? (
            <div className="signed-in-user">
              {currentUser.avatarUrl ? (
                <img alt="" className="profile-avatar" src={currentUser.avatarUrl} />
              ) : (
                <span aria-hidden="true" className="profile-avatar-fallback">
                  {currentUser.initials}
                </span>
              )}
              <div>
                <strong>{currentUser.name}</strong>
                <p>{currentUser.role}</p>
              </div>
            </div>
          ) : (
            <p>Guest workspace</p>
          )}
          {authError ? <p className="auth-error">{authError}</p> : null}
          <button type="button" disabled={isSignInDisabled} onClick={onToggleAuth}>
            {isAuthenticated ? 'Sign out' : 'Sign in with GitHub'}
          </button>
        </div>
      </header>
      <div className="dashboard-shell">{children}</div>
    </div>
  )
}
