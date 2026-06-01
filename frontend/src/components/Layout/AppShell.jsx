export function AppShell({
  authError,
  children,
  currentUser,
  isAuthenticated,
  isSignInDisabled,
  onToggleAuth,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Application navigation">
        <div>
          <p className="eyebrow">Mini Trello</p>
          <h1>Dashboard</h1>
        </div>
        <nav className="side-nav" aria-label="Primary">
          <a href="#overview">Overview</a>
          <a href="#boards">Boards</a>
          <a href="#cards">Cards</a>
          <a href="#profile">Profile</a>
          <a href="#activity">Activity</a>
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
      </aside>
      <div className="dashboard-shell">{children}</div>
    </div>
  )
}
