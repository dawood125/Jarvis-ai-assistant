function IntelPanel({ quickSuggestions, recentActivity, statusMeters }) {
  return (
    <aside className="intel-panel" aria-label="System intelligence panel">
      <section>
        <h2>Suggestions</h2>
        <ul>
          {quickSuggestions.map((item) => (
            <li key={item}>
              <button type="button">{item}</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Recent Activity</h2>
        <ul>
          {recentActivity.map((item) => (
            <li key={item.label}>
              <span>{item.ago}</span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>System Status</h2>
        {statusMeters.map((meter) => (
          <div className="meter-block" key={meter.name}>
            <div>
              <span>{meter.name}</span>
              <strong>{meter.valueLabel}</strong>
            </div>
            <div className="meter"><i style={{ width: meter.width }}></i></div>
          </div>
        ))}
      </section>
    </aside>
  )
}

export default IntelPanel
