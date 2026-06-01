const seedBoard = {
  id: 'board-1',
  title: 'Product Sprint',
  description: 'A tiny Trello-style board wired to an Express API.',
  members: [
    { id: 'dummy-48291', name: 'dummy-48291', initials: 'D1' },
    { id: 'dummy-73916', name: 'dummy-73916', initials: 'D2' },
    { id: 'dummy-10483', name: 'dummy-10483', initials: 'D3' },
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
          assigneeId: 'dummy-48291',
        },
        {
          id: 'card-2',
          title: 'Sketch mobile board layout',
          description: 'Keep lists readable on narrow screens.',
          label: 'Design',
          assigneeId: 'dummy-73916',
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
          assigneeId: 'dummy-10483',
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
          assigneeId: 'dummy-48291',
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
          assigneeId: 'dummy-73916',
        },
      ],
    },
  ],
}

module.exports = { seedBoard }
