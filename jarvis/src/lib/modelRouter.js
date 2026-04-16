import { requestModelReply } from './modelClients'

export const MODEL_PROVIDERS = Object.freeze({
  GROQ: 'groq',
  OPENROUTER: 'openrouter',
  LOCAL_FALLBACK: 'local-fallback',
})

const MODEL_CONFIG_STORAGE_KEY = 'jarvis.model.config.v1'

const DEFAULT_MODEL_CONFIG = {
  primary: MODEL_PROVIDERS.GROQ,
  fallback: MODEL_PROVIDERS.OPENROUTER,
  allowCloud: false,
}

function sanitizeProvider(value) {
  const allowed = Object.values(MODEL_PROVIDERS)
  return allowed.includes(value) ? value : MODEL_PROVIDERS.LOCAL_FALLBACK
}

export function readModelConfig() {
  try {
    const stored = window.localStorage.getItem(MODEL_CONFIG_STORAGE_KEY)
    if (!stored) {
      window.localStorage.setItem(MODEL_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_MODEL_CONFIG))
      return DEFAULT_MODEL_CONFIG
    }

    const parsed = JSON.parse(stored)
    return {
      primary: sanitizeProvider(parsed?.primary || DEFAULT_MODEL_CONFIG.primary),
      fallback: sanitizeProvider(parsed?.fallback || DEFAULT_MODEL_CONFIG.fallback),
      allowCloud: Boolean(parsed?.allowCloud),
    }
  } catch {
    return DEFAULT_MODEL_CONFIG
  }
}

export function writeModelConfig(nextConfig) {
  const safeConfig = {
    primary: sanitizeProvider(nextConfig?.primary || DEFAULT_MODEL_CONFIG.primary),
    fallback: sanitizeProvider(nextConfig?.fallback || DEFAULT_MODEL_CONFIG.fallback),
    allowCloud: Boolean(nextConfig?.allowCloud),
  }

  window.localStorage.setItem(MODEL_CONFIG_STORAGE_KEY, JSON.stringify(safeConfig))
  return safeConfig
}

export function selectModelProvider(config) {
  if (!config.allowCloud) {
    return MODEL_PROVIDERS.LOCAL_FALLBACK
  }

  return sanitizeProvider(config.primary)
}

export function createModelRouterReply(command, config = readModelConfig()) {
  const provider = selectModelProvider(config)

  if (provider === MODEL_PROVIDERS.LOCAL_FALLBACK) {
    return {
      provider,
      reply:
        `Local-safe mode is active. I captured your request: "${command}". ` +
        'Enable cloud routing to use Groq/OpenRouter for richer responses.',
    }
  }

  if (provider === MODEL_PROVIDERS.GROQ) {
    return {
      provider,
      reply:
        `Groq route selected (contract mode). Request captured: "${command}". ` +
        'Live API call wiring will be added in the next integration step.',
    }
  }

  return {
    provider: MODEL_PROVIDERS.OPENROUTER,
    reply:
      `OpenRouter fallback selected (contract mode). Request captured: "${command}". ` +
      'Live API call wiring will be added in the next integration step.',
  }
}

export async function resolveModelReply(command, config = readModelConfig()) {
  const primaryProvider = selectModelProvider(config)

  if (primaryProvider === MODEL_PROVIDERS.LOCAL_FALLBACK) {
    return createModelRouterReply(command, config)
  }

  const primaryResult = await requestModelReply({
    provider: primaryProvider,
    command,
  })

  if (primaryResult.ok) {
    return {
      provider: primaryProvider,
      reply: primaryResult.reply,
    }
  }

  const fallbackProvider = sanitizeProvider(config.fallback)

  if (fallbackProvider === MODEL_PROVIDERS.LOCAL_FALLBACK || fallbackProvider === primaryProvider) {
    return {
      provider: MODEL_PROVIDERS.LOCAL_FALLBACK,
      reply:
        `Cloud route failed (${primaryResult.reason}), switched to local-safe response mode. ` +
        `Captured request: "${command}".`,
    }
  }

  const fallbackResult = await requestModelReply({
    provider: fallbackProvider,
    command,
  })

  if (fallbackResult.ok) {
    return {
      provider: fallbackProvider,
      reply: fallbackResult.reply,
    }
  }

  return {
    provider: MODEL_PROVIDERS.LOCAL_FALLBACK,
    reply:
      `Primary (${primaryProvider}) and fallback (${fallbackProvider}) routes failed. ` +
      'Local-safe mode is responding until provider credentials/connectivity are available.',
  }
}
