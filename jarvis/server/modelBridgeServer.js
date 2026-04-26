import { createServer } from 'node:http'
import os from 'node:os'
import { spawn } from 'node:child_process'
import path from 'node:path'

const PORT = Number(process.env.MODEL_BRIDGE_PORT || 8787)
const REQUEST_TIMEOUT_MS = Number(process.env.MODEL_BRIDGE_REQUEST_TIMEOUT_MS || 12000)
const TELEMETRY_REFRESH_MS = Number(process.env.SYSTEM_TELEMETRY_REFRESH_MS || 5000)
const SYSTEM_PING_HOST = process.env.SYSTEM_PING_HOST || '1.1.1.1'
const FILE_SEARCH_TIMEOUT_MS = Number(process.env.SYSTEM_FILE_SEARCH_TIMEOUT_MS || 12000)
const WEB_SUMMARY_FETCH_TIMEOUT_MS = Number(process.env.SYSTEM_WEB_SUMMARY_FETCH_TIMEOUT_MS || 9000)
const FILE_SEARCH_MAX_RESULTS = Number(process.env.SYSTEM_FILE_SEARCH_MAX_RESULTS || 8)
const ALLOWED_ORIGINS = (process.env.MODEL_BRIDGE_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

const FILE_SEARCH_ROOTS = (process.env.SYSTEM_FILE_SEARCH_ROOTS || `${process.cwd()},${os.homedir()}`)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

function parseEnvBoolean(value) {
  return String(value || '')
    .trim()
    .toLowerCase() === 'true'
}

const SYSTEM_ACTIONS_ENABLED = parseEnvBoolean(process.env.SYSTEM_ACTIONS_ENABLED)

const APP_COMMANDS = {
  vscode: process.env.SYSTEM_APP_VSCODE || 'code',
  terminal: process.env.SYSTEM_APP_TERMINAL || 'wt',
  chrome: process.env.SYSTEM_APP_CHROME || 'chrome',
  spotify: process.env.SYSTEM_APP_SPOTIFY || 'spotify',
}

const PROJECT_PATHS = {
  jarvis: process.env.SYSTEM_PROJECT_JARVIS || process.cwd(),
  freelancehub: process.env.SYSTEM_PROJECT_FREELANCEHUB || '',
  portfolio: process.env.SYSTEM_PROJECT_PORTFOLIO || '',
  'hospital-system': process.env.SYSTEM_PROJECT_HOSPITAL || '',
}

const CLOSE_PROCESS_ALLOWLIST = {
  vscode: ['Code.exe'],
  terminal: ['WindowsTerminal.exe', 'wt.exe', 'powershell.exe', 'cmd.exe'],
  chrome: ['chrome.exe'],
  spotify: ['Spotify.exe'],
  web: (process.env.SYSTEM_WEB_CLOSE_PROCESSES || 'chrome.exe,msedge.exe,firefox.exe')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
}

const LAUNCH_ALLOWLIST = {
  vscode: { label: 'VS Code' },
  terminal: { label: 'Terminal' },
  chrome: { label: 'Google Chrome' },
  spotify: { label: 'Spotify' },
  web: { label: 'Website' },
}

const PROJECT_ALLOWLIST = {
  jarvis: { label: 'Jarvis AI Personal Assistant' },
  freelancehub: { label: 'FreelanceHub' },
  portfolio: { label: 'Portfolio' },
  'hospital-system': { label: 'Hospital System' },
}

const PROJECT_EDITOR_CLOSE_TARGET = process.env.SYSTEM_PROJECT_EDITOR_CLOSE_TARGET || 'vscode'

function createCpuTimesSnapshot() {
  const cpus = os.cpus() || []
  if (cpus.length === 0) {
    return { idle: 0, total: 0 }
  }

  let idle = 0
  let total = 0

  cpus.forEach((cpu) => {
    const times = cpu.times || {}
    idle += times.idle || 0
    total +=
      (times.user || 0) +
      (times.nice || 0) +
      (times.sys || 0) +
      (times.irq || 0) +
      (times.idle || 0)
  })

  return { idle, total }
}

let previousCpuSnapshot = createCpuTimesSnapshot()

function sampleCpuLoadPercent() {
  const nextSnapshot = createCpuTimesSnapshot()
  const deltaIdle = nextSnapshot.idle - previousCpuSnapshot.idle
  const deltaTotal = nextSnapshot.total - previousCpuSnapshot.total

  previousCpuSnapshot = nextSnapshot

  if (deltaTotal <= 0) {
    return null
  }

  const usage = 100 * (1 - deltaIdle / deltaTotal)
  return Math.max(0, Math.min(100, Math.round(usage)))
}

function parsePingOutput(text) {
  if (!text) {
    return null
  }

  const windowsMatch = text.match(/Average\s*=\s*(\d+)ms/i)
  if (windowsMatch?.[1]) {
    return Number(windowsMatch[1])
  }

  const unixMatch = text.match(/min\/avg\/max(?:\/mdev)?\s*=\s*[\d.]+\/([\d.]+)\/[\d.]+/i)
  if (unixMatch?.[1]) {
    return Math.round(Number(unixMatch[1]))
  }

  const genericMatch = text.match(/time[=<]\s*(\d+(?:\.\d+)?)\s*ms/i)
  if (genericMatch?.[1]) {
    return Math.round(Number(genericMatch[1]))
  }

  return null
}

function measurePingLatency(host) {
  return new Promise((resolve) => {
    const args = process.platform === 'win32' ? ['-n', '1', '-w', '1200', host] : ['-c', '1', '-W', '1', host]
    const child = spawn('ping', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let output = ''
    let resolved = false

    const finish = (value) => {
      if (!resolved) {
        resolved = true
        resolve(value)
      }
    }

    const timeout = setTimeout(() => {
      child.kill()
      finish(null)
    }, 2000)

    child.stdout?.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.on('error', () => {
      clearTimeout(timeout)
      finish(null)
    })

    child.on('close', () => {
      clearTimeout(timeout)
      finish(parsePingOutput(output))
    })
  })
}

function getMemoryUsagePercent() {
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  if (!totalMemory) {
    return null
  }

  const used = totalMemory - freeMemory
  return Math.max(0, Math.min(100, Math.round((used / totalMemory) * 100)))
}

const latestSystemTelemetry = {
  status: 'initializing',
  source: 'bridge-os',
  cpuLoadPercent: null,
  memoryUsagePercent: null,
  networkPingMs: null,
  updatedAt: null,
}

async function refreshSystemTelemetry() {
  try {
    const [pingMs] = await Promise.all([measurePingLatency(SYSTEM_PING_HOST)])

    latestSystemTelemetry.status = 'online'
    latestSystemTelemetry.cpuLoadPercent = sampleCpuLoadPercent()
    latestSystemTelemetry.memoryUsagePercent = getMemoryUsagePercent()
    latestSystemTelemetry.networkPingMs = pingMs
    latestSystemTelemetry.updatedAt = new Date().toISOString()
  } catch {
    latestSystemTelemetry.status = 'degraded'
    latestSystemTelemetry.updatedAt = new Date().toISOString()
  }
}

refreshSystemTelemetry()
setInterval(refreshSystemTelemetry, TELEMETRY_REFRESH_MS).unref()

function resolveCorsOrigin(origin) {
  if (!origin) {
    return '*'
  }

  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    return origin
  }

  return ALLOWED_ORIGINS[0] || '*'
}

function sendJson(res, statusCode, payload, origin) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': resolveCorsOrigin(origin),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''

    req.on('data', (chunk) => {
      raw += chunk.toString()
      if (raw.length > 1024 * 1024) {
        reject(new Error('payload_too_large'))
      }
    })

    req.on('end', () => {
      try {
        const parsed = raw ? JSON.parse(raw) : {}
        resolve(parsed)
      } catch {
        reject(new Error('invalid_json'))
      }
    })

    req.on('error', () => reject(new Error('stream_error')))
  })
}

function escapePowerShellLiteral(value) {
  return String(value || '').replace(/'/g, "''")
}

function normalizeHttpUrl(rawValue) {
  const candidate = String(rawValue || '').trim()
  if (!candidate || /\s/.test(candidate)) {
    return null
  }

  const normalized = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`

  try {
    const parsed = new URL(normalized)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function withTimeout(timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  }
}

function withNodeTimeout(promise, timeoutMs, timeoutReason = 'timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutReason)), timeoutMs)
    }),
  ])
}

function getProviderConfig(provider) {
  if (provider === 'groq') {
    return {
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY || process.env.GROK_API_KEY,
      model: process.env.GROQ_MODEL || process.env.GROK_MODEL || 'llama-3.1-8b-instant',
      headers: {},
    }
  }

  if (provider === 'openrouter') {
    return {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      headers: {
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:5173',
        'X-Title': process.env.OPENROUTER_APP_TITLE || 'Jarvis Secure Bridge',
      },
    }
  }

  return null
}

async function requestProviderReply(provider, command) {
  const config = getProviderConfig(provider)

  if (!config) {
    return {
      ok: false,
      reason: 'unsupported_provider',
      reply: `Provider ${provider} is not supported by bridge.`,
    }
  }

  if (!config.apiKey) {
    return {
      ok: false,
      reason: 'missing_api_key',
      reply: `Bridge is missing API key for ${provider}. Configure environment variables on server side.`,
    }
  }

  const timeout = withTimeout(REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are JARVIS, a concise and helpful AI personal assistant. Keep responses short and actionable.',
          },
          {
            role: 'user',
            content: command,
          },
        ],
      }),
      signal: timeout.signal,
    })

    if (!response.ok) {
      return {
        ok: false,
        reason: `provider_http_${response.status}`,
        reply: `Provider ${provider} returned HTTP ${response.status}.`,
      }
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return {
        ok: false,
        reason: 'empty_response',
        reply: `Provider ${provider} returned an empty response payload.`,
      }
    }

    return {
      ok: true,
      reason: null,
      reply: content,
    }
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout' : 'network_error'

    return {
      ok: false,
      reason,
      reply: `Provider ${provider} call failed (${reason}).`,
    }
  } finally {
    timeout.clear()
  }
}

function createWindowsStartAttempt(target) {
  return {
    command: 'cmd',
    args: ['/c', 'start', '', target],
    description: `start:${target}`,
  }
}

function buildLaunchAttempts(targetId, targetUrl) {
  if (process.platform === 'win32') {
    if (targetId === 'vscode') {
      return [
        createWindowsStartAttempt('vscode://file'),
        createWindowsStartAttempt(APP_COMMANDS.vscode),
        { command: APP_COMMANDS.vscode, args: [], description: APP_COMMANDS.vscode },
      ]
    }

    if (targetId === 'terminal') {
      return [
        createWindowsStartAttempt(APP_COMMANDS.terminal),
        createWindowsStartAttempt('powershell'),
        createWindowsStartAttempt('cmd'),
      ]
    }

    if (targetId === 'chrome') {
      return [
        createWindowsStartAttempt(APP_COMMANDS.chrome),
        createWindowsStartAttempt('https://www.google.com'),
      ]
    }

    if (targetId === 'spotify') {
      return [
        createWindowsStartAttempt('spotify:'),
        createWindowsStartAttempt(APP_COMMANDS.spotify),
      ]
    }

    if (targetId === 'web' && targetUrl) {
      return [createWindowsStartAttempt(targetUrl)]
    }

    return []
  }

  if (targetId === 'web' && targetUrl) {
    return [{ command: 'xdg-open', args: [targetUrl], description: `xdg-open:${targetUrl}` }]
  }

  return []
}

function runLaunchAttempt(attempt) {
  return new Promise((resolve) => {
    const child = spawn(attempt.command, attempt.args || [], {
      windowsHide: true,
      stdio: 'ignore',
      shell: false,
    })

    child.on('error', () => {
      resolve({ ok: false, reason: 'spawn_error' })
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true, reason: null })
        return
      }

      resolve({ ok: false, reason: `exit_${code}` })
    })
  })
}

function runWhereSearch(rootPath, query, maxResults) {
  return new Promise((resolve) => {
    const wildcard = `*${query.replace(/["<>|]/g, '').trim()}*`
    const child = spawn('where', ['/r', rootPath, wildcard], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let output = ''

    child.stdout?.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.on('error', () => {
      resolve([])
    })

    child.on('close', () => {
      const lines = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.toLowerCase().includes('info: could not find files'))
        .slice(0, maxResults)

      resolve(lines)
    })
  })
}

async function executeFilesystemSearch(query, maxResults) {
  const sanitizedQuery = String(query || '').trim()
  if (!sanitizedQuery) {
    return {
      ok: false,
      reason: 'validation_error',
      reply: 'File search query is required.',
      results: [],
    }
  }

  const dedupe = new Set()

  for (const root of FILE_SEARCH_ROOTS) {
    if (dedupe.size >= maxResults) {
      break
    }

    const resolvedRoot = path.resolve(root)

    let matches = []
    try {
      if (process.platform === 'win32') {
        matches = await withNodeTimeout(runWhereSearch(resolvedRoot, sanitizedQuery, maxResults), FILE_SEARCH_TIMEOUT_MS)
      }
    } catch {
      matches = []
    }

    matches.forEach((match) => {
      if (dedupe.size < maxResults) {
        dedupe.add(match)
      }
    })
  }

  return {
    ok: true,
    reason: null,
    reply: dedupe.size > 0 ? `File search completed for "${sanitizedQuery}".` : `No filesystem matches found for "${sanitizedQuery}".`,
    results: Array.from(dedupe),
  }
}

function stripHtmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function summarizeText(text, maxLength = 460) {
  const compact = String(text || '').trim()
  if (!compact) {
    return 'No meaningful content was extracted from the source.'
  }

  const sentences = compact.match(/[^.!?]+[.!?]?/g) || []
  const selected = []
  let totalLength = 0

  for (const sentence of sentences) {
    const clean = sentence.trim()
    if (!clean) {
      continue
    }

    if (totalLength + clean.length > maxLength) {
      break
    }

    selected.push(clean)
    totalLength += clean.length + 1

    if (selected.length >= 3) {
      break
    }
  }

  if (selected.length === 0) {
    return compact.slice(0, maxLength)
  }

  return selected.join(' ')
}

async function fetchText(url) {
  const timeout = withTimeout(WEB_SUMMARY_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: timeout.signal,
      headers: {
        'User-Agent': 'Jarvis-Bridge/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`http_${response.status}`)
    }

    return await response.text()
  } finally {
    timeout.clear()
  }
}

async function summarizeWebRequest(url, query) {
  const normalizedUrl = normalizeHttpUrl(url)

  if (normalizedUrl) {
    try {
      const html = await fetchText(normalizedUrl)
      const plainText = stripHtmlToText(html)
      const summary = summarizeText(plainText)

      return {
        ok: true,
        reason: null,
        reply: `Web summary for ${normalizedUrl}: ${summary}`,
      }
    } catch (error) {
      return {
        ok: false,
        reason: error?.message || 'fetch_failed',
        reply: `Failed to fetch summary from ${normalizedUrl}.`,
      }
    }
  }

  const trimmedQuery = String(query || '').trim()
  if (!trimmedQuery) {
    return {
      ok: false,
      reason: 'validation_error',
      reply: 'Web summary requires a valid URL or query.',
    }
  }

  try {
    const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmedQuery)}&format=json&no_html=1&skip_disambig=1`
    const payload = JSON.parse(await fetchText(endpoint))

    const candidates = []
    if (payload?.AbstractText) {
      candidates.push(payload.AbstractText)
    }

    if (Array.isArray(payload?.RelatedTopics)) {
      payload.RelatedTopics.slice(0, 4).forEach((item) => {
        if (typeof item?.Text === 'string') {
          candidates.push(item.Text)
        }
      })
    }

    const sourceText = candidates.join(' ')
    const summary = summarizeText(sourceText)

    return {
      ok: true,
      reason: null,
      reply: `Web summary for "${trimmedQuery}": ${summary}`,
    }
  } catch (error) {
    return {
      ok: false,
      reason: error?.message || 'fetch_failed',
      reply: `Failed to summarize web query "${trimmedQuery}".`,
    }
  }
}

function buildProjectOpenAttempts(projectPath) {
  if (process.platform === 'win32') {
    return [
      { command: APP_COMMANDS.vscode, args: [projectPath], description: `${APP_COMMANDS.vscode} ${projectPath}` },
      { command: 'cmd', args: ['/c', 'start', '', APP_COMMANDS.vscode, projectPath], description: `start ${APP_COMMANDS.vscode}` },
    ]
  }

  return [{ command: APP_COMMANDS.vscode, args: [projectPath], description: `${APP_COMMANDS.vscode} ${projectPath}` }]
}

function normalizeProjectPath(projectPath) {
  const normalized = String(projectPath || '').trim()
  if (!normalized) {
    return null
  }

  return normalized
}

async function executeOpenProject(projectId) {
  const allowedProject = PROJECT_ALLOWLIST[projectId]
  if (!allowedProject) {
    return {
      ok: false,
      reason: 'project_not_allowed',
      reply: `Project ${projectId} is not in the allowlist.`,
    }
  }

  const projectPath = normalizeProjectPath(PROJECT_PATHS[projectId])
  if (!projectPath) {
    return {
      ok: false,
      reason: 'project_not_configured',
      reply: `Project path for ${allowedProject.label} is not configured in bridge environment.`,
    }
  }

  const attempts = buildProjectOpenAttempts(projectPath)
  let lastReason = 'unknown_failure'

  for (const attempt of attempts) {
    const outcome = await runLaunchAttempt(attempt)
    if (outcome.ok) {
      return {
        ok: true,
        reason: null,
        reply: `Project launch executed for ${allowedProject.label} (${projectPath}).`,
      }
    }

    lastReason = outcome.reason || lastReason
  }

  return {
    ok: false,
    reason: lastReason,
    reply: `Failed to launch project ${allowedProject.label} (${lastReason}).`,
  }
}

function runTaskkillAttempt(processName) {
  return new Promise((resolve) => {
    const child = spawn('taskkill', ['/IM', processName, '/F'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let output = ''

    child.stdout?.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      output += chunk.toString()
    })

    child.on('error', () => {
      resolve({ ok: false, reason: 'spawn_error', output })
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true, reason: null, output })
        return
      }

      if (/not found|no running instance/i.test(output)) {
        resolve({ ok: true, reason: 'already_closed', output })
        return
      }

      resolve({ ok: false, reason: `exit_${code}`, output })
    })
  })
}

async function executeCloseTarget(targetId) {
  const processes = CLOSE_PROCESS_ALLOWLIST[targetId]
  if (!processes || processes.length === 0) {
    return {
      ok: false,
      reason: 'target_not_allowed',
      reply: `Close target ${targetId} is not in the allowlist.`,
    }
  }

  let killCount = 0
  let alreadyClosedCount = 0
  let lastReason = 'unknown_failure'

  for (const processName of processes) {
    const result = await runTaskkillAttempt(processName)
    if (result.ok && result.reason === null) {
      killCount += 1
      continue
    }

    if (result.ok && result.reason === 'already_closed') {
      alreadyClosedCount += 1
      continue
    }

    lastReason = result.reason || lastReason
  }

  if (killCount > 0) {
    return {
      ok: true,
      reason: null,
      reply: `Close command executed for ${targetId}.`,
    }
  }

  if (alreadyClosedCount === processes.length) {
    return {
      ok: true,
      reason: 'already_closed',
      reply: `No running process was found for ${targetId}; it appears already closed.`,
    }
  }

  return {
    ok: false,
    reason: lastReason,
    reply: `Failed to execute close command for ${targetId} (${lastReason}).`,
  }
}

async function executeCloseProject(projectId) {
  const allowedProject = PROJECT_ALLOWLIST[projectId]
  if (!allowedProject) {
    return {
      ok: false,
      reason: 'project_not_allowed',
      reply: `Project ${projectId} is not in the allowlist.`,
    }
  }

  const projectPath = normalizeProjectPath(PROJECT_PATHS[projectId])
  if (!projectPath) {
    return {
      ok: false,
      reason: 'project_not_configured',
      reply: `Project path for ${allowedProject.label} is not configured in bridge environment.`,
    }
  }

  const closeResult = await executeCloseTarget(PROJECT_EDITOR_CLOSE_TARGET)
  if (!closeResult.ok) {
    return closeResult
  }

  return {
    ok: true,
    reason: closeResult.reason,
    reply:
      closeResult.reason === 'already_closed'
        ? `Project close request processed for ${allowedProject.label}; editor already appears closed.`
        : `Project close executed for ${allowedProject.label}.`,
  }
}

async function executeLaunchTarget(targetId, targetUrl) {
  const allowedTarget = LAUNCH_ALLOWLIST[targetId]
  if (!allowedTarget) {
    return {
      ok: false,
      reason: 'target_not_allowed',
      reply: `Launch target ${targetId} is not in the allowlist.`,
    }
  }

  if (targetId === 'web') {
    const safeUrl = normalizeHttpUrl(targetUrl)
    if (!safeUrl) {
      return {
        ok: false,
        reason: 'invalid_url',
        reply: 'Website launch requires a valid http/https URL.',
      }
    }

    targetUrl = safeUrl
  }

  const attempts = buildLaunchAttempts(targetId, targetUrl)
  if (attempts.length === 0) {
    return {
      ok: false,
      reason: 'no_launch_strategy',
      reply: `No launch strategy is configured for ${targetId} on this platform.`,
    }
  }

  let lastReason = 'unknown_failure'

  for (const attempt of attempts) {
    // Try fallback launch commands in order until one succeeds.
    // This improves reliability across machines with different PATH/app registrations.
    const outcome = await runLaunchAttempt(attempt)
    if (outcome.ok) {
      return {
        ok: true,
        reason: null,
        reply: `Launch command executed for ${targetId}.`,
      }
    }

    lastReason = outcome.reason || lastReason
  }

  return {
    ok: false,
    reason: lastReason,
    reply: `Failed to execute launch command for ${targetId} (${lastReason}).`,
  }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true }, origin)
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(
      res,
      200,
      {
        ok: true,
        service: 'jarvis-model-bridge',
        systemActionsEnabled: SYSTEM_ACTIONS_ENABLED,
        launchTargets: Object.keys(LAUNCH_ALLOWLIST),
        closeTargets: Object.keys(CLOSE_PROCESS_ALLOWLIST),
        projectTargets: Object.keys(PROJECT_ALLOWLIST).filter((projectId) => Boolean(normalizeProjectPath(PROJECT_PATHS[projectId]))),
        telemetry: {
          status: latestSystemTelemetry.status,
          source: latestSystemTelemetry.source,
          updatedAt: latestSystemTelemetry.updatedAt,
        },
        providers: {
          groq: Boolean(process.env.GROQ_API_KEY || process.env.GROK_API_KEY),
          openrouter: Boolean(process.env.OPENROUTER_API_KEY),
        },
      },
      origin,
    )
    return
  }

  if (req.method === 'POST' && req.url === '/api/system/close') {
    try {
      const body = await parseJsonBody(req)
      const confirmed = Boolean(body?.confirmed)
      const targetId = typeof body?.targetId === 'string' ? body.targetId.trim().toLowerCase() : ''

      if (!confirmed || !targetId) {
        sendJson(
          res,
          400,
          {
            ok: false,
            reason: 'validation_error',
            reply: 'Close request requires confirmed=true and targetId.',
          },
          origin,
        )
        return
      }

      if (!SYSTEM_ACTIONS_ENABLED) {
        sendJson(
          res,
          403,
          {
            ok: false,
            reason: 'system_actions_disabled',
            reply: 'System actions are disabled by bridge safety policy.',
          },
          origin,
        )
        return
      }

      const result = await executeCloseTarget(targetId)
      sendJson(res, result.ok ? 200 : 502, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `System close request failed (${reason}).`,
        },
        origin,
      )
      return
    }
  }

  if (req.method === 'GET' && req.url === '/api/system/status') {
    sendJson(
      res,
      200,
      {
        ok: true,
        status: latestSystemTelemetry.status,
        source: latestSystemTelemetry.source,
        updatedAt: latestSystemTelemetry.updatedAt,
        metrics: {
          cpuLoadPercent: latestSystemTelemetry.cpuLoadPercent,
          memoryUsagePercent: latestSystemTelemetry.memoryUsagePercent,
          networkPingMs: latestSystemTelemetry.networkPingMs,
        },
      },
      origin,
    )
    return
  }

  if (req.method === 'POST' && req.url === '/api/model/reply') {
    try {
      const body = await parseJsonBody(req)
      const provider = typeof body.provider === 'string' ? body.provider.trim().toLowerCase() : ''
      const command = typeof body.command === 'string' ? body.command.trim() : ''

      if (!provider || !command) {
        sendJson(
          res,
          400,
          {
            ok: false,
            reason: 'validation_error',
            reply: 'Request must include provider and command strings.',
          },
          origin,
        )
        return
      }

      const result = await requestProviderReply(provider, command)
      sendJson(res, result.ok ? 200 : 502, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `Bridge request failed (${reason}).`,
        },
        origin,
      )
      return
    }
  }

  if (req.method === 'POST' && req.url === '/api/system/launch') {
    try {
      const body = await parseJsonBody(req)
      const confirmed = Boolean(body?.confirmed)
      const targetId = typeof body?.targetId === 'string' ? body.targetId.trim().toLowerCase() : ''
      const targetUrl = typeof body?.targetUrl === 'string' ? body.targetUrl.trim() : ''

      if (!confirmed || !targetId) {
        sendJson(
          res,
          400,
          {
            ok: false,
            reason: 'validation_error',
            reply: 'Launch request requires confirmed=true and targetId.',
          },
          origin,
        )
        return
      }

      if (!SYSTEM_ACTIONS_ENABLED) {
        sendJson(
          res,
          403,
          {
            ok: false,
            reason: 'system_actions_disabled',
            reply: 'System actions are disabled by bridge safety policy.',
          },
          origin,
        )
        return
      }

      const result = await executeLaunchTarget(targetId, targetUrl)
      sendJson(res, result.ok ? 200 : 502, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `System launch request failed (${reason}).`,
        },
        origin,
      )
      return
    }
  }

  if (req.method === 'POST' && req.url === '/api/system/project/open') {
    try {
      const body = await parseJsonBody(req)
      const confirmed = Boolean(body?.confirmed)
      const projectId = typeof body?.projectId === 'string' ? body.projectId.trim().toLowerCase() : ''

      if (!confirmed || !projectId) {
        sendJson(
          res,
          400,
          {
            ok: false,
            reason: 'validation_error',
            reply: 'Project open request requires confirmed=true and projectId.',
          },
          origin,
        )
        return
      }

      if (!SYSTEM_ACTIONS_ENABLED) {
        sendJson(
          res,
          403,
          {
            ok: false,
            reason: 'system_actions_disabled',
            reply: 'System actions are disabled by bridge safety policy.',
          },
          origin,
        )
        return
      }

      const result = await executeOpenProject(projectId)
      sendJson(res, result.ok ? 200 : 502, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `Project open request failed (${reason}).`,
        },
        origin,
      )
      return
    }
  }

  if (req.method === 'POST' && req.url === '/api/system/project/close') {
    try {
      const body = await parseJsonBody(req)
      const confirmed = Boolean(body?.confirmed)
      const projectId = typeof body?.projectId === 'string' ? body.projectId.trim().toLowerCase() : ''

      if (!confirmed || !projectId) {
        sendJson(
          res,
          400,
          {
            ok: false,
            reason: 'validation_error',
            reply: 'Project close request requires confirmed=true and projectId.',
          },
          origin,
        )
        return
      }

      if (!SYSTEM_ACTIONS_ENABLED) {
        sendJson(
          res,
          403,
          {
            ok: false,
            reason: 'system_actions_disabled',
            reply: 'System actions are disabled by bridge safety policy.',
          },
          origin,
        )
        return
      }

      const result = await executeCloseProject(projectId)
      sendJson(res, result.ok ? 200 : 502, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `Project close request failed (${reason}).`,
        },
        origin,
      )
      return
    }
  }

  if (req.method === 'POST' && req.url === '/api/system/file-search') {
    try {
      const body = await parseJsonBody(req)
      const query = typeof body?.query === 'string' ? body.query.trim() : ''
      const maxResults = Number(body?.maxResults || FILE_SEARCH_MAX_RESULTS)

      const result = await executeFilesystemSearch(query, Math.max(1, Math.min(20, maxResults)))
      sendJson(res, result.ok ? 200 : 400, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `Filesystem search request failed (${reason}).`,
          results: [],
        },
        origin,
      )
      return
    }
  }

  if (req.method === 'POST' && req.url === '/api/web/summarize') {
    try {
      const body = await parseJsonBody(req)
      const url = typeof body?.url === 'string' ? body.url.trim() : ''
      const query = typeof body?.query === 'string' ? body.query.trim() : ''

      const result = await summarizeWebRequest(url, query)
      sendJson(res, result.ok ? 200 : 502, result, origin)
      return
    } catch (error) {
      const reason = error?.message || 'bridge_error'
      sendJson(
        res,
        400,
        {
          ok: false,
          reason,
          reply: `Web summary request failed (${reason}).`,
        },
        origin,
      )
      return
    }
  }

  sendJson(
    res,
    404,
    {
      ok: false,
      reason: 'not_found',
      reply: 'Bridge endpoint not found.',
    },
    origin,
  )
})

server.listen(PORT, () => {
  console.log(`[jarvis-bridge] running on http://localhost:${PORT}`)
})
