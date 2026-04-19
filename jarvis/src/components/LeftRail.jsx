import { motion } from 'framer-motion'

function LeftRail({ statusMeters, notes }) {
  const safeNotes = notes && notes.length > 0 ? notes.slice(0, 4) : []

  return (
    <motion.aside
      initial={{ x: -26, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="col-span-1 flex min-h-0 flex-col gap-4"
    >
      <section className="glass-panel flex items-center justify-center p-5">
        <div className="arc-container">
          <svg className="arc-ring" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="rgba(0,240,255,0.3)" strokeWidth="2" fill="none" strokeDasharray="10 5" />
          </svg>
          <svg className="arc-ring-reverse" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" stroke="rgba(0,240,255,0.95)" strokeWidth="1.5" fill="none" strokeDasharray="20 10" />
          </svg>
          <div className="core-dot" />
        </div>
      </section>

      <section className="glass-panel p-4">
        <h3 className="mb-3 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">System Vitals</h3>
        <div className="space-y-4">
          {statusMeters.map((meter) => (
            <div key={meter.name}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>{meter.name}</span>
                <span className="glow-text">{meter.valueLabel}</span>
              </div>
              <div className="stat-bar-bg">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: meter.width }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="stat-bar-fill"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel min-h-0 flex-1 p-4">
        <h3 className="mb-3 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">Recent Notes</h3>
        <div className="max-h-full space-y-2 overflow-y-auto pr-1 chat-scroll">
          {safeNotes.length === 0 && (
            <div className="rounded-r border-l-2 border-cyan-700 bg-slate-900/30 p-2 text-xs text-slate-500">
              No notes yet. Try: note Your idea here.
            </div>
          )}
          {safeNotes.map((note) => (
            <div key={note.createdAt} className="rounded-r border-l-2 border-cyan-500 bg-slate-900/30 p-2 text-xs text-slate-300">
              {note.text}
            </div>
          ))}
        </div>
      </section>
    </motion.aside>
  )
}

export default LeftRail
