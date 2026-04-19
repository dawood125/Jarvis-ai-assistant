export const COMMAND_TYPES = Object.freeze({
  STATUS: 'status',
  LAUNCH_APP: 'launch-app',
  SAVE_NOTE: 'save-note',
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

function formatStatus(statusMeters) {
  if (!statusMeters || statusMeters.length === 0) {
    return 'All core telemetry channels are online and stable.'
  }

  const lines = statusMeters.map((item) => `${item.name}: ${item.valueLabel}`)
  return `System snapshot -> ${lines.join(' | ')}`
}

function resolveAppTarget(targetText) {
  const normalizedTarget = targetText.toLowerCase()
  return APP_CATALOG.find((app) => app.aliases.some((alias) => normalizedTarget.includes(alias))) || null
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

  if (normalized.includes('status') || normalized.includes('health') || normalized.includes('telemetry')) {
    return {
      reply: formatStatus(statusMeters),
      action: null,
      intent: COMMAND_TYPES.STATUS,
    }
  }

  if (
    normalized.startsWith('open ') ||
    normalized.startsWith('launch ') ||
    normalized.startsWith('start ') ||
    normalized.startsWith('run ')
  ) {
    const target = cleanCommand.split(' ').slice(1).join(' ').trim()
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

  if (
    normalized === 'list notes' ||
    normalized === 'list note' ||
    normalized === 'show notes' ||
    normalized === 'show note' ||
    normalized === 'view notes' ||
    normalized === 'view note'
  ) {
    return {
      reply: 'Loading notes from local memory...',
      action: {
        type: COMMAND_TYPES.LIST_NOTES,
      },
      intent: COMMAND_TYPES.LIST_NOTES,
    }
  }

  if (normalized.includes('search')) {
    const query = cleanCommand
      .replace(/^search\s*/i, '')
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
        'Available now: status checks, app-launch intent preview, local file-context search, local notes save/list, and command history persistence.',
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
