import { useEffect, useState } from 'react'
import { boardsApi } from '../../services/boardsApi'

const emptyForm = {
  description: '',
  name: '',
}

export function BoardManager({ isAuthenticated, onBoardsLoaded, onSelectBoard, selectedBoardId }) {
  const [boards, setBoards] = useState([])
  const [detailsBoard, setDetailsBoard] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingBoardId, setEditingBoardId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadBoards = async () => {
    if (!isAuthenticated) {
      setBoards([])
      setDetailsBoard(null)
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
        setDetailsBoard(null)
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
    setEditingBoardId('')
    setIsEditing(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    try {
      if (isEditing) {
        await boardsApi.updateBoard(editingBoardId, form)
      } else {
        await boardsApi.createBoard(form)
      }

      resetForm()
      await loadBoards()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleShowDetails = async (boardId) => {
    try {
      setDetailsBoard(await boardsApi.getBoard(boardId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (board) => {
    setForm({
      description: board.description || '',
      name: board.name,
    })
    setEditingBoardId(board.id)
    setIsEditing(true)
  }

  const handleDelete = async (boardId) => {
    try {
      await boardsApi.deleteBoard(boardId)
      resetForm()
      setDetailsBoard(null)
      if (selectedBoardId === boardId) {
        onSelectBoard('')
      }
      await loadBoards()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section id="boards" className="boards-panel" aria-labelledby="boards-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Boards</p>
          <h2 id="boards-title">
            {isAuthenticated ? 'Board management' : 'Sign in required'}
          </h2>
        </div>
        {isAuthenticated ? <span>{boards.length} owned</span> : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to create and manage your boards.</p>
      ) : (
        <div className="board-manager-grid">
          <form className="board-form" onSubmit={handleSubmit}>
            {error ? <p className="inline-error">{error}</p> : null}
            <input
              aria-label="Board name"
              name="name"
              placeholder="Board name"
              value={form.name}
              onChange={handleChange}
            />
            <textarea
              aria-label="Board description"
              name="description"
              placeholder="Board description"
              value={form.description}
              onChange={handleChange}
            />
            <div className="form-actions">
              <button type="submit">{isEditing ? 'Save board' : 'Create board'}</button>
              {isEditing ? (
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="board-list" aria-live="polite">
            {isLoading ? <p>Loading boards...</p> : null}
            {!isLoading && boards.length === 0 ? <p>No boards yet.</p> : null}
            {boards.map((board) => (
              <article key={board.id}>
                <div>
                  <strong>{board.name}</strong>
                  <p>{board.description || 'No description'}</p>
                </div>
                <div className="card-actions">
                  <button type="button" onClick={() => onSelectBoard(board.id)}>
                    {selectedBoardId === board.id ? 'Selected' : 'Open'}
                  </button>
                  <button type="button" onClick={() => handleShowDetails(board.id)}>
                    Details
                  </button>
                  <button type="button" onClick={() => handleEdit(board)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(board.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          {detailsBoard ? (
            <article className="board-details">
              <p className="eyebrow">Details</p>
              <h3>{detailsBoard.name}</h3>
              <dl>
                <div>
                  <dt>Board ID</dt>
                  <dd>{detailsBoard.id}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{detailsBoard.description || 'No description'}</dd>
                </div>
              </dl>
            </article>
          ) : null}
        </div>
      )}
    </section>
  )
}
