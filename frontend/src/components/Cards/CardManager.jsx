import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import { TaskBoard } from '../Tasks/TaskBoard'
import { boardsApi } from '../../services/boardsApi'
import { cardApi } from '../../services/cardApi'

const cardType = 'board-card'
const listType = 'board-list'

const emptyForm = {
  description: '',
  label: 'General',
  listId: 'today',
  title: '',
}

const normalizeListId = (listId) => listId || 'today'

const createListId = (name, lists) => {
  const baseId = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'assignment-group'
  let nextId = baseId
  let suffix = 2

  while (lists.some((list) => list.id === nextId)) {
    nextId = `${baseId}-${suffix}`
    suffix += 1
  }

  return nextId
}

const getListName = (lists, listId, fallbackName) =>
  lists.find((list) => list.id === normalizeListId(listId))?.name || fallbackName || 'List'

const sortCardsByPosition = (cards) =>
  [...cards].sort((firstCard, secondCard) => {
    const firstPosition = Number.isFinite(firstCard.position) ? firstCard.position : 0
    const secondPosition = Number.isFinite(secondCard.position) ? secondCard.position : 0

    return firstPosition - secondPosition
  })

const applyListPositions = (cards) => {
  const listIds = [...new Set(cards.map((card) => normalizeListId(card.listId)))]

  return listIds.flatMap((listId) =>
    cards
      .filter((card) => normalizeListId(card.listId) === listId)
      .map((card, index) => ({
        ...card,
        listId,
        position: index,
      })),
  )
}

function IconButton({ children, className = '', label, onClick, title = label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`icon-button ${className}`.trim()}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

function BoardCard({
  card,
  index,
  isOpen,
  listId,
  onDelete,
  onEdit,
  onMove,
  onReorder,
  onSaveOrder,
  onToggleDetails,
  selectedBoard,
}) {
  const cardRef = useRef(null)
  const [, dropRef] = useDrop({
    accept: cardType,
    hover: (draggedCard) => {
      if (!cardRef.current || draggedCard.id === card.id) {
        return
      }

      if (draggedCard.listId === listId && draggedCard.index === index) {
        return
      }

      onReorder(draggedCard, listId, index)
      draggedCard.index = index
      draggedCard.listId = listId
    },
  })

  const [{ isDragging }, dragRef] = useDrag({
    type: cardType,
    item: {
      ...card,
      index,
      listId,
    },
    end: () => onSaveOrder(),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const setCardNode = (node) => {
    cardRef.current = node
    dragRef(dropRef(node))
  }

  return (
    <article ref={setCardNode} className="board-task-card" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <span>{getListName(selectedBoard.lists, card.listId, card.listName)}</span>
      <strong>{card.title}</strong>
      <p>{card.description || 'No description'}</p>
      <label className="move-card-control">
        Move to
        <select
          aria-label={`Move ${card.title}`}
          value={normalizeListId(card.listId)}
          onChange={(event) => onMove(card, event.target.value)}
        >
          {selectedBoard.lists.map((targetList) => (
            <option key={targetList.id} value={targetList.id}>
              {targetList.name}
            </option>
          ))}
        </select>
      </label>
      <div className="card-actions">
        <IconButton
          label={isOpen ? 'Close task card' : 'Open task card'}
          onClick={() => onToggleDetails(card.id)}
        >
          {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
        </IconButton>
        <IconButton label="Edit task card" onClick={() => onEdit(card)}>
          <Pencil size={16} />
        </IconButton>
        <IconButton className="danger" label="Delete task card" onClick={() => onDelete(card.id)}>
          <Trash2 size={16} />
        </IconButton>
      </div>
    </article>
  )
}

function ListColumn({
  cards,
  detailsCardId,
  editingListId,
  index,
  list,
  onCreateCard,
  onDeleteList,
  onDelete,
  onEdit,
  onRenameList,
  onStartEditList,
  onMove,
  onReorder,
  onReorderList,
  onSaveOrder,
  onSaveListOrder,
  onToggleDetails,
  selectedBoard,
}) {
  const listRef = useRef(null)
  const listHandleRef = useRef(null)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [{ isOver }, dropRef] = useDrop({
    accept: [cardType, listType],
    hover: (draggedList, monitor) => {
      if (monitor.getItemType() !== listType || draggedList.id === list.id) {
        return
      }

      if (draggedList.index === index) {
        return
      }

      onReorderList(draggedList, index)
      draggedList.index = index
    },
    drop: (card, monitor) => {
      if (monitor.getItemType() !== cardType) {
        return
      }

      if (normalizeListId(card.listId) !== list.id) {
        onMove(card, list.id)
        onSaveOrder()
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })
  const [{ isDragging }, dragRef] = useDrag({
    type: listType,
    item: {
      id: list.id,
      index,
    },
    end: () => onSaveListOrder(),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const setListNode = (node) => {
    listRef.current = node
    dropRef(node)
  }

  const setListHandleNode = (node) => {
    listHandleRef.current = node
    dragRef(node)
  }

  return (
    <section
      ref={setListNode}
      className={`list-column ${isOver ? 'is-over' : ''}`}
      style={{ opacity: isDragging ? 0.62 : 1 }}
    >
      {editingListId === list.id ? (
        <form
          className="list-title-form"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            onRenameList(list.id, formData.get('name'))
          }}
        >
          <input
            aria-label={`Rename ${list.name}`}
            autoFocus
            defaultValue={list.name}
            name="name"
            onBlur={(event) => onRenameList(list.id, event.target.value)}
          />
        </form>
      ) : (
        <div className="list-title-row">
          <div className="list-title-main">
            <button
              type="button"
              aria-label={`Reorder ${list.name} list`}
              className="list-drag-handle"
              ref={setListHandleNode}
              title={`Drag ${list.name}`}
            >
              <GripVertical size={16} />
            </button>
            <h3>{list.name}</h3>
          </div>
          <div className="list-title-actions">
            <IconButton label={`Edit ${list.name} list`} onClick={() => onStartEditList(list.id)}>
              <Pencil size={15} />
            </IconButton>
            <IconButton className="danger" label={`Delete ${list.name} list`} onClick={() => onDeleteList(list.id)}>
              <Trash2 size={15} />
            </IconButton>
          </div>
        </div>
      )}
      {cards.length === 0 ? <p className="empty-list-copy">Drop cards here</p> : null}
      {cards.map((card, index) => (
        <BoardCard
          key={card.id}
          card={card}
          index={index}
          isOpen={detailsCardId === card.id}
          listId={list.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onMove={onMove}
          onReorder={onReorder}
          onSaveOrder={onSaveOrder}
          onToggleDetails={onToggleDetails}
          selectedBoard={selectedBoard}
        />
      ))}
      {isAddingCard ? (
        <form
          className="list-card-form"
          onSubmit={async (event) => {
            event.preventDefault()

            if (!newCardTitle.trim()) {
              return
            }

            await onCreateCard(list.id, newCardTitle)
            setNewCardTitle('')
            setIsAddingCard(false)
          }}
        >
          <input
            aria-label={`New task card in ${list.name}`}
            autoFocus
            placeholder="Task card title"
            value={newCardTitle}
            onChange={(event) => setNewCardTitle(event.target.value)}
          />
          <div className="form-actions">
            <button type="submit">
              <Plus size={15} />
              Add task card
            </button>
            <IconButton
              label="Cancel new task card"
              onClick={() => {
                setNewCardTitle('')
                setIsAddingCard(false)
              }}
            >
              <X size={15} />
            </IconButton>
          </div>
        </form>
      ) : (
        <button type="button" className="list-add-card-button" onClick={() => setIsAddingCard(true)}>
          <Plus size={15} />
          Add task card
        </button>
      )}
    </section>
  )
}

export function CardManager({
  isAuthenticated,
  onBoardsChange,
  selectedBoard,
}) {
  const [cards, setCards] = useState([])
  const [detailsCard, setDetailsCard] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingListId, setEditingListId] = useState('')
  const [listForm, setListForm] = useState({ name: '' })
  const [selectedCardId, setSelectedCardId] = useState('')
  const cardsRef = useRef([])
  const listsRef = useRef([])

  const orderedCards = sortCardsByPosition(cards)

  useEffect(() => {
    cardsRef.current = cards
  }, [cards])

  useEffect(() => {
    listsRef.current = selectedBoard?.lists || []
  }, [selectedBoard])

  const loadCards = async () => {
    if (!isAuthenticated) {
      setCards([])
      setDetailsCard(null)
      return
    }

    if (!selectedBoard) {
      setCards([])
      setDetailsCard(null)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const nextCards = await cardApi.getBoardCards(selectedBoard.id)

      setCards(applyListPositions(sortCardsByPosition(nextCards)))
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
        setCards([])
        setDetailsCard(null)
        return
      }

      if (!selectedBoard) {
        setCards([])
        setDetailsCard(null)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const nextCards = await cardApi.getBoardCards(selectedBoard.id)

        if (isMounted) {
          setCards(applyListPositions(sortCardsByPosition(nextCards)))
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

  const handleMoveCard = async (card, listId) => {
    if (!listId || normalizeListId(card.listId) === listId) {
      return
    }

    try {
      await cardApi.updateBoardCard(selectedBoard.id, card.id, {
        description: card.description || '',
        label: card.label || 'General',
        listId,
        position: cards.filter((item) => normalizeListId(item.listId) === listId).length,
        title: card.title,
      })
      await loadCards()
      if (detailsCard?.id === card.id) {
        setDetailsCard(await cardApi.getBoardCard(selectedBoard.id, card.id))
      }
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
      const insertIndex = insertBeforeCard
        ? remainingCards.findIndex((card) => card.id === insertBeforeCard.id)
        : remainingCards.length
      const nextCards = [...remainingCards]

      nextCards.splice(insertIndex, 0, movingCard)

      return applyListPositions(nextCards)
    })
  }

  const handleSaveCardOrder = async () => {
    try {
      await Promise.all(
        cardsRef.current.map((card) =>
          cardApi.updateBoardCard(selectedBoard.id, card.id, {
            description: card.description || '',
            label: card.label || 'General',
            listId: normalizeListId(card.listId),
            position: Number.isFinite(card.position) ? card.position : 0,
            title: card.title,
          }),
        ),
      )
    } catch (err) {
      setError(err.message)
      await loadCards()
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

  return (
    <section className="board-workspace" aria-labelledby="assigned-title">
      <div className="board-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 id="assigned-title">
            {selectedBoard ? selectedBoard.name : 'No board open'}
          </h2>
          {selectedBoard ? <p>{selectedBoard.description || 'Assignments live inside this board.'}</p> : null}
        </div>
        {isAuthenticated && selectedBoard ? (
          <div className="board-header-actions">
            <form className="list-create-form" onSubmit={handleCreateList}>
              <input
                aria-label="List name"
                placeholder="New list"
                value={listForm.name}
                onChange={(event) => setListForm({ name: event.target.value })}
              />
              <button type="submit">
                <Plus size={15} />
                Create list
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to list, create, edit, and delete assignments.</p>
      ) : !selectedBoard ? (
        <div className="empty-board-state">
          <h3>Create or open a board</h3>
          <p>Use the switch board bar above to choose a board or create a new one.</p>
        </div>
      ) : (
        <>
          {error ? <p className="inline-error">{error}</p> : null}
          <div className="assigned-list card-listing" aria-live="polite">
            {isLoading ? <p>Loading cards...</p> : null}
            {!isLoading && cards.length === 0 ? <p>No assignments in this board yet.</p> : null}
            <div className="list-board">
              {selectedBoard.lists.map((list, index) => (
                <ListColumn
                  key={list.id}
                  cards={orderedCards.filter((card) => normalizeListId(card.listId) === list.id)}
                  detailsCardId={detailsCard?.id}
                  editingListId={editingListId}
                  index={index}
                  list={list}
                  onCreateCard={handleCreateCardInList}
                  onDeleteList={handleDeleteList}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onRenameList={handleRenameList}
                  onStartEditList={setEditingListId}
                  onMove={handleMoveCard}
                  onReorder={handleReorderCard}
                  onReorderList={handleReorderList}
                  onSaveOrder={handleSaveCardOrder}
                  onSaveListOrder={handleSaveListOrder}
                  onToggleDetails={handleToggleDetails}
                  selectedBoard={selectedBoard}
                />
              ))}
            </div>
          </div>

          {detailsCard ? (
            <div
              className="task-card-screen"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setDetailsCard(null)
                }
              }}
            >
              <article
                aria-labelledby="task-card-title"
                aria-modal="true"
                className="card-details"
                role="dialog"
              >
                <div className="card-details-header">
                  <div>
                    <p className="eyebrow">Task card</p>
                    <h3 id="task-card-title">{detailsCard.title}</h3>
                  </div>
                  <IconButton
                    label="Close task card"
                    onClick={() => {
                      setDetailsCard(null)
                    }}
                  >
                    <X size={17} />
                  </IconButton>
                </div>
                <dl>
                  <div>
                    <dt>Board block</dt>
                    <dd>{getListName(selectedBoard.lists, detailsCard.listId, detailsCard.listName)}</dd>
                  </div>
                  <div>
                    <dt>Label</dt>
                    <dd>{detailsCard.label}</dd>
                  </div>
                  <div>
                    <dt>Description</dt>
                    <dd>{detailsCard.description || 'No description'}</dd>
                  </div>
                </dl>
                <TaskBoard
                  boardId={selectedBoard.id}
                  cardId={detailsCard.id}
                />
              </article>
            </div>
          ) : null}
          {isEditing ? (
            <div
              className="task-card-screen"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  resetForm()
                }
              }}
            >
              <article
                aria-labelledby="edit-task-card-title"
                aria-modal="true"
                className="card-details edit-card-dialog"
                role="dialog"
              >
                <div className="card-details-header">
                  <div>
                    <p className="eyebrow">Task card</p>
                    <h3 id="edit-task-card-title">Edit task card</h3>
                  </div>
                  <IconButton label="Close editor" onClick={resetForm}>
                    <X size={17} />
                  </IconButton>
                </div>
                <form className="card-form card-composer-panel" onSubmit={handleEditSubmit}>
                  <input
                    aria-label="Task card title"
                    name="title"
                    placeholder="Task card title"
                    value={form.title}
                    onChange={handleChange}
                  />
                  <input
                    aria-label="Card label"
                    name="label"
                    placeholder="Label"
                    value={form.label}
                    onChange={handleChange}
                  />
                  <select
                    aria-label="List"
                    name="listId"
                    value={form.listId}
                    onChange={handleChange}
                  >
                    {selectedBoard.lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    aria-label="Card description"
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                  />
                  <div className="form-actions">
                    <button type="submit">Save task card</button>
                    <IconButton label="Cancel editing task card" onClick={resetForm}>
                      <X size={15} />
                    </IconButton>
                  </div>
                </form>
              </article>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
