Jarvis Python Agent

Quick start

1. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. (Optional) Create a `.env` at `python/.env` and set:

```
GROQ_API_KEY=your_groq_api_key_here
MEMORY_DB_PATH=../jarvis/data/jarvis.db
SYSTEM_ACTIONS_ENABLED=false
SYSTEM_APP_ALLOWLIST=code,chrome,wt,spotify
SYSTEM_FILE_SEARCH_ROOTS=C:\Users\YourName\,D:\Projects
```

3. Run the FastAPI app for development:

```bash
uvicorn python.main:app --reload --port 8788
```

4. Health check:

```
GET http://127.0.0.1:8788/health
```

5. WebSocket: connect to `ws://127.0.0.1:8788/ws` and send JSON `{ "text": "hello" }`.

6. Smoke test from the repo root:

```bash
python python/smoke_test.py
```

Notes
- This is a working FastAPI microservice with a Groq-capable agent loop. If `GROQ_API_KEY` is set, the agent uses tool-calling; otherwise it falls back to local command handling.
- The service reuses the existing SQLite database at `../jarvis/data/jarvis.db` by default. Be careful when running both Node and Python against the same DB concurrently; backups recommended.
