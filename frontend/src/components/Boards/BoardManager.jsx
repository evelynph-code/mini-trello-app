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
  const [renameDraft, setRenameDraft] = useState({ boardId: '', name: '' })
  const [isDeletingBoard, setIsDeletingBoard] = useState(false)
  const [isLeavingBoard, setIsLeavingBoard] = useState(false)
  const [isRenamingBoard, setIsRenamingBoard] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState('')
  const [openPanel, setOpenPanel] = useState({ boardId: '', panel: '' })
  const [successNotice, setSuccessNotice] = useState({ message: '', placement: '' })
  const selectedBoard = boards.find((board) => board.id === selectedBoardId) || null
  const canManageBoard = Boolean(selectedBoard && selectedBoard.ownerId === currentUser?.id)
  const canRenameSelectedBoard = canManageBoard
  const canDeleteSelectedBoard = Boolean(canManageBoard && !selectedBoard?.isDefault)
  const canManageMembers = Boolean(selectedBoard && selectedBoard.ownerId === currentUser?.id)
  const canViewMembers = Boolean(selectedBoard && currentUser && selectedBoard.memberIds?.includes(currentUser.id))
  const canLeaveSelectedBoard = Boolean(
    selectedBoard &&
      currentUser &&
      selectedBoard.ownerId !== currentUser.id &&
      selectedBoard.memberIds?.includes(currentUser.id),
  )
  const boardMembers = selectedBoard?.members || []
  const isInitialBoardLoad = isLoading && boards.length === 0
  const renameBoardName =
    renameDraft.boardId === selectedBoard?.id ? renameDraft.name : selectedBoard?.name || ''
  const activeOwnerPanel =
    openPanel.boardId === selectedBoard?.id ? openPanel.panel : ''

  const toggleOwnerPanel = (panel) => {
    setOpenPanel((current) => ({
      boardId: selectedBoard.id,
      panel: current.boardId === selectedBoard.id && current.panel === panel ? '' : panel,
    }))
  }

  const showSuccess = (message, placement) => {
    setSuccessNotice({ message, placement })
  }

  const clearSuccess = () => {
    setSuccessNotice({ message: '', placement: '' })
  }

  useEffect(() => {
    if (!successNotice.message) {
      return undefined
    }

    const timeoutId = window.setTimeout(clearSuccess, 3200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [successNotice.message])

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
      clearSuccess()
      const board = await boardsApi.createBoard(form)

      resetForm()
      const nextBoards = await boardsApi.getBoards()

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards, board.id)
      onSelectBoard(board.id)
      showSuccess(`${board.name} created.`, 'create')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRenameBoard = async (event) => {
    event.preventDefault()

    const name = renameBoardName.trim()

    if (!canRenameSelectedBoard || !name || name === selectedBoard.name || isRenamingBoard) {
      return
    }

    try {
      setError('')
      clearSuccess()
      setIsRenamingBoard(true)

      const updatedBoard = await boardsApi.updateBoard(selectedBoard.id, {
        description: selectedBoard.description || '',
        lists: selectedBoard.lists,
        name,
      })
      const nextBoards = boards.map((board) =>
        board.id === updatedBoard.id ? { ...board, ...updatedBoard } : board,
      )

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards, updatedBoard.id)
      setRenameDraft({ boardId: updatedBoard.id, name: updatedBoard.name })
      showSuccess(`${updatedBoard.name} renamed.`, 'settings')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRenamingBoard(false)
    }
  }

  const handleDeleteBoard = async () => {
    if (!canDeleteSelectedBoard || isDeletingBoard) {
      return
    }

    const shouldDelete = window.confirm(`Delete ${selectedBoard.name}? This will remove its cards, tasks, comments, and activity.`)

    if (!shouldDelete) {
      return
    }

    try {
      setError('')
      clearSuccess()
      setIsDeletingBoard(true)

      await boardsApi.deleteBoard(selectedBoard.id)

      const nextBoards = boards.filter((board) => board.id !== selectedBoard.id)
      const fallbackBoard = nextBoards.find((board) => board.isDefault) || nextBoards[0] || null

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards, fallbackBoard?.id || '')
      onSelectBoard(fallbackBoard?.id || '')
      showSuccess(`${selectedBoard.name} deleted.`, 'board')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDeletingBoard(false)
    }
  }

  const handleLeaveBoard = async () => {
    if (!canLeaveSelectedBoard || isLeavingBoard) {
      return
    }

    const shouldLeave = window.confirm(`Leave ${selectedBoard.name}? You will lose access to this board.`)

    if (!shouldLeave) {
      return
    }

    try {
      setError('')
      clearSuccess()
      setIsLeavingBoard(true)

      await boardsApi.leaveBoard(selectedBoard.id)

      const nextBoards = boards.filter((board) => board.id !== selectedBoard.id)
      const fallbackBoard = nextBoards.find((board) => board.isDefault) || nextBoards[0] || null

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards, fallbackBoard?.id || '')
      onSelectBoard(fallbackBoard?.id || '')
      showSuccess(`You left ${selectedBoard.name}.`, 'board')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLeavingBoard(false)
    }
  }

  const handleInviteMember = async (event) => {
    event.preventDefault()

    if (!canManageMembers || !selectedBoardId || !inviteIdentifier.trim()) {
      return
    }

    try {
      setError('')
      clearSuccess()

      const result = await boardsApi.inviteBoardMember(selectedBoardId, inviteIdentifier.trim())

      setInviteIdentifier('')
      showSuccess(`Invitation sent to ${result.invitee.name}.`, 'access')
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
      clearSuccess()
      setRemovingMemberId(member.id)

      const updatedBoard = await boardsApi.removeBoardMember(selectedBoardId, member.id)
      const nextBoards = boards.map((board) =>
        board.id === updatedBoard.id ? updatedBoard : board,
      )

      setBoards(nextBoards)
      onBoardsLoaded(nextBoards)
      showSuccess(`${member.name} no longer has access to this board.`, 'access')
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
          {successNotice.placement === 'board' ? (
            <p className="inline-success board-wide-notice">{successNotice.message}</p>
          ) : null}
          <label className="board-control">
            <span>Switch board</span>
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
          </label>
          <form className="board-form board-create-form" onSubmit={handleSubmit}>
            {error ? <p className="inline-error">{error}</p> : null}
            {successNotice.placement === 'create' ? (
              <p className="inline-success">{successNotice.message}</p>
            ) : null}
            <label className="board-control">
              <span>Create board</span>
              <input
                aria-label="Board name"
                name="name"
                placeholder="New board name"
                value={form.name}
                onChange={handleChange}
              />
            </label>
            <div className="form-actions">
              <button type="submit" disabled={isLoading}>
                Create board
              </button>
            </div>
          </form>
          {isInitialBoardLoad ? (
            <div className="board-loading-state" aria-label="Loading board data">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {canManageBoard ? (
            <div className="board-owner-tools">
              <div className="owner-tools-header">
                <strong>Owner tools</strong>
              </div>
              <div className="owner-tool-actions">
                <button
                  type="button"
                  className={activeOwnerPanel === 'settings' ? 'active' : ''}
                  aria-expanded={activeOwnerPanel === 'settings'}
                  aria-controls="board-settings-panel"
                  onClick={() => toggleOwnerPanel('settings')}
                >
                  Board settings
                </button>
                <button
                  type="button"
                  className={activeOwnerPanel === 'access' ? 'active' : ''}
                  aria-expanded={activeOwnerPanel === 'access'}
                  aria-controls="board-access-panel"
                  onClick={() => toggleOwnerPanel('access')}
                >
                  Access
                  <span>{boardMembers.length}</span>
                </button>
              </div>
              {activeOwnerPanel === 'settings' ? (
                <div id="board-settings-panel" className="board-edit-panel">
                  {successNotice.placement === 'settings' ? (
                    <p className="inline-success">{successNotice.message}</p>
                  ) : null}
                  <div>
                    <strong>{selectedBoard.isDefault ? 'Default board' : 'Board settings'}</strong>
                    <span>
                      {selectedBoard.isDefault
                        ? 'You can rename this board, but it cannot be deleted.'
                        : 'Rename or delete this board.'}
                    </span>
                  </div>
                  <form className="board-rename-form" onSubmit={handleRenameBoard}>
                    <input
                      aria-label="Rename selected board"
                      disabled={!canRenameSelectedBoard || isRenamingBoard || isDeletingBoard}
                      value={renameBoardName}
                      onChange={(event) =>
                        setRenameDraft({ boardId: selectedBoard.id, name: event.target.value })
                      }
                    />
                    <button
                      type="submit"
                      disabled={
                        !canRenameSelectedBoard ||
                        isRenamingBoard ||
                        isDeletingBoard ||
                        !renameBoardName.trim() ||
                        renameBoardName.trim() === selectedBoard.name
                      }
                    >
                      {isRenamingBoard ? 'Renaming' : 'Rename'}
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      disabled={!canDeleteSelectedBoard || isRenamingBoard || isDeletingBoard}
                      onClick={handleDeleteBoard}
                    >
                      {isDeletingBoard ? 'Deleting' : 'Delete'}
                    </button>
                  </form>
                </div>
              ) : null}
              {activeOwnerPanel === 'access' ? (
                <div id="board-access-panel" className="board-access-list">
                  {successNotice.placement === 'access' ? (
                    <p className="inline-success">{successNotice.message}</p>
                  ) : null}
                  <form className="board-member-form" onSubmit={handleInviteMember}>
                    <input
                      aria-label="Handle or email"
                      placeholder="Invite by handle or email"
                      value={inviteIdentifier}
                      onChange={(event) => setInviteIdentifier(event.target.value)}
                    />
                    <button type="submit" disabled={isLoading || !inviteIdentifier.trim()}>
                      Send invite
                    </button>
                  </form>
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
                            <small>
                              {member.id === selectedBoard.ownerId
                                ? 'Owner'
                                : member.username || member.email || member.role}
                            </small>
                          </span>
                          {canManageMembers && member.id !== selectedBoard.ownerId ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              disabled={removingMemberId === member.id}
                            >
                              {removingMemberId === member.id ? 'Removing' : 'Remove'}
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Only you have access to this board.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          {canLeaveSelectedBoard ? (
            <div className="board-shared-tools">
              <div className="shared-board-summary">
                <strong>Shared board</strong>
                <span>You accepted access to this board.</span>
              </div>
              <div className="shared-tool-actions">
                <button
                  type="button"
                  className={activeOwnerPanel === 'access' ? 'active' : ''}
                  aria-expanded={activeOwnerPanel === 'access'}
                  aria-controls="board-shared-access-panel"
                  onClick={() => toggleOwnerPanel('access')}
                >
                  Access
                  <span>{boardMembers.length}</span>
                </button>
                <button
                  type="button"
                  className="danger-button"
                  disabled={isLeavingBoard}
                  onClick={handleLeaveBoard}
                >
                  {isLeavingBoard ? 'Leaving' : 'Leave board'}
                </button>
              </div>
              {canViewMembers && activeOwnerPanel === 'access' ? (
                <div id="board-shared-access-panel" className="board-access-list">
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
                            <small>
                              {member.id === selectedBoard.ownerId
                                ? 'Owner'
                                : member.username || member.email || member.role}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Only you have access to this board.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
