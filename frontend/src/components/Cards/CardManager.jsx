import { useEffect, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { TaskBoard } from '../Tasks/TaskBoard'
import { cardApi } from '../../services/cardApi'

const cardType = 'board-card'

const emptyForm = {
  description: '',
  label: 'General',
  listId: 'backlog',
  title: '',
}

const normalizeListId = (listId) => (listId === 'planning' ? 'backlog' : listId)

const normalizeListName = (listName) => (listName === 'Planning' ? 'Backlog' : listName)

function BoardCard({
  card,
  isOpen,
  onDelete,
  onEdit,
  onMove,
  onToggleDetails,
  selectedBoard,
}) {
  const [{ isDragging }, dragRef] = useDrag({
    type: cardType,
    item: card,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  return (
    <article ref={dragRef} className="board-task-card" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <span>{normalizeListName(card.listName)}</span>
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
        <button type="button" onClick={() => onToggleDetails(card.id)}>
          {isOpen ? 'Close task card' : 'Open task card'}
        </button>
        <button type="button" onClick={() => onEdit(card)}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(card.id)}>
          Delete
        </button>
      </div>
    </article>
  )
}

function ListColumn({
  cards,
  detailsCardId,
  list,
  onDelete,
  onEdit,
  onMove,
  onToggleDetails,
  selectedBoard,
}) {
  const [{ isOver }, dropRef] = useDrop({
    accept: cardType,
    drop: (card) => {
      if (normalizeListId(card.listId) !== list.id) {
        onMove(card, list.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  return (
    <section ref={dropRef} className={`list-column ${isOver ? 'is-over' : ''}`}>
      <h3>{list.name}</h3>
      {cards.length === 0 ? <p className="empty-list-copy">Drop cards here</p> : null}
      {cards.map((card) => (
        <BoardCard
          key={card.id}
          card={card}
          isOpen={detailsCardId === card.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onMove={onMove}
          onToggleDetails={onToggleDetails}
          selectedBoard={selectedBoard}
        />
      ))}
    </section>
  )
}

export function CardManager({
  boards,
  isAuthenticated,
  selectedBoard,
  onSelectBoard,
}) {
  const [cards, setCards] = useState([])
  const [detailsCard, setDetailsCard] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState('')

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
      setCards(await cardApi.getBoardCards(selectedBoard.id))
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
          setCards(nextCards)
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    try {
      if (isEditing) {
        await cardApi.updateBoardCard(selectedBoard.id, selectedCardId, form)
      } else {
        await cardApi.createBoardCard(selectedBoard.id, form)
      }

      resetForm()
      setIsComposerOpen(false)
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
      listId: normalizeListId(card.listId || 'backlog'),
      title: card.title,
    })
    setIsComposerOpen(true)
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

  const handleMoveCard = async (card, listId) => {
    if (!listId || normalizeListId(card.listId) === listId) {
      return
    }

    try {
      await cardApi.updateBoardCard(selectedBoard.id, card.id, {
        description: card.description || '',
        label: card.label || 'General',
        listId,
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

  return (
    <section className="board-workspace" aria-labelledby="assigned-title">
      <div className="board-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 id="assigned-title">
            {selectedBoard ? selectedBoard.name : 'No board open'}
          </h2>
          {selectedBoard ? <p>{selectedBoard.description || 'Cards live inside this board.'}</p> : null}
        </div>
        {isAuthenticated && selectedBoard ? (
          <button type="button" onClick={() => setIsComposerOpen((value) => !value)}>
            {isComposerOpen ? 'Close composer' : 'Create card'}
          </button>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to list, create, edit, and delete board cards.</p>
      ) : !selectedBoard ? (
        <div className="empty-board-state">
          <h3>Create or open a board</h3>
          <p>Use the switch board bar above to choose a board or create a new one.</p>
        </div>
      ) : (
        <>
          {error ? <p className="inline-error">{error}</p> : null}
          {isComposerOpen ? (
            <form className="card-form card-composer-panel" onSubmit={handleSubmit}>
              {boards.length > 0 ? (
                <select
                  aria-label="Board"
                  value={selectedBoard.id}
                  onChange={(event) => {
                    const nextBoard = boards.find((board) => board.id === event.target.value)

                    if (nextBoard) {
                      onSelectBoard(nextBoard.id)
                    }
                  }}
                >
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                aria-label="Card title"
                name="title"
                placeholder="Card title"
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
                <button type="submit">{isEditing ? 'Save card' : 'Create card'}</button>
                {isEditing ? (
                  <button type="button" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div className="assigned-list card-listing" aria-live="polite">
            {isLoading ? <p>Loading cards...</p> : null}
            {!isLoading && cards.length === 0 ? <p>No cards in this board yet.</p> : null}
            <div className="list-board">
              {selectedBoard.lists.map((list) => (
                <ListColumn
                  key={list.id}
                  cards={cards.filter((card) => normalizeListId(card.listId) === list.id)}
                  detailsCardId={detailsCard?.id}
                  list={list}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onMove={handleMoveCard}
                  onToggleDetails={handleToggleDetails}
                  selectedBoard={selectedBoard}
                />
              ))}
            </div>
          </div>

          {detailsCard ? (
            <article className="card-details">
              <p className="eyebrow">Task card</p>
              <h3>{detailsCard.title}</h3>
              <dl>
                <div>
                  <dt>Column</dt>
                  <dd>{normalizeListName(detailsCard.listName)}</dd>
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
              <TaskBoard boardId={selectedBoard.id} cardId={detailsCard.id} />
            </article>
          ) : null}
        </>
      )}
    </section>
  )
}
