import { useCallback, useState } from 'react'
import { BoardManager } from '../components/Boards/BoardManager'
import { CardManager } from '../components/Cards/CardManager'

export function BoardPage({ currentUser, isAuthenticated }) {
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState('')

  const selectedBoard = boards.find((board) => board.id === selectedBoardId) || null

  const handleBoardsLoaded = useCallback((nextBoards) => {
    setBoards(nextBoards)

    if (!selectedBoardId && nextBoards.length > 0) {
      setSelectedBoardId(nextBoards[0].id)
    }
  }, [selectedBoardId])

  return (
    <main className="dashboard-grid">
      <section id="overview" className="overview-panel" aria-labelledby="overview-title">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 id="overview-title">
            {isAuthenticated ? `Welcome back, ${currentUser.name}` : 'Public board preview'}
          </h2>
          <p>
            {isAuthenticated
              ? 'Create boards, open one, then add cards to its lists.'
              : 'Sign in to create boards and manage Trello-style cards.'}
          </p>
        </div>
        <div className="stat-grid" aria-label="Board statistics">
          <div>
            <strong>{boards.length}</strong>
            <span>Boards</span>
          </div>
          <div>
            <strong>{selectedBoard?.lists.length || 0}</strong>
            <span>Lists</span>
          </div>
          <div>
            <strong>{selectedBoard ? 1 : 0}</strong>
            <span>Open</span>
          </div>
        </div>
      </section>

      <aside id="profile" className="profile-panel" aria-labelledby="profile-title">
        <p className="eyebrow">Profile</p>
        {isAuthenticated ? (
          <>
            <div className="profile-heading">
              <span>{currentUser.initials}</span>
              <div>
                <h2 id="profile-title">{currentUser.name}</h2>
                <p>{currentUser.role}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>Authenticated</dd>
              </div>
              <div>
                <dt>Workspace</dt>
                <dd>{selectedBoard?.name || 'No board open'}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <h2 id="profile-title">Guest access</h2>
            <p>Profile details appear after sign in.</p>
          </>
        )}
      </aside>

      <BoardManager
        isAuthenticated={isAuthenticated}
        onBoardsLoaded={handleBoardsLoaded}
        onSelectBoard={setSelectedBoardId}
        selectedBoardId={selectedBoardId}
      />
      <CardManager
        boards={boards}
        isAuthenticated={isAuthenticated}
        onSelectBoard={setSelectedBoardId}
        selectedBoard={selectedBoard}
      />
      <section id="activity" className="activity-bar">
        <p>
          {isAuthenticated
            ? `${currentUser.name} is managing ${boards.length} board${boards.length === 1 ? '' : 's'}`
            : 'Sign in to manage boards and cards'}
        </p>
      </section>
    </main>
  )
}
