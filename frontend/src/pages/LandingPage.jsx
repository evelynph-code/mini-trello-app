import { Kanban, Lock, LogIn, MessageSquare, Users } from 'lucide-react'

export function LandingPage({ authError, isLoading, onSignIn }) {
  return (
    <main className="landing-page">
      <header className="landing-nav" aria-label="Landing navigation">
        <div>
          <p className="eyebrow">Mini Trello</p>
          <strong>Team boards</strong>
        </div>
        <button type="button" disabled={isLoading} onClick={onSignIn}>
          <LogIn size={17} />
          {isLoading ? 'Checking session' : 'Sign in with GitHub'}
        </button>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="eyebrow">Work together</p>
          <h1 id="landing-title">Mini Trello</h1>
          <p>
            Plan assignments, track tasks, leave comments, and keep every board moving
            with realtime updates.
          </p>
          {authError ? <p className="landing-error">{authError}</p> : null}
          <div className="landing-actions">
            <button type="button" disabled={isLoading} onClick={onSignIn}>
              <LogIn size={18} />
              Continue with GitHub
            </button>
          </div>
        </div>

        <div className="landing-board-preview" aria-hidden="true">
          <div className="preview-topbar">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-board">
            {[
              {
                cards: ['Review OAuth flow', 'Invite teammate'],
                icon: Users,
                title: 'Today',
              },
              {
                cards: ['Polish card details', 'Add task comments'],
                icon: MessageSquare,
                title: 'This Week',
              },
              {
                cards: ['Realtime activity', 'Done'],
                icon: Kanban,
                title: 'Launch',
              },
            ].map((list) => {
              const Icon = list.icon

              return (
                <article key={list.title} className="preview-list">
                  <div>
                    <Icon size={15} />
                    <strong>{list.title}</strong>
                  </div>
                  {list.cards.map((card) => (
                    <p key={card}>{card}</p>
                  ))}
                </article>
              )
            })}
          </div>
          <div className="preview-status">
            <Lock size={14} />
            <span>Private workspace</span>
          </div>
        </div>
      </section>
    </main>
  )
}
