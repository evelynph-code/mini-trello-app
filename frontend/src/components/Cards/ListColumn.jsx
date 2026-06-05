import { useRef, useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import { BoardCard } from './BoardCard'
import { IconButton } from './IconButton'
import { cardType, listType, normalizeListId } from './cardUtils'

export function ListColumn({
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
  onStartOrder,
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

      if (!monitor.isOver({ shallow: true })) {
        return
      }

      const targetIndex = normalizeListId(card.listId) === list.id
        ? Math.max(cards.length - 1, 0)
        : cards.length

      onReorder(card, list.id, targetIndex)
      card.listId = list.id
      card.index = targetIndex
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
      {cards.length === 0 ? (
        <div className="empty-list-copy rich-empty-state">
          <strong>No cards</strong>
          <span>Drop one here or add a new card below.</span>
        </div>
      ) : null}
      {cards.map((card, cardIndex) => (
        <BoardCard
          key={card.id}
          card={card}
          index={cardIndex}
          isOpen={detailsCardId === card.id}
          listId={list.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onReorder={onReorder}
          onSaveOrder={onSaveOrder}
          onStartOrder={onStartOrder}
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
