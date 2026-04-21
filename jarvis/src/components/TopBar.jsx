import { motion } from 'framer-motion'

function TopBar({ now, dateText, bridgeHealth, telemetryStatus }) {
  const bridgeOnline = bridgeHealth?.status === 'online'
  const telemetryOnline = telemetryStatus === 'online'

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-panel flex h-18 items-center justify-between px-4 md:px-6"
    >
      <div className="flex items-center gap-3 md:gap-5">
        <h1 className="breathing-text text-xl font-semibold tracking-[0.24em] glow-text md:text-2xl">
          J.A.R.V.I.S.
        </h1>
        <span className="hidden text-[10px] tracking-[0.18em] text-slate-500 md:block">v1.0 // DAWOOD&apos;S SYSTEM</span>
      </div>

      <div className="text-right">
        <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
          <span className={`h-2 w-2 rounded-full ${bridgeOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className={`text-[10px] tracking-[0.16em] ${bridgeOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
            BRIDGE {bridgeOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className={`h-2 w-2 rounded-full ${telemetryOnline ? 'bg-cyan-400' : 'bg-amber-400'}`} />
          <span className={`text-[10px] tracking-[0.16em] ${telemetryOnline ? 'text-cyan-300' : 'text-amber-300'}`}>
            SYSTEM {telemetryOnline ? 'LIVE' : 'STALE'}
          </span>
        </div>
        <div className="glow-text text-lg font-medium tracking-[0.16em] md:text-xl">{now}</div>
        <div className="text-[10px] tracking-[0.15em] text-slate-500 md:text-xs">{dateText}</div>
      </div>
    </motion.header>
  )
}

export default TopBar
