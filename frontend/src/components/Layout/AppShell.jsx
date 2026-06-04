import { Bell, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function AppShell({
  authError,
  children,
  currentUser,
  isAuthenticated,
  isSignInDisabled,
  activePage,
  notifications = [],
  onNavigate,
  onNotificationRead,
  onRespondToInvitation,
  onToggleAuth,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationMenuRef = useRef(null)
  const pageTitle = activePage === 'settings' ? 'Settings' : 'Dashboard'

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (notificationMenuRef.current?.contains(event.target)) {
        return
      }

      setIsNotificationsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isNotificationsOpen])

  return (
    <div className="app-shell">
      <header className="topbar" aria-label="Application navigation">
        <div className="brand-block">
          <p className="eyebrow">Mini Trello</p>
          <h1>{pageTitle}</h1>
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
          {isAuthenticated ? (
            <div className="notification-menu" ref={notificationMenuRef}>
              <button
                type="button"
                aria-label="Notifications"
                className="notification-button topbar-icon-button"
                title="Notifications"
                onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
              >
                <Bell size={18} />
                {notifications.length > 0 ? (
                  <span aria-label={`${notifications.length} unread notifications`}>
                    {notifications.length}
                  </span>
                ) : null}
              </button>
              {isNotificationsOpen ? (
                <div className="notification-popover">
                  <h3>Notifications</h3>
                  {notifications.length === 0 ? (
                    <p>No notifications.</p>
                  ) : (
                    notifications.map((notification) => (
                      <article key={notification.id}>
                        <p>
                          <strong>{notification.title}</strong>
                          <br />
                          {notification.message}
                        </p>
                        {notification.type === 'board-invitation' ? (
                          <div className="form-actions">
                            <button
                              type="button"
                              onClick={() => onRespondToInvitation(notification.id, 'accepted')}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => onRespondToInvitation(notification.id, 'declined')}
                            >
                              Decline
                            </button>
                          </div>
                        ) : notification.type !== 'task-due-soon' ? (
                          <button type="button" onClick={() => onNotificationRead(notification.id)}>
                            Mark read
                          </button>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          {authError ? <p className="auth-error">{authError}</p> : null}
          {isAuthenticated ? (
            <button
              type="button"
              aria-label="Sign out"
              className="topbar-icon-button"
              disabled={isSignInDisabled}
              title="Sign out"
              onClick={onToggleAuth}
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button type="button" disabled={isSignInDisabled} onClick={onToggleAuth}>
              Sign in with GitHub
            </button>
          )}
        </div>
      </header>
      <div className="dashboard-shell">{children}</div>
    </div>
  )
}
