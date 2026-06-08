import { useCallback, useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { LogOut, MailCheck, Send } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/Layout/AppShell'
import { BoardPage } from './pages/BoardPage'
import { LandingPage } from './pages/LandingPage'
import { SettingsPage } from './pages/SettingsPage'
import { authApi } from './services/authApi'
import { invitationsApi } from './services/invitationsApi'
import { notificationsApi } from './services/notificationsApi'
import './App.css'

function LoadingPage() {
  return (
    <main className="app-loading-page" aria-live="polite" aria-busy="true">
      <section className="app-loading-panel" aria-label="Loading application">
        <div className="loading-mark">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">Mini Trello</p>
        <h1>Opening your workspace</h1>
        <p>Checking your session and preparing your boards.</p>
        <div className="loading-bar" />
      </section>
    </main>
  )
}

function EmailVerificationGate({ authError, currentUser, onResend, onSignOut, onVerify }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [notice, setNotice] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsVerifying(true)

    try {
      await onVerify(code)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    setIsResending(true)

    try {
      const result = await onResend()

      setNotice(result.message || 'Verification code sent. Check your inbox.')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="landing-page verification-page">
      <section className="verification-panel" aria-labelledby="verification-title">
        <p className="eyebrow">Verify email</p>
        <MailCheck size={34} />
        <h1 id="verification-title">Enter your verification code</h1>
        <p>
          We sent a 6-digit code to <strong>{currentUser.email}</strong>. Verify your
          email to open your boards.
        </p>
        {authError ? <p className="landing-error">{authError}</p> : null}
        {error ? <p className="landing-error">{error}</p> : null}
        {notice ? <p className="landing-notice">{notice}</p> : null}

        <form className="verification-form" onSubmit={handleSubmit}>
          <input
            aria-label="Verification code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <button type="submit" disabled={isVerifying || code.length !== 6}>
            <MailCheck size={16} />
            {isVerifying ? 'Verifying' : 'Verify'}
          </button>
        </form>

        <div className="verification-actions">
          <button type="button" disabled={isResending} onClick={handleResend}>
            <Send size={16} />
            {isResending ? 'Sending' : 'Resend code'}
          </button>
          <button type="button" onClick={onSignOut}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </section>
    </main>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [notificationTarget, setNotificationTarget] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const isAuthenticated = Boolean(currentUser)
  const activePage = location.pathname === '/settings' ? 'settings' : 'dashboard'
  const requiresEmailVerification =
    currentUser?.provider === 'local' && !currentUser.emailVerified

  const handleNavigate = (page) => {
    navigate(page === 'settings' ? '/settings' : '/')
  }

  const loadCurrentUser = async () => {
    setAuthError('')

    try {
      const user = await authApi.getCurrentUser()

      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    } finally {
      setIsAuthReady(true)
    }
  }

  useEffect(() => {
    let isMounted = true

    authApi
      .getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user)
          setIsAuthReady(true)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setAuthError(err.message === 'Not authenticated.' ? '' : err.message)
          setIsAuthReady(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!currentUser || (currentUser.provider === 'local' && !currentUser.emailVerified)) {
      return
    }

    try {
      setNotifications(await notificationsApi.getNotifications())
    } catch (err) {
      setAuthError(err.message)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      return undefined
    }

    let isMounted = true

    Promise.resolve().then(async () => {
      if (isMounted) {
        await loadNotifications()
      }
    })

    return () => {
      isMounted = false
    }
  }, [currentUser, loadNotifications])

  const handleInvitationResponse = async (invitationId, status) => {
    try {
      await invitationsApi.respondToInvitation(invitationId, status)
      await loadNotifications()

      if (status === 'accepted') {
        window.dispatchEvent(new Event('boards:refresh'))
      }
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleNotificationRead = async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId)
      await loadNotifications()
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleNotificationOpen = async (notification) => {
    if (!notification.boardId) {
      return
    }

    navigate('/')
    setNotificationTarget({
      boardId: notification.boardId,
      cardId: notification.cardId || '',
      taskId: notification.taskId || '',
      openedAt: Date.now(),
    })

    if (notification.type !== 'task-due-soon') {
      try {
        await handleNotificationRead(notification.id)
      } catch (err) {
        setAuthError(err.message)
      }
    }
  }

  const handleToggleAuth = async () => {
    if (!isAuthenticated) {
      window.location.href = authApi.getGitHubLoginUrl()
      return
    }

    try {
      await authApi.logout()
      setNotifications([])
      setNotificationTarget(null)
      await loadCurrentUser()
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await authApi.deleteAccount()
      setNotifications([])
      setNotificationTarget(null)
      setCurrentUser(null)
      navigate('/')
      setAuthError('')
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const handleResendVerificationEmail = async () => {
    const result = await authApi.resendVerificationEmail()
    await loadCurrentUser()

    return result
  }

  const handleVerifyEmail = async (code) => {
    const user = await authApi.verifyEmail(code)

    setCurrentUser(user)
    setAuthError('')
    setNotificationTarget(null)
    navigate('/')
  }

  if (!isAuthReady) {
    return <LoadingPage />
  }

  if (!isAuthenticated) {
    return (
      <LandingPage
        authError={authError}
        isLoading={!isAuthReady}
        onAuthSuccess={(user) => {
          setCurrentUser(user)
          setAuthError('')
          setNotificationTarget(null)
          navigate('/')
        }}
        onSignIn={() => {
          window.location.href = authApi.getGitHubLoginUrl()
        }}
      />
    )
  }

  if (requiresEmailVerification) {
    return (
      <EmailVerificationGate
        authError={authError}
        currentUser={currentUser}
        onResend={handleResendVerificationEmail}
        onSignOut={handleToggleAuth}
        onVerify={handleVerifyEmail}
      />
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <AppShell
        authError={authError}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        isSignInDisabled={false}
        activePage={activePage}
        notifications={notifications}
        onNavigate={handleNavigate}
        onNotificationOpen={handleNotificationOpen}
        onNotificationRead={handleNotificationRead}
        onRespondToInvitation={handleInvitationResponse}
        onToggleAuth={handleToggleAuth}
      >
        {location.pathname === '/settings' ? (
          <SettingsPage
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            onDeleteAccount={handleDeleteAccount}
            onResendVerificationEmail={handleResendVerificationEmail}
            onSignOut={handleToggleAuth}
            onUserChange={setCurrentUser}
          />
        ) : location.pathname === '/' ? (
          <BoardPage
            currentUser={currentUser}
            focusTarget={notificationTarget}
            isAuthenticated={isAuthenticated}
            onFocusTargetConsumed={() => setNotificationTarget(null)}
          />
        ) : (
          <Navigate to="/" replace />
        )}
      </AppShell>
    </DndProvider>
  )
}

export default App
