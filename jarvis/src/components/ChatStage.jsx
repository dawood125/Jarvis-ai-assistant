import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Send } from 'lucide-react'

function ChatStage({ messages, onSubmitCommand, isProcessing }) {
  const [commandText, setCommandText] = useState('')
  const feedRef = useRef(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages, isProcessing])

  const handleSubmit = (event) => {
    event.preventDefault()
    const cleanText = commandText.trim()

    if (!cleanText) {
      return
    }

    onSubmitCommand(cleanText)
    setCommandText('')
  }

  return (
    <motion.section
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex flex-col flex-1 h-full min-w-0 p-6 rounded-2xl border border-[#00f3ff]/20 bg-gradient-to-br from-[#060a1e]/80 to-[#02040a]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,243,255,0.05),inset_0_0_20px_rgba(0,243,255,0.05)] relative"
    >
      <div className="absolute top-0 right-10 w-64 h-1 bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent blur-[2px]" />

      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto pr-4 mb-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#00f3ff]/20 scrollbar-track-transparent"
      >
        {messages.map((message, index) => {
          const isUser = message.role === 'user'
          return (
            <motion.article
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`max-w-[80%] p-4 rounded-2xl border ${
                isUser 
                  ? 'ml-auto bg-[#0a122e]/80 border-[#4f6dff]/30 rounded-tr-none' 
                  : 'mr-auto bg-[#00f3ff]/5 border-[#00f3ff]/20 shadow-[inset_0_0_15px_rgba(0,243,255,0.05)] rounded-tl-none'
              }`}
              key={`${message.role}-${index}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {!isUser && <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]" />}
                <span className={`text-[10px] font-['Orbitron'] tracking-[0.2em] uppercase ${
                  isUser ? 'text-[#4f6dff]' : 'text-[#00f3ff]'
                }`}>
                  {message.label}
                </span>
                {isUser && <div className="w-1.5 h-1.5 rounded-full bg-[#4f6dff] shadow-[0_0_8px_#4f6dff]" />}
              </div>
              <p className={`font-['Rajdhani'] text-[15px] leading-relaxed tracking-wide ${
                isUser ? 'text-[#edf3ff]' : 'text-[#d6ecff]'
              }`}>
                {message.text}
              </p>
            </motion.article>
          )
        })}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-2 p-4 w-max rounded-2xl bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-tl-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#00f3ff] opacity-50" />
            <span className="w-2 h-2 rounded-full bg-[#00f3ff] opacity-80" />
            <span className="w-2 h-2 rounded-full bg-[#00f3ff] opacity-100" />
          </motion.div>
        )}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-2 pl-4 rounded-full border border-[#00f3ff]/30 bg-[#020513]/60 backdrop-blur-md shrink-0"
      >
        <input
          value={commandText}
          onChange={(event) => setCommandText(event.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-['Rajdhani'] text-lg text-[#edf3ff] placeholder:text-[#4b6a9c] placeholder:tracking-widest placeholder:text-sm"
          placeholder="WAITING FOR COMMAND..."
          type="text"
        />
        <motion.button 
          whileHover={{ scale: 1.1, filter: 'brightness(1.2)' }}
          whileTap={{ scale: 0.9 }}
          type="button" 
          className="p-3 rounded-full bg-[#0a122e] border border-[#bf00ff]/30 text-[#bf00ff]"
        >
          <Mic size={20} />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: '0 0 15px #00f3ff' }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isProcessing}
          className="flex items-center justify-center p-3 px-5 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#4f6dff] text-[#02040a]"
        >
          <Send size={20} className="mr-2" />
          <span className="font-['Orbitron'] font-bold text-xs tracking-widest uppercase">Execute</span>
        </motion.button>
      </motion.form>
    </motion.section>
  )
}

export default ChatStage
