export const summarizeTasks = (tasks) => {
  const activeTasks = tasks.filter((task) => task.status !== 'done')
  const dueTasks = activeTasks
    .filter((task) => task.deadline)
    .sort((firstTask, secondTask) => firstTask.deadline.localeCompare(secondTask.deadline))

  return {
    dueTask: dueTasks[0]
      ? {
          deadline: dueTasks[0].deadline,
          id: dueTasks[0].id,
          status: dueTasks[0].status,
          title: dueTasks[0].title,
        }
      : null,
    remainingCount: activeTasks.length,
  }
}

const normalizeTaskSummary = (summary) => {
  if (typeof summary === 'number') {
    return { dueTask: null, remainingCount: summary }
  }

  return {
    dueTask: summary?.dueTask || null,
    remainingCount: summary?.remainingCount || 0,
  }
}

export const normalizeTaskSummaries = (summaries) =>
  Object.fromEntries(
    Object.entries(summaries || {}).map(([cardId, summary]) => [
      cardId,
      normalizeTaskSummary(summary),
    ]),
  )
