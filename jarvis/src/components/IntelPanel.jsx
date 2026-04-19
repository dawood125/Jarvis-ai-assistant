import { motion } from 'framer-motion'

function IntelPanel({ quickSuggestions, recentActivity, onSuggestionSelect }) {
  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    show: { 
      opacity: 1, x: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.4 } 
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const quickActionButtons = [
    { label: 'VS CODE', command: 'launch vscode' },
    { label: 'CHROME', command: 'launch chrome' },
    { label: 'MUSIC', command: 'launch spotify' },
    { label: 'TERMINAL', command: 'launch terminal' },
  ]

  const activeProjects = [
    { name: 'FreelanceHub', stack: 'MERN', color: 'border-cyan-400' },
    { name: 'Portfolio V2', stack: 'NEXT', color: 'border-rose-400' },
    { name: 'JARVIS UI', stack: 'NODE', color: 'border-fuchsia-400' },
  ]

  return (
    <motion.aside
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="col-span-1 flex min-h-0 flex-col gap-4"
    >
      <motion.section variants={itemVariants} className="glass-panel p-4">
        <h2 className="mb-3 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {quickActionButtons.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => onSuggestionSelect(item.command)}
              className="action-btn rounded-lg p-3 text-center text-[10px] tracking-[0.12em]"
            >
              {item.label}
            </motion.button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {quickSuggestions.slice(0, 2).map((item) => (
            <motion.div key={item} whileHover={{ x: 3 }}>
              <button
                type="button"
                onClick={() => onSuggestionSelect(item)}
                className="w-full rounded-lg border border-cyan-900 bg-slate-900/35 p-2 text-left text-xs text-slate-300 hover:border-cyan-500/70"
              >
                {item}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="glass-panel p-4">
        <h2 className="mb-3 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Active Projects
        </h2>
        <div className="space-y-2">
          {activeProjects.map((item) => (
            <div key={item.name} className={`flex items-center justify-between rounded border-l-2 bg-slate-900/35 p-2 ${item.color}`}>
              <span className="text-xs text-slate-300">{item.name}</span>
              <span className="text-[10px] text-cyan-300">{item.stack}</span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="glass-panel min-h-0 flex-1 p-4">
        <h2 className="mb-3 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Activity Feed
        </h2>
        <ul className="chat-scroll max-h-full space-y-3 overflow-y-auto pr-1">
          {recentActivity.map((item) => (
            <li key={item.label} className="rounded border border-slate-800 bg-slate-900/35 p-2">
              <span className="text-[10px] tracking-[0.14em] text-slate-500">{item.ago}</span>
              <strong className="mt-1 block text-xs font-medium text-slate-200">{item.label}</strong>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={itemVariants} className="glass-panel p-4">
        <h2 className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">Weather</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="glow-text text-2xl font-semibold">28°C</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Sheikhupura</div>
          </div>
          <div className="text-2xl text-amber-400/80">☀</div>
        </div>
      </motion.section>
    </motion.aside>
  )
}

export default IntelPanel
