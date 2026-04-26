# Jarvis Frontend Workspace

This workspace contains the Jarvis HUD-style React client plus a secure local model bridge server.

## Scripts

- npm run dev: starts Vite frontend at http://localhost:5173
- npm run bridge: starts secure model bridge at http://localhost:8787
- npm run build: production build validation

## Recommended Local Run Flow

Use two terminals:

1. Terminal A
- npm run bridge

2. Terminal B
- npm run dev

The frontend uses /api/model/reply and /health via Vite proxy to reach the bridge.

## Environment Setup

Copy .env.example to .env and configure:

- GROQ_API_KEY and optional GROQ_MODEL
- OPENROUTER_API_KEY and optional OPENROUTER_MODEL
- VITE_USE_MODEL_BRIDGE=true

By default, cloud calls are routed through the secure bridge so provider keys are not exposed in browser runtime.

## Security Note

Do not commit real API keys. Keep them only in local .env files.

## Optional Real App Launch Mode

By default, launch commands stay in preview mode.

To enable real launch execution with strict confirmation:

- Set VITE_ENABLE_SYSTEM_ACTIONS=true in frontend environment
- Set SYSTEM_ACTIONS_ENABLED=true in bridge environment
- Keep using confirm/cancel flow in chat before execution

If either flag is false, launch requests remain safely non-executing.

When enabled, launch confirmations support allowlisted apps and website targets (http/https).

Close-app confirmations are also supported for allowlisted targets (VS Code, terminal, Chrome, Spotify).

Project launcher confirmations are supported for mapped project IDs via bridge env variables:

- SYSTEM_PROJECT_JARVIS
- SYSTEM_PROJECT_FREELANCEHUB
- SYSTEM_PROJECT_PORTFOLIO
- SYSTEM_PROJECT_HOSPITAL

Project close confirmations are also supported and close the mapped editor target (default: VS Code).

## Real Filesystem Search

The bridge exposes /api/system/file-search for real file lookups by filename keyword.

Configure search behavior via:

- SYSTEM_FILE_SEARCH_ROOTS (comma-separated absolute paths)
- SYSTEM_FILE_SEARCH_MAX_RESULTS
- SYSTEM_FILE_SEARCH_TIMEOUT_MS

## Web Browse and Summarize

The bridge exposes /api/web/summarize for URL and query summarization.

Examples:

- summarize https://example.com
- summarize tech news

Tune request timeout with SYSTEM_WEB_SUMMARY_FETCH_TIMEOUT_MS.

## Real System Vitals

The bridge now exposes real system telemetry at /api/system/status:

- CPU Load (sampled from OS CPU times)
- Memory Usage (OS used-memory percentage)
- Network Ping (single ping probe to SYSTEM_PING_HOST)

Tune telemetry cadence with SYSTEM_TELEMETRY_REFRESH_MS in your bridge environment.
