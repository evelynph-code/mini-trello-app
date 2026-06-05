import { useCallback, useState } from 'react'
import { cardApi } from '../services/cardApi'
import { normalizeTaskSummaries, summarizeTasks } from '../utils/taskSummaryUtils'

export function useCardTaskSummaries({ selectedBoard, setError }) {
  const [taskSummaries, setTaskSummaries] = useState({})

  const clearTaskSummaries = useCallback(() => {
    setTaskSummaries({})
  }, [])

  const refreshTaskCount = useCallback(async (cardId) => {
    if (!selectedBoard || !cardId) {
      return
    }

    try {
      const nextTaskSummaries = normalizeTaskSummaries(
        await cardApi.getBoardCardTaskSummaries(selectedBoard.id),
      )

      setTaskSummaries((currentSummaries) => ({
        ...currentSummaries,
        [cardId]: nextTaskSummaries[cardId] || { dueTask: null, remainingCount: 0 },
      }))
    } catch (err) {
      setError(err.message)
    }
  }, [selectedBoard, setError])

  const refreshTaskCounts = useCallback(async (boardId) => {
    if (!boardId) {
      clearTaskSummaries()
      return
    }

    try {
      setTaskSummaries(normalizeTaskSummaries(await cardApi.getBoardCardTaskSummaries(boardId)))
    } catch (err) {
      setError(err.message)
    }
  }, [clearTaskSummaries, setError])

  const updateTaskSummary = useCallback((cardId, tasks) => {
    setTaskSummaries((currentSummaries) => ({
      ...currentSummaries,
      [cardId]: summarizeTasks(tasks),
    }))
  }, [])

  return {
    clearTaskSummaries,
    refreshTaskCount,
    refreshTaskCounts,
    taskSummaries,
    updateTaskSummary,
  }
}
