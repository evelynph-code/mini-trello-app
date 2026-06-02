import { UserSettingsList } from '../components/Users/UserSettingsList'

export function SettingsPage({ currentUser, isAuthenticated, onUserChange }) {
  return (
    <main className="settings-page">
      <section className="settings-panel" aria-labelledby="settings-title">
        <p className="eyebrow">Settings</p>
        <h2 id="settings-title">Profile settings</h2>
        {isAuthenticated ? (
          <UserSettingsList currentUser={currentUser} onUserChange={onUserChange} />
        ) : (
          <p>Sign in to manage profile and account settings.</p>
        )}
      </section>
    </main>
  )
}
