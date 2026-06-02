import { MessageSquare, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cardDetailsApi } from '../../services/cardDetailsApi'
import { socket } from '../../services/realtime'

const formatEntryTime = (createdAt) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(createdAt || Date.now()))

export function CommentActivityPanel({ boardId, cardId }) {
  const [activities, setActivities] = useState([])
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const applyDetails = (details) => {
    setActivities(details.activities || [])
    setComments(details.comments || [])
  }

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
          {comments.length === 0 ? <p className="empty-list-copy">No comments yet.</p> : null}
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
          <h4>Activity</h4>
          {activities.length === 0 ? <p className="empty-list-copy">No activity yet.</p> : null}
          {activities.map((entry) => (
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
