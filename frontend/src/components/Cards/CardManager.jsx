import { useEffect, useState } from 'react'
import { cardApi } from '../../services/cardApi'

const emptyForm = {
  description: '',
  label: 'General',
  listId: 'planning',
  title: '',
}

const normalizeListId = (listId) => (listId === 'backlog' ? 'planning' : listId)

const normalizeListName = (listName) => (listName === 'Backlog' ? 'Planning' : listName)

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

  const handleEdit = (card) => {
    setForm({
      description: card.description || '',
      label: card.label || 'General',
      listId: normalizeListId(card.listId || 'planning'),
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
                <section key={list.id} className="list-column">
                  <h3>{list.name}</h3>
                  {cards
                    .filter((card) => normalizeListId(card.listId) === list.id)
                    .map((card) => (
                      <article key={card.id}>
                        <span>{normalizeListName(card.listName)}</span>
                        <strong>{card.title}</strong>
                        <p>{card.description || 'No description'}</p>
                        <label className="move-card-control">
                          Move to
                          <select
                            aria-label={`Move ${card.title}`}
                            value={normalizeListId(card.listId)}
                            onChange={(event) => handleMoveCard(card, event.target.value)}
                          >
                            {selectedBoard.lists.map((targetList) => (
                              <option key={targetList.id} value={targetList.id}>
                                {targetList.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="card-actions">
                          <button type="button" onClick={() => handleShowDetails(card.id)}>
                            Details
                          </button>
                          <button type="button" onClick={() => handleEdit(card)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(card.id)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                </section>
              ))}
            </div>
          </div>

          {detailsCard ? (
            <article className="card-details">
              <p className="eyebrow">Details</p>
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
            </article>
          ) : null}
        </>
      )}
    </section>
  )
}
