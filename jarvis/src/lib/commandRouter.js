export const COMMAND_TYPES = Object.freeze({
  STATUS: 'status',
  RUNTIME_DIAGNOSTIC: 'runtime-diagnostic',
  LAUNCH_APP: 'launch-app',
  CLOSE_APP: 'close-app',
  OPEN_PROJECT: 'open-project',
  CLOSE_PROJECT: 'close-project',
  WEB_SUMMARIZE: 'web-summarize',
  SAVE_NOTE: 'save-note',
  SAVE_JOURNAL: 'save-journal',
  DAILY_RECAP: 'daily-recap',
  LIST_NOTES: 'list-notes',
  FILE_SEARCH: 'file-search',
  HELP: 'help',
  UNKNOWN: 'unknown',
})

const APP_CATALOG = [
  {
    id: 'vscode',
    label: 'VS Code',
    aliases: ['vscode', 'vs code', 'visual studio code', 'code'],
  },
  {
    id: 'terminal',
    label: 'Terminal',
    aliases: ['terminal', 'powershell', 'cmd', 'command prompt'],
  },
  {
    id: 'chrome',
    label: 'Google Chrome',
    aliases: ['chrome', 'google chrome', 'browser'],
  },
  {
    id: 'spotify',
    label: 'Spotify',
    aliases: ['spotify', 'music'],
  },
]

const WEB_TARGET_CATALOG = [
  { label: 'YouTube', aliases: ['youtube', 'yt'], url: 'https://youtube.com' },
  { label: 'GitHub', aliases: ['github'], url: 'https://github.com' },
  { label: 'Gmail', aliases: ['gmail'], url: 'https://mail.google.com' },
  { label: 'Google', aliases: ['google'], url: 'https://google.com' },
  { label: 'ChatGPT', aliases: ['chatgpt'], url: 'https://chatgpt.com' },
]

const PROJECT_CATALOG = [
  {
    id: 'jarvis',
    label: 'Jarvis AI Personal Assistant',
    aliases: ['jarvis', 'jarvis ai', 'jarvis project', 'assistant project'],
  },
  {
    id: 'freelancehub',
    label: 'FreelanceHub',
    aliases: ['freelancehub', 'freelance hub'],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    aliases: ['portfolio', 'portfolio v2', 'my portfolio'],
  },
  {
    id: 'hospital-system',
    label: 'Hospital System',
    aliases: ['hospital', 'hospital system', 'hostipal system'],
  },
]

function cleanExtractedText(text) {
  return text.replace(/^[\s:.,-]+/, '').trim()
}

function normalizeEntityText(text) {
  return String(text || '')
    .trim()
    .replace(/^(?:the|my)\s+/i, '')
    .trim()
}

function isNaturalStatusQuery(normalized) {
  if (normalized.includes('status') || normalized.includes('health') || normalized.includes('telemetry')) {
    return true
  }

  if (normalized.includes('what is happening in my system') || normalized.includes("what's happening in my system")) {
    return true
  }

  return (
    normalized.includes('system') &&
    (normalized.includes('report') ||
      normalized.includes('diagnostic') ||
      normalized.includes('happening') ||
      normalized.includes('going on'))
  )
}

function extractLaunchTarget(cleanCommand, normalized) {
  if (
    normalized.startsWith('open ') ||
    normalized.startsWith('launch ') ||
    normalized.startsWith('start ') ||
    normalized.startsWith('run ')
  ) {
    return cleanCommand.split(' ').slice(1).join(' ').trim()
  }

  const naturalMatch = cleanCommand.match(/\b(?:open|launch|start|run)\b\s+(.+)$/i)
  if (!naturalMatch?.[1]) {
    return null
  }

  return cleanExtractedText(naturalMatch[1])
}

function extractCloseTarget(cleanCommand, normalized) {
  if (
    normalized.startsWith('close ') ||
    normalized.startsWith('quit ') ||
    normalized.startsWith('stop ') ||
    normalized.startsWith('exit ')
  ) {
    return cleanCommand.split(' ').slice(1).join(' ').trim()
  }

  const naturalMatch = cleanCommand.match(/\b(?:close|quit|stop|exit)\b\s+(.+)$/i)
  if (!naturalMatch?.[1]) {
    return null
  }

  return cleanExtractedText(naturalMatch[1])
}

function extractProjectName(cleanCommand) {
  const patterns = [
    /(?:open|launch|start|run)\s+(?:my\s+)?(.+?)\s+project$/i,
    /(?:open|launch|start|run)\s+project\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = cleanCommand.match(pattern)
    if (match?.[1]) {
      const extracted = cleanExtractedText(match[1])
      if (extracted) {
        return extracted
      }
    }
  }

  return null
}

function extractCloseProjectName(cleanCommand) {
  const patterns = [
    /(?:close|stop|exit|quit)\s+(?:my\s+)?(.+?)\s+project$/i,
    /(?:close|stop|exit|quit)\s+project\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = cleanCommand.match(pattern)
    if (match?.[1]) {
      const extracted = cleanExtractedText(match[1])
      if (extracted) {
        return extracted
      }
    }
  }

  return null
}

function extractWebSummaryRequest(cleanCommand, normalized) {
  const urlMatch = cleanCommand.match(/(https?:\/\/\S+|www\.\S+)/i)
  const extractedUrl = urlMatch?.[1] || null

  if (normalized.startsWith('summarize ') || normalized.startsWith('browse ') || normalized.startsWith('web summary ')) {
    const query = cleanCommand
      .replace(/^summarize\s*/i, '')
      .replace(/^browse\s*/i, '')
      .replace(/^web summary\s*/i, '')
      .replace(/(https?:\/\/\S+|www\.\S+)/i, '')
      .trim()

    return {
      url: extractedUrl,
      query: query || null,
    }
  }

  if (normalized.includes('trending in tech') || normalized.includes('tech news')) {
    return {
      url: null,
      query: 'trending in tech',
    }
  }

  if ((normalized.includes('summarize') || normalized.includes('browse')) && extractedUrl) {
    return {
      url: extractedUrl,
      query: null,
    }
  }

  return null
}

function extractNaturalNoteText(cleanCommand) {
  const patterns = [
    /(?:please\s+)?(?:add|save|create|take)\s+(?:today\s+)?(?:tasks?\s+)?notes?\s*[:.-]?\s*(.+)$/i,
    /(?:please\s+)?(?:add|save|create|take)\s+(?:a\s+)?note\s*[:.-]?\s*(.+)$/i,
    /\bremember\s+(?:that\s+)?(.+)$/i,
    /\bnote\s*[:.-]\s*(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = cleanCommand.match(pattern)
    if (match?.[1]) {
      const extracted = cleanExtractedText(match[1])
      if (extracted) {
        return extracted
      }
    }
  }

  return null
}

function isNaturalListNotes(normalized) {
  if (
    normalized === 'list notes' ||
    normalized === 'list note' ||
    normalized === 'show notes' ||
    normalized === 'show note' ||
    normalized === 'view notes' ||
    normalized === 'view note'
  ) {
    return true
  }

  return (
    normalized.includes('notes') &&
    (normalized.includes('list') || normalized.includes('show') || normalized.includes('view') || normalized.includes('my notes'))
  )
}

function isDailyRecapRequest(normalized) {
  if (
    normalized === 'daily recap' ||
    normalized === 'today recap' ||
    normalized === 'recap today' ||
    normalized === 'show recap' ||
    normalized === 'today summary'
  ) {
    return true
  }

  return (
    normalized.includes('recap') ||
    normalized.includes('summary of today') ||
    normalized.includes('what did i do today') ||
    normalized.includes('show my today tasks')
  )
}

function isRuntimeDiagnosticRequest(normalized) {
  return (
    normalized.includes('diagnose launch') ||
    normalized.includes('launch issue') ||
    normalized.includes('not opening') ||
    normalized.includes('why not opening') ||
    normalized.includes('why app not opening') ||
    normalized === 'diagnose' ||
    normalized === 'diagnostics'
  )
}

function extractJournalText(cleanCommand, normalized) {
  const cleanedCommand = cleanCommand.replace(/^hey\s+jarvis[\s,:-]*/i, '').trim()

  const patterns = [
    /^(?:journal|log)(?:\s+today)?\s*[:.-]?\s*(.+)$/i,
    /(?:please\s+)?add\s+today\s+(?:task\s+)?notes?\s*[:.-]?\s*(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = cleanedCommand.match(pattern)
    if (match?.[1]) {
      const extracted = cleanExtractedText(match[1])
      if (extracted) {
        return extracted
      }
    }
  }

  const journalSignals = /(today\s+i\s+|i\s+worked\s+on|i\s+started|i\s+completed|i\s+built|i\s+implemented|i\s+fixed)/i
  if (journalSignals.test(normalized) && normalized.includes('today')) {
    return cleanedCommand
  }

  return null
}

function formatStatus(statusMeters) {
  if (!statusMeters || statusMeters.length === 0) {
    return 'All core telemetry channels are online and stable.'
  }

  const lines = statusMeters.map((item) => `${item.name}: ${item.valueLabel}`)
  return `System snapshot -> ${lines.join(' | ')}`
}

function normalizeWebUrl(targetText) {
  const compact = targetText.trim()
  if (!compact || /\s/.test(compact)) {
    return null
  }

  const candidate = /^https?:\/\//i.test(compact) ? compact : `https://${compact}`

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function resolveWebTarget(targetText) {
  const normalizedTarget = targetText.toLowerCase().trim()

  for (const item of WEB_TARGET_CATALOG) {
    if (item.aliases.some((alias) => normalizedTarget === alias || normalizedTarget.startsWith(`${alias} `))) {
      return {
        id: 'web',
        label: item.label,
        url: item.url,
      }
    }
  }

  const resolvedUrl = normalizeWebUrl(targetText)
  if (!resolvedUrl) {
    return null
  }

  try {
    const parsed = new URL(resolvedUrl)
    return {
      id: 'web',
      label: `Website (${parsed.hostname})`,
      url: resolvedUrl,
    }
  } catch {
    return {
      id: 'web',
      label: 'Website',
      url: resolvedUrl,
    }
  }
}

function resolveAppTarget(targetText) {
  const normalizedTarget = normalizeEntityText(targetText).toLowerCase()
  const appMatch = APP_CATALOG.find((app) => app.aliases.some((alias) => normalizedTarget.includes(alias)))
  if (appMatch) {
    return appMatch
  }

  return resolveWebTarget(normalizedTarget)
}

function resolveProjectTarget(projectText) {
  const normalizedTarget = normalizeEntityText(projectText).toLowerCase().trim()

  return PROJECT_CATALOG.find((project) =>
    project.aliases.some(
      (alias) =>
        normalizedTarget === alias ||
        normalizedTarget.includes(alias) ||
        alias.includes(normalizedTarget),
    ),
  ) || null
}

export function routeCommand(command, statusMeters) {
  const cleanCommand = command.trim()
  const normalized = cleanCommand.toLowerCase()

  if (!cleanCommand) {
    return {
      reply: 'I did not receive a command. Please try again.',
      action: null,
      intent: COMMAND_TYPES.UNKNOWN,
    }
  }

  if (isNaturalStatusQuery(normalized)) {
    return {
      reply: formatStatus(statusMeters),
      action: null,
      intent: COMMAND_TYPES.STATUS,
    }
  }

  if (isRuntimeDiagnosticRequest(normalized)) {
    return {
      reply: 'Running runtime diagnostics for launch and system channels...',
      action: {
        type: COMMAND_TYPES.RUNTIME_DIAGNOSTIC,
      },
      intent: COMMAND_TYPES.RUNTIME_DIAGNOSTIC,
    }
  }

  if (isDailyRecapRequest(normalized)) {
    return {
      reply: 'Building your daily recap from journal memory...',
      action: {
        type: COMMAND_TYPES.DAILY_RECAP,
      },
      intent: COMMAND_TYPES.DAILY_RECAP,
    }
  }

  const journalText = extractJournalText(cleanCommand, normalized)
  if (journalText) {
    return {
      reply: 'Capturing your daily progress into journal memory...',
      action: {
        type: COMMAND_TYPES.SAVE_JOURNAL,
        payload: {
          text: journalText,
        },
      },
      intent: COMMAND_TYPES.SAVE_JOURNAL,
    }
  }

  const projectName = extractProjectName(cleanCommand)
  if (projectName) {
    const resolvedProject = resolveProjectTarget(projectName)

    return {
      reply: resolvedProject
        ? `Project launch intent captured for ${resolvedProject.label}. Preparing a safe execution preview.`
        : `Project launch intent captured for ${projectName}. Add project mapping in bridge env to enable execution.`,
      action: {
        type: COMMAND_TYPES.OPEN_PROJECT,
        payload: {
          projectName,
          resolvedProject,
        },
        requiresConfirmation: true,
        executionMode: 'preview-only',
      },
      intent: COMMAND_TYPES.OPEN_PROJECT,
    }
  }

  const closeProjectName = extractCloseProjectName(cleanCommand)
  if (closeProjectName) {
    const resolvedProject = resolveProjectTarget(closeProjectName)

    return {
      reply: resolvedProject
        ? `Project close intent captured for ${resolvedProject.label}. Preparing a safe execution preview.`
        : `Project close intent captured for ${closeProjectName}. Add project mapping in bridge env to enable execution.`,
      action: {
        type: COMMAND_TYPES.CLOSE_PROJECT,
        payload: {
          projectName: closeProjectName,
          resolvedProject,
        },
        requiresConfirmation: true,
        executionMode: 'preview-only',
      },
      intent: COMMAND_TYPES.CLOSE_PROJECT,
    }
  }

  const webSummaryRequest = extractWebSummaryRequest(cleanCommand, normalized)
  if (webSummaryRequest) {
    return {
      reply: 'Web summary request accepted. Fetching and condensing information now...',
      action: {
        type: COMMAND_TYPES.WEB_SUMMARIZE,
        payload: webSummaryRequest,
      },
      intent: COMMAND_TYPES.WEB_SUMMARIZE,
    }
  }

  const launchTarget = extractLaunchTarget(cleanCommand, normalized)
  if (launchTarget) {
    const target = launchTarget
    const resolvedTarget = resolveAppTarget(target)

    return {
      reply: resolvedTarget
        ? `Launch intent captured for ${resolvedTarget.label}. Preparing a safe execution preview.`
        : `Launch intent captured for ${target || 'target app'}. Running live system actions is currently locked behind confirmation mode.`,
      action: {
        type: COMMAND_TYPES.LAUNCH_APP,
        payload: {
          target: target || 'target app',
          resolvedTarget,
        },
        requiresConfirmation: true,
        executionMode: 'preview-only',
      },
      intent: COMMAND_TYPES.LAUNCH_APP,
    }
  }

  const closeTarget = extractCloseTarget(cleanCommand, normalized)
  if (closeTarget) {
    const resolvedTarget = resolveAppTarget(closeTarget)

    return {
      reply: resolvedTarget
        ? `Close intent captured for ${resolvedTarget.label}. Preparing a safe execution preview.`
        : `Close intent captured for ${closeTarget || 'target app'}. Use names like VS Code, terminal, Chrome, or Spotify.`,
      action: {
        type: COMMAND_TYPES.CLOSE_APP,
        payload: {
          target: closeTarget || 'target app',
          resolvedTarget,
        },
        requiresConfirmation: true,
        executionMode: 'preview-only',
      },
      intent: COMMAND_TYPES.CLOSE_APP,
    }
  }

  if (normalized.startsWith('note ') || normalized.startsWith('save note')) {
    const noteText = cleanCommand.replace(/^save note\s*/i, '').replace(/^note\s*/i, '').trim()

    if (!noteText) {
      return {
        reply: 'Please add note content after the note command. Example: note Review Groq latency.',
        action: null,
        intent: COMMAND_TYPES.SAVE_NOTE,
      }
    }

    return {
      reply: 'Saving note to local memory...',
      action: {
        type: COMMAND_TYPES.SAVE_NOTE,
        payload: { text: noteText },
      },
      intent: COMMAND_TYPES.SAVE_NOTE,
    }
  }

  const naturalNoteText = extractNaturalNoteText(cleanCommand)
  if (naturalNoteText) {
    return {
      reply: 'Captured your note request. Saving to local memory...',
      action: {
        type: COMMAND_TYPES.SAVE_NOTE,
        payload: { text: naturalNoteText },
      },
      intent: COMMAND_TYPES.SAVE_NOTE,
    }
  }

  if (isNaturalListNotes(normalized)) {
    return {
      reply: 'Loading notes from local memory...',
      action: {
        type: COMMAND_TYPES.LIST_NOTES,
      },
      intent: COMMAND_TYPES.LIST_NOTES,
    }
  }

  if (normalized.includes('search') || normalized.startsWith('find ') || normalized.startsWith('lookup ')) {
    const query = cleanCommand
      .replace(/^search\s*/i, '')
      .replace(/^find\s*/i, '')
      .replace(/^lookup\s*/i, '')
      .replace(/^files?\s*/i, '')
      .replace(/^for\s*/i, '')
      .trim()

    return {
      reply: 'Search request accepted. Scanning local indexed context now.',
      action: {
        type: COMMAND_TYPES.FILE_SEARCH,
        payload: {
          query: query || 'all',
        },
        executionMode: 'local-index',
      },
      intent: COMMAND_TYPES.FILE_SEARCH,
    }
  }

  if (normalized === 'help' || normalized.includes('what can you do')) {
    return {
      reply:
        'Available now: status checks, runtime diagnostics, launch/close app intents with confirmation, project open/close intents, real file search, web summarize, notes save/list, daily journal capture, and daily recap summaries.',
      action: null,
      intent: COMMAND_TYPES.HELP,
    }
  }

  return {
    reply: `Command received: "${cleanCommand}". I understand your intent and can map it to an action flow next.`,
    action: null,
    intent: COMMAND_TYPES.UNKNOWN,
  }
}

export function createJarvisReply(command, statusMeters) {
  return routeCommand(command, statusMeters).reply
}
