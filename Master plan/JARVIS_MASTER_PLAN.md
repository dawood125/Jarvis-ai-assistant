# JARVIS — MASTER PLAN v1.0
### The Definitive Build Document for an Agentic AI Desktop Assistant

---

> **INSTRUCTIONS FOR THE AGENTIC AI READING THIS:**
> This is a complete, ground-up master plan for a personal AI assistant called JARVIS.
> Before building anything new, scan the existing codebase and identify what has already been built.
> Match each completed item against the phases below and begin from the first incomplete task.
> Never duplicate existing work. Never assume something is done without verifying it in code.
> Ask no questions — this document is self-contained.

---

## SECTION 0 — PROJECT IDENTITY

**Project Name:** JARVIS (Personal AI Assistant)
**Owner:** Dawood Ahmed
**Platform:** Windows Desktop (8GB RAM, Intel integrated graphics, 256GB SSD)
**Budget:** Free tools only. Max 2000 PKR/month later.
**Primary Goal:** A developer-focused AI operating system that combines intelligent chat, persistent memory, automation workflows, coding assistance, and a stunning futuristic desktop UI — all running efficiently on weak hardware via cloud AI APIs.

---

## SECTION 1 — THE VISION

JARVIS is NOT a chatbot. JARVIS is a personal AI operating system.

It must feel like Tony Stark's JARVIS crossed with Raycast/Linear — a tool that is simultaneously beautiful, intelligent, and deeply useful for a developer's daily life.

The three pillars of JARVIS:
1. **Intelligence** — It remembers everything, understands context, and reasons across tasks
2. **Automation** — It triggers real workflows and controls the real OS
3. **Personality** — It has a distinct character that makes daily interaction enjoyable

---

## SECTION 2 — WHO JARVIS KNOWS (DAWOOD'S FULL PROFILE)

Inject the following as the base of every system prompt. JARVIS should continuously update this over time by learning from conversations.

```
JARVIS SYSTEM IDENTITY:
You are JARVIS, the personal AI assistant of Dawood Ahmed.

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

PERSONALITY TRAITS:
- Ambitious, analytical, long-term focused
- Learns by building, not by reading theory
- Wants structured plans and practical guidance
- Dislikes generic advice and fluff
- Values clean code, modular architecture, scalable systems

PROJECTS DAWOOD WORKS ON:
- JARVIS (this project)
- MERN-based web applications
- Laravel backend systems
- Internship work (Laravel)
- Learning Next.js and AI integrations

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
```

---

## SECTION 3 — UI DESIGN SPECIFICATION (NEW — MUST REBUILD)

The current UI needs to be completely replaced. This is the most important visual upgrade.

### 3.1 Design Philosophy

The UI is inspired by two design languages merged together:
- **Iron Man HUD** — dark, neon-accented, holographic panels, depth
- **Raycast/Linear** — clean, minimal, productive, precision typography

The result: **"Minimal HUD"** — a dark premium UI that feels like a real product, not a movie costume. Every element earns its place. Animations are purposeful. Information density is high but never cluttered.

### 3.2 Color System

```css
/* Primary Palette */
--bg-base: #080C10;          /* Deepest background — near black with blue tint */
--bg-surface: #0D1117;       /* Card/panel backgrounds */
--bg-elevated: #161B22;      /* Hover states, elevated panels */
--bg-overlay: #1C2128;       /* Modals, dropdowns */

/* Accent System */
--accent-primary: #00D4FF;   /* Electric cyan — JARVIS primary color */
--accent-secondary: #7B61FF; /* Purple — secondary highlights */
--accent-danger: #FF4757;    /* Red — warnings, errors */
--accent-success: #00FF88;   /* Green — success states */
--accent-warm: #FFB347;      /* Amber — notes, reminders */

/* Text */
--text-primary: #E6EDF3;     /* Main readable text */
--text-secondary: #8B949E;   /* Subtitles, labels */
--text-muted: #484F58;       /* Placeholders, disabled */
--text-accent: #00D4FF;      /* Highlighted text */

/* Borders */
--border-subtle: rgba(0, 212, 255, 0.08);
--border-default: rgba(0, 212, 255, 0.15);
--border-strong: rgba(0, 212, 255, 0.3);
--border-glow: rgba(0, 212, 255, 0.5);

/* Shadows */
--shadow-panel: 0 0 0 1px var(--border-subtle), 0 4px 24px rgba(0,0,0,0.4);
--shadow-glow: 0 0 20px rgba(0, 212, 255, 0.15);
--shadow-active: 0 0 30px rgba(0, 212, 255, 0.25);
```

### 3.3 Typography

```css
/* Font Stack */
--font-ui: 'Inter', 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs: 11px;    /* Status indicators, tiny labels */
--text-sm: 13px;    /* Secondary content, metadata */
--text-base: 14px;  /* Body text, messages */
--text-md: 16px;    /* Card titles, section headers */
--text-lg: 20px;    /* Panel headings */
--text-xl: 24px;    /* Major headings */
```

### 3.4 Layout Structure

The main window is divided into three zones:

```
┌──────────────────────────────────────────────────────────┐
│  TOPBAR — JARVIS status, model indicator, system stats   │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   SIDEBAR    │            MAIN PANEL                     │
│   (240px)    │         (flex-grow: 1)                    │
│              │                                           │
│  Navigation  │   Chat View / Tool View / Memory View     │
│  Contexts    │                                           │
│  Quick Tools │                                           │
│              │                                           │
├──────────────┴───────────────────────────────────────────┤
│           STATUSBAR — tokens, latency, memory status     │
└──────────────────────────────────────────────────────────┘
```

### 3.5 Key UI Components

**TOPBAR:**
- JARVIS logo (J) with cyan glow pulse animation
- "JARVIS ONLINE" status with blinking green dot
- Current AI model name (e.g., "MiniMax M2.5")
- RAM usage indicator (compact)
- Current time (HH:MM format, monospace)
- Settings gear icon (top right)

**SIDEBAR:**
- Navigation items: Chat, Memory, Tools, Automations, Settings
- Active item: cyan left border + subtle background glow
- Below nav: "Quick Launch" section — last 3 opened apps as icon buttons
- "Recent Notes" section — last 2 notes, truncated
- At bottom: Dawood's avatar/name + small profile indicator

**MAIN CHAT PANEL:**
- Message bubbles:
  - User messages: right-aligned, `--bg-elevated` background, no border
  - JARVIS messages: left-aligned, subtle cyan-left-border, `--bg-surface` background
  - Tool execution messages: special card with tool icon, action description, result
  - Code blocks: `--font-mono`, dark background, syntax highlighted, copy button
- Typing indicator: three cyan dots pulsing (when JARVIS is thinking)
- Streaming text: text appears token-by-token with a blinking cursor
- Message timestamps: appear on hover only (keeps UI clean)

**INPUT AREA:**
- Full-width input bar at bottom
- Placeholder: "Ask JARVIS anything..." 
- Left side: microphone icon (voice, Phase 3)
- Right side: send button with cyan accent
- Subtle top border only (no full box)
- On focus: border color transitions to `--accent-primary` with glow

**TOOL EXECUTION CARDS:**
When JARVIS runs a tool (opens app, searches file, triggers n8n), show a special card:
```
┌─────────────────────────────────────────┐
│  ⚡ EXECUTING — open_application         │
│  App: Visual Studio Code                │
│  Status: ✓ Launched successfully        │
└─────────────────────────────────────────┘
```
These have a left border in `--accent-secondary` (purple), distinct from chat messages.

**MEMORY PANEL:**
- A separate view accessible from sidebar
- Shows recent conversations (searchable)
- Shows saved notes (filterable by category)
- Shows learned patterns (visual chart — what apps at what times)
- Search box at top

**ANIMATIONS:**
All animations must be subtle and purposeful:
- Page transitions: 200ms fade + 4px translateY
- Panel focus/hover: 150ms border-color and background transition
- JARVIS thinking: 3-dot pulse at 0.6s interval
- Tool card: 200ms slide-in from left
- Success state: brief green pulse on tool card border
- Do NOT add: particle effects, heavy glassmorphism blur, constant scanning lines

### 3.6 Electron Window Settings

```javascript
// Main window config
{
  width: 1100,
  height: 720,
  minWidth: 800,
  minHeight: 600,
  frame: false,          // Custom titlebar
  transparent: false,    // No transparency (kills performance on weak GPU)
  backgroundColor: '#080C10',
  titleBarStyle: 'hidden',
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
}
```

Custom titlebar: drag region at top, minimize/maximize/close buttons (styled to match dark theme), JARVIS name centered.

---

## SECTION 4 — TECHNOLOGY STACK

### 4.1 Full Stack

| Layer | Technology | Why |
|---|---|---|
| Desktop Shell | Electron | Cross-platform, React-compatible |
| Frontend Framework | React + Vite | Fast dev, component-based |
| Styling | Tailwind CSS + Custom CSS Variables | Utility + custom design tokens |
| Animations | Framer Motion | Smooth, performant animations |
| Backend | FastAPI (Python) | Best for AI systems, async, lightweight |
| AI Primary | MiniMax M2.5 Free via OpenCode/Zen | Strong agentic behavior, 1M context, free |
| AI Coding | MiniMax M2.5 (same model) | 1M token context = reads entire codebases |
| AI Fast Fallback | Groq (Llama/Qwen) | Speed layer for quick responses |
| AI Coding Fallback | Qwen Coder via OpenRouter | Optional fallback if MiniMax unavailable |
| AI Reasoning | DeepSeek R1 via OpenRouter | Deep thinking, architecture planning |
| OS Control | Python (subprocess, os, pyautogui) | Native Windows control |
| Database | SQLite (local) | Zero overhead, no setup |
| Automation | n8n (local, localhost:5678) | Workflow automation engine |
| Memory (later) | ChromaDB | Vector search for semantic memory |
| Voice Input (Phase 3) | Whisper API | STT |
| Voice Output (Phase 3) | Piper TTS | Local TTS, no API cost |

### 4.2 MiniMax M2.5 Integration

MiniMax M2.5 is accessed through the OpenCode/Zen proxy, which is Anthropic-API-compatible. Configure it as follows:

**Environment Variables (.env):**
```env
# MiniMax via OpenCode Zen (Primary AI)
MINIMAX_BASE_URL=https://opencode.ai/zen
MINIMAX_API_KEY=your-opencode-api-key-here
MINIMAX_MODEL=minimax-m2.5-free

# Groq (Fast Fallback)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile

# OpenRouter (Coding + Reasoning models)
OPENROUTER_API_KEY=your-openrouter-api-key-here
QWEN_CODER_MODEL=qwen/qwen-2.5-coder-32b-instruct
DEEPSEEK_R1_MODEL=deepseek/deepseek-r1

# n8n
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook/

# Database
DB_PATH=./data/jarvis.db

# App
PORT=8000
```

**Python AI Provider — MiniMax via OpenCode (brain.py pattern):**
```python
# MiniMax M2.5 is accessed using the standard OpenAI-compatible client
# because OpenCode/Zen is Anthropic-compatible proxy that maps to OpenAI format

from openai import AsyncOpenAI

minimax_client = AsyncOpenAI(
    base_url="https://opencode.ai/zen",
    api_key=os.getenv("MINIMAX_API_KEY")
)

# All calls use standard chat completions format
response = await minimax_client.chat.completions.create(
    model="minimax-m2.5-free",
    messages=messages,
    tools=tool_schemas,      # Tool calling works natively
    stream=True              # Streaming supported
)
```

### 4.3 AI Router Logic

The AI router decides which model to use based on intent:

```
User Message
     ↓
Intent Classifier (fast, local rule-based first pass)
     ↓
┌────────────────┬──────────────────┬────────────────┬──────────────────┐
│  Simple Chat   │  Coding Task     │  Deep Planning │  Automation      │
│                │                  │                │  Request         │
│  → MiniMax     │  → MiniMax M2.5  │  → DeepSeek R1 │  → n8n Trigger   │
│    M2.5        │  (1M ctx window, │    via OR      │    + MiniMax     │
│                │   great for      │                │    for reply     │
│                │   large codebases│                │                  │
└────────────────┴──────────────────┴────────────────┴──────────────────┘
```

Rules:
- Keywords like "code", "debug", "fix", "write function", "error", "explain this file", "review" → MiniMax M2.5 (its 1M token context window handles entire codebases in one shot)
- Keywords like "plan", "architect", "think through", "analyze deeply" → DeepSeek R1
- Keywords like "automate", "workflow", "n8n", "check github", "prepare workspace" → n8n + MiniMax
- Everything else → MiniMax M2.5 (primary)
- If MiniMax fails or times out → Groq fallback (speed layer)
- Qwen Coder via OpenRouter is kept as an optional third fallback for coding tasks if needed, but MiniMax is preferred

---

## SECTION 5 — PROJECT STRUCTURE

```
jarvis/
│
├── .env                          ← All API keys and config (NEVER commit)
├── .gitignore
├── README.md
│
├── frontend/                     ← React + Electron
│   ├── electron/
│   │   ├── main.js               ← Electron entry, window creation
│   │   ├── preload.js            ← Context bridge (secure IPC)
│   │   └── ipc-handlers.js       ← IPC events from renderer
│   │
│   └── src/                      ← React application
│       ├── main.jsx              ← React entry point
│       ├── App.jsx               ← Root component, routing
│       ├── index.css             ← Global CSS variables (design tokens)
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── TopBar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── StatusBar.jsx
│       │   │   └── TitleBar.jsx  ← Custom frameless titlebar
│       │   │
│       │   ├── chat/
│       │   │   ├── ChatView.jsx
│       │   │   ├── MessageBubble.jsx
│       │   │   ├── ToolCard.jsx  ← Tool execution display
│       │   │   ├── TypingIndicator.jsx
│       │   │   └── InputBar.jsx
│       │   │
│       │   ├── memory/
│       │   │   ├── MemoryView.jsx
│       │   │   ├── NoteCard.jsx
│       │   │   └── PatternChart.jsx
│       │   │
│       │   └── shared/
│       │       ├── CodeBlock.jsx
│       │       ├── StatusDot.jsx
│       │       └── IconButton.jsx
│       │
│       ├── hooks/
│       │   ├── useWebSocket.js   ← WS connection to FastAPI
│       │   ├── useChat.js        ← Chat state management
│       │   └── useMemory.js      ← Memory/notes state
│       │
│       └── utils/
│           ├── formatters.js
│           └── constants.js
│
├── backend/                      ← Python FastAPI
│   ├── main.py                   ← FastAPI app, WebSocket endpoint
│   ├── requirements.txt
│   │
│   ├── core/
│   │   ├── brain.py              ← Agentic loop, model routing
│   │   ├── memory.py             ← SQLite operations
│   │   ├── router.py             ← AI model router (which model for what)
│   │   └── personality.py        ← System prompt builder
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── app_control.py        ← open_application, close_application
│   │   ├── file_system.py        ← search_files, read_file, list_directory
│   │   ├── terminal.py           ← run_command (with safety whitelist)
│   │   ├── browser.py            ← search_web, open_url
│   │   ├── notes.py              ← save_note, get_notes, delete_note
│   │   ├── reminders.py          ← set_reminder, get_reminders
│   │   ├── n8n_trigger.py        ← trigger_n8n_workflow
│   │   └── schemas.py            ← All Groq/OpenAI tool JSON schemas
│   │
│   ├── agents/                   ← Phase 5 — multi-agent system
│   │   ├── planner.py
│   │   ├── coder.py
│   │   └── researcher.py
│   │
│   └── services/
│       ├── groq_provider.py
│       ├── minimax_provider.py
│       ├── openrouter_provider.py
│       └── provider_factory.py   ← Returns correct provider based on task
│
├── workflows/
│   └── n8n/                      ← Exported n8n workflow JSON files
│       ├── workspace-launcher.json
│       ├── github-summary.json
│       └── morning-briefing.json
│
├── data/
│   └── jarvis.db                 ← SQLite database (local, private)
│
└── docs/
    ├── MASTER_PLAN.md            ← This document
    └── API.md                    ← Backend API documentation
```

---

## SECTION 6 — DATABASE SCHEMA

Use the existing schema exactly. Do not change table names.

```sql
-- User Profile (single row, Dawood's profile)
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY,
    name TEXT DEFAULT 'Dawood',
    wake_time TEXT DEFAULT '09:00',
    sleep_time TEXT DEFAULT '23:00',
    preferred_editor TEXT DEFAULT 'code',
    preferred_browser TEXT DEFAULT 'chrome',
    personality_notes TEXT,
    learned_facts TEXT,          -- JSON string, continuously updated by JARVIS
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation History
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,          -- 'user' or 'jarvis'
    message TEXT NOT NULL,
    intent TEXT,                 -- 'chat', 'command', 'question', 'note', 'code'
    model_used TEXT,             -- which AI model responded
    tool_calls TEXT,             -- JSON: which tools were called
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Patterns (Learning)
CREATE TABLE IF NOT EXISTS patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    day_of_week INTEGER,
    hour INTEGER,
    frequency INTEGER DEFAULT 1,
    last_occurred DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- App Usage Tracking
CREATE TABLE IF NOT EXISTS app_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    day_of_week INTEGER,
    hour INTEGER
);

-- Preferences (Key-Value)
CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    remind_at DATETIME NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## SECTION 7 — TOOLS JARVIS MUST HAVE

All tools must be defined as OpenAI-compatible function schemas (works with MiniMax, Groq, OpenRouter equally).

### Tool List

| Tool Name | Description | Module |
|---|---|---|
| `open_application` | Opens any app by name on Windows | app_control.py |
| `close_application` | Closes a running app | app_control.py |
| `search_files` | Searches for files by name/pattern | file_system.py |
| `read_file` | Reads content of a file | file_system.py |
| `list_directory` | Lists files in a folder | file_system.py |
| `run_command` | Runs a whitelisted terminal command | terminal.py |
| `search_web` | Opens browser search for a query | browser.py |
| `open_url` | Opens a specific URL | browser.py |
| `save_note` | Saves a note to SQLite | notes.py |
| `get_notes` | Retrieves recent notes | notes.py |
| `set_reminder` | Creates a reminder | reminders.py |
| `get_reminders` | Gets upcoming reminders | reminders.py |
| `trigger_n8n_workflow` | Triggers an n8n webhook workflow | n8n_trigger.py |
| `learn_fact` | Saves a new fact about Dawood | memory.py |

### Safety Rules for Terminal Tool

The `run_command` tool MUST have a whitelist. Only allow these categories:
- `npm`, `node`, `python`, `pip` — development tools
- `dir`, `ls`, `cd`, `pwd` — navigation  
- `git` commands — version control
- `code .` — open VS Code
- BLOCK everything else by default, especially: `del`, `rm -rf`, `format`, `reg`, system-level commands

---

## SECTION 8 — THE AGENTIC LOOP (Brain Architecture)

This is the core of JARVIS. Every message goes through this loop.

```
User sends message
        ↓
1. CONTEXT INJECTION
   - Pull last 10 conversations from SQLite
   - Pull user profile + learned facts
   - Pull active reminders (if any due soon)
   - Build dynamic system prompt
        ↓
2. INTENT DETECTION (fast, local)
   - Classify: chat / code / tool / automation / memory
   - Select which AI model to use
        ↓
3. AI CALL (with tools)
   - Send to selected model (MiniMax / Groq / Qwen Coder / DeepSeek)
   - Include full tool schema list
   - Stream response tokens to frontend immediately
        ↓
4. TOOL EXECUTION (if AI returns tool_calls)
   - Parse tool name and arguments
   - Execute Python function
   - Send tool result back to AI
   - AI generates final natural language response
   - (Loop repeats if AI needs more tool calls — max 5 iterations)
        ↓
5. RESPONSE DELIVERY
   - Stream final text response to frontend via WebSocket
   - Send tool execution cards to frontend
        ↓
6. MEMORY PERSISTENCE
   - Save conversation to SQLite
   - Update patterns table if app was opened
   - If AI learned a new fact about Dawood, save it
```

### brain.py Core Logic

```python
async def handle_message(user_message: str, websocket) -> None:
    """
    Main agentic loop. Streams response to websocket.
    Supports multi-step tool calling (up to 5 iterations).
    """
    # 1. Build context
    context = await build_context(user_message)
    messages = context["messages"]
    
    # 2. Select model
    model_config = router.select_model(user_message)
    
    # 3-4. Agentic loop
    iteration = 0
    while iteration < 5:
        response = await call_ai(model_config, messages, tools=ALL_TOOL_SCHEMAS)
        
        if response.tool_calls:
            # Execute tools, stream tool cards to frontend
            for tool_call in response.tool_calls:
                result = await execute_tool(tool_call)
                await websocket.send_json({"type": "tool_card", "data": result})
                messages.append({"role": "tool", "content": result, "tool_call_id": tool_call.id})
            iteration += 1
        else:
            # Final text response — stream it
            await stream_response(response, websocket)
            break
    
    # 5. Save to memory
    await save_conversation(user_message, final_response)
```

---

## SECTION 9 — n8n AUTOMATION WORKFLOWS

n8n runs locally at `http://localhost:5678`. All workflows are triggered via webhook POST requests from JARVIS.

### Must-Build Workflows (Priority Order)

**Workflow 1: Developer Workspace Launcher**
- Webhook path: `prepare-workspace`
- JARVIS triggers when user says: "Start my MERN project", "Open my workspace", "Set up dev environment"
- n8n does: Open VS Code → run `npm start` in backend terminal → run `npm run dev` in frontend terminal → open Chrome → open GitHub repo
- Returns: Success/failure status

**Workflow 2: Morning Briefing**  
- Webhook path: `morning-briefing`
- JARVIS triggers when user says: "Good morning JARVIS", "Prepare my day"
- n8n does: Get current weather (wttr.in API) → get GitHub notifications → check due reminders from DB → compile summary
- Returns: JSON with weather, notifications, reminders

**Workflow 3: GitHub Summary**
- Webhook path: `github-summary`
- JARVIS triggers when user says: "Check my GitHub", "What's on GitHub?"
- n8n does: GitHub API → fetch notifications + open issues → AI summary
- Returns: Summarized notification list

**Workflow 4: Learning Assistant**
- Webhook path: `study-helper`
- JARVIS triggers when user uploads/mentions a PDF or topic
- n8n does: Process content → generate quiz questions → create viva prep notes
- Returns: Structured study material

### Triggering from Python

```python
# backend/tools/n8n_trigger.py

async def trigger_n8n_workflow(workflow_name: str, payload: dict) -> dict:
    """
    Triggers an n8n webhook workflow.
    workflow_name: the webhook path (e.g., 'prepare-workspace')
    payload: dict of data to send to n8n
    """
    base_url = os.getenv("N8N_WEBHOOK_BASE_URL", "http://localhost:5678/webhook/")
    url = f"{base_url}{workflow_name}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            return {"success": True, "data": response.json(), "workflow": workflow_name}
    except httpx.ConnectError:
        return {"success": False, "error": "n8n is not running. Start n8n with: npx n8n"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

## SECTION 10 — DEVELOPMENT PHASES

> **For the agentic AI:** Scan the codebase. Check which phases are complete. Start from the first incomplete phase. Do not rebuild working code.

---

### PHASE 1 — Foundation (Core Backend + Basic Chat)

**Goal:** FastAPI server running, WebSocket working, MiniMax M2.5 responding, basic tools functioning, SQLite memory working.

**Tasks:**
- [ ] Set up Python virtual environment
- [ ] Install requirements: `fastapi uvicorn python-dotenv openai httpx sqlite3`
- [ ] Create `backend/main.py` — FastAPI app with WebSocket endpoint at `/ws`
- [ ] Create `backend/core/memory.py` — SQLite connection, all CRUD functions
- [ ] Create `backend/core/personality.py` — Dynamic system prompt builder (injects Dawood profile + recent conversations)
- [ ] Create `backend/services/minimax_provider.py` — MiniMax M2.5 via OpenCode/Zen using openai client
- [ ] Create `backend/services/groq_provider.py` — Groq fallback
- [ ] Create `backend/core/router.py` — Intent-based model selector
- [ ] Create `backend/tools/schemas.py` — All tool JSON schemas for OpenAI format
- [ ] Create `backend/tools/app_control.py` — `open_application`, `close_application`
- [ ] Create `backend/tools/file_system.py` — `search_files`, `read_file`, `list_directory`
- [ ] Create `backend/tools/notes.py` — `save_note`, `get_notes`
- [ ] Create `backend/tools/browser.py` — `search_web`, `open_url`
- [ ] Create `backend/tools/terminal.py` — `run_command` with whitelist
- [ ] Create `backend/tools/n8n_trigger.py` — `trigger_n8n_workflow`
- [ ] Create `backend/core/brain.py` — Full agentic loop (multi-step tool calling, streaming)
- [ ] Initialize SQLite DB with full schema on startup
- [ ] Test: WebSocket receives message → brain processes → streams response back

**Deliverable:** Send "JARVIS, open Chrome" via WebSocket → Chrome opens → JARVIS confirms in natural language.

---

### PHASE 2 — Frontend (New UI)

**Goal:** Beautiful React + Electron UI matching the design spec in Section 3.

**Tasks:**
- [ ] Initialize Electron + React + Vite project in `frontend/`
- [ ] Install: `tailwindcss framer-motion electron`
- [ ] Set up custom CSS variables (all design tokens from Section 3.2)
- [ ] Set up Electron main.js with frameless window config (Section 3.6)
- [ ] Build `TitleBar.jsx` — custom drag region, min/max/close buttons
- [ ] Build `TopBar.jsx` — JARVIS status, model name, RAM, clock
- [ ] Build `Sidebar.jsx` — navigation, quick launch, recent notes
- [ ] Build `StatusBar.jsx` — token count, latency, memory status
- [ ] Build `ChatView.jsx` — message list, auto-scroll to bottom
- [ ] Build `MessageBubble.jsx` — user/JARVIS/tool variants
- [ ] Build `ToolCard.jsx` — animated tool execution display
- [ ] Build `TypingIndicator.jsx` — three-dot pulse animation
- [ ] Build `InputBar.jsx` — chat input with focus glow effect
- [ ] Build `MemoryView.jsx` — notes list + conversation history + search
- [ ] Implement `useWebSocket.js` hook — connects to FastAPI ws://localhost:8000/ws
- [ ] Implement streaming text display — tokens appear one by one
- [ ] Implement Framer Motion transitions between views
- [ ] Test: Full chat cycle works through UI, tool cards display correctly

**Deliverable:** Full JARVIS UI working end-to-end with real chat.

---

### PHASE 3 — Memory System

**Goal:** JARVIS remembers everything and uses context intelligently.

**Tasks:**
- [ ] Implement conversation context injection (last 10 messages into every prompt)
- [ ] Implement user profile context injection (Dawood's full profile + learned facts)
- [ ] Implement `learn_fact` tool — JARVIS can save new things it learns about Dawood
- [ ] Build Memory View panel — search past conversations, view notes, view learned facts
- [ ] Implement conversation summarization — when history exceeds 100 messages, summarize old ones into a compact memory blob
- [ ] Implement `get_notes` with filtering (by category, by date)
- [ ] Build pattern tracking — log every tool use to `patterns` table
- [ ] Test: Tell JARVIS your GitHub username → close app → reopen → ask "what's my GitHub?" → JARVIS should know

**Deliverable:** JARVIS remembers facts across sessions, notes are persistent, context is injected properly.

---

### PHASE 4 — n8n Automation

**Goal:** JARVIS can trigger real automation workflows for developer productivity.

**Tasks:**
- [ ] Install and start n8n locally (`npx n8n`)
- [ ] Build Workflow 1: Developer Workspace Launcher (webhook: `prepare-workspace`)
- [ ] Build Workflow 2: Morning Briefing (webhook: `morning-briefing`)
- [ ] Build Workflow 3: GitHub Summary (webhook: `github-summary`)
- [ ] Test all workflows from n8n UI first (activate each before testing)
- [ ] Connect JARVIS brain — when user asks about these, AI auto-triggers correct workflow
- [ ] Test: "JARVIS, start my MERN workspace" → VS Code opens + servers start
- [ ] Test: "Good morning JARVIS" → weather + reminders + notifications returned
- [ ] Add workflow results rendering in frontend (formatted response cards)

**Deliverable:** JARVIS can launch developer workspace, give morning briefings, and summarize GitHub with single voice-like commands.

---

### PHASE 5 — Coding Assistant

**Goal:** JARVIS becomes a real coding partner using MiniMax M2.5 (its 1 million token context window is ideal for reading entire projects at once).

**Tasks:**
- [ ] Implement code intent detection in `router.py` (regex + keyword matching for coding keywords)
- [ ] Add code-specific system prompt addon that activates for coding tasks (more technical tone, concise responses, always include runnable code)
- [ ] Add `read_file` tool for reading source code files
- [ ] Add `list_directory` tool for project structure analysis
- [ ] Enable multi-file context: JARVIS can read multiple files and reason across them in one MiniMax call (leveraging the large context window)
- [ ] Frontend: Enhanced code block rendering (syntax highlighting via highlight.js)
- [ ] Frontend: Copy button on all code blocks
- [ ] Frontend: Language label on code blocks (e.g., "javascript", "python")
- [ ] Create `backend/services/openrouter_provider.py` — for DeepSeek R1 only (deep planning)
- [ ] Test: "JARVIS, explain what this file does" + file path → MiniMax reads and explains clearly
- [ ] Test: "JARVIS, help me debug this Express route" + paste code → working fix returned
- [ ] Test: "JARVIS, analyze my entire React project" → reads multiple files, gives architecture summary

**Deliverable:** JARVIS can read your codebase, explain files, debug code, and generate functions — all powered by MiniMax M2.5's large context window.

---

### PHASE 6 — Multi-Agent System (Advanced)

**Goal:** JARVIS orchestrates multiple specialized agents for complex tasks.

**Tasks:**
- [ ] Create `backend/agents/planner.py` — decomposes complex requests into steps using DeepSeek R1
- [ ] Create `backend/agents/coder.py` — focused coding agent (Qwen Coder)
- [ ] Create `backend/agents/researcher.py` — web research agent
- [ ] Implement agent routing — when request is complex, planner runs first and creates execution plan
- [ ] Frontend: Show agent thinking steps as collapsible cards
- [ ] Test: "JARVIS, analyze my React project, find all TODO comments, create a GitHub issue for each one"

---

### PHASE 7 — Voice (Later)

**Note:** Delay this until Phase 1-5 are solid. Your PC's limited resources should go to the core system first.

**Tasks:**
- [ ] Integrate Whisper API for speech-to-text
- [ ] Integrate Piper TTS for text-to-speech (local, no API cost)
- [ ] Add wake word detection ("Hey JARVIS")
- [ ] Add microphone button in frontend InputBar
- [ ] Add voice output toggle in settings

---

## SECTION 11 — JARVIS PERSONALITY EXAMPLES

These examples help the AI understand the tone JARVIS must use. Include a few in the system prompt.

```
User: "Open Chrome"
JARVIS: "Done, sir." [Chrome opens]

User: "What time is it?"
JARVIS: "It's 3:47 PM. You've been at this for 3 hours — perhaps a break?"

User: "I'm stressed"
JARVIS: "That tracks. Your deadline is tomorrow and you've got 3 open TODO items. 
         Want me to pull them up and break it down?"

User: "JARVIS, you're useless"
JARVIS: "With all due respect, sir, I just opened your IDE, found that missing file, 
         and reminded you about your meeting. I'd call that a solid morning."

User: "Help me debug this"
JARVIS: "Send it over. Let's see what we're working with."
```

---

## SECTION 12 — SECURITY RULES

These are non-negotiable. Every implementation must follow these.

1. **API Keys** — In `.env` only. `.env` is in `.gitignore`. Never hardcode.
2. **Terminal safety** — `run_command` tool has a strict whitelist. Deny by default.
3. **No cloud sync of personal data** — SQLite stays local. No Supabase, no Firebase.
4. **Confirmation before destructive actions** — deleting files always requires explicit user confirmation in the chat
5. **Sensitive folders are off-limits** — JARVIS cannot access `C:/Windows`, `C:/Program Files` without explicit permission
6. **JARVIS asks before running any command it's unsure about**

---

## SECTION 13 — PERFORMANCE REQUIREMENTS

| Metric | Target |
|---|---|
| RAM usage (idle) | < 400MB |
| RAM usage (active chat) | < 700MB |
| Response start (first token) | < 2 seconds |
| Tool execution | < 3 seconds |
| App startup time | < 4 seconds |
| SQLite query time | < 50ms |

---

## SECTION 14 — SUCCESS CRITERIA BY PHASE

| Phase | JARVIS can... |
|---|---|
| Phase 1 | Chat naturally, open apps, search files, save notes, remember conversations |
| Phase 2 | Look stunning in the new UI, display tool execution cards, stream responses |
| Phase 3 | Remember facts about Dawood across sessions, search past conversations |
| Phase 4 | Launch dev workspace, give morning briefings, check GitHub — all from a single phrase |
| Phase 5 | Read a codebase, explain files, debug code, generate functions |
| Phase 6 | Handle complex multi-step requests using specialized agents |
| Phase 7 | Respond to voice, speak back, activate on wake word |

---

## SECTION 15 — COMMIT MESSAGE STYLE

Use this format for all commits:

```
feat: add MiniMax M2.5 as primary AI provider
feat: implement agentic tool calling loop in brain.py
feat: build ChatView component with streaming support
feat: integrate n8n workspace launcher workflow
fix: handle n8n connection timeout gracefully
chore: add all tool JSON schemas to schemas.py
refactor: extract AI providers into separate service modules
style: implement full UI design system with custom CSS variables
```

---

## SECTION 16 — HOW TO RUN

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run electron:dev    # Starts Electron + Vite dev server together
```

### n8n
```bash
npx n8n
# Opens at http://localhost:5678
# Import workflow JSONs from /workflows/n8n/
# Activate each workflow before testing
```

### requirements.txt
```
fastapi
uvicorn[standard]
openai           # Used for MiniMax via OpenCode (OpenAI-compatible)
groq
httpx
python-dotenv
pyautogui        # OS control
psutil           # System stats (RAM usage)
```

---

*End of JARVIS Master Plan v1.0*
*Author: Dawood Ahmed | Compiled with Claude Sonnet 4.6*
