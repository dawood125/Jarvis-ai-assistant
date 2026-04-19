import { useEffect, useRef, useState } from 'react'
import ChatStage from './components/ChatStage'
import HudBackground from './components/HudBackground'
import IntelPanel from './components/IntelPanel'
import LeftRail from './components/LeftRail'
import TopBar from './components/TopBar'
import { initialMessages, initialRecentActivity, quickSuggestions } from './data/mockData'
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

function createTelemetrySnapshot() {
  const cpu = Math.floor(Math.random() * 40) + 20
  const memory = Math.floor(Math.random() * 30) + 40
  const ping = Math.floor(Math.random() * 20) + 5

  return {
    cpu,
    memory,
    ping,
  }
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
  const [notes, setNotes] = useState(() => readStoredNotes())
  const [telemetry, setTelemetry] = useState(() => createTelemetrySnapshot())
  const responseTimerRef = useRef(null)

  const statusMeters = [
    { name: 'CPU Load', valueLabel: `${telemetry.cpu}%`, width: `${telemetry.cpu}%` },
    { name: 'Memory Usage', valueLabel: `${telemetry.memory}%`, width: `${telemetry.memory}%` },
    {
      name: 'Network Ping',
      valueLabel: `${telemetry.ping}ms`,
      width: `${Math.min(100, telemetry.ping * 2)}%`,
    },
  ]

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTelemetry(createTelemetrySnapshot())
    }, 3000)

    return () => window.clearInterval(interval)
  }, [])

  const now = new Date().toLocaleTimeString([], {
    hour12: false,
  })

  const dateText = new Date().toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
      setNotes(updatedNotes)
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
        notes,
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
    <div className="relative h-screen w-full overflow-hidden bg-[#050a14] text-white">
      <HudBackground />

      <main className="relative z-10 h-full p-4 md:p-5">
        <div className="flex h-full flex-col gap-4">
          <TopBar now={now} dateText={dateText} />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-4">
            <LeftRail statusMeters={statusMeters} notes={notes} />
            <div className="lg:col-span-2 min-h-0">
              <ChatStage
                messages={messages}
                onSubmitCommand={handleCommand}
                isProcessing={isProcessing}
              />
            </div>
            <IntelPanel
              quickSuggestions={quickSuggestions}
              recentActivity={recentActivity}
              onSuggestionSelect={handleCommand}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
