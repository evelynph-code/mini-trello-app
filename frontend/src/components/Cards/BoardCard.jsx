import { useRef } from 'react'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import { IconButton } from './IconButton'
import { cardType, getListName, normalizeListId } from './cardUtils'

export function BoardCard({
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
