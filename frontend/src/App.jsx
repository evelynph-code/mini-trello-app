import { useState } from 'react'
import { AppShell } from './components/Layout/AppShell'
import { BoardPage } from './pages/BoardPage'
import './App.css'

const demoUser = {
  id: 'dummy-48291',
  name: 'dummy-48291',
  initials: 'D1',
  role: 'Placeholder account',
}

function App() {
  const [currentUser, setCurrentUser] = useState(demoUser)
  const isAuthenticated = Boolean(currentUser)

  const handleToggleAuth = () => {
    setCurrentUser((user) => (user ? null : demoUser))
  }

  return (
    <AppShell
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      onToggleAuth={handleToggleAuth}
    >
      <BoardPage currentUser={currentUser} isAuthenticated={isAuthenticated} />
    </AppShell>
  )
}

export default App
