import { useEffect, useState } from 'react'
import { Board } from '../components/Board/Board'
import { boardApi } from '../services/boardApi'

export function BoardPage() {
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
    <>
      {error ? <p className="error-message">{error}</p> : null}
      <Board
        board={board}
        onCreateCard={handleCreateCard}
        onMoveCard={handleMoveCard}
      />
      <section id="activity" className="activity-bar">
        <p>{board.columns.reduce((total, column) => total + column.cards.length, 0)} cards tracked</p>
        <button type="button" onClick={handleReset}>
          Reset demo board
        </button>
      </section>
    </>
  )
}
