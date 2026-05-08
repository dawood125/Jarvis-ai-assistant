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
        # Strategy 1: use cmd /c start without title (works for registered aliases & UWP apps)
        subprocess.Popen(["cmd", "/c", "start", app_name], shell=False)
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
        return {"ok": False, "reason": "validation_error", "reply": "No query provided."}

    if requests is None or BeautifulSoup is None:
        url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}"
        webbrowser.open(url)
        return {"ok": True, "reply": f"Opened browser search for '{query}'."}

    # Strategy 1: DuckDuckGo Instant Answer API (free, no scraping, JSON)
    try:
        api_url = "https://api.duckduckgo.com/"
        params = {"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"}
        r = requests.get(api_url, params=params, timeout=8,
                         headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        r.raise_for_status()
        data = r.json()

        snippets = []
        if data.get("AbstractText"):
            snippets.append(data["AbstractText"])
        for related in data.get("RelatedTopics", [])[:3]:
            if isinstance(related, dict) and related.get("Text"):
                snippets.append(related["Text"])

        if snippets:
            summary = "\n".join([f"- {s[:300]}" for s in snippets[:4]])
            return {"ok": True, "reply": f"Search results for '{query}':\n{summary}", "results": snippets}
    except Exception:
        pass  # fall through to strategy 2

    # Strategy 2: DuckDuckGo Lite HTML scrape
    try:
        url = "https://lite.duckduckgo.com/lite/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        r = requests.post(url, data={"q": query}, headers=headers, timeout=10)
        r.raise_for_status()

        soup = BeautifulSoup(r.text, "html.parser")
        results = []
        for td in soup.find_all("td", class_="result-snippet"):
            text = td.get_text(strip=True)
            if text:
                results.append(text)
            if len(results) >= 3:
                break

        # Also grab result titles
        if not results:
            for a in soup.find_all("a", class_="result-link"):
                results.append(a.get_text(strip=True))
                if len(results) >= 3:
                    break

        if results:
            summary = "\n".join([f"- {r}" for r in results])
            return {"ok": True, "reply": f"Search results for '{query}':\n{summary}", "results": results}
    except Exception:
        pass

    # Strategy 3: Open browser as last resort
    url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}"
    webbrowser.open(url)
    return {"ok": True, "reply": f"I opened a browser search for '{query}' since web scraping returned no results.", "url": url}


# Allowlist of safe terminal commands (no destructive ops)
SAFE_COMMANDS = {
    "dir", "ls", "echo", "type", "cat", "ipconfig", "ping", "systeminfo",
    "tasklist", "whoami", "hostname", "date", "time", "ver", "cd", "pwd",
    "python", "pip", "git", "node", "npm", "code", "curl"
}


def run_terminal_command(command: str) -> dict:
    """Run a safe, whitelisted terminal command and return output."""
    cmd = (command or "").strip()
    if not cmd:
        return {"ok": False, "reason": "empty_command", "reply": "No command provided."}

    base = cmd.split()[0].lower().rstrip(".exe")
    if base not in SAFE_COMMANDS:
        return {
            "ok": False,
            "reason": "not_allowed",
            "reply": f"Command '{base}' is not in the safe command list. I won't run that, sir."
        }

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=15,
            encoding="utf-8",
            errors="replace"
        )
        output = (result.stdout or result.stderr or "").strip()
        return {
            "ok": True,
            "reply": f"```\n{output[:2000]}\n```" if output else "Command ran with no output.",
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "reason": "timeout", "reply": "Command timed out after 15 seconds."}
    except Exception as e:
        return {"ok": False, "reason": "exec_error", "reply": str(e)}


def trigger_n8n_workflow(workflow_name: str, payload: dict) -> dict:
    """Trigger an n8n webhook workflow."""
    if not workflow_name:
        return {"ok": False, "reason": "validation_error", "reply": "Workflow name required."}

    # In n8n, you typically set up a webhook URL per workflow.
    # We will assume a base URL format: http://localhost:5678/webhook/{workflow_name}
    base_url = os.environ.get("N8N_WEBHOOK_BASE_URL", "http://localhost:5678/webhook/")
    
    # Ensure URL ends with slash before appending name to avoid malformed URLs
    if not base_url.endswith("/"):
        base_url += "/"
        
    url = f"{base_url}{urllib.parse.quote(workflow_name)}"

    if requests is None:
        return {"ok": False, "reason": "missing_dependency", "reply": "Requests module not installed."}

    try:
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        
        # n8n might return JSON or text
        try:
            data = r.json()
            return {"ok": True, "reply": f"Triggered workflow '{workflow_name}'. Output:\n{json.dumps(data)}"}
        except ValueError:
            return {"ok": True, "reply": f"Triggered workflow '{workflow_name}'. Response:\n{r.text}"}
    except Exception as e:
        return {"ok": False, "reason": "request_failed", "reply": f"Failed to trigger n8n workflow '{workflow_name}': {str(e)}"}
