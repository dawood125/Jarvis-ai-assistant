import { motion } from 'framer-motion'

function IntelPanel({
  quickSuggestions,
  recentActivity,
  onSuggestionSelect,
  modelConfig,
  bridgeHealth,
  onRefreshBridgeHealth,
  onModelConfigChange,
}) {
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

  const clientSystemActionsEnabled = import.meta.env.VITE_ENABLE_SYSTEM_ACTIONS === 'true'

  return (
    <motion.aside
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="col-span-1 flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1"
    >
      <motion.section variants={itemVariants} className="glass-panel p-4">
        <h2 className="mb-3 border-b border-slate-800 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Model Routing
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/35 p-2">
            <span className="text-slate-300">Cloud Routing</span>
            <button
              type="button"
              onClick={() => onModelConfigChange({ allowCloud: !modelConfig.allowCloud })}
              className={`rounded px-2 py-1 text-[10px] tracking-[0.12em] ${
                modelConfig.allowCloud ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {modelConfig.allowCloud ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-slate-400">
              Primary
              <select
                value={modelConfig.primary}
                onChange={(event) => onModelConfigChange({ primary: event.target.value })}
                className="rounded border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-200"
              >
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
                <option value="local-fallback">Local</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-slate-400">
              Fallback
              <select
                value={modelConfig.fallback}
                onChange={(event) => onModelConfigChange({ fallback: event.target.value })}
                className="rounded border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-200"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="groq">Groq</option>
                <option value="local-fallback">Local</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/35 p-2">
            <div className="space-y-1">
              <div className={`text-[10px] tracking-[0.14em] ${bridgeHealth.status === 'online' ? 'text-emerald-300' : 'text-rose-300'}`}>
                BRIDGE {bridgeHealth.status === 'online' ? 'ONLINE' : 'OFFLINE'}
              </div>
              <div className="text-[10px] text-slate-500">
                Groq key: {bridgeHealth.providers.groq ? 'yes' : 'no'} | OpenRouter key: {bridgeHealth.providers.openrouter ? 'yes' : 'no'}
              </div>
              <div className="text-[10px] text-slate-500">
                System launch: {bridgeHealth.systemActionsEnabled ? 'bridge-enabled' : 'bridge-disabled'} | client flag: {clientSystemActionsEnabled ? 'on' : 'off'}
              </div>
            </div>
            <button
              type="button"
              onClick={onRefreshBridgeHealth}
              className="action-btn rounded px-2 py-1 text-[10px] tracking-[0.12em]"
            >
              REFRESH
            </button>
          </div>
        </div>
      </motion.section>

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

      <motion.section variants={itemVariants} className="glass-panel p-4 lg:min-h-0 lg:flex-1">
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
