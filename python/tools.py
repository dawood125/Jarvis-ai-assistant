import os
import subprocess
import webbrowser
from pathlib import Path
from typing import List

SYSTEM_ACTIONS_ENABLED = os.environ.get('SYSTEM_ACTIONS_ENABLED', 'false').lower() == 'true'
APP_ALLOWLIST = [s.strip() for s in os.environ.get('SYSTEM_APP_ALLOWLIST', 'code,chrome,wt,spotify').split(',') if s.strip()]
SEARCH_ROOTS = [p.strip() for p in os.environ.get('SYSTEM_FILE_SEARCH_ROOTS', str(Path(__file__).resolve().parents[1])).split(',') if p.strip()]


def open_application(app_name: str) -> dict:
    app_name = (app_name or '').strip()
    if not SYSTEM_ACTIONS_ENABLED:
        return {"ok": False, "reason": "system_actions_disabled", "reply": "System actions disabled by configuration."}

    # simple allowlist check
    if app_name.lower() not in [a.lower() for a in APP_ALLOWLIST]:
        return {"ok": False, "reason": "not_allowed", "reply": f"App '{app_name}' is not allowed."}

    try:
        # Try os.startfile on Windows for common apps; fallback to subprocess.
        try:
            os.startfile(app_name)
        except Exception:
            subprocess.Popen([app_name], shell=True)
        return {"ok": True, "reply": f"Launched {app_name}."}
    except Exception as e:
        return {"ok": False, "reason": "launch_failed", "reply": str(e)}


def search_files(query: str, max_results: int = 10) -> List[str]:
    q = (query or '').lower().strip()
    if not q:
        return []

    results = []
    roots = SEARCH_ROOTS if len(SEARCH_ROOTS) > 0 else [str(Path.home())]

    for root in roots:
        root_path = Path(root)
        if not root_path.exists():
            continue
        try:
            for dirpath, dirnames, filenames in os.walk(root_path):
                for fn in filenames:
                    if q in fn.lower():
                        results.append(str(Path(dirpath) / fn))
                        if len(results) >= max_results:
                            return results
        except Exception:
            continue
    return results


def save_note(title: str, content: str, memory_save_func) -> dict:
    text = (title or '').strip()
    if content:
        text = (text + '\n' + content).strip()
    if not text:
        return {"ok": False, "reason": "validation_error", "reply": "Note text required."}

    return memory_save_func(text)


def get_notes(memory_get_notes_func, limit: int = 10) -> List[dict]:
    return memory_get_notes_func(limit)


def search_web(query: str) -> dict:
    if not query:
        return {"ok": False, "reason": "validation_error"}
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    webbrowser.open(url)
    return {"ok": True, "reply": f"Opened web search for '{query}'", "url": url}
