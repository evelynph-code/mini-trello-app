import { useCallback, useEffect, useState } from 'react'
import { BoardManager } from '../components/Boards/BoardManager'
import { CardManager } from '../components/Cards/CardManager'

export function BoardPage({
  currentUser,
  focusTarget,
  isAuthenticated,
  onFocusTargetConsumed,
}) {
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [appliedFocusTargetKey, setAppliedFocusTargetKey] = useState(0)

  const selectedBoard = boards.find((board) => board.id === selectedBoardId) || null
  const focusTargetKey = focusTarget?.openedAt || 0
  const pendingFocusBoardId =
    focusTarget?.boardId && appliedFocusTargetKey !== focusTargetKey
      ? focusTarget.boardId
      : ''

  const handleBoardsLoaded = useCallback((nextBoards, preferredBoardId = '') => {
    setBoards(nextBoards)

    const preferredBoard = nextBoards.find((board) => board.id === (preferredBoardId || pendingFocusBoardId))
    const currentBoard = nextBoards.find((board) => board.id === selectedBoardId)

    if (preferredBoard) {
      if (!preferredBoardId && pendingFocusBoardId) {
        setAppliedFocusTargetKey(focusTargetKey)
      }

      setSelectedBoardId(preferredBoard.id)
    } else if (currentBoard) {
      setSelectedBoardId(currentBoard.id)
    } else if (nextBoards.length > 0) {
      setSelectedBoardId(nextBoards[0].id)
    } else {
      setSelectedBoardId('')
    }
  }, [focusTargetKey, pendingFocusBoardId, selectedBoardId])

  useEffect(() => {
    if (!pendingFocusBoardId || !boards.some((board) => board.id === pendingFocusBoardId)) {
      return undefined
    }

    let isMounted = true

    Promise.resolve().then(() => {
      if (isMounted) {
        setAppliedFocusTargetKey(focusTargetKey)
        setSelectedBoardId(pendingFocusBoardId)

        if (!focusTarget?.cardId) {
          onFocusTargetConsumed?.()
        }
      }
    })

    return () => {
      isMounted = false
    }
  }, [boards, focusTarget?.cardId, focusTargetKey, onFocusTargetConsumed, pendingFocusBoardId])

  return (
    <main className="board-app">
      <BoardManager
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        onBoardsLoaded={handleBoardsLoaded}
        onSelectBoard={setSelectedBoardId}
        selectedBoardId={selectedBoardId}
      />
      <CardManager
        currentUser={currentUser}
        focusTarget={focusTarget}
        isAuthenticated={isAuthenticated}
        onFocusTargetConsumed={onFocusTargetConsumed}
        onBoardsChange={setBoards}
        selectedBoard={selectedBoard}
      />
    </main>
  )
}
