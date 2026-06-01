export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mini Trello</p>
          <h1>Team board</h1>
        </div>
        <nav aria-label="Primary">
          <a href="#board">Board</a>
          <a href="#activity">Activity</a>
        </nav>
      </header>
      {children}
    </div>
  )
}
