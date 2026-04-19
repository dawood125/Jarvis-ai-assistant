const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL_CALL_TIMEOUT_MS = 12000
const DEFAULT_BRIDGE_PATH = '/api/model/reply'

function resolveBridgeUrl() {
  const baseUrl = (import.meta.env.VITE_MODEL_BRIDGE_URL || '').trim()
  if (!baseUrl) {
    return DEFAULT_BRIDGE_PATH
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_BRIDGE_PATH}`
}

function withTimeout(signalTimeoutMs) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), signalTimeoutMs)

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timer),
  }
}

function getProviderConfig(provider) {
  if (provider === 'groq') {
    return {
      endpoint: GROQ_API_URL,
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant',
      headers: {},
    }
  }

  if (provider === 'openrouter') {
    return {
      endpoint: OPENROUTER_API_URL,
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      model: import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      headers: {
        'HTTP-Referer': import.meta.env.VITE_OPENROUTER_REFERER || 'http://localhost:5173',
        'X-Title': import.meta.env.VITE_OPENROUTER_APP_TITLE || 'Jarvis Local Prototype',
      },
    }
  }

  return null
}

export async function requestModelReply({ provider, command }) {
  const useBridge = import.meta.env.VITE_USE_MODEL_BRIDGE !== 'false'
  const allowClientCalls = import.meta.env.VITE_ENABLE_CLIENT_MODEL_CALLS === 'true'

  if (useBridge) {
    try {
      const response = await fetch(resolveBridgeUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          command,
        }),
      })

      const payload = await response.json()

      if (response.ok && payload?.ok) {
        return payload
      }

      if (!allowClientCalls) {
        return {
          ok: false,
          reason: payload?.reason || `bridge_http_${response.status}`,
          reply:
            payload?.reply ||
            'Model bridge request failed. Start bridge server with npm run bridge and retry.',
        }
      }
    } catch {
      if (!allowClientCalls) {
        return {
          ok: false,
          reason: 'bridge_unreachable',
          reply:
            'Model bridge is unreachable. Start bridge server with npm run bridge or configure VITE_MODEL_BRIDGE_URL.',
        }
      }
    }
  }

  if (!allowClientCalls) {
    return {
      ok: false,
      reason: 'client_calls_disabled',
      reply:
        'Cloud calls are disabled because secure bridge mode is not available and direct client mode is off.',
    }
  }

  const config = getProviderConfig(provider)
  if (!config) {
    return {
      ok: false,
      reason: 'unsupported_provider',
      reply: `Provider ${provider} is not supported by the current client adapter.`,
    }
  }

  if (!config.apiKey) {
    return {
      ok: false,
      reason: 'missing_api_key',
      reply: `Missing API key for ${provider}. Add the required VITE_* key in your local .env file.`,
    }
  }

  const timeout = withTimeout(MODEL_CALL_TIMEOUT_MS)

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
