import { motion } from 'framer-motion'

function JarvisCore() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center perspective-[800px]">
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-400/30 border-l-cyan-400"
        style={{ boxShadow: '0 0 15px rgba(0, 243, 255, 0.4)' }}
        animate={{ rotateX: 360, rotateY: 180, rotateZ: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      {/* Middle Ring */}
      <motion.div
        className="absolute inset-[4px] rounded-full border-t flex-shrink-0 border-r border-[#bf00ff]/60 border-t-[#bf00ff]"
        style={{ boxShadow: '0 0 20px rgba(191, 0, 255, 0.3)' }}
        animate={{ rotateX: -360, rotateY: 360, rotateZ: -180 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner Core */}
      <motion.div
        className="absolute inset-[14px] rounded-full bg-gradient-to-tr from-cyan-400 to-[#bf00ff]"
        style={{ boxShadow: '0 0 30px rgba(0, 243, 255, 0.8), inset 0 0 10px white' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export default JarvisCore
