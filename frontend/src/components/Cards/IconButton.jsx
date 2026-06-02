export function IconButton({ children, className = '', label, onClick, title = label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`icon-button ${className}`.trim()}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}
