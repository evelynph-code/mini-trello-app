const seedBoard = {
  id: 'board-1',
  title: 'Product Sprint',
  description: 'A tiny Trello-style board wired to an Express API.',
  members: [
    { id: 'user-1', name: 'Ava Chen', initials: 'AC' },
    { id: 'user-2', name: 'Milo Tran', initials: 'MT' },
    { id: 'user-3', name: 'Rae Kim', initials: 'RK' },
  ],
  columns: [
    {
      id: 'column-backlog',
      title: 'Backlog',
      cards: [
        {
          id: 'card-1',
          title: 'Define board data model',
          description: 'Capture columns, cards, labels, members, and ordering.',
          label: 'Planning',
          assigneeId: 'user-1',
        },
        {
          id: 'card-2',
          title: 'Sketch mobile board layout',
          description: 'Keep lists readable on narrow screens.',
          label: 'Design',
          assigneeId: 'user-2',
        },
      ],
    },
    {
      id: 'column-doing',
      title: 'Doing',
      cards: [
        {
          id: 'card-3',
          title: 'Build API route structure',
          description: 'Separate routes, controllers, and board service logic.',
          label: 'Backend',
          assigneeId: 'user-3',
        },
      ],
    },
    {
      id: 'column-review',
      title: 'Review',
      cards: [
        {
          id: 'card-4',
          title: 'Connect frontend to API',
          description: 'Load the starter board and render cards by column.',
          label: 'Frontend',
          assigneeId: 'user-1',
        },
      ],
    },
    {
      id: 'column-done',
      title: 'Done',
      cards: [
        {
          id: 'card-5',
          title: 'Create Vite project shell',
          description: 'Base React app is ready for feature work.',
          label: 'Setup',
          assigneeId: 'user-2',
        },
      ],
    },
  ],
}

module.exports = { seedBoard }
