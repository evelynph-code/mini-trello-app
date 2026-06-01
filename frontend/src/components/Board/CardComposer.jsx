import { useState } from 'react'

export function CardComposer({ members, onCreate }) {
  const [title, setTitle] = useState('')
  const [label, setLabel] = useState('General')
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || '')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    onCreate({
      title: title.trim(),
      description: 'New card added from the board UI.',
      label,
      assigneeId,
    })
    setTitle('')
  }

  return (
    <form className="card-composer" onSubmit={handleSubmit}>
      <input
        aria-label="Card title"
        placeholder="Add a card"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="composer-row">
        <select
          aria-label="Card label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        >
          <option>General</option>
          <option>Design</option>
          <option>Frontend</option>
          <option>Backend</option>
          <option>Planning</option>
        </select>
        <select
          aria-label="Assignee"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">Add</button>
    </form>
  )
}
