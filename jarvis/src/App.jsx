import { useEffect, useRef, useState } from 'react'
import ChatStage from './components/ChatStage'
import HudBackground from './components/HudBackground'
import IntelPanel from './components/IntelPanel'
import LeftRail from './components/LeftRail'
import TopBar from './components/TopBar'
import { initialMessages, initialRecentActivity, quickSuggestions } from './data/mockData'
import {
  executeConfirmedCloseAppAction,
  executeConfirmedCloseProjectAction,
  executeConfirmedLaunchAppAction,
  executeConfirmedOpenProjectAction,
  executeFileSearchAction,
  executeLaunchAppAction,
  executeWebSummaryAction,
} from './lib/commandActions'
import { COMMAND_TYPES, routeCommand } from './lib/commandRouter'
import {
  fetchBridgeHealth,
  fetchMemoryBootstrap,
  fetchSystemTelemetry,
  migrateLocalMemoryToBridge,
  persistMemoryPreferences,
  persistMemoryProfile,
  persistConversationMessage,
  persistJournalMessage,
  persistNoteMessage,
} from './lib/modelClients'
import { readModelConfig, resolveModelReply, writeModelConfig } from './lib/modelRouter'

const CHAT_STORAGE_KEY = 'jarvis.chat.history.v1'
const NOTES_STORAGE_KEY = 'jarvis.notes.v1'
const JOURNAL_STORAGE_KEY = 'jarvis.journal.v1'
const MEMORY_MIGRATED_STORAGE_KEY = 'jarvis.memory.migrated.v1'
const PANEL_TABS = Object.freeze({
  ACTIONS: 'actions',
  MEMORY: 'memory',
  ACTIVITY: 'activity',
  DEV: 'dev',
})

function createDefaultUserProfile() {
  return {
    id: 1,
    name: 'Dawood',
    wakeTime: '09:00',
    sleepTime: '23:00',
    preferredEditor: 'code',
    preferredBrowser: 'chrome',
    personalityNotes: '',
    createdAt: null,
    updatedAt: null,
  }
}

function normalizeUserProfile(profile) {
  if (!profile) {
    return createDefaultUserProfile()
  }

  return {
    id: profile.id || 1,
    name: profile.name || 'Dawood',
    wakeTime: profile.wakeTime || '09:00',
    sleepTime: profile.sleepTime || '23:00',
    preferredEditor: profile.preferredEditor || 'code',
    preferredBrowser: profile.preferredBrowser || 'chrome',
    personalityNotes: profile.personalityNotes || '',
    createdAt: profile.createdAt || null,
    updatedAt: profile.updatedAt || null,
  }
}

function buildModelConfigFromPreferences(preferences, fallbackConfig) {
  const nextConfig = { ...fallbackConfig }
  if (typeof preferences?.['model.primary'] === 'string') {
    nextConfig.primary = preferences['model.primary']
  }
  if (typeof preferences?.['model.fallback'] === 'string') {
    nextConfig.fallback = preferences['model.fallback']
  }
  if (typeof preferences?.['model.allowCloud'] === 'string') {
    nextConfig.allowCloud = preferences['model.allowCloud'] === 'true'
  }

  return nextConfig
}

function buildModelPreferencePayload(config) {
  return {
    preferences: {
      'model.primary': config.primary,
      'model.fallback': config.fallback,
      'model.allowCloud': String(config.allowCloud),
    },
  }
}

function resolvePanelFocus(command, routeResult) {
  const normalized = String(command || '').toLowerCase()
  const actionType = routeResult?.action?.type

  if (
    actionType === COMMAND_TYPES.SAVE_PROFILE ||
    actionType === COMMAND_TYPES.SAVE_NOTE ||
    actionType === COMMAND_TYPES.LIST_NOTES
  ) {
    return PANEL_TABS.MEMORY
  }

  if (actionType === COMMAND_TYPES.SAVE_JOURNAL || actionType === COMMAND_TYPES.DAILY_RECAP) {
    return PANEL_TABS.ACTIVITY
  }

  if (actionType === COMMAND_TYPES.RUNTIME_DIAGNOSTIC) {
    return PANEL_TABS.DEV
  }

  if (
    actionType === COMMAND_TYPES.LAUNCH_APP ||
    actionType === COMMAND_TYPES.CLOSE_APP ||
    actionType === COMMAND_TYPES.OPEN_PROJECT ||
    actionType === COMMAND_TYPES.CLOSE_PROJECT ||
    actionType === COMMAND_TYPES.FILE_SEARCH ||
    actionType === COMMAND_TYPES.WEB_SUMMARIZE
  ) {
    return PANEL_TABS.ACTIONS
  }

  if (normalized.includes('profile') || normalized.includes('memory') || normalized.startsWith('note')) {
    return PANEL_TABS.MEMORY
  }

  if (normalized.includes('journal') || normalized.includes('recap') || normalized.includes('activity')) {
    return PANEL_TABS.ACTIVITY
  }

  if (normalized.includes('diagnose') || normalized.includes('diagnostic')) {
    return PANEL_TABS.DEV
  }

  return null
}

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

function readStoredChat() {
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

function buildRuntimeDiagnosticReply({ bridgeHealth, telemetry }) {
  const bridgeOnline = bridgeHealth?.status === 'online'
  const systemActionsEnabled = Boolean(bridgeHealth?.systemActionsEnabled)
  const telemetryOnline = telemetry?.status === 'online'
  const providersReady = Boolean(bridgeHealth?.providers?.groq || bridgeHealth?.providers?.openrouter)

  const checks = [
    `Bridge: ${bridgeOnline ? 'online' : 'offline'}`,
    `System actions: ${systemActionsEnabled ? 'enabled' : 'disabled'}`,
    `Telemetry: ${telemetryOnline ? 'live' : 'offline'}`,
    `Provider keys: ${providersReady ? 'detected' : 'missing'}`,
  ]

  const recovery = []

  if (!bridgeOnline) {
    recovery.push('start bridge with npm run bridge')
  }

  if (!systemActionsEnabled) {
    recovery.push('enable VITE_ENABLE_SYSTEM_ACTIONS and SYSTEM_ACTIONS_ENABLED')
  }

  if (!telemetryOnline) {
    recovery.push('verify /api/system/status via bridge and then press REFRESH')
  }

  if (!providersReady) {
    recovery.push('add GROQ_API_KEY or OPENROUTER_API_KEY in bridge env')
  }

  if (recovery.length === 0) {
    return `Runtime diagnostics -> ${checks.join(' | ')}. No blocking issue detected. Retry launch command and confirm.`
  }

  return `Runtime diagnostics -> ${checks.join(' | ')}. Recovery: ${recovery.join(' ; ')}.`
}

function App() {
  const [messages, setMessages] = useState(() => readStoredChat())
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [modelConfig, setModelConfig] = useState(() => readModelConfig())
  const [userProfile, setUserProfile] = useState(() => createDefaultUserProfile())
  const [panelFocus, setPanelFocus] = useState(PANEL_TABS.ACTIONS)
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
  const memorySyncRef = useRef(false)

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

  useEffect(() => {
    if (bridgeHealth.status !== 'online' || memorySyncRef.current) {
      return
    }

    memorySyncRef.current = true

    const localConversations = readStoredChat()
    const localNotes = readStoredNotes()
    const localJournalEntries = readStoredJournal()
    const migrationDone = window.localStorage.getItem(MEMORY_MIGRATED_STORAGE_KEY) === '1'

    const syncMemory = async () => {
      if (!migrationDone && (localConversations.length > 0 || localNotes.length > 0 || localJournalEntries.length > 0)) {
        await migrateLocalMemoryToBridge({
          conversations: localConversations,
          notes: localNotes,
          journalEntries: localJournalEntries,
        })
        window.localStorage.setItem(MEMORY_MIGRATED_STORAGE_KEY, '1')
      }

      const bootstrap = await fetchMemoryBootstrap()
      if (!bootstrap.ok) {
        return
      }

      if (bootstrap.conversations.length > 0) {
        setMessages(bootstrap.conversations)
        window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(bootstrap.conversations))
      }

      setUserProfile(normalizeUserProfile(bootstrap.userProfile || bootstrap.profile))
      if (bootstrap.preferences && Object.keys(bootstrap.preferences).length > 0) {
        const nextConfig = writeModelConfig(
          buildModelConfigFromPreferences(bootstrap.preferences, readModelConfig()),
        )
        setModelConfig(nextConfig)
      }

      setNotes(bootstrap.notes)
      writeStoredNotes(bootstrap.notes)
      writeStoredJournal(bootstrap.journalEntries)
    }

    syncMemory().catch(() => {
      memorySyncRef.current = false
    })
  }, [bridgeHealth.status])

  const handleModelConfigChange = (partialConfig) => {
    const nextConfig = writeModelConfig({ ...modelConfig, ...partialConfig })
    setModelConfig(nextConfig)

    if (bridgeHealth.status === 'online') {
      void persistMemoryPreferences(buildModelPreferencePayload(nextConfig))
    }
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
      const nextMessage = {
        role: 'jarvis',
        label: 'JARVIS CORE',
        text: replyText,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [
        ...prev,
        nextMessage,
      ])

      if (bridgeHealth.status === 'online') {
        void persistConversationMessage(nextMessage)
      }

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

    const userMessage = {
      role: 'user',
      label: 'YOU',
      text: command,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])

    if (bridgeHealth.status === 'online') {
      void persistConversationMessage(userMessage)
    }

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

      if (pendingAction.type === COMMAND_TYPES.CLOSE_APP) {
        executeConfirmedCloseAppAction(pendingAction, {
          bridgeHealth,
        })
          .then((closeResult) => {
            setRecentActivity((prev) => [closeResult.activityEntry, ...prev].slice(0, 6))
            queueJarvisReply(closeResult.reply)
          })
          .catch(() => {
            queueJarvisReply('Close confirmation failed due to an unexpected adapter error.')
          })

        setPendingAction(null)
        return
      }

      if (pendingAction.type === COMMAND_TYPES.OPEN_PROJECT) {
        executeConfirmedOpenProjectAction(pendingAction, {
          bridgeHealth,
        })
          .then((projectResult) => {
            setRecentActivity((prev) => [projectResult.activityEntry, ...prev].slice(0, 6))
            queueJarvisReply(projectResult.reply)
          })
          .catch(() => {
            queueJarvisReply('Project launch confirmation failed due to an unexpected adapter error.')
          })

        setPendingAction(null)
        return
      }

      if (pendingAction.type === COMMAND_TYPES.CLOSE_PROJECT) {
        executeConfirmedCloseProjectAction(pendingAction, {
          bridgeHealth,
        })
          .then((projectResult) => {
            setRecentActivity((prev) => [projectResult.activityEntry, ...prev].slice(0, 6))
            queueJarvisReply(projectResult.reply)
          })
          .catch(() => {
            queueJarvisReply('Project close confirmation failed due to an unexpected adapter error.')
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
    const nextPanelFocus = resolvePanelFocus(command, routeResult)
    if (nextPanelFocus) {
      setPanelFocus(nextPanelFocus)
    }
    let replyText = routeResult.reply

    if (routeResult.action?.type === COMMAND_TYPES.SAVE_PROFILE) {
      const { field, value, label } = routeResult.action.payload
      const nextProfile = normalizeUserProfile({
        ...userProfile,
        [field]: value,
      })

      setUserProfile(nextProfile)

      if (bridgeHealth.status === 'online') {
        void persistMemoryProfile(nextProfile)
      }

      replyText = `Profile updated. I remembered your ${label} as ${value}.`
      setRecentActivity((prev) => [
        {
          ago: 'just now',
          label: createActivityLabel('Profile saved: ', `${label} = ${value}`),
        },
        ...prev,
      ].slice(0, 6))
    }

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

      if (bridgeHealth.status === 'online') {
        void persistNoteMessage(updatedNotes[0])
      }

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

      if (bridgeHealth.status === 'online') {
        void persistJournalMessage(nextEntry)
      }

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

    if (routeResult.action?.type === COMMAND_TYPES.CLOSE_APP) {
      if (routeResult.action.requiresConfirmation) {
        setPendingAction(routeResult.action)
        const target = routeResult.action.payload?.resolvedTarget?.label || routeResult.action.payload?.target || 'target app'
        replyText = `Close action staged for ${target}. Reply with confirm to proceed or cancel to abort.`
      }
    }

    if (routeResult.action?.type === COMMAND_TYPES.OPEN_PROJECT) {
      if (routeResult.action.requiresConfirmation) {
        setPendingAction(routeResult.action)
        const project =
          routeResult.action.payload?.resolvedProject?.label || routeResult.action.payload?.projectName || 'project'
        replyText = `Project launch staged for ${project}. Reply with confirm to proceed or cancel to abort.`
      }
    }

    if (routeResult.action?.type === COMMAND_TYPES.CLOSE_PROJECT) {
      if (routeResult.action.requiresConfirmation) {
        setPendingAction(routeResult.action)
        const project =
          routeResult.action.payload?.resolvedProject?.label || routeResult.action.payload?.projectName || 'project'
        replyText = `Project close staged for ${project}. Reply with confirm to proceed or cancel to abort.`
      }
    }

    if (routeResult.action?.type === COMMAND_TYPES.FILE_SEARCH) {
      executeFileSearchAction(routeResult.action, {
        messages,
        recentActivity,
        notes,
        bridgeHealth,
      })
        .then((searchResult) => {
          setRecentActivity((prev) => [searchResult.activityEntry, ...prev].slice(0, 6))
          queueJarvisReply(searchResult.reply)
        })
        .catch(() => {
          queueJarvisReply('File search failed due to an unexpected adapter error.')
        })

      return
    }

    if (routeResult.action?.type === COMMAND_TYPES.WEB_SUMMARIZE) {
      executeWebSummaryAction(routeResult.action, {
        bridgeHealth,
      })
        .then((summaryResult) => {
          setRecentActivity((prev) => [summaryResult.activityEntry, ...prev].slice(0, 6))
          queueJarvisReply(summaryResult.reply)
        })
        .catch(() => {
          queueJarvisReply('Web summary failed due to an unexpected adapter error.')
        })

      return
    }

    if (routeResult.action?.type === COMMAND_TYPES.RUNTIME_DIAGNOSTIC) {
      replyText = buildRuntimeDiagnosticReply({
        bridgeHealth,
        telemetry,
      })

      setRecentActivity((prev) => [
        {
          ago: 'just now',
          label: 'Runtime diagnostics generated',
        },
        ...prev,
      ].slice(0, 6))
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
          queueJarvisReply(
            'Model route failed unexpectedly. Recovery: verify bridge online state, provider keys, and cloud toggle, then retry your prompt.',
          )
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
            <LeftRail statusMeters={statusMeters} />
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
              userProfile={userProfile}
              bridgeHealth={bridgeHealth}
              onRefreshBridgeHealth={refreshRuntimeStatus}
              onModelConfigChange={handleModelConfigChange}
              notes={notes}
              focusSection={panelFocus}
              onFocusChange={setPanelFocus}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
