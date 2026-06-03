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
  const [memberIdentifier, setMemberIdentifier] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const selectedBoard = boards.find((board) => board.id === selectedBoardId) || null

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
      setSuccessMessage('')
      const board = await boardsApi.createBoard(form)
      onSelectBoard(board.id)

      resetForm()
      await loadBoards()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddMember = async (event) => {
    event.preventDefault()

    if (!selectedBoardId || !memberIdentifier.trim()) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')

      const result = await boardsApi.addBoardMember(selectedBoardId, memberIdentifier.trim())

      setMemberIdentifier('')
      setSuccessMessage(`${result.member.name} can now access ${result.board.name}.`)
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
            {successMessage ? <p className="inline-success">{successMessage}</p> : null}
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
          {selectedBoard ? (
            <form className="board-form board-member-form" onSubmit={handleAddMember}>
              <input
                aria-label="User ID, username, or email"
                placeholder="Add member by user ID, username, or email"
                value={memberIdentifier}
                onChange={(event) => setMemberIdentifier(event.target.value)}
              />
              <div className="form-actions">
                <button type="submit">Add to board</button>
              </div>
            </form>
          ) : null}
        </div>
      )}
    </section>
  )
}
