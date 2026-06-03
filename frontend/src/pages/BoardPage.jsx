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
