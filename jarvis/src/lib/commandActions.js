const MAX_SEARCH_RESULTS = 4

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
        'Try names like: VS Code, terminal, Chrome, or Spotify.',
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
