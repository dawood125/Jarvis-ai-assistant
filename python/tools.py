import os
import subprocess
import webbrowser
import shlex
import urllib.parse
from pathlib import Path
from typing import List

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    requests = None
    BeautifulSoup = None

SYSTEM_ACTIONS_ENABLED = os.environ.get('SYSTEM_ACTIONS_ENABLED', 'false').lower() == 'true'
APP_ALLOWLIST = [s.strip() for s in os.environ.get('SYSTEM_APP_ALLOWLIST', 'code,chrome,wt,spotify').split(',') if s.strip()]
SEARCH_ROOTS = [p.strip() for p in os.environ.get('SYSTEM_FILE_SEARCH_ROOTS', str(Path(__file__).resolve().parents[1])).split(',') if p.strip()]


def open_application(app_name: str) -> dict:
    app_name = (app_name or '').strip()
    system_actions_enabled = os.environ.get('SYSTEM_ACTIONS_ENABLED', 'false').lower() == 'true'
    if not system_actions_enabled:
        return {"ok": False, "reason": "system_actions_disabled", "reply": "System actions disabled by configuration."}

    app_key = f"SYSTEM_APP_{app_name.upper().replace(' ', '_')}"
    mapped_app_name = os.environ.get(app_key)
    
    if mapped_app_name:
        app_name = mapped_app_name

    allowlist = [s.strip() for s in os.environ.get('SYSTEM_APP_ALLOWLIST', 'code,chrome,wt,spotify').split(',') if s.strip()]

    if app_name.lower() not in [a.lower() for a in allowlist]:
        return {"ok": False, "reason": "not_allowed", "reply": f"App '{app_name}' is not allowed."}

    try:
        args = ["cmd", "/c", "start", "", app_name]
        subprocess.Popen(args, shell=False)
        return {"ok": True, "reply": f"Launched {app_name}."}
    except Exception as e:
        return {"ok": False, "reason": "launch_failed", "reply": str(e)}


def search_files(query: str, max_results: int = 10) -> List[str]:
    q = (query or '').lower().strip()
    if not q:
        return []

    results = []
    search_roots_env = os.environ.get('SYSTEM_FILE_SEARCH_ROOTS', str(Path(__file__).resolve().parents[1]))
    roots = [p.strip() for p in search_roots_env.split(',') if p.strip()] if search_roots_env else [str(Path.home())]

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
    
    if requests is None or BeautifulSoup is None:
        url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}"
        webbrowser.open(url)
        return {"ok": True, "reply": f"Opened web search for '{query}' in browser (requests/bs4 not installed).", "url": url}
    
    try:
        url = "https://lite.duckduckgo.com/lite/"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        data = {"q": query}
        res = requests.post(url, data=data, headers=headers, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        for td in soup.find_all('td', class_='result-snippet'):
            results.append(td.get_text(strip=True))
            if len(results) >= 3:
                break
        
        if not results:
            return {"ok": True, "reply": f"No results found for '{query}'.", "results": []}
            
        summary = "\n".join([f"- {r}" for r in results])
        return {"ok": True, "reply": f"Search results for '{query}':\n{summary}", "results": results}
    except Exception as e:
        return {"ok": False, "reason": "search_failed", "reply": f"Web search failed: {str(e)}"}
