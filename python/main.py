import json
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse

from . import memory, brain

load_dotenv()

app = FastAPI(title="Jarvis Python Agent")

WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_HTML = WORKSPACE_ROOT / "jarvis" / "index.html"


@app.on_event("startup")
async def startup_event():
    memory.init_db()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-agent"}


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


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
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
