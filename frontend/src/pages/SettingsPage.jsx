export function SettingsPage({ currentUser, isAuthenticated }) {
  return (
    <main className="settings-page">
      <section className="settings-panel" aria-labelledby="settings-title">
        <p className="eyebrow">Settings</p>
        <h2 id="settings-title">Profile settings</h2>
        {isAuthenticated ? (
          <div className="settings-placeholder">
            <div className="profile-heading">
              <span>{currentUser.initials}</span>
              <div>
                <strong>{currentUser.name}</strong>
                <p>{currentUser.role}</p>
              </div>
            </div>
            <p>Display name, profile details, preferences, and account controls will live here.</p>
          </div>
        ) : (
          <p>Sign in to manage profile and account settings.</p>
        )}
      </section>
    </main>
  )
}
