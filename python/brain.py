import asyncio
import json
import os
from typing import Any, Dict, List

from . import memory, tools

try:
    from groq import Groq
except Exception:  # pragma: no cover - optional at import time
    Groq = None

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")


def _build_system_prompt() -> str:
    profile = memory.get_user_profile()
    notes = memory.get_notes(limit=3)
    recent = memory.get_last_conversations(limit=5)
    return "\n".join([
        "You are JARVIS, a personal AI assistant for Dawood Ahmed, a Full Stack Developer in Pakistan.",
        "PERSONALITY: Friendly, witty, slightly sarcastic like Tony Stark's JARVIS. Call him 'sir' occasionally.",
        "RULE: Keep replies SHORT and DIRECT. Never write walls of text.",
        "TOOL USAGE: When the user asks to open/launch an app, ALWAYS call open_application. When they ask to search the web, ALWAYS call search_web. When they ask to find files, ALWAYS call search_files.",
        "N8N AUTOMATION: When the user asks to perform complex integrations (e.g. check emails, prepare workspace, fetch crypto prices), ALWAYS call trigger_n8n_workflow.",
        "IMPORTANT: Do NOT ask for confirmation before using tools. Just use them immediately.",
        f"User profile: {json.dumps(profile, ensure_ascii=False)}",
        f"Recent notes: {json.dumps(notes, ensure_ascii=False)}",
        f"Recent conversations: {json.dumps(recent, ensure_ascii=False)}",
    ])


def _tool_schemas() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "open_application",
                "description": "Open an application on Windows using an allowlist.",
                "parameters": {
                    "type": "object",
                    "properties": {"app_name": {"type": "string"}},
                    "required": ["app_name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_files",
                "description": "Search allowed folders for filenames containing a query.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "filename_query": {"type": "string"},
                        "max_results": {"type": "integer", "default": 8},
                    },
                    "required": ["filename_query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "save_note",
                "description": "Save a note into SQLite.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "content": {"type": "string"},
                    },
                    "required": ["title", "content"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_notes",
                "description": "Fetch recent notes from SQLite.",
                "parameters": {
                    "type": "object",
                    "properties": {"limit": {"type": "integer", "default": 5}},
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "Search the web and return summarized results for any query.",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "run_terminal_command",
                "description": "Run a safe whitelisted terminal/shell command and return the output. Only use for read-only info commands like ipconfig, ping, tasklist, git status, etc.",
                "parameters": {
                    "type": "object",
                    "properties": {"command": {"type": "string", "description": "The shell command to run"}},
                    "required": ["command"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "trigger_n8n_workflow",
                "description": "Trigger an automated n8n workflow for complex tasks (like sending emails, preparing environments, API heavy lifting).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "workflow_name": {"type": "string", "description": "The name or ID of the webhook workflow (e.g., 'prepare-workspace')"},
                        "payload": {"type": "object", "description": "JSON object containing data to send to the workflow", "additionalProperties": True}
                    },
                    "required": ["workflow_name", "payload"],
                },
            },
        },
    ]


def _execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if name == "open_application":
        app = arguments.get("app_name", "")
        result = tools.open_application(app)
        if result.get("ok"):
            memory.log_app_usage(app)  # Learning layer: track app usage
        return result
    if name == "search_files":
        return {"ok": True, "results": tools.search_files(arguments.get("filename_query", ""), int(arguments.get("max_results", 8)))}
    if name == "save_note":
        return tools.save_note(arguments.get("title", ""), arguments.get("content", ""), memory.save_note)
    if name == "get_notes":
        return {"ok": True, "notes": tools.get_notes(memory.get_notes, int(arguments.get("limit", 5)))}
    if name == "search_web":
        return tools.search_web(arguments.get("query", ""))
    if name == "run_terminal_command":
        return tools.run_terminal_command(arguments.get("command", ""))
    if name == "trigger_n8n_workflow":
        return tools.trigger_n8n_workflow(arguments.get("workflow_name", ""), arguments.get("payload", {}))
    return {"ok": False, "reason": "unknown_tool", "reply": f"Unknown tool: {name}"}


def _is_simple_greeting(text: str) -> bool:
    normalized = text.lower().strip()
    greeting_starters = ("hello", "hi", "hey", "good morning", "good evening", "good afternoon")
    return any(normalized.startswith(prefix) for prefix in greeting_starters)


def _handle_small_talk(text: str) -> str | None:
    normalized = text.lower().strip()

    if _is_simple_greeting(text):
        if "how are you" in normalized:
            return "I’m operating at peak efficiency, sir. What are we tackling today?"
        return "Good to see you, sir. What can I do for you?"

    if normalized in {"thanks", "thank you", "thx"}:
        return "Always, sir."

    return None


async def _handle_with_groq(message: str) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    if Groq is None or not api_key:
        raise RuntimeError("Groq client unavailable")

    client = Groq(api_key=api_key)
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": _build_system_prompt()},
        {"role": "user", "content": message},
    ]

    for _ in range(5):
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=model,
            messages=messages,
            tools=_tool_schemas(),
            tool_choice="auto",
            temperature=0.3,
        )

        choice = response.choices[0].message
        tool_calls = getattr(choice, "tool_calls", None) or []
        content = getattr(choice, "content", None)

        if tool_calls:
            messages.append({"role": "assistant", "content": content or "", "tool_calls": [
                {
                    "id": tool_call.id,
                    "type": "function",
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments,
                    },
                }
                for tool_call in tool_calls
            ]})

            for tool_call in tool_calls:
                raw_arguments = tool_call.function.arguments or "{}"
                try:
                    parsed_arguments = json.loads(raw_arguments)
                except Exception:
                    parsed_arguments = {}
                tool_result = await asyncio.to_thread(_execute_tool, tool_call.function.name, parsed_arguments)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(tool_result, ensure_ascii=False),
                    }
                )
            continue

        if content:
            return content.strip()

    return "I couldn't finish that request."


def _route_model(text: str) -> tuple[str, str]:
    """AI Router: Determines which provider and model to use based on the task."""
    lower = text.lower()
    
    # Coding Tasks -> OpenRouter (Qwen Coder)
    if any(k in lower for k in ["code", "debug", "react", "python", "script", "error", "bug", "write a program"]):
        return "openrouter", "qwen/qwen-2.5-coder-32b-instruct"
        
    # Deep Planning Tasks -> OpenRouter (DeepSeek R1)
    if any(k in lower for k in ["plan", "architecture", "analyze", "strategy", "think", "complex"]):
        return "openrouter", "deepseek/deepseek-r1"
        
    # Default Chat -> Groq
    return "groq", os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

async def _handle_with_openrouter(message: str, model: str) -> str:
    import requests
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OpenRouter API key missing")
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": os.environ.get("OPENROUTER_REFERER", "http://localhost:5173"),
        "X-Title": os.environ.get("OPENROUTER_APP_TITLE", "Jarvis"),
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _build_system_prompt()},
            {"role": "user", "content": message}
        ],
        "temperature": 0.3
    }
    
    response = await asyncio.to_thread(requests.post, "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


async def handle_message(message: str) -> str:
    text = (message or "").strip()
    if not text:
        return "I didn't get that."

    memory.save_conversation("user", text)

    small_talk_reply = _handle_small_talk(text)
    if small_talk_reply:
        memory.save_conversation("jarvis", small_talk_reply)
        return small_talk_reply

    provider, model = _route_model(text)
    
    try:
        if provider == "openrouter" and os.environ.get("OPENROUTER_API_KEY"):
            reply = await _handle_with_openrouter(text, model)
        elif os.environ.get("GROQ_API_KEY") and Groq is not None:
            reply = await _handle_with_groq(text)
        else:
            reply = await asyncio.to_thread(_handle_local_fallback, text)
    except Exception as e:
        print(f"[{provider} error]: {e}")
        reply = await asyncio.to_thread(_handle_local_fallback, text)

    memory.save_conversation("jarvis", reply)
    return reply


def _handle_local_fallback(text: str) -> str:
    lower = text.lower()

    if lower.startswith("search files") or lower.startswith("find file") or "search files for" in lower:
        query = text.split(maxsplit=2)[-1] if len(text.split()) >= 2 else text
        results = tools.search_files(query, max_results=8)
        if not results:
            return f"No files found for '{query}'."
        return "Found {} result(s):\n{}".format(len(results), "\n".join(results[:8]))

    if lower.startswith("open ") or lower.startswith("launch "):
        app = text.split(maxsplit=1)[1]
        result = tools.open_application(app)
        return result.get("reply", "Failed to launch")

    if lower.startswith("note ") or lower.startswith("save note"):
        content = text.partition(" ")[2]
        result = tools.save_note("", content, memory.save_note)
        return result.get("reply", "Note saved.")

    return f"Echo: {text}"


def handle_message_sync(message: str) -> str:
    return asyncio.run(handle_message(message))
