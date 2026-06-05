const boardRepository = require('../repositories/boardRepository')
const cardRepository = require('../repositories/cardRepository')
const invitationRepository = require('../repositories/invitationRepository')
const notificationRepository = require('../repositories/notificationRepository')
const taskRepository = require('../repositories/taskRepository')

const dayInMs = 24 * 60 * 60 * 1000

const formatInvitationNotification = (invitation) => ({
  ...invitation,
  actionable: true,
  message: `${invitation.inviterName} invited you to ${invitation.boardName}.`,
  title: 'Board invitation',
  type: 'board-invitation',
})

const getDueSoonNotifications = async (userId) => {
  const boards = await boardRepository.findBoardsByUserId(userId)
  const dueSoonGroups = await Promise.all(
    boards.map(async (board) => {
      const cards = await cardRepository.findCardsByBoardId(board.id)
      const tasks = await taskRepository.findTasksByAssigneeAcrossCards(
        board.id,
        cards.map((card) => card.id),
        userId,
      )

      return tasks
        .filter((task) => task.deadline && task.status !== 'done')
        .map((task) => {
          const dueDate = new Date(`${task.deadline}T00:00:00`)
          const today = new Date()

          today.setHours(0, 0, 0, 0)

          return {
            board,
            daysUntilDue: Math.round((dueDate - today) / dayInMs),
            task,
          }
        })
        .filter(({ daysUntilDue }) => daysUntilDue >= 0 && daysUntilDue <= 2)
        .map(({ board: taskBoard, daysUntilDue, task }) => ({
          boardId: taskBoard.id,
          boardName: taskBoard.name,
          cardId: task.cardId,
          createdAt: Date.now(),
          id: `due-soon-${taskBoard.id}-${task.cardId}-${task.id}`,
          message: formatTaskBoardMessage(
            task,
            taskBoard,
            daysUntilDue === 0
              ? 'due today'
              : `due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
          ),
          status: 'unread',
          taskId: task.id,
          taskTitle: task.title,
          title: 'Task nearly due',
          type: 'task-due-soon',
        }))
    }),
  )

  return dueSoonGroups.flat()
}

const getNotifications = async (userId) => {
  const [invitations, storedNotifications, dueSoonNotifications] = await Promise.all([
    invitationRepository.findPendingInvitationsByUserId(userId),
    notificationRepository.findUnreadNotificationsByUserId(userId),
    getDueSoonNotifications(userId),
  ])

  return [
    ...invitations.map(formatInvitationNotification),
    ...storedNotifications,
    ...dueSoonNotifications,
  ].sort((a, b) => b.createdAt - a.createdAt)
}

const formatTaskBoardMessage = (task, board, detail) =>
  `"${task.title}" in "${board.name}" ${detail}.`

const getBoardOwnerTaskDetail = ({ actor, task, type }) => {
  const actorName = actor.name || 'Someone'

  switch (type) {
    case 'board-task-created':
      return `created by ${actorName}`
    case 'board-task-status-changed':
      return `changed to ${task.status} by ${actorName}`
    case 'board-task-deleted':
      return `deleted by ${actorName}`
    case 'board-task-updated':
    default:
      return `updated by ${actorName}`
  }
}

const notifyTaskAssigned = async ({ actor, board, card, task }) => {
  if (!task.assigneeId || task.assigneeId === actor.id) {
    return null
  }

  return notificationRepository.createNotification({
    boardId: board.id,
    boardName: board.name,
    cardId: card.id,
    cardTitle: card.title,
    message: formatTaskBoardMessage(task, board, `assigned to you by ${actor.name || 'Someone'}`),
    taskId: task.id,
    taskTitle: task.title,
    title: 'Task assigned',
    type: 'task-assigned',
    userId: task.assigneeId,
  })
}

const notifyTaskAssignedByIds = async ({ actor, boardId, cardId, task }) => {
  const [board, card] = await Promise.all([
    boardRepository.findBoardById(boardId),
    cardRepository.findCardById(boardId, cardId),
  ])

  if (!board || !card) {
    return null
  }

  return notifyTaskAssigned({ actor, board, card, task })
}

const notifyTaskReviewRequested = async ({ actor, board, card, task }) => {
  if (!task.reviewerId || task.reviewerId === actor.id) {
    return null
  }

  return notificationRepository.createNotification({
    boardId: board.id,
    boardName: board.name,
    cardId: card.id,
    cardTitle: card.title,
    message: formatTaskBoardMessage(
      task,
      board,
      `waiting for your review from ${actor.name || 'Someone'}`,
    ),
    taskId: task.id,
    taskTitle: task.title,
    title: 'Review requested',
    type: 'task-review-requested',
    userId: task.reviewerId,
  })
}

const notifyTaskReviewRequestedByIds = async ({ actor, boardId, cardId, task }) => {
  const [board, card] = await Promise.all([
    boardRepository.findBoardById(boardId),
    cardRepository.findCardById(boardId, cardId),
  ])

  if (!board || !card) {
    return null
  }

  return notifyTaskReviewRequested({ actor, board, card, task })
}

const notifyBoardOwner = async ({ actor, board, card, message, task, title, type }) => {
  if (!board?.ownerId || board.ownerId === actor.id) {
    return null
  }

  return notificationRepository.createNotification({
    boardId: board.id,
    boardName: board.name,
    cardId: card?.id || null,
    cardTitle: card?.title || '',
    message: task
      ? formatTaskBoardMessage(task, board, getBoardOwnerTaskDetail({ actor, task, type }))
      : message,
    taskId: task?.id || null,
    taskTitle: task?.title || '',
    title,
    type,
    userId: board.ownerId,
  })
}

const notifyBoardOwnerByIds = async ({ actor, boardId, cardId, message, task, title, type }) => {
  const [board, card] = await Promise.all([
    boardRepository.findBoardById(boardId),
    cardId ? cardRepository.findCardById(boardId, cardId) : Promise.resolve(null),
  ])

  if (!board) {
    return null
  }

  return notifyBoardOwner({ actor, board, card, message, task, title, type })
}

const notifyTaskComment = async ({ actor, board, card, tasks }) => {
  const recipientIds = [
    ...new Set(
      tasks
        .flatMap((task) => [task.ownerId, task.assigneeId])
        .filter((userId) => userId && userId !== actor.id),
    ),
  ]

  return notificationRepository.createNotifications(
    recipientIds.map((userId) => ({
      boardId: board.id,
      boardName: board.name,
      cardId: card.id,
      cardTitle: card.title,
      message: `"${card.title}" in "${board.name}" commented on by ${actor.name || 'Someone'}.`,
      title: 'New task card comment',
      type: 'task-comment',
      userId,
    })),
  )
}

const notifyTaskCommentByIds = async ({ actor, boardId, cardId }) => {
  const [board, card, tasks] = await Promise.all([
    boardRepository.findBoardById(boardId),
    cardRepository.findCardById(boardId, cardId),
    taskRepository.findTasksByCardId(boardId, cardId),
  ])

  if (!board || !card) {
    return null
  }

  return notifyTaskComment({ actor, board, card, tasks })
}

const markNotificationRead = (notificationId, userId) =>
  notificationRepository.deleteNotificationForUser(notificationId, userId)

module.exports = {
  getNotifications,
  markNotificationRead,
  notifyBoardOwner,
  notifyBoardOwnerByIds,
  notifyTaskAssigned,
  notifyTaskAssignedByIds,
  notifyTaskComment,
  notifyTaskCommentByIds,
  notifyTaskReviewRequested,
  notifyTaskReviewRequestedByIds,
}
