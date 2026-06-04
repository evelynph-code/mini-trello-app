import { CalendarDays, Flag, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { socket } from '../../services/realtime'
import { taskApi } from '../../services/taskApi'
import { usersApi } from '../../services/usersApi'
import { IconButton } from '../Cards/IconButton'

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
  reviewerId: '',
  status: 'icebox',
  title: '',
}

const getStatusName = (statusId) =>
  statuses.find((status) => status.id === statusId)?.name || 'Icebox'

const formatDeadline = (deadline) => {
  if (!deadline) {
    return 'No deadline'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${deadline}T00:00:00`))
}

const getDeadlineState = (deadline, status) => {
  if (!deadline || status === 'done') {
    return { className: 'deadline-empty', label: deadline ? 'Completed' : 'No deadline' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deadlineDate = new Date(`${deadline}T00:00:00`)
  const dayDifference = Math.round((deadlineDate - today) / 86400000)

  if (dayDifference < 0) {
    return { className: 'deadline-overdue', label: 'Overdue' }
  }

  if (dayDifference === 0) {
    return { className: 'deadline-today', label: 'Due today' }
  }

  if (dayDifference <= 2) {
    return { className: 'deadline-soon', label: 'Due soon' }
  }

  return { className: 'deadline-scheduled', label: 'Scheduled' }
}

function TaskCard({ canDelete, canEdit, members, task, onDelete, onEdit, onMove }) {
  const deadlineState = getDeadlineState(task.deadline, task.status)
  const [nextStatus, setNextStatus] = useState(task.status || 'icebox')
  const [reviewerId, setReviewerId] = useState(task.reviewerId || '')
  const isWaitingForReview = nextStatus === 'waiting-review'
  const didChangeStatus = nextStatus !== (task.status || 'icebox')
  const didChangeReviewer = reviewerId !== (task.reviewerId || '')
  const canApplyMove = didChangeStatus || (isWaitingForReview && didChangeReviewer)

  return (
    <article className="task-item">
      <div className="task-item-header">
        <strong>{task.title}</strong>
        <div className="task-badges">
          <span className={`task-status-badge status-${task.status || 'icebox'}`}>
            {getStatusName(task.status)}
          </span>
          <span className={`task-priority-badge priority-${task.priority || 'medium'}`}>
            {task.priority || 'medium'}
          </span>
        </div>
      </div>
      {task.description ? <p>{task.description}</p> : null}
      <dl>
        <div>
          <dt>
            <Flag size={13} />
            Status
          </dt>
          <dd>{getStatusName(task.status)}</dd>
        </div>
        <div>
          <dt>
            <UserRound size={13} />
            Assignee
          </dt>
          <dd>{task.assigneeName || task.assigneeId || 'Unassigned'}</dd>
        </div>
        <div>
          <dt>
            <UserRound size={13} />
            Owner
          </dt>
          <dd>{task.ownerName || task.ownerId || 'Unknown'}</dd>
        </div>
        {task.status === 'waiting-review' || task.reviewerId ? (
          <div>
            <dt>
              <UserRound size={13} />
              Reviewer
            </dt>
            <dd>{task.reviewerName || task.reviewerId || 'Unassigned'}</dd>
          </div>
        ) : null}
        <div>
          <dt>
            <CalendarDays size={13} />
            Deadline
          </dt>
          <dd>
            <span className={`deadline-pill ${deadlineState.className}`}>
              {deadlineState.label}
            </span>
            <span>{formatDeadline(task.deadline)}</span>
          </dd>
        </div>
      </dl>
      {canEdit ? (
        <>
          <div className="task-review-controls">
            <label className="move-card-control">
              Status
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
            {isWaitingForReview ? (
              <label className="move-card-control">
                Reviewer
                <select value={reviewerId} onChange={(event) => setReviewerId(event.target.value)}>
                  <option value="">Choose reviewer</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username ? `${member.name} (@${member.username})` : member.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {canApplyMove ? (
              <button
                type="button"
                className="details-button task-apply-review"
                disabled={isWaitingForReview && !reviewerId}
                onClick={() => onMove(task, nextStatus, isWaitingForReview ? reviewerId : '')}
              >
                Apply
              </button>
            ) : null}
          </div>
          <div className="card-actions">
            <IconButton label="Edit task" onClick={() => onEdit(task)}>
              <Pencil size={16} />
            </IconButton>
            {canDelete ? (
              <IconButton className="danger" label="Delete task" onClick={() => onDelete(task.id)}>
                <Trash2 size={16} />
              </IconButton>
            ) : null}
          </div>
        </>
      ) : null}
    </article>
  )
}

export function TaskBoard({
  boardId,
  cardId,
  currentUser,
  onTasksChange,
  selectedBoard,
}) {
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyTaskForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [tasks, setTasks] = useState([])
  const memberIds = useMemo(
    () => selectedBoard?.memberIds || [selectedBoard?.ownerId].filter(Boolean),
    [selectedBoard],
  )

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

  useEffect(() => {
    let isMounted = true

    Promise.resolve().then(async () => {
      if (!selectedBoard) {
        setMembers([])
        return
      }

      try {
        const users = await usersApi.getUsers()

        if (isMounted) {
          setMembers(users.filter((user) => memberIds.includes(user.id)))
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      }
    })

    return () => {
      isMounted = false
    }
  }, [selectedBoard, memberIds])

  const canEditTask = (task) =>
    task.ownerId === currentUser?.id ||
    task.assigneeId === currentUser?.id ||
    task.reviewerId === currentUser?.id ||
    (!task.ownerId && selectedBoard?.ownerId === currentUser?.id)

  const canDeleteTask = (task) =>
    task.ownerId === currentUser?.id ||
    task.assigneeId === currentUser?.id ||
    (!task.ownerId && selectedBoard?.ownerId === currentUser?.id)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'status' && value !== 'waiting-review' ? { reviewerId: '' } : {}),
    }))
  }

  const resetForm = () => {
    setForm(emptyTaskForm)
    setIsFormOpen(false)
    setIsEditing(false)
    setSelectedTaskId('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      return
    }

    if (form.status === 'waiting-review' && !form.reviewerId) {
      setError('Choose a reviewer before moving this task to waiting for review.')
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
      reviewerId: task.reviewerId || '',
      status: task.status || 'icebox',
      title: task.title,
    })
    setIsEditing(true)
    setIsFormOpen(true)
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

  const handleMove = async (task, status, reviewerId = '') => {
    const nextReviewerId = status === 'waiting-review' ? reviewerId : ''

    if (!task?.id || (task.status === status && (task.reviewerId || '') === nextReviewerId)) {
      return
    }

    if (status === 'waiting-review' && !nextReviewerId) {
      setError('Choose a reviewer before moving this task to waiting for review.')
      return
    }

    try {
      await taskApi.updateTask(boardId, cardId, task.id, {
        assigneeId: task.assigneeId || '',
        deadline: task.deadline || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        reviewerId: nextReviewerId,
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
        <div className="task-board-actions">
          {isLoading ? <span>Loading</span> : <span>{tasks.length} tasks</span>}
          {!isFormOpen ? (
            <button
              type="button"
              className="details-button"
              onClick={() => {
                setForm(emptyTaskForm)
                setIsEditing(false)
                setSelectedTaskId('')
                setIsFormOpen(true)
              }}
            >
              <Plus size={16} />
              Add task
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}

      {isFormOpen ? (
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
            <select
              aria-label="Task assignee"
              name="assigneeId"
              value={form.assigneeId}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username ? `${member.name} (@${member.username})` : member.name}
                </option>
              ))}
            </select>
          </label>
          {form.status === 'waiting-review' ? (
            <label>
              Reviewer
              <select
                aria-label="Task reviewer"
                name="reviewerId"
                value={form.reviewerId}
                onChange={handleChange}
              >
                <option value="">Choose reviewer</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username ? `${member.name} (@${member.username})` : member.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
              <X size={15} />
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="task-list">
        {tasks.length === 0 ? <p className="empty-list-copy">No tasks in this card yet.</p> : null}
        {tasks.map((task) => (
          <TaskCard
            canDelete={canDeleteTask(task)}
            canEdit={canEditTask(task)}
            key={`${task.id}-${task.status || 'icebox'}-${task.reviewerId || 'none'}`}
            members={members}
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
