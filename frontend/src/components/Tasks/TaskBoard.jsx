import { useEffect, useState } from 'react'
import { socket } from '../../services/realtime'
import { taskApi } from '../../services/taskApi'

const statuses = [
  { id: 'icebox', name: 'Icebox' },
  { id: 'backlog', name: 'Backlog' },
  { id: 'on-going', name: 'On going' },
  { id: 'waiting-review', name: 'Waiting for review' },
  { id: 'done', name: 'Done' },
]

const priorities = ['low', 'medium', 'high', 'urgent']

const emptyTaskForm = {
  assigneeId: '',
  deadline: '',
  description: '',
  priority: 'medium',
  status: 'icebox',
  title: '',
}

const getStatusName = (statusId) =>
  statuses.find((status) => status.id === statusId)?.name || 'Icebox'

function TaskCard({ task, onDelete, onEdit, onMove }) {
  return (
    <article className="task-item">
      <div className="task-item-header">
        <strong>{task.title}</strong>
        <span className="task-priority-badge">{task.priority}</span>
      </div>
      {task.description ? <p>{task.description}</p> : null}
      <dl>
        <div>
          <dt>Status</dt>
          <dd>{getStatusName(task.status)}</dd>
        </div>
        <div>
          <dt>Assignee</dt>
          <dd>{task.assigneeId || 'Unassigned'}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{task.deadline || 'No deadline'}</dd>
        </div>
      </dl>
      <label className="move-card-control">
        Status
        <select value={task.status} onChange={(event) => onMove(task, event.target.value)}>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </label>
      <div className="card-actions">
        <button type="button" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(task.id)}>
          Delete
        </button>
      </div>
    </article>
  )
}

export function TaskBoard({
  boardId,
  cardId,
  onTasksChange,
}) {
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyTaskForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [tasks, setTasks] = useState([])

  const loadTasks = async () => {
    setIsLoading(true)
    setError('')

    try {
      setTasks(await taskApi.getTasks(boardId, cardId))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.resolve().then(async () => {
      setIsLoading(true)
      setError('')

      try {
        const nextTasks = await taskApi.getTasks(boardId, cardId)

        if (isMounted) {
          setTasks(nextTasks)
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

    socket.connect()
    socket.emit('tasks:join', { boardId, cardId })
    socket.on('tasks:changed', (payload) => {
      if (payload.boardId === boardId && payload.cardId === cardId) {
        setTasks(payload.tasks)
        onTasksChange?.()
      }
    })

    return () => {
      isMounted = false
      socket.emit('tasks:leave', { boardId, cardId })
      socket.off('tasks:changed')
    }
  }, [boardId, cardId, onTasksChange])

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const resetForm = () => {
    setForm(emptyTaskForm)
    setIsEditing(false)
    setSelectedTaskId('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    try {
      if (isEditing) {
        await taskApi.updateTask(boardId, cardId, selectedTaskId, form)
      } else {
        await taskApi.createTask(boardId, cardId, form)
      }

      resetForm()
      await loadTasks()
      onTasksChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (task) => {
    setForm({
      assigneeId: task.assigneeId || '',
      deadline: task.deadline || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'icebox',
      title: task.title,
    })
    setIsEditing(true)
    setSelectedTaskId(task.id)
  }

  const handleDelete = async (taskId) => {
    try {
      await taskApi.deleteTask(boardId, cardId, taskId)
      await loadTasks()
      onTasksChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleMove = async (task, status) => {
    if (!task?.id || task.status === status) {
      return
    }

    try {
      await taskApi.updateTask(boardId, cardId, task.id, {
        assigneeId: task.assigneeId || '',
        deadline: task.deadline || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status,
        title: task.title,
      })
      await loadTasks()
      onTasksChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="task-board" aria-labelledby="task-board-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Task card</p>
          <h3 id="task-board-title">Tasks in this card</h3>
        </div>
        {isLoading ? <span>Loading</span> : <span>{tasks.length} tasks</span>}
      </div>

      {error ? <p className="inline-error">{error}</p> : null}

      {isEditing ? (
        <form className="task-form task-composer-card" onSubmit={handleSubmit}>
          <label>
            Task
            <input
              aria-label="Task title"
              name="title"
              placeholder="Task title"
              value={form.title}
              onChange={handleChange}
            />
          </label>
          <label>
            Status
            <select
              aria-label="Task status"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              aria-label="Task priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assignee
            <input
              aria-label="Task assignee"
              name="assigneeId"
              placeholder="Display name or user id"
              value={form.assigneeId}
              onChange={handleChange}
            />
          </label>
          <label>
            Deadline
            <input
              aria-label="Task deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
            />
          </label>
          <label>
            Details
            <textarea
              aria-label="Task description"
              name="description"
              placeholder="Task details"
              value={form.description}
              onChange={handleChange}
            />
          </label>
          <div className="form-actions">
            <button type="submit">{isEditing ? 'Save task' : 'Create task'}</button>
            <button
              type="button"
              onClick={() => {
                resetForm()
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="task-list">
        {tasks.length === 0 ? <p className="empty-list-copy">No tasks in this card yet.</p> : null}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onMove={handleMove}
          />
        ))}
      </div>
    </section>
  )
}
