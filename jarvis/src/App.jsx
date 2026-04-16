import { useEffect, useRef, useState } from 'react'
import ChatStage from './components/ChatStage'
import IntelPanel from './components/IntelPanel'
import LeftRail from './components/LeftRail'
import TopBar from './components/TopBar'
import { initialMessages, initialRecentActivity, quickSuggestions, statusMeters } from './data/mockData'
import { executeFileSearchAction, executeLaunchAppAction } from './lib/commandActions'
import { COMMAND_TYPES, routeCommand } from './lib/commandRouter'
import { readModelConfig, resolveModelReply } from './lib/modelRouter'

const CHAT_STORAGE_KEY = 'jarvis.chat.history.v1'
const NOTES_STORAGE_KEY = 'jarvis.notes.v1'

function readStoredNotes() {
  try {
    const stored = window.localStorage.getItem(NOTES_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredNotes(notes) {
  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
}

function createActivityLabel(prefix, content) {
  const compact = content.trim()
  if (compact.length <= 40) {
    return `${prefix}${compact}`
  }

  return `${prefix}${compact.slice(0, 40)}...`
}

function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = window.localStorage.getItem(CHAT_STORAGE_KEY)
      if (!stored) {
        return initialMessages
      }

      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialMessages
    } catch {
      return initialMessages
    }
  })
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [modelConfig] = useState(() => readModelConfig())
  const responseTimerRef = useRef(null)

  useEffect(() => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(
    () => () => {
      if (responseTimerRef.current) {
        window.clearTimeout(responseTimerRef.current)
      }
    },
    [],
  )

  const now = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const queueJarvisReply = (replyText) => {
    if (responseTimerRef.current) {
      window.clearTimeout(responseTimerRef.current)
    }

    responseTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'jarvis',
          label: 'JARVIS CORE',
          text: replyText,
        },
      ])
      setIsProcessing(false)
      responseTimerRef.current = null
    }, 600)
  }

  const handleCommand = (rawCommand) => {
    const command = rawCommand.trim()
    if (!command) {
      return
    }

    const normalized = command.toLowerCase()

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        label: 'YOU',
        text: command,
      },
    ])

    setIsProcessing(true)

    if (pendingAction && (normalized === 'confirm' || normalized === 'yes' || normalized === 'yes confirm')) {
      let replyText = 'Pending action confirmed.'

      if (pendingAction.type === COMMAND_TYPES.LAUNCH_APP) {
        const launchResult = executeLaunchAppAction(pendingAction, { confirmed: true })
        replyText = launchResult.reply
        setRecentActivity((prev) => [launchResult.activityEntry, ...prev].slice(0, 6))
      }

      setPendingAction(null)

      queueJarvisReply(replyText)

      return
    }

    if (pendingAction && (normalized === 'cancel' || normalized === 'abort')) {
      setPendingAction(null)

      queueJarvisReply('Pending action canceled. No system workflow was executed.')

      return
    }

    const routeResult = routeCommand(command, statusMeters)
    let replyText = routeResult.reply

    if (routeResult.action?.type === COMMAND_TYPES.SAVE_NOTE) {
      const existingNotes = readStoredNotes()
      const updatedNotes = [
        {
          text: routeResult.action.payload.text,
          createdAt: new Date().toISOString(),
        },
        ...existingNotes,
      ].slice(0, 100)

      writeStoredNotes(updatedNotes)
      replyText = `Note stored locally. Total notes in memory: ${updatedNotes.length}.`
      setRecentActivity((prev) => [
        {
          ago: 'just now',
          label: createActivityLabel('Note saved: ', routeResult.action.payload.text),
        },
        ...prev,
      ].slice(0, 6))
    }

    if (routeResult.action?.type === COMMAND_TYPES.LIST_NOTES) {
      const notes = readStoredNotes()

      if (notes.length === 0) {
        replyText = 'No local notes found yet. Use: note <your text>'
      } else {
        const preview = notes
          .slice(0, 3)
          .map((item, index) => `${index + 1}) ${item.text}`)
          .join(' | ')

        replyText = `Local notes (${notes.length} total): ${preview}`
      }
    }

    if (routeResult.action?.type === COMMAND_TYPES.LAUNCH_APP) {
      if (routeResult.action.requiresConfirmation) {
        setPendingAction(routeResult.action)
        const target = routeResult.action.payload?.resolvedTarget?.label || routeResult.action.payload?.target || 'target app'
        replyText = `Launch action staged for ${target}. Reply with confirm to proceed or cancel to abort.`
      } else {
        const launchResult = executeLaunchAppAction(routeResult.action)
        replyText = launchResult.reply
        setRecentActivity((prev) => [launchResult.activityEntry, ...prev].slice(0, 6))
      }
    }

    if (routeResult.action?.type === COMMAND_TYPES.FILE_SEARCH) {
      const searchResult = executeFileSearchAction(routeResult.action, {
        messages,
        recentActivity,
        notes: readStoredNotes(),
      })
      replyText = searchResult.reply
      setRecentActivity((prev) => [searchResult.activityEntry, ...prev].slice(0, 6))
    }

    if (routeResult.intent === COMMAND_TYPES.UNKNOWN) {
      resolveModelReply(command, modelConfig)
        .then((modelReply) => {
          setRecentActivity((prev) => [
            {
              ago: 'just now',
              label: createActivityLabel('Model route: ', modelReply.provider),
            },
            ...prev,
          ].slice(0, 6))

          queueJarvisReply(modelReply.reply)
        })
        .catch(() => {
          queueJarvisReply('Model route failed unexpectedly. Staying in local-safe response mode.')
        })

      return
    }

    queueJarvisReply(replyText)
  }

  return (
    <div className="flex w-full h-screen bg-[#02040a] overflow-hidden text-[#edf3ff]">
      {/* 3D background element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-200 h-200 bg-[#bf00ff]/10 blur-[150px] mix-blend-screen rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-150 h-150 bg-[#00f3ff]/10 blur-[150px] mix-blend-screen rounded-full" />
        {/* Simple CSS Grid pattern for the FUI look */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] transform-[perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(2.5)] opacity-40 origin-top" />
      </div>

      <LeftRail />

      <main className="flex flex-col flex-1 relative z-10 w-full min-w-0">
        <TopBar now={now} />

        <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-70px)]">
          <ChatStage
            messages={messages}
            onSubmitCommand={handleCommand}
            isProcessing={isProcessing}
          />
          <IntelPanel
            quickSuggestions={quickSuggestions}
            recentActivity={recentActivity}
            statusMeters={statusMeters}
            onSuggestionSelect={handleCommand}
          />
        </div>
      </main>
    </div>
  )
}

export default App
