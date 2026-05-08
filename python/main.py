import json
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

env_path = Path(__file__).resolve().parents[1] / "jarvis" / ".env"
load_dotenv(dotenv_path=env_path)

from . import memory, brain
app = FastAPI(title="Jarvis Python Agent")

# Allow the frontend dev server to call this backend during development
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_HTML = WORKSPACE_ROOT / "jarvis" / "index.html"


@app.on_event("startup")
async def startup_event():
    memory.init_db()


@app.get("/health")
async def health():
    return {
        "status": "online",
        "systemActionsEnabled": True,
        "providers": {
            "groq": True,
            "openrouter": False,
        }
    }


@app.get("/api/system/status")
async def system_status():
    import psutil
    import time
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory().percent
    return {
        "status": "online",
        "source": "python-agent",
        "updatedAt": time.time(),
        "metrics": {
            "cpuLoadPercent": cpu,
            "memoryUsagePercent": mem,
            "networkPingMs": 15
        }
    }


@app.get("/api/system/usage")
async def app_usage_stats():
    return JSONResponse(memory.get_app_usage_stats(days=7))


@app.get("/")
async def root():
    if FRONTEND_HTML.exists():
        return FileResponse(FRONTEND_HTML)
    return JSONResponse({"ok": False, "reason": "frontend_not_found"}, status_code=404)


@app.get("/api/memory/bootstrap")
async def memory_bootstrap(limit: int = 10):
    return JSONResponse(memory.get_bootstrap(limit=limit))


@app.get("/api/memory/profile")
async def get_profile():
    return JSONResponse({"ok": True, "profile": memory.get_user_profile()})


@app.post("/api/memory/profile")
async def post_profile(request: Request):
    payload = await request.json()
    return JSONResponse(memory.save_user_profile(payload))


@app.get("/api/memory/preferences")
async def get_preferences():
    return JSONResponse({"ok": True, "preferences": memory.get_preferences()})


@app.post("/api/memory/preferences")
async def post_preferences(request: Request):
    payload = await request.json()
    return JSONResponse(memory.save_preferences(payload))


@app.post("/api/memory/chat")
async def post_chat(request: Request):
    payload = await request.json()
    return JSONResponse(
        memory.save_conversation(
            payload.get("role", "user"),
            payload.get("text", ""),
            payload.get("label"),
            payload.get("createdAt"),
        )
    )


@app.post("/api/memory/note")
async def post_note(request: Request):
    payload = await request.json()
    return JSONResponse(memory.save_note(payload.get("text", ""), payload.get("createdAt")))


@app.post("/api/memory/journal")
async def post_journal(request: Request):
    payload = await request.json()
    return JSONResponse(memory.save_journal_entry(payload))


@app.post("/api/memory/migrate")
async def migrate_memory(request: Request):
    payload = await request.json()
    conversations = payload.get("conversations") if isinstance(payload, dict) else []
    notes = payload.get("notes") if isinstance(payload, dict) else []
    journal_entries = payload.get("journalEntries") if isinstance(payload, dict) else []

    inserted = {
        "conversations": 0,
        "notes": 0,
        "journalEntries": 0,
    }

    for item in conversations or []:
      result = memory.save_conversation(
          item.get("role", "user"),
          item.get("text", ""),
          item.get("label"),
          item.get("createdAt"),
      )
      if result.get("ok"):
          inserted["conversations"] += 1

    for item in notes or []:
        result = memory.save_note(item.get("text", ""), item.get("createdAt"))
        if result.get("ok"):
            inserted["notes"] += 1

    for item in journal_entries or []:
        result = memory.save_journal_entry(item)
        if result.get("ok"):
            inserted["journalEntries"] += 1

    return JSONResponse({
        "ok": True,
        "reason": None,
        "inserted": inserted,
    })


@app.post("/api/model/reply")
async def model_reply(request: Request):
    command = ''
    raw_body = await request.body()

    if raw_body:
        try:
            payload = json.loads(raw_body.decode('utf-8'))
        except Exception:
            payload = {}

        if isinstance(payload, dict):
            command = payload.get("command") or payload.get("text") or ''
        elif isinstance(payload, str):
            command = payload
    else:
        command = ''

    reply = await brain.handle_message(str(command))
    return JSONResponse({"ok": True, "reply": reply})


@app.options("/api/model/reply")
async def model_reply_options():
    return Response(status_code=200)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    origin = ws.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        await ws.close(code=1008, reason="Origin not allowed")
        return

    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            try:
                payload = json.loads(data)
            except Exception:
                payload = {"type": "message", "text": data}

            text = payload.get("text") if isinstance(payload, dict) else str(payload)
            reply = await brain.handle_message(text)
            await ws.send_text(json.dumps({"type": "reply", "text": reply}))
    except WebSocketDisconnect:
        return
