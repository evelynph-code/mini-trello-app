export const findMemberById = (members, memberId) =>
  members.find((member) => member.id === memberId)

export const getNextColumnId = (columns, currentColumnId) => {
  const currentIndex = columns.findIndex((column) => column.id === currentColumnId)

  if (currentIndex < 0 || currentIndex === columns.length - 1) {
    return null
  }

  return columns[currentIndex + 1].id
}
