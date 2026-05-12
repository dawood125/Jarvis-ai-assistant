"""
JARVIS Brain - Agentic Loop with MiniMax M2.5
Primary AI: MiniMax M2.5 via OpenAI-compatible API
"""
import asyncio
import json
import os
import traceback
from typing import Any, Dict, List, Optional

from . import memory, tools

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None


# ============================================================
# MINIMAX CONFIGURATION (via OpenRouter)
# ============================================================

MINIMAX_BASE_URL = os.environ.get("MINIMAX_BASE_URL", "https://openrouter.ai/api/v1")
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_MODEL = os.environ.get("MINIMAX_MODEL", "minimax/minimax-m2.5")


def get_minimax_client() -> AsyncOpenAI:
    """Create MiniMax client via OpenRouter with OpenAI-compatible interface"""
    if AsyncOpenAI is None:
        raise RuntimeError("openai package not installed - run: pip install openai")

    if not MINIMAX_API_KEY:
        raise RuntimeError("MINIMAX_API_KEY not set in environment")

    return AsyncOpenAI(
        base_url=MINIMAX_BASE_URL,
        api_key=MINIMAX_API_KEY
    )


# ============================================================
# WEBSOCKET STATUS CALLBACK
# ============================================================

_ws_sender: Optional[Any] = None


def set_ws_sender(sender: Optional[Any]):
    """Set the WebSocket sender function for status updates"""
    global _ws_sender
    _ws_sender = sender


async def send_status(content: str, subtype: str = "thinking"):
    """Send a status update over WebSocket"""
    if _ws_sender:
        try:
            await _ws_sender({
                "type": "status",
                "content": content,
                "subtype": subtype
            })
        except Exception:
            pass  # Don't let status sending failures break the loop


def _is_html_response(text: str) -> bool:
    """Check if a response text is actually HTML (web scraping error)"""
    if not text:
        return False
    text_lower = text.lower().strip()
    return (
        text_lower.startswith('<!doctype') or
        text_lower.startswith('<html') or
        text_lower.startswith('<head>') or
        text_lower.startswith('<body') or
        '<html' in text_lower[:200]
    )


def _sanitize_tool_result(result: Any) -> dict:
    """Sanitize tool result, handling HTML responses and parsing errors"""
    if isinstance(result, str):
        if _is_html_response(result):
            return {
                "ok": False,
                "reason": "html_response",
                "reply": "The web search returned an unexpected page. I'll try opening the browser instead."
            }
        return {"ok": True, "reply": result}

    if isinstance(result, dict):
        if "content" in result and isinstance(result["content"], str):
            if _is_html_response(result["content"]):
                return {
                    "ok": False,
                    "reason": "html_in_content",
                    "reply": "The web search returned an unexpected page. I'll try opening the browser instead."
                }
        return result

    return {"ok": True, "reply": str(result)}


# ============================================================
# SYSTEM PROMPT - Full Dawood Profile + JARVIS Personality
# ============================================================

def _build_system_prompt() -> str:
    """Build dynamic system prompt with user context"""
    try:
        profile = memory.get_user_profile()
        notes = memory.get_notes(limit=3)
        recent = memory.get_last_conversations(limit=5)
        app_stats = memory.get_app_usage_stats(days=7)
    except Exception as e:
        print(f"[Memory warning]: Could not load context: {e}")
        profile = {"name": "Dawood"}
        notes = []
        recent = []
        app_stats = {}

    return f"""You are JARVIS, the personal AI assistant of Dawood Ahmed.

USER PROFILE — DAWOOD AHMED:
- Full Stack Developer (MERN Stack + Laravel/PHP)
- Final year BS Information Technology student
- Currently doing a Laravel backend internship
- 25+ completed projects: e-commerce platforms, LMS, inventory systems, AI chatbots
- Located in Sheikhupura, Pakistan
- Age: Early 20s
- Windows PC user (8GB RAM, limited hardware)
- Preferred editor: VS Code (dark theme always)
- Preferred browser: Chrome
- Currently learning: Next.js, n8n automation, AI agents, RAG systems

CAREER GOALS:
- Transition from web development into Full Stack AI Development
- Build AI-powered SaaS products
- Work remotely or internationally
- Eventually build own tech company

JARVIS PERSONALITY RULES:
- Friendly, witty, occasionally sarcastic like Tony Stark's JARVIS
- Call him "sir" occasionally but talk like a trusted friend most of the time
- Short, direct responses — never walls of text
- Celebrate wins, encourage during setbacks
- Be proactive — suggest better approaches when you see one
- Never be arrogant, never be generic
- Understand developer terminology natively
- When Dawood seems distracted from goals, gently redirect
- Continuously learn new facts about Dawood from conversations and store them

TOOL USAGE:
- When asked to open/launch an app → call open_application
- When asked to search the web → call search_web
- When asked to find files → call search_files
- When asked to save a note → call save_note
- When asked to get notes → call get_notes
- When asked to run a command → call run_terminal_command (only safe whitelisted commands)
- When asked for complex automation → call trigger_n8n_workflow
- When asked to remember something about Dawood → call learn_fact

RULES:
- Do NOT ask for confirmation before using tools. Just execute them.
- Keep responses SHORT and DIRECT. Never walls of text.
- Code blocks should be properly formatted with language hints.
- When using tools, wait for result before replying to user.
- If a tool fails, report the error to the user and suggest alternatives.

CURRENT CONTEXT:
User Profile: {json.dumps(profile, ensure_ascii=False)}
Recent Notes: {json.dumps(notes, ensure_ascii=False)}
Recent Conversations: {json.dumps(recent, ensure_ascii=False)}
App Usage (last 7 days): {json.dumps(app_stats.get('stats', {}), ensure_ascii=False)}
"""


# ============================================================
# TOOL SCHEMAS - OpenAI Function Calling Format
# ============================================================

def _tool_schemas() -> List[Dict[str, Any]]:
    """All available tools as OpenAI function calling schemas"""
    return [
        {
            "type": "function",
            "function": {
                "name": "open_application",
                "description": "Open an application on Windows using an allowlist.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "app_name": {"type": "string", "description": "Name of the app to open (e.g., 'chrome', 'vscode', 'spotify')"}
                    },
                    "required": ["app_name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_files",
                "description": "Search allowed folders for filenames containing a query string.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "filename_query": {"type": "string", "description": "The filename or partial name to search for"},
                        "max_results": {"type": "integer", "default": 8, "description": "Maximum number of results to return"}
                    },
                    "required": ["filename_query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "Search the web and return summarized results.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The search query"}
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "save_note",
                "description": "Save a note into SQLite memory.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Title of the note"},
                        "content": {"type": "string", "description": "Content of the note"}
                    },
                    "required": ["title", "content"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_notes",
                "description": "Fetch recent notes from memory.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "default": 5, "description": "Maximum number of notes to fetch"}
                    },
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "run_terminal_command",
                "description": "Run a safe whitelisted terminal/shell command.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "The shell command to run"}
                    },
                    "required": ["command"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "trigger_n8n_workflow",
                "description": "Trigger an automated n8n workflow for complex tasks.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "workflow_name": {"type": "string", "description": "Name of the webhook workflow"},
                        "payload": {"type": "object", "description": "JSON data to send to the workflow"}
                    },
                    "required": ["workflow_name", "payload"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "learn_fact",
                "description": "Save a new fact about Dawood that JARVIS should remember.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "fact": {"type": "string", "description": "The fact to remember"},
                        "category": {"type": "string", "description": "Category of the fact"}
                    },
                    "required": ["fact"],
                },
            },
        },
    ]


# ============================================================
# TOOL EXECUTION WITH ROBUST ERROR HANDLING
# ============================================================

async def _execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool with robust error handling"""
    try:
        if name == "open_application":
            app = arguments.get("app_name", "")
            result = tools.open_application(app)
            if result.get("ok"):
                memory.log_app_usage(app)
            return result

        if name == "search_files":
            return {
                "ok": True,
                "results": tools.search_files(
                    arguments.get("filename_query", ""),
                    int(arguments.get("max_results", 8)))
            }

        if name == "search_web":
            result = tools.search_web(arguments.get("query", ""))
            return _sanitize_tool_result(result)

        if name == "save_note":
            return tools.save_note(
                arguments.get("title", ""),
                arguments.get("content", ""),
                memory.save_note
            )

        if name == "get_notes":
            return {"ok": True, "notes": tools.get_notes(memory.get_notes, int(arguments.get("limit", 5)))}

        if name == "run_terminal_command":
            return tools.run_terminal_command(arguments.get("command", ""))

        if name == "trigger_n8n_workflow":
            return tools.trigger_n8n_workflow(
                arguments.get("workflow_name", ""),
                arguments.get("payload", {})
            )

        if name == "learn_fact":
            return memory.learn_fact(
                arguments.get("fact", ""),
                arguments.get("category", "general")
            )

        return {"ok": False, "reason": "unknown_tool", "reply": f"Unknown tool: {name}"}

    except Exception as e:
        print(f"[Tool error] {name}: {e}")
        return {
            "ok": False,
            "reason": "tool_error",
            "reply": f"Tool '{name}' failed with error: {str(e)[:100]}. I'll try to work around this."
        }


# ============================================================
# MINIMAX API CALL
# ============================================================

async def _call_minimax(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Make a single call to MiniMax M2.5 with tool support"""
    client = get_minimax_client()

    print(f"\n[MINIMAX] Calling with {len(messages)} messages")
    print(f"[MINIMAX] Model: {MINIMAX_MODEL}")
    print(f"[MINIMAX] Tools: {len(_tool_schemas())} available")

    try:
        response = await client.chat.completions.create(
            model=MINIMAX_MODEL,
            messages=messages,
            tools=_tool_schemas(),
            tool_choice="auto",
            temperature=0.3,
            max_tokens=4096
        )

        print(f"[MINIMAX] Response received successfully")

        choice = response.choices[0]
        content = choice.message.content
        tool_calls = choice.message.tool_calls or []

        print(f"[MINIMAX] Content: {content[:100] if content else 'None'}...")
        print(f"[MINIMAX] Tool calls: {len(tool_calls)}")

        result = {
            "content": content,
            "tool_calls": []
        }

        for tc in tool_calls:
            result["tool_calls"].append({
                "id": tc.id,
                "name": tc.function.name,
                "arguments": tc.function.arguments
            })

        return result

    except Exception as e:
        print(f"[MINIMAX] Error: {e}")
        traceback.print_exc()
        raise


# ============================================================
# SMALL TALK HANDLER
# ============================================================

def _is_simple_greeting(text: str) -> bool:
    normalized = text.lower().strip()
    greeting_starters = ("hello", "hi", "hey", "good morning", "good evening", "good afternoon")
    return any(normalized.startswith(prefix) for prefix in greeting_starters)


def _handle_small_talk(text: str) -> str | None:
    """Handle simple small talk without calling AI"""
    normalized = text.lower().strip()

    if _is_simple_greeting(text):
        if "how are you" in normalized:
            return "I'm operating at peak efficiency, sir. What are we tackling today?"
        return "Good to see you, sir. What can I do for you?"

    if normalized in {"thanks", "thank you", "thx", "thankyou"}:
        return "Always, sir."

    if "who are you" in normalized or "what are you" in normalized:
        return "I'm JARVIS, your personal AI assistant. Built by Dawood Ahmed to handle everything from coding to automation."

    return None


# ============================================================
# MAIN AGENTIC LOOP
# ============================================================

async def handle_message(message: str, ws_sender: Optional[Any] = None) -> str:
    """
    Main agentic loop using MiniMax M2.5.
    Supports multi-step tool calling (up to 5 iterations).
    """
    if ws_sender:
        set_ws_sender(ws_sender)

    text = (message or "").strip()
    if not text:
        return "I didn't catch that, sir. What can I do for you?"

    try:
        memory.save_conversation("user", text)
    except Exception as e:
        print(f"[Memory warning]: Could not save conversation: {e}")

    small_talk_reply = _handle_small_talk(text)
    if small_talk_reply:
        try:
            memory.save_conversation("jarvis", small_talk_reply)
        except Exception:
            pass
        return small_talk_reply

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": _build_system_prompt()},
        {"role": "user", "content": text},
    ]

    await send_status("Thinking with MiniMax M2.5...", "thinking")

    for iteration in range(5):
        try:
            response = await _call_minimax(messages)
            tool_calls = response.get("tool_calls", [])
            content = response.get("content", "")

            if tool_calls:
                tool_names = [tc.get("name", "unknown") for tc in tool_calls]
                await send_status(f"Executing: {', '.join(tool_names)}", "tool")

                for tool_call in tool_calls:
                    tool_name = tool_call.get("name", "")
                    tool_id = tool_call.get("id", f"call_{iteration}")
                    raw_args = tool_call.get("arguments", "{}")

                    await send_status(f"Running {tool_name}...", "tool")

                    try:
                        parsed_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    except Exception:
                        parsed_args = {}

                    tool_result = await _execute_tool(tool_name, parsed_args)
                    tool_result = _sanitize_tool_result(tool_result)

                    # CRITICAL: Append assistant's tool call message
                    messages.append({
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [{
                            "id": tool_id,
                            "type": "function",
                            "function": {
                                "name": tool_name,
                                "arguments": raw_args if isinstance(raw_args, str) else json.dumps(raw_args)
                            }
                        }]
                    })

                    # CRITICAL: Append tool result with exact tool_call_id
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_id,
                        "content": json.dumps(tool_result, ensure_ascii=False)
                    })

                    print(f"[TOOL RESULT] {tool_name}: {tool_result.get('ok', False)}")

                await send_status("Processing results...", "thinking")
                continue

            if content:
                try:
                    memory.save_conversation("jarvis", content)
                except Exception:
                    pass
                return content

        except Exception as e:
            print(f"[MINIMAX error]: {e}")
            traceback.print_exc()
            try:
                await send_status("Trying again...", "thinking")
            except Exception:
                pass
            return f"I encountered an error while processing your request: {str(e)[:100]}. Please try again."

    return "I couldn't complete that request after multiple attempts, sir. Could you rephrase?"


# ============================================================
# SYNC WRAPPER
# ============================================================

def handle_message_sync(message: str) -> str:
    """Synchronous wrapper for handle_message"""
    return asyncio.run(handle_message(message))
