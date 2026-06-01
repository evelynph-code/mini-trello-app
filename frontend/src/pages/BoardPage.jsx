import { useEffect, useState } from 'react'
import { Board } from '../components/Board/Board'
import { boardApi } from '../services/boardApi'

const countCards = (columns) =>
  columns.reduce((total, column) => total + column.cards.length, 0)

const getAssignedCards = (columns, userId) =>
  columns.flatMap((column) =>
    column.cards
      .filter((card) => card.assigneeId === userId)
      .map((card) => ({ ...card, columnTitle: column.title })),
  )

export function BoardPage({ currentUser, isAuthenticated }) {
  const [board, setBoard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadBoard = async () => {
    setIsLoading(true)
    setError('')

    try {
      setBoard(await boardApi.getBoard())
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    boardApi
      .getBoard()
      .then((data) => {
        if (isMounted) {
          setBoard(data)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreateCard = async (columnId, card) => {
    try {
      await boardApi.createCard(columnId, card)
      await loadBoard()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleMoveCard = async (cardId, targetColumnId) => {
    try {
      setBoard(await boardApi.moveCard(cardId, targetColumnId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReset = async () => {
    try {
      setBoard(await boardApi.resetBoard())
    } catch (err) {
      setError(err.message)
    }
  }

  if (isLoading) {
    return <p className="status-message">Loading board...</p>
  }

  if (!board) {
    return (
      <section className="status-panel">
        <h2>Board unavailable</h2>
        <p>{error || 'Start the backend API, then refresh the app.'}</p>
        <button type="button" onClick={loadBoard}>
          Retry
        </button>
      </section>
    )
  }

  return (
    <main className="dashboard-grid">
      {error ? <p className="error-message">{error}</p> : null}
      <section id="overview" className="overview-panel" aria-labelledby="overview-title">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 id="overview-title">
            {isAuthenticated ? `Welcome back, ${currentUser.name}` : 'Public board preview'}
          </h2>
          <p>
            {isAuthenticated
              ? 'Your assigned work and team progress are ready.'
              : 'Sign in to see assigned cards, profile details, and private activity.'}
          </p>
        </div>
        <div className="stat-grid" aria-label="Board statistics">
          <div>
            <strong>{board.columns.length}</strong>
            <span>Lists</span>
          </div>
          <div>
            <strong>{countCards(board.columns)}</strong>
            <span>Cards</span>
          </div>
          <div>
            <strong>{board.members.length}</strong>
            <span>Members</span>
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
                <dd>{board.title}</dd>
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

      <section className="assigned-panel" aria-labelledby="assigned-title">
        <p className="eyebrow">My cards</p>
        <h2 id="assigned-title">
          {isAuthenticated ? 'Assigned to you' : 'Sign in required'}
        </h2>
        {isAuthenticated ? (
          <div className="assigned-list">
            {getAssignedCards(board.columns, currentUser.id).map((card) => (
              <article key={card.id}>
                <span>{card.columnTitle}</span>
                <strong>{card.title}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p>Authentication controls which user-specific cards render here.</p>
        )}
      </section>

      <Board
        board={board}
        onCreateCard={handleCreateCard}
        onMoveCard={handleMoveCard}
      />
      <section id="activity" className="activity-bar">
        <p>
          {isAuthenticated
            ? `${currentUser.name} is viewing ${countCards(board.columns)} tracked cards`
            : `${countCards(board.columns)} public cards tracked`}
        </p>
        <button type="button" onClick={handleReset}>
          Reset demo board
        </button>
      </section>
    </main>
  )
}
