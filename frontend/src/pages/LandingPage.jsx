import { Kanban, Lock, LogIn, MessageSquare, Users } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '../services/authApi'

const emptyForm = {
  email: '',
  identifier: '',
  name: '',
  password: '',
  username: '',
}

export function LandingPage({ authError, isLoading, onAuthSuccess, onSignIn }) {
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState(emptyForm)
  const [localError, setLocalError] = useState('')
  const [verificationMessage, setVerificationMessage] = useState('')

  const handleChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleLocalAuth = async (event) => {
    event.preventDefault()
    setLocalError('')
    setVerificationMessage('')

    try {
      if (authMode === 'register') {
        const payload = await authApi.register({
          email: form.email,
          name: form.name,
          password: form.password,
          username: form.username,
        })

        setVerificationMessage(payload.verification?.message || 'Email verification is pending.')
        onAuthSuccess(payload.user)
      } else {
        onAuthSuccess(await authApi.login({
          identifier: form.identifier,
          password: form.password,
        }))
      }
    } catch (err) {
      setLocalError(err.message)
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-nav" aria-label="Landing navigation">
        <div>
          <p className="eyebrow">Mini Trello</p>
          <strong>Team boards</strong>
        </div>
        <button type="button" disabled={isLoading} onClick={onSignIn}>
          <LogIn size={17} />
          {isLoading ? 'Checking session' : 'Sign in with GitHub'}
        </button>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="eyebrow">Work together</p>
          <h1 id="landing-title">Mini Trello</h1>
          <p>
            Plan assignments, track tasks, leave comments, and keep every board moving
            with realtime updates.
          </p>
          {authError ? <p className="landing-error">{authError}</p> : null}
          {localError ? <p className="landing-error">{localError}</p> : null}
          {verificationMessage ? <p className="landing-notice">{verificationMessage}</p> : null}
          <div className="landing-actions">
            <button type="button" disabled={isLoading} onClick={onSignIn}>
              <LogIn size={18} />
              Continue with GitHub
            </button>
          </div>

          <form className="landing-auth-card" onSubmit={handleLocalAuth}>
            <div className="auth-mode-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login')
                  setLocalError('')
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('register')
                  setLocalError('')
                }}
              >
                Create account
              </button>
            </div>

            {authMode === 'register' ? (
              <>
                <input
                  aria-label="Display name"
                  name="name"
                  placeholder="Display name"
                  value={form.name}
                  onChange={handleChange}
                />
                <input
                  aria-label="Username"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
                <input
                  aria-label="Email"
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </>
            ) : (
              <input
                aria-label="Handle or email"
                name="identifier"
                placeholder="Handle or email"
                value={form.identifier}
                onChange={handleChange}
              />
            )}

            <input
              aria-label="Password"
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
            />
            <button type="submit">
              <LogIn size={16} />
              {authMode === 'register' ? 'Create account' : 'Log in'}
            </button>
            {authMode === 'register' ? (
              <p>After signup, check your inbox for a 6-digit verification code.</p>
            ) : null}
          </form>
        </div>

        <div className="landing-board-preview" aria-hidden="true">
          <div className="preview-topbar">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-board">
            {[
              {
                cards: ['Review OAuth flow', 'Invite teammate'],
                icon: Users,
                title: 'Today',
              },
              {
                cards: ['Polish card details', 'Add task comments'],
                icon: MessageSquare,
                title: 'This Week',
              },
              {
                cards: ['Realtime activity', 'Done'],
                icon: Kanban,
                title: 'Launch',
              },
            ].map((list) => {
              const Icon = list.icon

              return (
                <article key={list.title} className="preview-list">
                  <div>
                    <Icon size={15} />
                    <strong>{list.title}</strong>
                  </div>
                  {list.cards.map((card) => (
                    <p key={card}>{card}</p>
                  ))}
                </article>
              )
            })}
          </div>
          <div className="preview-status">
            <Lock size={14} />
            <span>Private workspace</span>
          </div>
        </div>
      </section>
    </main>
  )
}
