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
  onStartOrder,
  onToggleDetails,
  selectedBoard,
}) {
  const cardRef = useRef(null)
  const pointerStartRef = useRef(null)
  const [, dropRef] = useDrop({
    accept: cardType,
    hover: (draggedCard, monitor) => {
      if (!cardRef.current || draggedCard.id === card.id) {
        return
      }

      if (draggedCard.listId === listId && draggedCard.index === index) {
        return
      }

      if (draggedCard.listId === listId) {
        const hoverRect = cardRef.current.getBoundingClientRect()
        const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
        const pointerOffset = monitor.getClientOffset()

        if (!pointerOffset) {
          return
        }

        const hoverClientY = pointerOffset.y - hoverRect.top

        if (draggedCard.index < index && hoverClientY < hoverMiddleY) {
          return
        }

        if (draggedCard.index > index && hoverClientY > hoverMiddleY) {
          return
        }
      }

      onReorder(draggedCard, listId, index)
      draggedCard.index = index
      draggedCard.listId = listId
    },
  })

  const [{ isDragging }, dragRef] = useDrag({
    type: cardType,
    item: () => {
      onStartOrder()

      return {
        ...card,
        index,
        listId,
      }
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
      <strong>{card.title}</strong>
      <p>{card.description || 'No description'}</p>
      <div className="board-task-card-meta">
        <span className="board-task-list-name">
          {getListName(selectedBoard.lists, card.listId, card.listName)}
        </span>
        <span className="task-count-badge">
          <ListChecks size={14} />
          {card.taskCount || 0} {(card.taskCount || 0) === 1 ? 'task' : 'tasks'} remain
        </span>
      </div>
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
