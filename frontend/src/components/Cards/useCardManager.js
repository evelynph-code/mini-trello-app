import { useEffect, useRef, useState } from 'react'
import {
  applyListPositions,
  createListId,
  emptyForm,
  getListName,
  normalizeListId,
  sortCardsByPosition,
} from './cardUtils'
import { boardsApi } from '../../services/boardsApi'
import { cardApi } from '../../services/cardApi'
import { socket } from '../../services/realtime'

const countRemainingTasks = (tasks) => tasks.filter((task) => task.status !== 'done').length

const cardOrderSignature = (cards) =>
  cards
    .map((card) => `${card.id}:${normalizeListId(card.listId)}:${Number.isFinite(card.position) ? card.position : 0}`)
    .join('|')

export function useCardManager({ isAuthenticated, onBoardsChange, selectedBoard }) {
  const [cards, setCards] = useState([])
  const [detailsCard, setDetailsCard] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingListId, setEditingListId] = useState('')
  const [listForm, setListForm] = useState({ name: '' })
  const [selectedCardId, setSelectedCardId] = useState('')
  const [taskCounts, setTaskCounts] = useState({})
  const cardsRef = useRef([])
  const hasCardOrderChangedRef = useRef(false)
  const isCardOrderActiveRef = useRef(false)
  const listsRef = useRef([])
  const queuedRemoteCardsRef = useRef(null)

  const orderedCards = sortCardsByPosition(
    cards.map((card) => ({
      ...card,
      taskCount: taskCounts[card.id] || 0,
    })),
  )

  useEffect(() => {
    cardsRef.current = cards
  }, [cards])

  useEffect(() => {
    listsRef.current = selectedBoard?.lists || []
  }, [selectedBoard])

  const applyRemoteCards = (nextCards, options = {}) => {
    if (!options.force && isCardOrderActiveRef.current) {
      queuedRemoteCardsRef.current = nextCards
      return
    }

    setCards(applyListPositions(sortCardsByPosition(nextCards)))
    setDetailsCard((currentCard) => {
      if (!currentCard) {
        return currentCard
      }

      return nextCards.find((card) => card.id === currentCard.id) || null
    })
  }

  const applyQueuedRemoteCards = () => {
    if (!queuedRemoteCardsRef.current) {
      return
    }

    const nextCards = queuedRemoteCardsRef.current

    queuedRemoteCardsRef.current = null
    applyRemoteCards(nextCards, { force: true })
  }

  const refreshTaskCount = async (cardId) => {
    if (!selectedBoard || !cardId) {
      return
    }

    try {
      const nextTaskCounts = await cardApi.getBoardCardTaskCounts(selectedBoard.id)

      setTaskCounts((currentCounts) => ({
        ...currentCounts,
        [cardId]: nextTaskCounts[cardId] || 0,
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  const refreshTaskCounts = async (boardId) => {
    if (!boardId) {
      setTaskCounts({})
      return
    }

    try {
      setTaskCounts(await cardApi.getBoardCardTaskCounts(boardId))
    } catch (err) {
      setError(err.message)
    }
  }

  const loadCards = async () => {
    if (!isAuthenticated || !selectedBoard) {
      setCards([])
      setDetailsCard(null)
      setTaskCounts({})
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const nextCards = await cardApi.getBoardCards(selectedBoard.id)

      applyRemoteCards(nextCards)
      await refreshTaskCounts(selectedBoard.id)
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

      if (!isAuthenticated || !selectedBoard) {
        setCards([])
        setDetailsCard(null)
        setTaskCounts({})
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const nextCards = await cardApi.getBoardCards(selectedBoard.id)

        if (isMounted) {
          applyRemoteCards(nextCards)
          await refreshTaskCounts(selectedBoard.id)
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
  }, [isAuthenticated, selectedBoard])

  useEffect(() => {
    if (!isAuthenticated || !selectedBoard) {
      return undefined
    }

    const handleBoardChanged = (payload) => {
      if (payload.boardId !== selectedBoard.id) {
        return
      }

      if (payload.board) {
        onBoardsChange((currentBoards) =>
          currentBoards.map((board) => (board.id === payload.board.id ? payload.board : board)),
        )
      }

      if (payload.cards) {
        applyRemoteCards(payload.cards)
        refreshTaskCounts(selectedBoard.id)
      }

      if (payload.resource === 'tasks' && payload.cardId && payload.tasks) {
        setTaskCounts((currentCounts) => ({
          ...currentCounts,
          [payload.cardId]: countRemainingTasks(payload.tasks),
        }))
      }
    }

    socket.connect()
    socket.emit('board:join', { boardId: selectedBoard.id })
    socket.on('board:changed', handleBoardChanged)

    return () => {
      socket.emit('board:leave', { boardId: selectedBoard.id })
      socket.off('board:changed', handleBoardChanged)
    }
  }, [isAuthenticated, onBoardsChange, selectedBoard])

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setIsEditing(false)
    setSelectedCardId('')
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    try {
      await cardApi.updateBoardCard(selectedBoard.id, selectedCardId, form)

      resetForm()
      await loadCards()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleShowDetails = async (cardId) => {
    try {
      setSelectedCardId(cardId)
      setDetailsCard(await cardApi.getBoardCard(selectedBoard.id, cardId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleDetails = (cardId) => {
    if (detailsCard?.id === cardId) {
      setDetailsCard(null)
      return
    }

    handleShowDetails(cardId)
  }

  const handleEdit = (card) => {
    setForm({
      description: card.description || '',
      label: card.label || 'General',
      listId: normalizeListId(card.listId || 'today'),
      title: card.title,
    })
    setIsEditing(true)
    setSelectedCardId(card.id)
  }

  const handleDelete = async (cardId) => {
    try {
      await cardApi.deleteBoardCard(selectedBoard.id, cardId)
      resetForm()
      setDetailsCard(null)
      await loadCards()
    } catch (err) {
      setError(err.message)
    }
  }

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

  const handleCreateCardInList = async (listId, title) => {
    try {
      const nextPosition = cards.filter((card) => normalizeListId(card.listId) === listId).length

      await cardApi.createBoardCard(selectedBoard.id, {
        description: '',
        label: 'General',
        listId,
        position: nextPosition,
        title,
      })
      await loadCards()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleStartCardOrder = () => {
    isCardOrderActiveRef.current = true
    hasCardOrderChangedRef.current = false
    queuedRemoteCardsRef.current = null
  }

  const handleReorderCard = (draggedCard, targetListId, targetIndex) => {
    setCards((currentCards) => {
      const sourceIndex = currentCards.findIndex((card) => card.id === draggedCard.id)

      if (sourceIndex < 0) {
        return currentCards
      }

      const movingCard = {
        ...currentCards[sourceIndex],
        listId: targetListId,
        listName: getListName(selectedBoard.lists, targetListId),
      }
      const remainingCards = currentCards.filter((card) => card.id !== draggedCard.id)
      const targetCards = remainingCards.filter((card) => normalizeListId(card.listId) === targetListId)
      const insertBeforeCard = targetCards[targetIndex]
      const lastTargetCard = targetCards[targetCards.length - 1]
      let insertIndex = remainingCards.length

      if (insertBeforeCard) {
        insertIndex = remainingCards.findIndex((card) => card.id === insertBeforeCard.id)
      } else if (lastTargetCard) {
        insertIndex = remainingCards.findIndex((card) => card.id === lastTargetCard.id) + 1
      }

      const nextCards = [...remainingCards]

      nextCards.splice(insertIndex, 0, movingCard)

      const positionedCards = applyListPositions(nextCards)

      if (cardOrderSignature(positionedCards) === cardOrderSignature(currentCards)) {
        return currentCards
      }

      hasCardOrderChangedRef.current = true
      cardsRef.current = positionedCards
      return positionedCards
    })
  }

  const handleSaveCardOrder = async () => {
    if (!isCardOrderActiveRef.current || !hasCardOrderChangedRef.current) {
      isCardOrderActiveRef.current = false
      hasCardOrderChangedRef.current = false
      applyQueuedRemoteCards()
      return
    }

    const cardsToSave = cardsRef.current.map((card) => ({
      id: card.id,
      listId: normalizeListId(card.listId),
      position: Number.isFinite(card.position) ? card.position : 0,
    }))

    try {
      const nextCards = await cardApi.updateBoardCardOrder(
        selectedBoard.id,
        cardsToSave,
      )

      queuedRemoteCardsRef.current = null
      applyRemoteCards(nextCards, { force: true })
    } catch (err) {
      setError(err.message)
      queuedRemoteCardsRef.current = null
      isCardOrderActiveRef.current = false
      await loadCards()
    } finally {
      isCardOrderActiveRef.current = false
      hasCardOrderChangedRef.current = false
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
    cards,
    detailsCard,
    editingListId,
    error,
    form,
    handleChange,
    handleCreateCardInList,
    handleCreateList,
    handleDelete,
    handleDeleteList,
    handleEdit,
    handleEditSubmit,
    handleRenameList,
    handleReorderCard,
    handleReorderList,
    handleSaveCardOrder,
    handleSaveListOrder,
    handleStartCardOrder,
    handleToggleDetails,
    isEditing,
    isLoading,
    listForm,
    orderedCards,
    refreshTaskCount,
    resetForm,
    setDetailsCard,
    setEditingListId,
    setListForm,
  }
}
