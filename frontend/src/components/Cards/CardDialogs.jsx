import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { CommentActivityPanel } from '../Tasks/CommentActivityPanel'
import { TaskBoard } from '../Tasks/TaskBoard'
import { IconButton } from './IconButton'
import { getListName } from './cardUtils'

export function CardDetailsDialog({ card, currentUser, onClose, onTasksChange, selectedBoard }) {
  return createPortal(
    <div
      className="task-card-screen"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
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
            <h3 id="task-card-title">{card.title}</h3>
            <p>{card.description || 'No description'}</p>
          </div>
          <IconButton label="Close task card" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
        <dl className="card-details-meta">
          <div>
            <dt>Board block</dt>
            <dd>{getListName(selectedBoard.lists, card.listId, card.listName)}</dd>
          </div>
          <div>
            <dt>Label</dt>
            <dd>{card.label}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{card.description || 'No description'}</dd>
          </div>
        </dl>
        <TaskBoard
          boardId={selectedBoard.id}
          cardId={card.id}
          currentUser={currentUser}
          onTasksChange={onTasksChange}
          selectedBoard={selectedBoard}
        />
        <CommentActivityPanel boardId={selectedBoard.id} cardId={card.id} />
      </article>
    </div>,
    document.body,
  )
}

export function EditCardDialog({
  form,
  onChange,
  onClose,
  onSubmit,
  selectedBoard,
}) {
  return createPortal(
    <div
      className="task-card-screen"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
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
          <IconButton label="Close editor" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
        <form className="card-form card-composer-panel" onSubmit={onSubmit}>
          <input
            aria-label="Task card title"
            name="title"
            placeholder="Task card title"
            value={form.title}
            onChange={onChange}
          />
          <input
            aria-label="Card label"
            name="label"
            placeholder="Label"
            value={form.label}
            onChange={onChange}
          />
          <select
            aria-label="List"
            name="listId"
            value={form.listId}
            onChange={onChange}
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
            onChange={onChange}
          />
          <div className="form-actions">
            <button type="submit">Save task card</button>
            <IconButton label="Cancel editing task card" onClick={onClose}>
              <X size={15} />
            </IconButton>
          </div>
        </form>
      </article>
    </div>,
    document.body,
  )
}
