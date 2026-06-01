export function AppShell({
  authError,
  children,
  currentUser,
  isAuthenticated,
  isSignInDisabled,
  activePage,
  onNavigate,
  onToggleAuth,
}) {
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
            <div className="signed-in-user">
              <span aria-hidden="true">{currentUser.initials}</span>
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
