function TopBar({ now }) {
  return (
    <header className="topbar">
      <h1>JARVIS</h1>
      <div className="topbar-meta">
        <span>{now}</span>
        <span className="status-pill">Online</span>
        <span>CPU 34%</span>
        <span>12ms</span>
      </div>
    </header>
  )
}

export default TopBar
