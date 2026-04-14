import { MessageSquare, FileText, FolderRoot, Fingerprint, Settings, Hexagon } from 'lucide-react'
import { motion } from 'framer-motion'
import JarvisCore from './JarvisCore'

function LeftRail() {
  const menuItems = [
    { icon: MessageSquare, id: 'chat', label: 'NEURAL LINK' },
    { icon: FileText, id: 'notes', label: 'DATA VAULT' },
    { icon: FolderRoot, id: 'projects', label: 'PROJECTS' },
    { icon: Hexagon, id: 'system', label: 'TELEMETRY' },
  ]

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="w-[100px] flex flex-col items-center py-8 border-r border-[#00f3ff]/20 bg-[#030614]/80 backdrop-blur-xl shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-20 shrink-0 h-full relative overflow-visible"
    >
      <div className="mb-12 cursor-pointer hover:scale-110 transition-transform">
        <JarvisCore />
      </div>

      <nav className="flex flex-col gap-10 flex-1 w-full relative pt-6">
        {menuItems.map((item, i) => {
          const Icon = item.icon
          const active = i === 0

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.15, textShadow: '0 0 8px #00f3ff' }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center gap-2 w-full transition-all duration-300 group outline-none ${
                active ? 'text-[#00f3ff]' : 'text-[#4b6a9c]'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-nav-glow"
                  className="absolute inset-0 bg-[#00f3ff]/10 blur-[15px] rounded-full w-12 h-12 left-1/2 -translate-x-1/2 -top-2 z-[-1]"
                />
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00f3ff] rounded-r shadow-[0_0_10px_#00f3ff]" />
              )}
              <Icon size={24} className={active ? 'drop-shadow-[0_0_10px_#00f3ff]' : ''} />
              <span className="text-[9px] font-bold tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity absolute top-[36px] mt-2 whitespace-nowrap drop-shadow text-[#00f3ff]">
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </nav>

      <motion.div className="mt-auto flex flex-col gap-6 items-center">
        <Settings size={22} className="text-[#4b6a9c] hover:text-[#00f3ff] cursor-pointer transition-colors" />
        <div className="relative group cursor-pointer w-12 h-12 rounded-full overflow-hidden border-2 border-[#bf00ff]/40 shadow-[0_0_15px_rgba(191,0,255,0.3)] flex items-center justify-center bg-[#050b1e]">
          <Fingerprint size={28} className="text-[#bf00ff] drop-shadow-[0_0_8px_#bf00ff]" />
          <div className="absolute inset-0 bg-[#bf00ff]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </div>
      </motion.div>
    </motion.aside>
  )
}

export default LeftRail
