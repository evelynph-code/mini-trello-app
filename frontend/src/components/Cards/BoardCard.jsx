import { useRef } from 'react'
import { ListChecks, Pencil, Trash2 } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import { IconButton } from './IconButton'
import { cardType, getListName } from './cardUtils'

export function BoardCard({
  card,
  index,
  isOpen,
  listId,
  onDelete,
  onEdit,
  onReorder,
  onSaveOrder,
  onToggleDetails,
  selectedBoard,
}) {
  const cardRef = useRef(null)
  const pointerStartRef = useRef(null)
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

  const handleCardClick = (event) => {
    if (event.defaultPrevented) {
      return
    }

    const pointerStart = pointerStartRef.current

    if (pointerStart) {
      const movement = Math.abs(event.clientX - pointerStart.x) + Math.abs(event.clientY - pointerStart.y)

      if (movement > 6) {
        return
      }
    }

    onToggleDetails(card.id)
  }

  const handleActionClick = (event) => {
    event.stopPropagation()
  }

  return (
    <article
      ref={setCardNode}
      aria-label={`${isOpen ? 'Close' : 'Open'} ${card.title} task card`}
      className={`board-task-card ${isOpen ? 'is-open' : ''}`}
      role="button"
      tabIndex={0}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggleDetails(card.id)
        }
      }}
      onMouseDown={(event) => {
        pointerStartRef.current = {
          x: event.clientX,
          y: event.clientY,
        }
      }}
    >
      <div className="board-task-card-meta">
        <span className="board-task-list-name">
          {getListName(selectedBoard.lists, card.listId, card.listName)}
        </span>
        <span className="task-count-badge">
          <ListChecks size={14} />
          {card.taskCount || 0} {(card.taskCount || 0) === 1 ? 'task' : 'tasks'} remain
        </span>
      </div>
      <strong>{card.title}</strong>
      <p>{card.description || 'No description'}</p>
      <div className="card-actions" onClick={handleActionClick} onKeyDown={handleActionClick}>
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
