import { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AppShell } from './components/Layout/AppShell'
import { BoardPage } from './pages/BoardPage'
import { LandingPage } from './pages/LandingPage'
import { SettingsPage } from './pages/SettingsPage'
import { authApi } from './services/authApi'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isAuthReady, setIsAuthReady] = useState(false)
  const isAuthenticated = Boolean(currentUser)

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

  const handleToggleAuth = async () => {
    if (!isAuthenticated) {
      window.location.href = authApi.getGitHubLoginUrl()
      return
    }

    try {
      await authApi.logout()
      await loadCurrentUser()
    } catch (err) {
      setAuthError(err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <LandingPage
        authError={authError}
        isLoading={!isAuthReady}
        onAuthSuccess={(user) => {
          setCurrentUser(user)
          setAuthError('')
          setActivePage('dashboard')
        }}
        onSignIn={() => {
          window.location.href = authApi.getGitHubLoginUrl()
        }}
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
        onNavigate={setActivePage}
        onToggleAuth={handleToggleAuth}
      >
        {activePage === 'settings' ? (
          <SettingsPage
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            onUserChange={setCurrentUser}
          />
        ) : (
          <BoardPage isAuthenticated={isAuthenticated} />
        )}
      </AppShell>
    </DndProvider>
  )
}

export default App
