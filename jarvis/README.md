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
