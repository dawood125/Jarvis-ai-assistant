import { Activity, ShieldCheck, Power, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'

function TopBar({ now }) {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
      className="h-[70px] w-full flex items-center justify-between px-10 border-b border-[#00f3ff]/10 bg-gradient-to-b from-[#020513]/90 to-[#020513]/20 backdrop-blur-md z-10 shrink-0"
    >
      <div className="flex items-center gap-6">
        <h1 className="font-['Orbitron'] font-black text-2xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bf00ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
          J.A.R.V.I.S.
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#00f3ff]/5 border border-[#00f3ff]/20 shadow-[inset_0_0_10px_rgba(0,243,255,0.1)]">
          <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_8px_#00f3ff]"></div>
          <span className="text-[10px] font-['Rajdhani'] font-bold tracking-widest text-[#00f3ff] uppercase">SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="flex flex-col flex-end text-right">
        <span className="text-[11px] font-['Orbitron'] tracking-[0.2em] text-[#4b6a9c] mb-1">T:{now}</span>
        <div className="flex items-center gap-4 text-[#00f3ff]/60">
          <div className="flex items-center gap-1">
            <Cpu size={12} className="text-[#bf00ff]" />
            <span className="text-[10px] font-bold font-['Rajdhani'] text-[#bf00ff]">34%</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={12} className="text-[#00f3ff]" />
            <span className="text-[10px] font-bold font-['Rajdhani'] text-[#00f3ff]">12ms PING</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-[#00f3ff]" />
            <span className="text-[10px] font-bold font-['Rajdhani'] text-[#00f3ff]">SEC: LEVEL 5</span>
          </div>
          <Power size={14} className="text-red-500/80 cursor-pointer hover:text-red-400 hover:drop-shadow-[0_0_8px_red] ml-2 transition-colors" />
        </div>
      </div>
    </motion.header>
  )
}

export default TopBar
