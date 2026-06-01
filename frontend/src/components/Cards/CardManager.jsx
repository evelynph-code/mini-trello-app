import { useEffect, useState } from 'react'
import { cardApi } from '../../services/cardApi'

const emptyForm = {
  description: '',
  label: 'General',
  listId: 'backlog',
  title: '',
}

export function CardManager({ boards, isAuthenticated, selectedBoard, onSelectBoard }) {
  const [cards, setCards] = useState([])
  const [detailsCard, setDetailsCard] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      listId: card.listId || 'backlog',
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

  return (
    <section className="assigned-panel card-manager" aria-labelledby="assigned-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">My cards</p>
          <h2 id="assigned-title">
            {isAuthenticated ? 'Board cards' : 'Sign in required'}
          </h2>
        </div>
        {isAuthenticated ? <span>{cards.length} cards</span> : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to list, create, edit, and delete board cards.</p>
      ) : !selectedBoard ? (
        <p>Create or open a board before adding cards.</p>
      ) : (
        <>
          <p className="selected-board-label">Open board: {selectedBoard.name}</p>
          {error ? <p className="inline-error">{error}</p> : null}
          <form className="card-form" onSubmit={handleSubmit}>
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

          <div className="assigned-list card-listing" aria-live="polite">
            {isLoading ? <p>Loading cards...</p> : null}
            {!isLoading && cards.length === 0 ? <p>No cards in this board yet.</p> : null}
            <div className="list-board">
              {selectedBoard.lists.map((list) => (
                <section key={list.id} className="list-column">
                  <h3>{list.name}</h3>
                  {cards
                    .filter((card) => card.listId === list.id)
                    .map((card) => (
                      <article key={card.id}>
                        <span>{card.listName}</span>
                        <strong>{card.title}</strong>
                        <p>{card.description || 'No description'}</p>
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
                  <dd>{detailsCard.listName}</dd>
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
