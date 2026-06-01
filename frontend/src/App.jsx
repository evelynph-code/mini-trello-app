import { useEffect, useState } from 'react'
import { AppShell } from './components/Layout/AppShell'
import { BoardPage } from './pages/BoardPage'
import { authApi } from './services/authApi'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const isAuthenticated = Boolean(currentUser)

  const loadCurrentUser = async () => {
    setAuthError('')

    try {
      const user = await authApi.getCurrentUser()

      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    }
  }

  useEffect(() => {
    let isMounted = true

    authApi
      .getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setAuthError(err.message === 'Not authenticated.' ? '' : err.message)
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

  return (
    <AppShell
      authError={authError}
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      isSignInDisabled={false}
      onToggleAuth={handleToggleAuth}
    >
      <BoardPage currentUser={currentUser} isAuthenticated={isAuthenticated} />
    </AppShell>
  )
}

export default App
