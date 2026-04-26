const MAX_SEARCH_RESULTS = 4
const DEFAULT_SYSTEM_LAUNCH_PATH = '/api/system/launch'
const DEFAULT_SYSTEM_CLOSE_PATH = '/api/system/close'
const DEFAULT_SYSTEM_PROJECT_OPEN_PATH = '/api/system/project/open'
const DEFAULT_SYSTEM_PROJECT_CLOSE_PATH = '/api/system/project/close'
const DEFAULT_SYSTEM_FILE_SEARCH_PATH = '/api/system/file-search'
const DEFAULT_WEB_SUMMARY_PATH = '/api/web/summarize'

function resolveSystemLaunchUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_SYSTEM_LAUNCH_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_SYSTEM_LAUNCH_PATH}`
}

function resolveSystemCloseUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_SYSTEM_CLOSE_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_SYSTEM_CLOSE_PATH}`
}

function resolveProjectOpenUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_SYSTEM_PROJECT_OPEN_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_SYSTEM_PROJECT_OPEN_PATH}`
}

function resolveProjectCloseUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_SYSTEM_PROJECT_CLOSE_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_SYSTEM_PROJECT_CLOSE_PATH}`
}

function resolveSystemFileSearchUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_SYSTEM_FILE_SEARCH_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_SYSTEM_FILE_SEARCH_PATH}`
}

function resolveWebSummaryUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_WEB_SUMMARY_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_WEB_SUMMARY_PATH}`
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

function createLaunchFailureReply(targetLabel, reason, fallbackMessage) {
  const reasonText = reason ? ` (${reason})` : ''

  if (reason === 'bridge_offline' || reason === 'bridge_unreachable' || reason?.startsWith('bridge_http_')) {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: start the bridge with npm run bridge, press REFRESH in Model Routing, then retry launch and confirm.'
    )
  }

  if (reason === 'system_actions_disabled') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: set VITE_ENABLE_SYSTEM_ACTIONS=true and SYSTEM_ACTIONS_ENABLED=true, restart client/bridge, then retry.'
    )
  }

  if (reason === 'target_not_allowed') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: use supported targets like VS Code, terminal, Chrome, Spotify, YouTube, GitHub, or a valid website URL.'
    )
  }

  if (reason === 'invalid_url') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: use launch https://example.com or launch github.com.'
    )
  }

  if (reason === 'no_launch_strategy' || reason === 'spawn_error' || reason?.startsWith('exit_')) {
    return (
      `${fallbackMessage}${reasonText} ` +
      `Recovery: configure SYSTEM_APP_* overrides for ${targetLabel}, then restart bridge and retry.`
    )
  }

  return (
    `${fallbackMessage}${reasonText} ` +
    'Recovery: run diagnose launch for runtime checks, then retry the command.'
  )
}

function createCloseFailureReply(targetLabel, reason, fallbackMessage) {
  const reasonText = reason ? ` (${reason})` : ''

  if (reason === 'bridge_offline' || reason === 'bridge_unreachable' || reason?.startsWith('bridge_http_')) {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: start the bridge with npm run bridge, press REFRESH in Model Routing, then retry close and confirm.'
    )
  }

  if (reason === 'system_actions_disabled') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: set VITE_ENABLE_SYSTEM_ACTIONS=true and SYSTEM_ACTIONS_ENABLED=true, restart client/bridge, then retry.'
    )
  }

  if (reason === 'target_not_allowed') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: use supported close targets like VS Code, terminal, Chrome, or Spotify.'
    )
  }

  return `${fallbackMessage}${reasonText} Recovery: run diagnose launch and retry the close command.`
}

function createProjectFailureReply(projectLabel, reason, fallbackMessage) {
  const reasonText = reason ? ` (${reason})` : ''

  if (reason === 'project_not_mapped' || reason === 'project_not_configured') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: set SYSTEM_PROJECT_* path for this project in bridge env, restart bridge, then retry.'
    )
  }

  if (reason === 'bridge_offline' || reason === 'bridge_unreachable' || reason?.startsWith('bridge_http_')) {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: start bridge with npm run bridge, then retry project launch and confirm.'
    )
  }

  if (reason === 'system_actions_disabled') {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: enable VITE_ENABLE_SYSTEM_ACTIONS and SYSTEM_ACTIONS_ENABLED, restart both runtimes, then retry.'
    )
  }

  return `${fallbackMessage}${reasonText} Recovery: verify project path mapping and retry.`
}

function createFileSearchFailureReply(reason, fallbackMessage) {
  const reasonText = reason ? ` (${reason})` : ''

  if (reason === 'bridge_offline' || reason === 'bridge_unreachable' || reason?.startsWith('bridge_http_')) {
    return (
      `${fallbackMessage}${reasonText} ` +
      'Recovery: start bridge with npm run bridge and retry. Showing local indexed fallback results meanwhile.'
    )
  }

  return `${fallbackMessage}${reasonText} Recovery: retry with a specific filename keyword.`
}

function createWebSummaryFailureReply(reason, fallbackMessage) {
  const reasonText = reason ? ` (${reason})` : ''

  if (reason === 'bridge_offline' || reason === 'bridge_unreachable' || reason?.startsWith('bridge_http_')) {
    return `${fallbackMessage}${reasonText} Recovery: start bridge with npm run bridge and retry web summary.`
  }

  if (reason === 'invalid_url') {
    return `${fallbackMessage}${reasonText} Recovery: use summarize https://example.com or summarize tech news.`
  }

  return `${fallbackMessage}${reasonText} Recovery: retry with another URL or query phrase.`
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
    const reason = 'target_unresolved'
    return {
      reply: createLaunchFailureReply(
        target,
        reason,
        `Launch contract ready for ${target}, but I could not map it to a known app yet.`,
      ),
      activityEntry: createActivityEntry(truncateLabel('Launch failed: ', target)),
      reason,
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  const bridgeAllowsSystemActions = Boolean(context?.bridgeHealth?.systemActionsEnabled)
  const clientAllowsSystemActions = import.meta.env.VITE_ENABLE_SYSTEM_ACTIONS === 'true'

  if (!bridgeOnline) {
    const reason = 'bridge_offline'
    return {
      reply: createLaunchFailureReply(
        resolvedTarget.label,
        reason,
        `Launch request for ${resolvedTarget.label} confirmed, but bridge is offline.`,
      ),
      activityEntry: createActivityEntry(`Launch blocked: ${resolvedTarget.label}`),
      reason,
    }
  }

  if (!clientAllowsSystemActions || !bridgeAllowsSystemActions) {
    const reason = 'system_actions_disabled'
    return {
      reply: createLaunchFailureReply(
        resolvedTarget.label,
        reason,
        `Launch confirmed for ${resolvedTarget.label}, but system actions are currently disabled by safety policy.`,
      ),
      activityEntry: createActivityEntry(`Launch preview only: ${resolvedTarget.label}`),
      reason,
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
      const reason = payload?.reason || `bridge_http_${response.status}`
      return {
        reply: createLaunchFailureReply(
          resolvedTarget.label,
          reason,
          payload?.reply || `Launch failed for ${resolvedTarget.label}. Bridge rejected the action.`,
        ),
        activityEntry: createActivityEntry(`Launch failed: ${resolvedTarget.label}`),
        reason,
      }
    }

    return {
      reply: payload.reply || `Launch command executed for ${resolvedTarget.label}.`,
      activityEntry: createActivityEntry(`Launch executed: ${resolvedTarget.label}`),
      reason: null,
    }
  } catch {
    const reason = 'bridge_unreachable'
    return {
      reply: createLaunchFailureReply(
        resolvedTarget.label,
        reason,
        `Launch request for ${resolvedTarget.label} could not reach the bridge endpoint.`,
      ),
      activityEntry: createActivityEntry(`Launch bridge error: ${resolvedTarget.label}`),
      reason,
    }
  }
}

export async function executeConfirmedCloseAppAction(action, context = {}) {
  const target = action?.payload?.target || 'target app'
  const resolvedTarget = action?.payload?.resolvedTarget

  if (!resolvedTarget || resolvedTarget.id === 'web') {
    const reason = 'target_not_allowed'
    return {
      reply: createCloseFailureReply(target, reason, `Close contract is not available for ${target}.`),
      activityEntry: createActivityEntry(truncateLabel('Close failed: ', target)),
      reason,
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  const bridgeAllowsSystemActions = Boolean(context?.bridgeHealth?.systemActionsEnabled)
  const clientAllowsSystemActions = import.meta.env.VITE_ENABLE_SYSTEM_ACTIONS === 'true'

  if (!bridgeOnline) {
    const reason = 'bridge_offline'
    return {
      reply: createCloseFailureReply(
        resolvedTarget.label,
        reason,
        `Close request for ${resolvedTarget.label} confirmed, but bridge is offline.`,
      ),
      activityEntry: createActivityEntry(`Close blocked: ${resolvedTarget.label}`),
      reason,
    }
  }

  if (!clientAllowsSystemActions || !bridgeAllowsSystemActions) {
    const reason = 'system_actions_disabled'
    return {
      reply: createCloseFailureReply(
        resolvedTarget.label,
        reason,
        `Close confirmed for ${resolvedTarget.label}, but system actions are disabled by safety policy.`,
      ),
      activityEntry: createActivityEntry(`Close preview only: ${resolvedTarget.label}`),
      reason,
    }
  }

  try {
    const response = await fetch(resolveSystemCloseUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmed: true,
        targetId: resolvedTarget.id,
        targetLabel: resolvedTarget.label,
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      const reason = payload?.reason || `bridge_http_${response.status}`
      return {
        reply: createCloseFailureReply(
          resolvedTarget.label,
          reason,
          payload?.reply || `Close failed for ${resolvedTarget.label}. Bridge rejected the request.`,
        ),
        activityEntry: createActivityEntry(`Close failed: ${resolvedTarget.label}`),
        reason,
      }
    }

    return {
      reply: payload.reply || `Close command executed for ${resolvedTarget.label}.`,
      activityEntry: createActivityEntry(`Close executed: ${resolvedTarget.label}`),
      reason: null,
    }
  } catch {
    const reason = 'bridge_unreachable'
    return {
      reply: createCloseFailureReply(
        resolvedTarget.label,
        reason,
        `Close request for ${resolvedTarget.label} could not reach the bridge endpoint.`,
      ),
      activityEntry: createActivityEntry(`Close bridge error: ${resolvedTarget.label}`),
      reason,
    }
  }
}

export async function executeConfirmedOpenProjectAction(action, context = {}) {
  const projectName = action?.payload?.projectName || 'project'
  const resolvedProject = action?.payload?.resolvedProject

  if (!resolvedProject) {
    const reason = 'project_not_mapped'
    return {
      reply: createProjectFailureReply(
        projectName,
        reason,
        `Project launch contract captured for ${projectName}, but no mapping is available yet.`,
      ),
      activityEntry: createActivityEntry(truncateLabel('Project failed: ', projectName)),
      reason,
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  const bridgeAllowsSystemActions = Boolean(context?.bridgeHealth?.systemActionsEnabled)
  const clientAllowsSystemActions = import.meta.env.VITE_ENABLE_SYSTEM_ACTIONS === 'true'

  if (!bridgeOnline) {
    const reason = 'bridge_offline'
    return {
      reply: createProjectFailureReply(
        resolvedProject.label,
        reason,
        `Project launch for ${resolvedProject.label} confirmed, but bridge is offline.`,
      ),
      activityEntry: createActivityEntry(`Project blocked: ${resolvedProject.label}`),
      reason,
    }
  }

  if (!clientAllowsSystemActions || !bridgeAllowsSystemActions) {
    const reason = 'system_actions_disabled'
    return {
      reply: createProjectFailureReply(
        resolvedProject.label,
        reason,
        `Project launch for ${resolvedProject.label} is blocked by safety policy.`,
      ),
      activityEntry: createActivityEntry(`Project preview only: ${resolvedProject.label}`),
      reason,
    }
  }

  try {
    const response = await fetch(resolveProjectOpenUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmed: true,
        projectId: resolvedProject.id,
        projectLabel: resolvedProject.label,
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      const reason = payload?.reason || `bridge_http_${response.status}`
      return {
        reply: createProjectFailureReply(
          resolvedProject.label,
          reason,
          payload?.reply || `Project launch failed for ${resolvedProject.label}.`,
        ),
        activityEntry: createActivityEntry(`Project failed: ${resolvedProject.label}`),
        reason,
      }
    }

    return {
      reply: payload.reply || `Project launch executed for ${resolvedProject.label}.`,
      activityEntry: createActivityEntry(`Project launched: ${resolvedProject.label}`),
      reason: null,
    }
  } catch {
    const reason = 'bridge_unreachable'
    return {
      reply: createProjectFailureReply(
        resolvedProject.label,
        reason,
        `Project launch request for ${resolvedProject.label} could not reach the bridge endpoint.`,
      ),
      activityEntry: createActivityEntry(`Project bridge error: ${resolvedProject.label}`),
      reason,
    }
  }
}

export async function executeConfirmedCloseProjectAction(action, context = {}) {
  const projectName = action?.payload?.projectName || 'project'
  const resolvedProject = action?.payload?.resolvedProject

  if (!resolvedProject) {
    const reason = 'project_not_mapped'
    return {
      reply: createProjectFailureReply(
        projectName,
        reason,
        `Project close contract captured for ${projectName}, but no mapping is available yet.`,
      ),
      activityEntry: createActivityEntry(truncateLabel('Project close failed: ', projectName)),
      reason,
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  const bridgeAllowsSystemActions = Boolean(context?.bridgeHealth?.systemActionsEnabled)
  const clientAllowsSystemActions = import.meta.env.VITE_ENABLE_SYSTEM_ACTIONS === 'true'

  if (!bridgeOnline) {
    const reason = 'bridge_offline'
    return {
      reply: createProjectFailureReply(
        resolvedProject.label,
        reason,
        `Project close for ${resolvedProject.label} confirmed, but bridge is offline.`,
      ),
      activityEntry: createActivityEntry(`Project close blocked: ${resolvedProject.label}`),
      reason,
    }
  }

  if (!clientAllowsSystemActions || !bridgeAllowsSystemActions) {
    const reason = 'system_actions_disabled'
    return {
      reply: createProjectFailureReply(
        resolvedProject.label,
        reason,
        `Project close for ${resolvedProject.label} is blocked by safety policy.`,
      ),
      activityEntry: createActivityEntry(`Project close preview only: ${resolvedProject.label}`),
      reason,
    }
  }

  try {
    const response = await fetch(resolveProjectCloseUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmed: true,
        projectId: resolvedProject.id,
        projectLabel: resolvedProject.label,
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      const reason = payload?.reason || `bridge_http_${response.status}`
      return {
        reply: createProjectFailureReply(
          resolvedProject.label,
          reason,
          payload?.reply || `Project close failed for ${resolvedProject.label}.`,
        ),
        activityEntry: createActivityEntry(`Project close failed: ${resolvedProject.label}`),
        reason,
      }
    }

    return {
      reply: payload.reply || `Project close executed for ${resolvedProject.label}.`,
      activityEntry: createActivityEntry(`Project closed: ${resolvedProject.label}`),
      reason: null,
    }
  } catch {
    const reason = 'bridge_unreachable'
    return {
      reply: createProjectFailureReply(
        resolvedProject.label,
        reason,
        `Project close request for ${resolvedProject.label} could not reach the bridge endpoint.`,
      ),
      activityEntry: createActivityEntry(`Project close bridge error: ${resolvedProject.label}`),
      reason,
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

function executeLocalIndexedSearchAction(action, context) {
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

export async function executeFileSearchAction(action, context = {}) {
  const query = action?.payload?.query?.trim() || ''

  if (!query || query === 'all') {
    return {
      reply: 'Search query missing. Try: search invoice.pdf or search hospital.',
      activityEntry: createActivityEntry('File search: missing query'),
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  if (!bridgeOnline) {
    const fallback = executeLocalIndexedSearchAction(action, context)
    return {
      ...fallback,
      reply: createFileSearchFailureReply(
        'bridge_offline',
        `Filesystem search unavailable right now. ${fallback.reply}`,
      ),
    }
  }

  try {
    const response = await fetch(resolveSystemFileSearchUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        maxResults: 8,
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      const reason = payload?.reason || `bridge_http_${response.status}`
      const fallback = executeLocalIndexedSearchAction(action, context)
      return {
        ...fallback,
        reply: createFileSearchFailureReply(
          reason,
          payload?.reply || `Filesystem search failed for "${query}". ${fallback.reply}`,
        ),
      }
    }

    const results = Array.isArray(payload?.results) ? payload.results : []
    if (results.length === 0) {
      return {
        reply: `No filesystem matches found for "${query}" in configured search roots.`,
        activityEntry: createActivityEntry(truncateLabel('File search: ', query)),
      }
    }

    const digest = results.map((item, index) => `${index + 1}) ${item}`).join(' | ')
    return {
      reply: `Filesystem matches for "${query}" (${results.length}): ${digest}`,
      activityEntry: createActivityEntry(truncateLabel('File search: ', query)),
    }
  } catch {
    const fallback = executeLocalIndexedSearchAction(action, context)
    return {
      ...fallback,
      reply: createFileSearchFailureReply(
        'bridge_unreachable',
        `Filesystem search could not reach bridge. ${fallback.reply}`,
      ),
    }
  }
}

export async function executeWebSummaryAction(action, context = {}) {
  const url = action?.payload?.url || null
  const query = action?.payload?.query || null

  if (!url && !query) {
    return {
      reply: 'Web summary requires a URL or query. Try: summarize https://example.com',
      activityEntry: createActivityEntry('Web summary: missing input'),
    }
  }

  const bridgeOnline = context?.bridgeHealth?.status === 'online'
  if (!bridgeOnline) {
    return {
      reply: createWebSummaryFailureReply('bridge_offline', 'Web summary is unavailable while bridge is offline.'),
      activityEntry: createActivityEntry('Web summary blocked: bridge offline'),
    }
  }

  try {
    const response = await fetch(resolveWebSummaryUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        query,
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      const reason = payload?.reason || `bridge_http_${response.status}`
      return {
        reply: createWebSummaryFailureReply(
          reason,
          payload?.reply || 'Web summary request failed.',
        ),
        activityEntry: createActivityEntry('Web summary failed'),
      }
    }

    return {
      reply: payload.reply || 'Web summary completed.',
      activityEntry: createActivityEntry('Web summary completed'),
    }
  } catch {
    return {
      reply: createWebSummaryFailureReply('bridge_unreachable', 'Web summary request could not reach bridge.'),
      activityEntry: createActivityEntry('Web summary bridge error'),
    }
  }
}
