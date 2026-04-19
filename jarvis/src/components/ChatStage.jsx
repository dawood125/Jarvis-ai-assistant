import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Mic, Send } from 'lucide-react'

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
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Communication Link</span>
        <span className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Secure
        </span>
      </div>

      <div
        ref={feedRef}
        className="chat-scroll flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5"
      >
        {messages.map((message, index) => {
          const isUser = message.role === 'user'
          return (
            <motion.article
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              className={`max-w-[82%] rounded-lg border p-4 ${
                isUser 
                  ? 'ml-auto border-cyan-800 bg-cyan-950/35 message-user' 
                  : 'mr-auto border-slate-800 bg-slate-900/55 message-jarvis'
              }`}
              key={`${message.role}-${index}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {!isUser && <div className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />}
                <span className={`text-[10px] tracking-[0.18em] uppercase ${
                  isUser ? 'text-cyan-400' : 'text-cyan-300'
                }`}>
                  {message.label}
                </span>
                {isUser && <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />}
              </div>
              <p className={`text-sm leading-relaxed ${
                isUser ? 'text-slate-100' : 'text-slate-300'
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
            transition={{ duration: 0.2 }}
            className="message-jarvis mb-2 w-max rounded-lg border border-slate-800 bg-slate-900/50 p-4"
          >
            <span className="wave-dot" />
            <span className="wave-dot" />
            <span className="wave-dot" />
          </motion.div>
        )}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-slate-800 p-4"
      >
        <ChevronRight size={18} className="glow-text" />
        <input
          value={commandText}
          onChange={(event) => setCommandText(event.target.value)}
          className="chat-input w-full rounded-lg px-4 py-3 text-sm"
          placeholder="Enter command or speak to JARVIS..."
          type="text"
        />
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          type="button" 
          className="action-btn rounded-lg p-3"
        >
          <Mic size={16} />
        </motion.button>
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isProcessing}
          className="action-btn rounded-lg px-4 py-3 text-xs font-semibold tracking-[0.16em]"
        >
          <Send size={15} className="mr-2" />
          SEND
        </motion.button>
      </motion.form>
    </motion.section>
  )
}

export default ChatStage
