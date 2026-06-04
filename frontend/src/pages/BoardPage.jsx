import { useCallback, useState } from 'react'
import { BoardManager } from '../components/Boards/BoardManager'
import { CardManager } from '../components/Cards/CardManager'

export function BoardPage({ currentUser, isAuthenticated }) {
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState('')

  const selectedBoard = boards.find((board) => board.id === selectedBoardId) || null

  const handleBoardsLoaded = useCallback((nextBoards, preferredBoardId = '') => {
    setBoards(nextBoards)

    const preferredBoard = nextBoards.find((board) => board.id === preferredBoardId)
    const currentBoard = nextBoards.find((board) => board.id === selectedBoardId)

    if (preferredBoard) {
      setSelectedBoardId(preferredBoard.id)
    } else if (currentBoard) {
      setSelectedBoardId(currentBoard.id)
    } else if (nextBoards.length > 0) {
      setSelectedBoardId(nextBoards[0].id)
    } else {
      setSelectedBoardId('')
    }
  }, [selectedBoardId])

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
        isAuthenticated={isAuthenticated}
        onBoardsChange={setBoards}
        selectedBoard={selectedBoard}
      />
    </main>
  )
}
