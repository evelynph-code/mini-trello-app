import { MessageSquare, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cardDetailsApi } from '../../services/cardDetailsApi'
import { socket } from '../../services/realtime'

const formatEntryTime = (createdAt) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(createdAt || Date.now()))

const activityFilters = [
  { id: 'all', label: 'All', matches: () => true },
  { id: 'tasks', label: 'Tasks', matches: (entry) => entry.type?.startsWith('task-') },
  { id: 'status', label: 'Status', matches: (entry) => entry.type === 'task-completed' },
  { id: 'reviews', label: 'Reviews', matches: (entry) => entry.type === 'task-review-requested' },
  { id: 'comments', label: 'Comments', matches: (entry) => entry.type === 'comment' },
]

export function CommentActivityPanel({ boardId, cardId }) {
  const [activities, setActivities] = useState([])
  const [activityFilter, setActivityFilter] = useState('all')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const applyDetails = (details) => {
    setActivities(details.activities || [])
    setComments(details.comments || [])
  }

  const activityFilterCounts = useMemo(
    () =>
      Object.fromEntries(
        activityFilters.map((filter) => [
          filter.id,
          activities.filter((entry) => filter.matches(entry)).length,
        ]),
      ),
    [activities],
  )
  const activeFilter = activityFilters.find((filter) => filter.id === activityFilter) || activityFilters[0]
  const filteredActivities = activities.filter((entry) => activeFilter.matches(entry))

  useEffect(() => {
    let isMounted = true

    Promise.resolve().then(async () => {
      setIsLoading(true)
      setError('')

      try {
        const details = await cardDetailsApi.getDetails(boardId, cardId)

        if (isMounted) {
          applyDetails(details)
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

    const handleDetailsChanged = (payload) => {
      if (payload.boardId === boardId && payload.cardId === cardId) {
        applyDetails(payload)
      }
    }

    socket.connect()
    socket.emit('tasks:join', { boardId, cardId })
    socket.on('card-details:changed', handleDetailsChanged)

    return () => {
      isMounted = false
      socket.emit('tasks:leave', { boardId, cardId })
      socket.off('card-details:changed', handleDetailsChanged)
    }
  }, [boardId, cardId])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const body = comment.trim()

    if (!body) {
      return
    }

    try {
      await cardDetailsApi.addComment(boardId, cardId, body)
      setComment('')
      applyDetails(await cardDetailsApi.getDetails(boardId, cardId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="comment-activity-panel" aria-labelledby="comment-activity-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Comment and activity</p>
          <h3 id="comment-activity-title">Discussion</h3>
        </div>
        {isLoading ? <span>Loading</span> : <span>{activities.length} updates</span>}
      </div>

      {error ? <p className="inline-error">{error}</p> : null}

      <form className="comment-form" onSubmit={handleSubmit}>
        <label>
          Comment
          <textarea
            aria-label="Add comment"
            placeholder="Ask a question or leave an update"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        <button type="submit">
          <Send size={15} />
          Post comment
        </button>
      </form>

      <div className="comment-activity-grid">
        <section className="comments-list" aria-label="Comments">
          <h4>Comments</h4>
          {comments.length === 0 ? (
            <div className="empty-list-copy rich-empty-state">
              <strong>No comments yet</strong>
              <span>Start the discussion with a question, decision, or quick update.</span>
            </div>
          ) : null}
          {comments.map((entry) => (
            <article key={entry.id} className="comment-entry">
              <div>
                <strong>{entry.authorName}</strong>
                <time dateTime={new Date(entry.createdAt).toISOString()}>
                  {formatEntryTime(entry.createdAt)}
                </time>
              </div>
              <p>{entry.body}</p>
            </article>
          ))}
        </section>

        <section className="activity-list" aria-label="Activity">
          <div className="activity-header">
            <h4>Activity</h4>
            <div className="activity-filter-tabs" aria-label="Filter activity">
              {activityFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activityFilter === filter.id ? 'active' : ''}
                  onClick={() => setActivityFilter(filter.id)}
                >
                  {filter.label}
                  <span>{activityFilterCounts[filter.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>
          {filteredActivities.length === 0 ? (
            <div className="empty-list-copy rich-empty-state">
              <strong>{activities.length === 0 ? 'No activity yet' : 'Nothing in this filter'}</strong>
              <span>
                {activities.length === 0
                  ? 'Changes to tasks and comments will appear here.'
                  : 'Try another filter to see more updates.'}
              </span>
            </div>
          ) : null}
          {filteredActivities.map((entry) => (
            <article key={entry.id} className="activity-entry">
              <MessageSquare size={14} />
              <div>
                <p>{entry.message}</p>
                <time dateTime={new Date(entry.createdAt).toISOString()}>
                  {formatEntryTime(entry.createdAt)}
                </time>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  )
}
