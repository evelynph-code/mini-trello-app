import { useEffect, useState } from 'react'
import { boardsApi } from '../../services/boardsApi'

const emptyForm = {
  name: '',
}

export function BoardManager({
  currentUser,
  isAuthenticated,
  onBoardsLoaded,
  onSelectBoard,
  selectedBoardId,
}) {
  const [boards, setBoards] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteIdentifier, setInviteIdentifier] = useState('')
  const [removingMemberId, setRemovingMemberId] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const selectedBoard = boards.find((board) => board.id === selectedBoardId) || null
  const canManageMembers = Boolean(selectedBoard && selectedBoard.ownerId === currentUser?.id)
  const boardMembers = selectedBoard?.members || []
  const isInitialBoardLoad = isLoading && boards.length === 0

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

  useEffect(() => {
    const handleBoardsRefresh = () => {
      loadBoards()
    }

    window.addEventListener('boards:refresh', handleBoardsRefresh)

    return () => {
      window.removeEventListener('boards:refresh', handleBoardsRefresh)
    }
  })

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

  const handleInviteMember = async (event) => {
    event.preventDefault()

    if (!canManageMembers || !selectedBoardId || !inviteIdentifier.trim()) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')

      const result = await boardsApi.inviteBoardMember(selectedBoardId, inviteIdentifier.trim())

      setInviteIdentifier('')
      setSuccessMessage(`Invitation sent to ${result.invitee.name}.`)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveMember = async (member) => {
    if (!canManageMembers || !selectedBoardId || removingMemberId) {
      return
    }

    const shouldRemove = window.confirm(`Remove ${member.name} from this board?`)

    if (!shouldRemove) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setRemovingMemberId(member.id)

      const updatedBoard = await boardsApi.removeBoardMember(selectedBoardId, member.id)
      const nextBoards = boards.map((board) =>
        board.id === updatedBoard.id ? updatedBoard : board,
      )

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards)
      setSuccessMessage(`${member.name} no longer has access to this board.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setRemovingMemberId('')
    }
  }

  return (
    <section
      id="boards"
      className={`board-switcher ${isLoading ? 'is-loading' : ''}`}
      aria-labelledby="boards-title"
      aria-busy={isLoading}
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Board</p>
          <h2 id="boards-title">Switch board</h2>
        </div>
        {isAuthenticated ? (
          <span className={isLoading ? 'loading-pill' : ''}>
            {isLoading ? (
              <>
                <span aria-hidden="true" className="loading-spinner" />
                Loading boards
              </>
            ) : (
              `${boards.length} boards`
            )}
          </span>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to create and manage your boards.</p>
      ) : (
        <div className="board-switcher-grid">
          <select
            aria-label="Switch board"
            disabled={isLoading}
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
              <button type="submit" disabled={isLoading}>
                Create board
              </button>
            </div>
          </form>
          {canManageMembers ? (
            <form className="board-form board-member-form" onSubmit={handleInviteMember}>
              <input
                aria-label="Handle or email"
                placeholder="Invite by handle or email"
                value={inviteIdentifier}
                onChange={(event) => setInviteIdentifier(event.target.value)}
              />
              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  Send invite
                </button>
              </div>
            </form>
          ) : null}
          {isInitialBoardLoad ? (
            <div className="board-loading-state" aria-label="Loading board data">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {canManageMembers ? (
            <div className="board-access-list">
              <div>
                <strong>People with access</strong>
                <span>
                  {boardMembers.length} {boardMembers.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              {boardMembers.length > 0 ? (
                <ul>
                  {boardMembers.map((member) => (
                    <li key={member.id}>
                      <span className="member-avatar">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" />
                        ) : (
                          member.initials || member.name?.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <span>
                        <strong>{member.name}</strong>
                        <small>{member.username || member.email || member.role}</small>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        disabled={removingMemberId === member.id}
                      >
                        {removingMemberId === member.id ? 'Removing' : 'Remove'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Only you have access to this board.</p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
