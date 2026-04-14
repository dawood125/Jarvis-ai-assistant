function LeftRail() {
  return (
    <aside className="left-rail" aria-label="Primary navigation">
      <div className="brand-mark">J</div>
      <nav className="rail-nav">
        <button className="rail-btn active" type="button">Chat</button>
        <button className="rail-btn" type="button">Notes</button>
        <button className="rail-btn" type="button">Projects</button>
        <button className="rail-btn" type="button">System</button>
      </nav>
      <button className="avatar-btn" type="button" aria-label="Open profile">
        DA
      </button>
    </aside>
  )
}

export default LeftRail
