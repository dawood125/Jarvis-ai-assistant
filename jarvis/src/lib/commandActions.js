const MAX_SEARCH_RESULTS = 4
const DEFAULT_SYSTEM_LAUNCH_PATH = '/api/system/launch'

function resolveSystemLaunchUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_SYSTEM_LAUNCH_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_SYSTEM_LAUNCH_PATH}`
}

function createActivityEntry(label) {
  return {
    ago: 'just now',
    label,
  }
}

function truncateLabel(prefix, content, maxLen = 44) {
  const compact = content.trim()
  if (!compact) {
    return `${prefix}n/a`
  }

  if (compact.length <= maxLen) {
    return `${prefix}${compact}`
  }

  return `${prefix}${compact.slice(0, maxLen)}...`
}

export function executeLaunchAppAction(action, options = {}) {
  const target = action?.payload?.target || 'target app'
  const resolvedTarget = action?.payload?.resolvedTarget
  const confirmed = Boolean(options.confirmed)

  if (!resolvedTarget) {
    return {
      reply:
        `Launch contract ready for ${target}, but I could not map it to a known app yet. ` +
        'Try names like: VS Code, terminal, Chrome, Spotify, or a website URL.',
      activityEntry: createActivityEntry(truncateLabel('Launch staged: ', target)),
    }
  }

  if (confirmed) {
    return {
      reply:
        `Confirmed. Preview execution complete: ${resolvedTarget.label} launch contract executed safely. ` +
        'System-level launching will be wired in Electron phase with explicit permission controls.',
      activityEntry: createActivityEntry(`Launch confirmed: ${resolvedTarget.label}`),
    }
  }

  return {
    reply:
      `Launch contract prepared for ${resolvedTarget.label}. ` +
      'Execution remains in preview mode until system-action confirmation is enabled.',
    activityEntry: createActivityEntry(`Launch staged: ${resolvedTarget.label}`),
  }
}

export async function executeConfirmedLaunchAppAction(action, context = {}) {
  const target = action?.payload?.target || 'target app'
  const resolvedTarget = action?.payload?.resolvedTarget

  if (!resolvedTarget) {
    return {
      reply:
        `Launch contract ready for ${target}, but I could not map it to a known app yet. ` +
        'Try names like: VS Code, terminal, Chrome, Spotify, or a website URL.',
      activityEntry: createActivityEntry(truncateLabel('Launch failed: ', target)),
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  const bridgeAllowsSystemActions = Boolean(context?.bridgeHealth?.systemActionsEnabled)
  const clientAllowsSystemActions = import.meta.env.VITE_ENABLE_SYSTEM_ACTIONS === 'true'

  if (!bridgeOnline) {
    return {
      reply:
        `Launch request for ${resolvedTarget.label} confirmed, but bridge is offline. ` +
        'Start the bridge and try again.',
      activityEntry: createActivityEntry(`Launch blocked: ${resolvedTarget.label}`),
    }
  }

  if (!clientAllowsSystemActions || !bridgeAllowsSystemActions) {
    return {
      reply:
        `Launch confirmed for ${resolvedTarget.label}, but system actions are currently disabled by safety policy. ` +
        'Enable VITE_ENABLE_SYSTEM_ACTIONS and SYSTEM_ACTIONS_ENABLED when you want real execution.',
      activityEntry: createActivityEntry(`Launch preview only: ${resolvedTarget.label}`),
    }
  }

  try {
    const response = await fetch(resolveSystemLaunchUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmed: true,
        targetId: resolvedTarget.id,
        targetLabel: resolvedTarget.label,
        targetRaw: target,
        targetUrl: resolvedTarget.id === 'web' ? resolvedTarget.url : undefined,
      }),
    })

    const payload = await response.json()

    if (!response.ok || !payload?.ok) {
      return {
        reply:
          payload?.reply ||
          `Launch failed for ${resolvedTarget.label}. Bridge rejected the action for safety or runtime reasons.`,
        activityEntry: createActivityEntry(`Launch failed: ${resolvedTarget.label}`),
      }
    }

    return {
      reply: payload.reply || `Launch command executed for ${resolvedTarget.label}.`,
      activityEntry: createActivityEntry(`Launch executed: ${resolvedTarget.label}`),
    }
  } catch {
    return {
      reply:
        `Launch request for ${resolvedTarget.label} could not reach the bridge endpoint. ` +
        'Check bridge server status and retry.',
      activityEntry: createActivityEntry(`Launch bridge error: ${resolvedTarget.label}`),
    }
  }
}

function buildSearchIndex({ messages, recentActivity, notes }) {
  const chatEntries = (messages || []).map((item) => ({
    source: 'chat',
    text: item.text,
  }))

  const activityEntries = (recentActivity || []).map((item) => ({
    source: 'activity',
    text: item.label,
  }))

  const noteEntries = (notes || []).map((item) => ({
    source: 'notes',
    text: item.text,
  }))

  return [...chatEntries, ...activityEntries, ...noteEntries]
}

export function executeFileSearchAction(action, context) {
  const query = action?.payload?.query?.trim() || ''

  if (!query || query === 'all') {
    return {
      reply: 'Search query missing. Try: search for memory or search for diagnostics.',
      activityEntry: createActivityEntry('Local search: missing query'),
    }
  }

  const normalizedQuery = query.toLowerCase()
  const index = buildSearchIndex(context)
  const matches = index.filter((item) => item.text.toLowerCase().includes(normalizedQuery)).slice(0, MAX_SEARCH_RESULTS)

  if (matches.length === 0) {
    return {
      reply: `No local matches found for "${query}". Add notes or messages first, then search again.`,
      activityEntry: createActivityEntry(truncateLabel('Local search: ', query)),
    }
  }

  const digest = matches.map((item, i) => `${i + 1}) ${item.source}: ${item.text}`).join(' | ')

  return {
    reply: `Indexed matches for "${query}": ${digest}`,
    activityEntry: createActivityEntry(truncateLabel('Local search: ', query)),
  }
}
