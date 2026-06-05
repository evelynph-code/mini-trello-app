import { useCallback, useEffect, useRef, useState } from 'react'
import { cardApi } from '../services/cardApi'
import { socket } from '../services/realtime'
import {
  applyListPositions,
  cardOrderSignature,
  emptyForm,
  getListName,
  normalizeListId,
  sortCardsByPosition,
} from '../utils/cardUtils'
import { useCardTaskSummaries } from './useCardTaskSummaries'
import { useListManager } from './useListManager'

export function useCardManager({
  focusTarget,
  isAuthenticated,
  onBoardsChange,
  onFocusTargetConsumed,
  selectedBoard,
}) {
  const [cards, setCards] = useState([])
  const [detailsCard, setDetailsCard] = useState(null)
  const [error, setError] = useState('')
  const [focusedTaskId, setFocusedTaskId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState('')
  const cardsRef = useRef([])
  const hasCardOrderChangedRef = useRef(false)
  const appliedFocusTargetRef = useRef(0)
  const isCardOrderActiveRef = useRef(false)
  const queuedRemoteCardsRef = useRef(null)
  const {
    clearTaskSummaries,
    refreshTaskCount,
    refreshTaskCounts,
    taskSummaries,
    updateTaskSummary,
  } = useCardTaskSummaries({ selectedBoard, setError })

  const orderedCards = sortCardsByPosition(
    cards.map((card) => ({
      ...card,
      taskCount: taskSummaries[card.id]?.remainingCount || 0,
      taskSummary: taskSummaries[card.id] || null,
    })),
  )

  useEffect(() => {
    cardsRef.current = cards
  }, [cards])

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

  const loadCards = async () => {
    if (!isAuthenticated || !selectedBoard) {
      setCards([])
      setDetailsCard(null)
      clearTaskSummaries()
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
        clearTaskSummaries()
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
  }, [clearTaskSummaries, isAuthenticated, refreshTaskCounts, selectedBoard])

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
        updateTaskSummary(payload.cardId, payload.tasks)
      }
    }

    socket.connect()
    socket.emit('board:join', { boardId: selectedBoard.id })
    socket.on('board:changed', handleBoardChanged)

    return () => {
      socket.emit('board:leave', { boardId: selectedBoard.id })
      socket.off('board:changed', handleBoardChanged)
    }
  }, [isAuthenticated, onBoardsChange, refreshTaskCounts, selectedBoard, updateTaskSummary])

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

  const handleShowDetails = useCallback(async (cardId, nextFocusedTaskId = '') => {
    if (!selectedBoard?.id) {
      return
    }

    try {
      setSelectedCardId(cardId)
      setFocusedTaskId(nextFocusedTaskId)
      setDetailsCard(await cardApi.getBoardCard(selectedBoard.id, cardId))
    } catch (err) {
      setError(err.message)
    }
  }, [selectedBoard])

  const handleToggleDetails = (cardId) => {
    if (detailsCard?.id === cardId) {
      setDetailsCard(null)
      return
    }

    handleShowDetails(cardId)
  }

  useEffect(() => {
    if (
      !focusTarget?.cardId ||
      focusTarget.boardId !== selectedBoard?.id ||
      appliedFocusTargetRef.current === focusTarget.openedAt
    ) {
      return undefined
    }

    let isMounted = true

    Promise.resolve().then(() => {
      if (isMounted) {
        appliedFocusTargetRef.current = focusTarget.openedAt
        handleShowDetails(focusTarget.cardId, focusTarget.taskId || '')
        onFocusTargetConsumed?.()
      }
    })

    return () => {
      isMounted = false
    }
  }, [focusTarget, handleShowDetails, onFocusTargetConsumed, selectedBoard])

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

  const {
    editingListId,
    handleCreateList,
    handleDeleteList,
    handleRenameList,
    handleReorderList,
    handleSaveListOrder,
    listForm,
    setEditingListId,
    setListForm,
  } = useListManager({
    cards,
    detailsCard,
    loadCards,
    onBoardsChange,
    selectedBoard,
    setDetailsCard,
    setError,
  })

  return {
    cards,
    detailsCard,
    editingListId,
    error,
    focusedTaskId,
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
