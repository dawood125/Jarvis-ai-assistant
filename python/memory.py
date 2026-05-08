import os
import sqlite3
from pathlib import Path
from typing import List, Dict, Any

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "jarvis" / "data" / "jarvis.db"
DB_PATH = os.environ.get("MEMORY_DB_PATH") or str(DEFAULT_DB_PATH)

_conn: sqlite3.Connection | None = None


def _connect():
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


def init_db():
    conn = _connect()
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode = WAL")
    cur.execute("PRAGMA foreign_keys = ON")
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT NOT NULL,
          label TEXT,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date_key TEXT NOT NULL,
          raw_text TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS journal_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_id INTEGER NOT NULL,
          task_text TEXT NOT NULL,
          task_order INTEGER NOT NULL,
          FOREIGN KEY(entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          name TEXT DEFAULT 'Dawood',
          wake_time TEXT DEFAULT '09:00',
          sleep_time TEXT DEFAULT '23:00',
          preferred_editor TEXT DEFAULT 'code',
          preferred_browser TEXT DEFAULT 'chrome',
          personality_notes TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          app_name TEXT NOT NULL,
          launched_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS patterns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pattern_description TEXT NOT NULL,
          confidence_score REAL DEFAULT 0.5,
          created_at TEXT NOT NULL
        );
        """
    )
    conn.commit()


def _now_iso():
    from datetime import datetime

    return datetime.utcnow().isoformat()


def _safe_text(value: Any, fallback: str = "") -> str:
    text = str(value if value is not None else fallback).strip()
    return text if text else fallback


def _normalize_timestamp(value: Any) -> str:
    candidate = _safe_text(value)
    if not candidate:
        return _now_iso()

    try:
        from datetime import datetime

        return datetime.fromisoformat(candidate.replace("Z", "+00:00")).isoformat()
    except Exception:
        return _now_iso()


def _ensure_profile_row(conn: sqlite3.Connection):
    cur = conn.cursor()
    row = cur.execute("SELECT id FROM user_profile WHERE id = 1 LIMIT 1").fetchone()
    if row is None:
        now = _now_iso()
        cur.execute(
            "INSERT INTO user_profile (id, name, wake_time, sleep_time, preferred_editor, preferred_browser, personality_notes, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("Dawood", "09:00", "23:00", "code", "chrome", "", now, now),
        )
        conn.commit()


def get_user_profile() -> Dict[str, Any]:
    conn = _connect()
    _ensure_profile_row(conn)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, wake_time, sleep_time, preferred_editor, preferred_browser, personality_notes, created_at, updated_at FROM user_profile WHERE id = 1 LIMIT 1"
    )
    row = cur.fetchone()
    return {
        "id": row["id"],
        "name": row["name"] or "Dawood",
        "wakeTime": row["wake_time"] or "09:00",
        "sleepTime": row["sleep_time"] or "23:00",
        "preferredEditor": row["preferred_editor"] or "code",
        "preferredBrowser": row["preferred_browser"] or "chrome",
        "personalityNotes": row["personality_notes"] or "",
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def get_last_conversations(limit: int = 10) -> List[Dict[str, Any]]:
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        "SELECT role, label, message, created_at FROM conversations ORDER BY datetime(created_at) DESC, id DESC LIMIT ?",
        (limit,),
    )
    rows = cur.fetchall()
    # map to expected frontend shape
    result = []
    for r in reversed(rows):
        result.append({
            "role": r["role"],
            "label": r["label"] or ("JARVIS CORE" if r["role"] == "jarvis" else "YOU"),
            "text": r["message"],
            "createdAt": r["created_at"],
        })
    return result


def save_conversation(role: str, text: str, label: str | None = None, created_at: str | None = None) -> Dict[str, Any]:
    role_value = "jarvis" if str(role).lower() == "jarvis" else "user"
    message_text = _safe_text(text)
    if not message_text:
        return {"ok": False, "reason": "validation_error", "reply": "Message text is required."}

    conn = _connect()
    cur = conn.cursor()
    created_at = _normalize_timestamp(created_at)
    cur.execute(
        "INSERT INTO conversations (role, label, message, created_at) VALUES (?, ?, ?, ?)",
        (role_value, _safe_text(label, "JARVIS CORE" if role_value == "jarvis" else "YOU"), message_text, created_at),
    )
    conn.commit()
    return {"ok": True, "reply": "Conversation message stored."}


def save_note(text: str, created_at: str | None = None) -> Dict[str, Any]:
    note_text = _safe_text(text)
    if not note_text:
        return {"ok": False, "reason": "validation_error", "reply": "Note text is required."}

    conn = _connect()
    cur = conn.cursor()
    created_at = _normalize_timestamp(created_at)
    cur.execute("INSERT INTO notes (text, created_at) VALUES (?, ?)", (note_text, created_at))
    conn.commit()
    total = cur.execute("SELECT COUNT(*) AS count FROM notes").fetchone()[0]
    return {"ok": True, "reply": "Note stored.", "total": total}


def get_notes(limit: int = 10) -> List[Dict[str, Any]]:
    conn = _connect()
    cur = conn.cursor()
    cur.execute("SELECT text, created_at FROM notes ORDER BY datetime(created_at) DESC, id DESC LIMIT ?", (limit,))
    rows = cur.fetchall()
    return [{"text": r["text"], "createdAt": r["created_at"]} for r in rows]


def get_preferences() -> Dict[str, str]:
    conn = _connect()
    cur = conn.cursor()
    rows = cur.execute("SELECT key, value FROM preferences ORDER BY key ASC").fetchall()
    return {row["key"]: row["value"] for row in rows}


def save_preferences(payload: Dict[str, Any]) -> Dict[str, Any]:
    items = payload.get("preferences") if isinstance(payload, dict) and isinstance(payload.get("preferences"), dict) else payload
    entries = [(str(key), _safe_text(value)) for key, value in dict(items or {}).items() if value is not None]
    if not entries:
        return {"ok": False, "reason": "validation_error", "reply": "No preferences provided.", "preferences": get_preferences()}

    conn = _connect()
    cur = conn.cursor()
    now = _now_iso()
    for key, value in entries:
        cur.execute(
            "INSERT INTO preferences (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
            (key, value, now),
        )
    conn.commit()
    return {"ok": True, "reply": "Preferences stored.", "preferences": get_preferences()}


def save_journal_entry(payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = _connect()
    cur = conn.cursor()
    raw_text = _safe_text(payload.get("raw") or payload.get("text"))
    if not raw_text:
        return {"ok": False, "reason": "validation_error", "reply": "Journal raw text is required."}

    created_at = _normalize_timestamp(payload.get("createdAt"))
    date_key = _safe_text(payload.get("dateKey"), created_at[:10])[:10]
    tasks = payload.get("tasks") if isinstance(payload.get("tasks"), list) else []
    cleaned_tasks = [_safe_text(task) for task in tasks if _safe_text(task)]

    existing = cur.execute("SELECT id FROM journal_entries WHERE raw_text = ? AND created_at = ? LIMIT 1", (raw_text, created_at)).fetchone()
    if existing:
        task_count = cur.execute("SELECT COUNT(*) AS count FROM journal_tasks WHERE entry_id = ?", (existing["id"],)).fetchone()["count"]
        return {"ok": True, "reason": "duplicate", "reply": "Journal entry already exists.", "taskCount": task_count}

    entry_result = cur.execute(
        "INSERT INTO journal_entries (date_key, raw_text, created_at) VALUES (?, ?, ?)",
        (date_key, raw_text, created_at),
    )
    entry_id = entry_result.lastrowid
    for index, task in enumerate(cleaned_tasks):
        cur.execute(
            "INSERT INTO journal_tasks (entry_id, task_text, task_order) VALUES (?, ?, ?)",
            (entry_id, task, index),
        )
    conn.commit()
    return {"ok": True, "reply": "Journal entry stored.", "taskCount": len(cleaned_tasks)}


def get_bootstrap(limit: int = 10) -> Dict[str, Any]:
    return {
        "ok": True,
        "profile": get_user_profile(),
        "conversations": get_last_conversations(limit=limit),
        "notes": get_notes(limit=limit),
        "preferences": get_preferences(),
    }


def save_user_profile(payload: dict) -> Dict[str, Any]:
    conn = _connect()
    cur = conn.cursor()
    _ensure_profile_row(conn)

    now = _now_iso()
    cur.execute("SELECT id, created_at FROM user_profile WHERE id = 1 LIMIT 1")
    existing = cur.fetchone()
    created_at = existing["created_at"] if existing else now

    cur.execute(
        "INSERT INTO user_profile (id, name, wake_time, sleep_time, preferred_editor, preferred_browser, personality_notes, created_at, updated_at) VALUES (1, ?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, wake_time=excluded.wake_time, sleep_time=excluded.sleep_time, preferred_editor=excluded.preferred_editor, preferred_browser=excluded.preferred_browser, personality_notes=excluded.personality_notes, updated_at=excluded.updated_at",
        (
            payload.get("name", "Dawood"),
            payload.get("wakeTime") or payload.get("wake_time") or '09:00',
            payload.get("sleepTime") or payload.get("sleep_time") or '23:00',
            payload.get("preferredEditor") or payload.get("preferred_editor") or 'code',
            payload.get("preferredBrowser") or payload.get("preferred_browser") or 'chrome',
            payload.get("personalityNotes") or payload.get("personality_notes") or '',
            created_at,
            now,
        ),
    )
    conn.commit()
    return {"ok": True, "profile": get_user_profile()}


def log_app_usage(app_name: str) -> bool:
    """Learning layer: record every app launch for pattern tracking."""
    try:
        from datetime import datetime
        conn = _connect()
        now = _now_iso()
        dt = datetime.utcnow()
        conn.execute(
            "INSERT INTO app_usage (app_name, launched_at) VALUES (?, ?)",
            (app_name.lower().strip(), now),
        )
        conn.commit()
        return True
    except Exception:
        return False


def get_app_usage_stats(days: int = 7) -> dict:
    """Return top launched apps in the last N days."""
    try:
        from datetime import datetime, timedelta
        conn = _connect()
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        cur = conn.execute(
            """
            SELECT app_name, COUNT(*) as launch_count
            FROM app_usage
            WHERE launched_at > ?
            GROUP BY app_name
            ORDER BY launch_count DESC
            LIMIT 10
            """,
            (cutoff,),
        )
        stats = {row["app_name"]: row["launch_count"] for row in cur.fetchall()}
        return {"ok": True, "stats": stats}
    except Exception as e:
        return {"ok": False, "reason": "db_error", "error": str(e)}
