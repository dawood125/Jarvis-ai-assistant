Agent Workspace — Milestone Record

Date: 2026-04-30

Milestone: Python agent service implemented and smoke-tested

Files added (python/):
- `requirements.txt` — FastAPI, uvicorn, groq, python-dotenv
- `main.py` — FastAPI app (health, bootstrap/profile/preferences/note/journal/chat endpoints, WebSocket)
- `memory.py` — SQLite wrapper functions (profile, preferences, conversations, notes, journal entries)
- `tools.py` — Safe OS helpers (open_application, search_files, search_web, save_note/get_notes helpers)
- `brain.py` — Groq-capable agent loop with local fallback handling
- `README.md` — quick start and run instructions
- `.env.example` — environment variables example

Summary:
- Scaffolding complete. The Python service is intentionally minimal and reuses the existing SQLite DB at `jarvis/data/jarvis.db` by default.
- `brain.py` now supports Groq tool-calling when `GROQ_API_KEY` is present and falls back to local command handling otherwise.

Next immediate tasks (tracked):
1. Phase 2 Python service slice completed and smoke-tested.
2. Next slice: add `app_usage`/`patterns` instrumentation if you want the learning layer on top of the agent.
3. Optional follow-up: connect the existing Node bridge/frontend to the Python service URL.

Run / test quick commands (from repo root):

```powershell
# use the repository virtualenv that already has the packages installed
& '.\.venv\Scripts\python.exe' -m uvicorn python.main:app --reload --port 8788
```

Smoke test:

```powershell
& '.\.venv\Scripts\python.exe' python\smoke_test.py
```

Notes & cautions:
- Running Node and Python concurrently against the same SQLite DB is supported but make backups first.
- `SYSTEM_ACTIONS_ENABLED` defaults to `false`; enable with `.env` only after you confirm allowlist settings.
- The validated runtime for this workspace is the repo virtualenv at `.venv`.

---

Date: 2026-05-04

Milestone: Chunk 1 UI overhaul (tabs + typography)

Summary:
- Right rail is now tabbed (Actions, Memory, Activity, Dev) to reduce visual clutter.
- Notes moved into the Memory tab; left rail simplified to core + vitals.
- Added display typography (Rajdhani + Space Grotesk) and new tab/badge styling.
- Added panel focus logic so commands can switch tabs automatically.
- Added `VITE_SYSTEM_BRIDGE_URL` so Python can be primary while Node handles system actions.

Files updated:
- `jarvis/src/components/IntelPanel.jsx`
- `jarvis/src/components/LeftRail.jsx`
- `jarvis/src/App.jsx`
- `jarvis/src/index.css`
- `jarvis/src/lib/commandActions.js`
- `jarvis/.env`
- `jarvis/.env.example`

Verification:
- Ran `npm run build` (frontend build) to validate UI changes.

Patch: System status + CORS preflight fix

Summary:
- System telemetry now reads `VITE_SYSTEM_BRIDGE_URL` when set (avoids hitting Python for `/api/system/status`).
- Added explicit OPTIONS handler for `/api/model/reply` to silence preflight 400s.

Files updated:
- `jarvis/src/lib/modelClients.js`
- `python/main.py`

Verification:
- Ran `npm run build` after change.

References:
- Plan details: `Plan/SecondPlan.md`
- Session plan: `/memories/session/plan.md`

If you want, I can now implement the full Groq function-calling loop in `python/brain.py` (requires `GROQ_API_KEY`), or continue by adding fully-implemented memory wrappers and unit smoke tests. Which should I do next?