import { useEffect, useRef, useState } from 'react'
import ChatStage from './components/ChatStage'
import HudBackground from './components/HudBackground'
import IntelPanel from './components/IntelPanel'
import LeftRail from './components/LeftRail'
import TopBar from './components/TopBar'
import { initialMessages, initialRecentActivity, quickSuggestions } from './data/mockData'
import {
  executeConfirmedLaunchAppAction,
  executeFileSearchAction,
  executeLaunchAppAction,
} from './lib/commandActions'
import { COMMAND_TYPES, routeCommand } from './lib/commandRouter'
import { fetchBridgeHealth, fetchSystemTelemetry } from './lib/modelClients'
import { readModelConfig, resolveModelReply, writeModelConfig } from './lib/modelRouter'

const CHAT_STORAGE_KEY = 'jarvis.chat.history.v1'
const NOTES_STORAGE_KEY = 'jarvis.notes.v1'
const JOURNAL_STORAGE_KEY = 'jarvis.journal.v1'

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

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

function readStoredJournal() {
  try {
    const stored = window.localStorage.getItem(JOURNAL_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredJournal(entries) {
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries))
}

function extractJournalTasks(text) {
  const cleaned = text
    .replace(/^today\s+i\s+/i, '')
    .replace(/^i\s+/i, '')
    .trim()

  if (!cleaned) {
    return []
  }

  const coarseParts = cleaned
    .split(/\s*(?:\.\s+|;\s+|\s+also\s+|,\s+also\s+)\s*/i)
    .map((item) => item.trim())
    .filter(Boolean)

  const taskParts = []
  for (const part of coarseParts) {
    const andSplit = part.split(/\s+and\s+/i).map((item) => item.trim())
    if (andSplit.length === 1) {
      taskParts.push(part)
      continue
    }

    const hasVerb = andSplit.every((segment) =>
      /(started|worked|completed|setup|set up|built|implemented|fixed|created|designed|tested|reviewed|deployed|documented)/i.test(segment),
    )

    if (hasVerb) {
      taskParts.push(...andSplit)
    } else {
      taskParts.push(part)
    }
  }

  const unique = []
  const seen = new Set()

  for (const rawTask of taskParts) {
    const normalized = rawTask.replace(/[.]+$/, '').trim()
    if (!normalized) {
      continue
    }

    const key = normalized.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(normalized)
  }

  return unique
}

function createJournalEntry(text) {
  const tasks = extractJournalTasks(text)
  return {
    dateKey: getDateKey(),
    createdAt: new Date().toISOString(),
    raw: text,
    tasks: tasks.length > 0 ? tasks : [text.trim()],
  }
}

function buildDailyRecapReply(entries) {
  const todayKey = getDateKey()
  const todayEntries = entries.filter((entry) => entry.dateKey === todayKey)

  if (todayEntries.length === 0) {
    return 'No journal entries found for today yet. You can say: journal today I worked on ...'
  }

  const allTasks = []
  const seen = new Set()

  todayEntries.forEach((entry) => {
    entry.tasks.forEach((task) => {
      const key = task.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        allTasks.push(task)
      }
    })
  })

  const limitedTasks = allTasks.slice(0, 8)
  const digest = limitedTasks.map((task, index) => `${index + 1}) ${task}`).join(' | ')

  return `Today recap (${limitedTasks.length} tasks from ${todayEntries.length} entries): ${digest}`
}

function createActivityLabel(prefix, content) {
  const compact = content.trim()
  if (compact.length <= 40) {
    return `${prefix}${compact}`
  }

  return `${prefix}${compact.slice(0, 40)}...`
}

function createEmptyTelemetryState() {
  return {
    status: 'offline',
    source: 'unavailable',
    updatedAt: null,
    metrics: {
      cpuLoadPercent: null,
      memoryUsagePercent: null,
      networkPingMs: null,
    },
  }
}

function formatPercentValue(value) {
  return Number.isFinite(value) ? `${value}%` : 'n/a'
}

function formatPingValue(value) {
  return Number.isFinite(value) ? `${value}ms` : 'n/a'
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
  const [modelConfig, setModelConfig] = useState(() => readModelConfig())
  const [bridgeHealth, setBridgeHealth] = useState({
    status: 'unknown',
    systemActionsEnabled: false,
    providers: {
      groq: false,
      openrouter: false,
    },
  })
  const [notes, setNotes] = useState(() => readStoredNotes())
  const [telemetry, setTelemetry] = useState(() => createEmptyTelemetryState())
  const responseTimerRef = useRef(null)

  const statusMeters = [
    {
      name: 'CPU Load',
      valueLabel: formatPercentValue(telemetry.metrics.cpuLoadPercent),
      width: `${Number.isFinite(telemetry.metrics.cpuLoadPercent) ? telemetry.metrics.cpuLoadPercent : 0}%`,
    },
    {
      name: 'Memory Usage',
      valueLabel: formatPercentValue(telemetry.metrics.memoryUsagePercent),
      width: `${Number.isFinite(telemetry.metrics.memoryUsagePercent) ? telemetry.metrics.memoryUsagePercent : 0}%`,
    },
    {
      name: 'Network Ping',
      valueLabel: formatPingValue(telemetry.metrics.networkPingMs),
      width: `${Number.isFinite(telemetry.metrics.networkPingMs) ? Math.min(100, telemetry.metrics.networkPingMs * 2) : 0}%`,
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

  const refreshRuntimeStatus = () => {
    Promise.all([fetchBridgeHealth(), fetchSystemTelemetry()]).then(([health, telemetrySnapshot]) => {
      setBridgeHealth(health)
      setTelemetry(telemetrySnapshot)
    })
  }

  useEffect(() => {
    refreshRuntimeStatus()
    const interval = window.setInterval(refreshRuntimeStatus, 8000)
    return () => window.clearInterval(interval)
  }, [])

  const handleModelConfigChange = (partialConfig) => {
    setModelConfig((prev) => writeModelConfig({ ...prev, ...partialConfig }))
  }

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
        executeConfirmedLaunchAppAction(pendingAction, {
          bridgeHealth,
        })
          .then((launchResult) => {
            setRecentActivity((prev) => [launchResult.activityEntry, ...prev].slice(0, 6))
            queueJarvisReply(launchResult.reply)
          })
          .catch(() => {
            queueJarvisReply('Launch confirmation failed due to an unexpected adapter error.')
          })

        setPendingAction(null)
        return
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

    if (routeResult.action?.type === COMMAND_TYPES.SAVE_JOURNAL) {
      const journalText = routeResult.action.payload.text
      const existingEntries = readStoredJournal()
      const nextEntry = createJournalEntry(journalText)
      const updatedEntries = [nextEntry, ...existingEntries].slice(0, 120)

      writeStoredJournal(updatedEntries)

      const primaryTask = nextEntry.tasks[0] || journalText
      replyText = `Daily journal updated. Captured ${nextEntry.tasks.length} task(s) for today.`

      setRecentActivity((prev) => [
        {
          ago: 'just now',
          label: createActivityLabel('Journal update: ', primaryTask),
        },
        ...prev,
      ].slice(0, 6))
    }

    if (routeResult.action?.type === COMMAND_TYPES.DAILY_RECAP) {
      const entries = readStoredJournal()
      replyText = buildDailyRecapReply(entries)

      setRecentActivity((prev) => [
        {
          ago: 'just now',
          label: 'Daily recap generated',
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
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#050a14] text-white lg:h-screen lg:overflow-hidden">
      <HudBackground />

      <main className="relative z-10 min-h-screen p-4 md:p-5 lg:h-full">
        <div className="flex min-h-full flex-col gap-4 lg:h-full">
          <TopBar now={now} dateText={dateText} bridgeHealth={bridgeHealth} telemetryStatus={telemetry.status} />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-4 lg:overflow-hidden">
            <LeftRail statusMeters={statusMeters} notes={notes} />
            <div className="min-h-115 lg:col-span-2 lg:min-h-0">
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
              modelConfig={modelConfig}
              bridgeHealth={bridgeHealth}
              onRefreshBridgeHealth={refreshRuntimeStatus}
              onModelConfigChange={handleModelConfigChange}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
