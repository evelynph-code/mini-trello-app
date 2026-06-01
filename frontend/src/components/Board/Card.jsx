import { findMemberById } from '../../utils/board'

export function Card({ card, columns, currentColumnId, members, onMove }) {
  const assignee = findMemberById(members, card.assigneeId)
  const moveTargets = columns.filter((column) => column.id !== currentColumnId)

  return (
    <article className="task-card">
      <div className="card-meta">
        <span>{card.label}</span>
        {assignee ? <strong title={assignee.name}>{assignee.initials}</strong> : null}
      </div>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <select
        aria-label={`Move ${card.title}`}
        value=""
        onChange={(event) => onMove(card.id, event.target.value)}
      >
        <option value="" disabled>
          Move to...
        </option>
        {moveTargets.map((column) => (
          <option key={column.id} value={column.id}>
            {column.title}
          </option>
        ))}
      </select>
    </article>
  )
}
