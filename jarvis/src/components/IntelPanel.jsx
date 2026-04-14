import { motion } from 'framer-motion'

function IntelPanel({ quickSuggestions, recentActivity, statusMeters }) {
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

  return (
    <motion.aside
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-[320px] flex flex-col gap-6 shrink-0 h-full overflow-y-auto scrollbar-none"
    >
      <motion.section variants={itemVariants} className="p-5 rounded-2xl border border-[#bf00ff]/20 bg-gradient-to-br from-[#060a1e]/80 to-[#02040a]/90 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#bf00ff] group-hover:scale-150 transition-transform" />
        <h2 className="font-['Orbitron'] text-[10px] text-[#bf00ff] tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#bf00ff] rounded-sm" /> PREDICTIVE SUGGESTIONS
        </h2>
        <ul className="flex flex-col gap-3">
          {quickSuggestions.map((item, i) => (
            <motion.li key={item} whileHover={{ x: 5 }} className="cursor-pointer">
              <button type="button" className="w-full text-left p-3 rounded-lg border border-[#bf00ff]/10 bg-[#bf00ff]/5 hover:bg-[#bf00ff]/20 hover:border-[#bf00ff]/50 transition-all text-[#d6ecff] font-['Rajdhani'] text-[14px] leading-snug">
                {item}
              </button>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={itemVariants} className="p-5 rounded-2xl border border-[#00f3ff]/20 bg-gradient-to-br from-[#060a1e]/80 to-[#02040a]/90 backdrop-blur-xl relative">
        <h2 className="font-['Orbitron'] text-[10px] text-[#00f3ff] tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00f3ff] rounded-sm" /> RECENT ACTIVITY
        </h2>
        <ul className="flex flex-col gap-4 relative">
          <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-[#00f3ff]/20" />
          {recentActivity.map((item) => (
            <li key={item.label} className="relative pl-4 flex flex-col">
              <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-[#00f3ff]" />
              <span className="text-[10px] font-['Orbitron'] tracking-widest text-[#4b6a9c]">{item.ago}</span>
              <strong className="text-[13px] font-['Rajdhani'] font-medium text-[#edf3ff]">{item.label}</strong>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={itemVariants} className="p-5 rounded-2xl border border-[#00f3ff]/20 bg-gradient-to-br from-[#060a1e]/80 to-[#02040a]/90 backdrop-blur-xl relative">
        <h2 className="font-['Orbitron'] text-[10px] text-[#00f3ff] tracking-[0.2em] mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00f3ff] rounded-sm" /> SUB-ROUTINE STATUS
        </h2>
        <div className="flex flex-col gap-5">
          {statusMeters.map((meter) => (
            <div className="flex flex-col gap-2" key={meter.name}>
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-['Orbitron'] tracking-widest text-[#4b6a9c] uppercase">{meter.name}</span>
                <strong className="text-[11px] font-['Orbitron'] tracking-widest text-[#00f3ff]">{meter.valueLabel}</strong>
              </div>
              <div className="w-full h-1.5 bg-[#02040a] rounded-full overflow-hidden border border-[#00f3ff]/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: meter.width }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#00f3ff] to-[#bf00ff] shadow-[0_0_10px_#00f3ff]" 
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.aside>
  )
}

export default IntelPanel
