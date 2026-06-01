import { Card } from './Card'
import { CardComposer } from './CardComposer'

export function Column({ column, columns, members, onCreateCard, onMoveCard }) {
  return (
    <section className="board-column" aria-labelledby={`${column.id}-title`}>
      <div className="column-header">
        <h2 id={`${column.id}-title`}>{column.title}</h2>
        <span>{column.cards.length}</span>
      </div>
      <div className="card-list">
        {column.cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            columns={columns}
            currentColumnId={column.id}
            members={members}
            onMove={onMoveCard}
          />
        ))}
      </div>
      <CardComposer
        members={members}
        onCreate={(card) => onCreateCard(column.id, card)}
      />
    </section>
  )
}
