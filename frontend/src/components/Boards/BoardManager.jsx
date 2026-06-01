import { useEffect, useState } from 'react'
import { boardsApi } from '../../services/boardsApi'

const emptyForm = {
  name: '',
}

export function BoardManager({ isAuthenticated, onBoardsLoaded, onSelectBoard, selectedBoardId }) {
  const [boards, setBoards] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(false)

  const loadBoards = async () => {
    if (!isAuthenticated) {
      setBoards([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const nextBoards = await boardsApi.getBoards()

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.resolve().then(async () => {
      if (!isMounted) {
        return
      }

      if (!isAuthenticated) {
        setBoards([])
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const nextBoards = await boardsApi.getBoards()

        if (isMounted) {
          setBoards(nextBoards)
          onBoardsLoaded(nextBoards)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, onBoardsLoaded])

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    try {
      const board = await boardsApi.createBoard(form)
      onSelectBoard(board.id)

      resetForm()
      await loadBoards()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section id="boards" className="board-switcher" aria-labelledby="boards-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Board</p>
          <h2 id="boards-title">Switch board</h2>
        </div>
        {isAuthenticated ? <span>{isLoading ? 'Loading' : `${boards.length} boards`}</span> : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to create and manage your boards.</p>
      ) : (
        <div className="board-switcher-grid">
          <select
            aria-label="Switch board"
            value={selectedBoardId}
            onChange={(event) => onSelectBoard(event.target.value)}
          >
            <option value="">Choose a board</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          <form className="board-form" onSubmit={handleSubmit}>
            {error ? <p className="inline-error">{error}</p> : null}
            <input
              aria-label="Board name"
              name="name"
              placeholder="New board name"
              value={form.name}
              onChange={handleChange}
            />
            <div className="form-actions">
              <button type="submit">Create board</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
