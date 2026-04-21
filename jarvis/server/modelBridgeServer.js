import { createServer } from 'node:http'
import os from 'node:os'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.MODEL_BRIDGE_PORT || 8787)
const REQUEST_TIMEOUT_MS = Number(process.env.MODEL_BRIDGE_REQUEST_TIMEOUT_MS || 12000)
const TELEMETRY_REFRESH_MS = Number(process.env.SYSTEM_TELEMETRY_REFRESH_MS || 5000)
const SYSTEM_PING_HOST = process.env.SYSTEM_PING_HOST || '1.1.1.1'
const ALLOWED_ORIGINS = (process.env.MODEL_BRIDGE_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
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

const LAUNCH_ALLOWLIST = {
  vscode: { label: 'VS Code' },
  terminal: { label: 'Terminal' },
  chrome: { label: 'Google Chrome' },
  spotify: { label: 'Spotify' },
  web: { label: 'Website' },
}

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
