import { Column } from './Column'

export function Board({ board, onCreateCard, onMoveCard }) {
  return (
    <section id="cards" className="board-page" aria-labelledby="cards-title">
      <section className="board-intro">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 id="cards-title">{board.title}</h2>
          <p>{board.description}</p>
        </div>
        <div className="member-strip" aria-label="Board members">
          {board.members.map((member) => (
            <span key={member.id} title={member.name}>
              {member.initials}
            </span>
          ))}
        </div>
      </section>

      <section className="board-grid" aria-label="Board columns">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            columns={board.columns}
            members={board.members}
            onCreateCard={onCreateCard}
            onMoveCard={onMoveCard}
          />
        ))}
      </section>
    </section>
  )
}
