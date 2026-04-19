import { createServer } from 'node:http'

const PORT = Number(process.env.MODEL_BRIDGE_PORT || 8787)
const REQUEST_TIMEOUT_MS = Number(process.env.MODEL_BRIDGE_REQUEST_TIMEOUT_MS || 12000)
const ALLOWED_ORIGINS = (process.env.MODEL_BRIDGE_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

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
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
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
        providers: {
          groq: Boolean(process.env.GROQ_API_KEY),
          openrouter: Boolean(process.env.OPENROUTER_API_KEY),
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
