import { useEffect, useRef, useState } from 'react'
import { boardsApi } from '../services/boardsApi'
import { cardApi } from '../services/cardApi'
import { createListId, normalizeListId } from '../utils/cardUtils'

export function useListManager({
  cards,
  detailsCard,
  loadCards,
  onBoardsChange,
  selectedBoard,
  setDetailsCard,
  setError,
}) {
  const [editingListId, setEditingListId] = useState('')
  const [listForm, setListForm] = useState({ name: '' })
  const listsRef = useRef([])

  useEffect(() => {
    listsRef.current = selectedBoard?.lists || []
  }, [selectedBoard])

  const persistBoardLists = async (lists) => {
    const updatedBoard = await boardsApi.updateBoard(selectedBoard.id, {
      description: selectedBoard.description || '',
      lists,
      name: selectedBoard.name,
    })

    onBoardsChange((currentBoards) =>
      currentBoards.map((board) => (board.id === updatedBoard.id ? updatedBoard : board)),
    )

    return updatedBoard
  }

  const handleDeleteList = async (listId) => {
    if (selectedBoard.lists.length <= 1) {
      setError('Keep at least one list on the board.')
      return
    }

    try {
      const cardsInList = cards.filter((card) => normalizeListId(card.listId) === listId)

      await Promise.all(cardsInList.map((card) => cardApi.deleteBoardCard(selectedBoard.id, card.id)))
      await persistBoardLists(selectedBoard.lists.filter((list) => list.id !== listId))
      setDetailsCard((currentCard) =>
        currentCard && normalizeListId(currentCard.listId) === listId ? null : currentCard,
      )
      await loadCards()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReorderList = (draggedList, targetIndex) => {
    onBoardsChange((currentBoards) =>
      currentBoards.map((board) => {
        if (board.id !== selectedBoard.id) {
          return board
        }

        const sourceIndex = board.lists.findIndex((list) => list.id === draggedList.id)

        if (sourceIndex < 0) {
          return board
        }

        const nextLists = [...board.lists]
        const [movingList] = nextLists.splice(sourceIndex, 1)

        nextLists.splice(targetIndex, 0, movingList)
        listsRef.current = nextLists

        return {
          ...board,
          lists: nextLists,
        }
      }),
    )
  }

  const handleSaveListOrder = async () => {
    try {
      await persistBoardLists(listsRef.current)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateList = async (event) => {
    event.preventDefault()

    const name = listForm.name.trim()

    if (!name) {
      return
    }

    try {
      const nextLists = [
        ...selectedBoard.lists,
        {
          id: createListId(name, selectedBoard.lists),
          name,
        },
      ]

      await persistBoardLists(nextLists)
      setListForm({ name: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRenameList = async (listId, rawName) => {
    const name = String(rawName || '').trim()
    setEditingListId('')

    if (!name) {
      return
    }

    const currentList = selectedBoard.lists.find((list) => list.id === listId)

    if (!currentList || currentList.name === name) {
      return
    }

    try {
      await persistBoardLists(
        selectedBoard.lists.map((list) => (list.id === listId ? { ...list, name } : list)),
      )

      if (detailsCard?.listId === listId) {
        setDetailsCard((currentCard) => ({
          ...currentCard,
          listName: name,
        }))
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    editingListId,
    handleCreateList,
    handleDeleteList,
    handleRenameList,
    handleReorderList,
    handleSaveListOrder,
    listForm,
    setEditingListId,
    setListForm,
  }
}
