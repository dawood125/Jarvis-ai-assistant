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
    notes = memory.get_notes(limit=5)
    recent = memory.get_last_conversations(limit=5)
    return "\n".join([
        "You are JARVIS, a concise Windows desktop assistant.",
        f"User profile: {json.dumps(profile, ensure_ascii=False)}",
        f"Recent notes: {json.dumps(notes, ensure_ascii=False)}",
        f"Recent conversations: {json.dumps(recent, ensure_ascii=False)}",
        "Use tools when needed. Keep replies short and direct.",
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
                "description": "Open Google search in the browser.",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        },
    ]


def _execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if name == "open_application":
        return tools.open_application(arguments.get("app_name", ""))
    if name == "search_files":
        return {"ok": True, "results": tools.search_files(arguments.get("filename_query", ""), int(arguments.get("max_results", 8)))}
    if name == "save_note":
        return tools.save_note(arguments.get("title", ""), arguments.get("content", ""), memory.save_note)
    if name == "get_notes":
        return {"ok": True, "notes": tools.get_notes(memory.get_notes, int(arguments.get("limit", 5)))}
    if name == "search_web":
        return tools.search_web(arguments.get("query", ""))
    return {"ok": False, "reason": "unknown_tool", "reply": f"Unknown tool: {name}"}


async def _handle_with_groq(message: str) -> str:
    if Groq is None or not GROQ_API_KEY:
        raise RuntimeError("Groq client unavailable")

    client = Groq(api_key=GROQ_API_KEY)
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": _build_system_prompt()},
        {"role": "user", "content": message},
    ]

    for _ in range(4):
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=GROQ_MODEL,
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
                tool_result = _execute_tool(tool_call.function.name, parsed_arguments)
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


async def handle_message(message: str) -> str:
    text = (message or "").strip()
    if not text:
        return "I didn't get that."

    memory.save_conversation("user", text)

    if GROQ_API_KEY and Groq is not None:
        try:
            reply = await _handle_with_groq(text)
        except Exception:
            reply = await asyncio.to_thread(_handle_local_fallback, text)
    else:
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
