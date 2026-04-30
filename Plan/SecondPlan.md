# PROJECT MISSION: JARVIS MIGRATION (Node.js to Python Agentic Architecture)

## 1. Project Overview
I am building "JARVIS," a personal AI assistant for my Windows PC. I have already completed Phase 1 (UI) and Phase 2 (basic chat + SQLite + hardcoded app opening) using a Node.js/MERN stack. 

However, the current implementation feels like a basic chatbot with "if/else" commands, not a true AI assistant. It lacks deep OS control, multi-step task execution, and contextual memory. 

**Goal:** Migrate the backend brain from Node.js to Python to transform JARVIS into a true "Agentic" AI that can autonomously use tools, control my Windows OS, remember everything, and handle complex requests.

## 2. Why We Are Shifting to Python
- **Agentic Loop (Tool Calling):** Node.js requires manual regex/keyword matching to trigger actions (e.g., `if (msg.includes("open youtube"))`). Python, using the native Groq SDK, supports "Function Calling/Tool Use." This allows the LLM itself to decide which tool to use, pass the parameters, and execute multi-step tasks autonomously.
- **Deep OS Control:** Python has native libraries (`pyautogui`, `subprocess`, `os`, `pywinauto`) to control windows, search files deeply, and eventually automate mouse/keyboard.
- **AI Ecosystem:** All advanced memory systems, vector databases, and AI frameworks are Python-first.

## 3. What We Are KEEPING (Do Not Change)
1. **The Frontend UI:** I have a premium, sci-fi HTML/CSS/JS dashboard (`jarvis.html`). It uses standard WebSockets/Fetch to talk to the backend. We are keeping this exactly as-is.
2. **The Database Schema:** I am using SQLite. The schema includes tables: `user_profile`, `conversations`, `notes`, `patterns`, `app_usage`, `preferences`, `reminders`. We will reuse this exact schema.
3. **The Brain (Groq API):** We are still using Groq (Llama 3.3 70B) via their API. We are just changing how we talk to it.

## 4. The New Python Tech Stack
- **Backend Server:** `FastAPI` (with `uvicorn`) — lightweight, fast, supports WebSockets for real-time chat with the UI.
- **AI SDK:** `groq` (Official Python SDK) — specifically using its **Tool Calling / Function Calling** features.
- **OS Control:** `subprocess`, `os`, `shutil`, `glob`, `webbrowser` (for deep file searching and app launching).
- **Database:** `sqlite3` (Python built-in).
- **Environment:** `python-dotenv` for API keys.
- **Constraints:** DO NOT use LangChain, LlamaIndex, or heavy frameworks. Keep it lightweight for 8GB RAM Windows PC. Raw Groq SDK only.

## 5. The New Architecture: "The Agentic Loop"
This is the core change. JARVIS must no longer be a simple `request -> response` chatbot. It must follow an Agentic Loop:

1. **Input:** User types a message (e.g., "Jarvis, find my resume and open VS Code, also note that I have a meeting at 5").
2. **Context Injection:** Python pulls my user profile, recent notes, and last 5 conversations from SQLite and prepends them to the system prompt.
3. **AI Thinking (Groq):** Python sends the message, system prompt, and a list of available "Tools" (functions) to Groq.
4. **Tool Execution:** If Groq decides action is needed, it returns a `tool_call` (e.g., `search_files("resume")`). Python executes the function and sends the result back to Groq.
5. **Final Response:** Groq formulates a natural, human-like response based on the tool's output.
6. **Output:** Python sends the response to the UI via WebSocket and saves it to the `conversations` database.

## 6. Tools JARVIS Must Have (Phase 1 Python Implementation)
Define these as Groq Tool schemas in Python:
1. `open_application(app_name: str)` -> Opens apps using `subprocess` or `os.startfile` on Windows.
2. `search_files(filename_query: str)` -> Searches the PC (e.g., `C:/Users/Dawood`) using `os.walk` or `glob`.
3. `save_note(title: str, content: str)` -> Inserts into the `notes` SQLite table.
4. `get_notes(limit: int)` -> Fetches recent notes from SQLite.
5. `search_web(query: str)` -> Uses `webbrowser.open()` to search Google (will upgrade to scraping later).

## 7. JARVIS Personality (System Prompt)
Inject this into the Groq system prompt dynamically:
"""
You are JARVIS, Dawood Ahmed's personal AI assistant.
PERSONALITY: Friendly, witty, slightly sarcastic (like Tony Stark's JARVIS). Call him "sir" occasionally but talk like a friend.
KNOWLEDGE ABOUT DAWOOD: Full Stack Developer (MERN + Laravel), final year BS IT student, lives in Sheikhupura, Pakistan, uses VS Code, prefers dark themes, works on Windows.
CAPABILITIES: You have access to tools to open apps, search files, save notes, and search the web. Use them proactively when asked.
RULE: Keep responses short, clear, and direct. Do not output walls of text. If you use a tool, wait for the result before replying to the user.
"""

## 8. Step-by-Step Implementation Plan
Please build the Python backend step-by-step as follows:

**Step 1: FastAPI Setup & WebSocket**
- Create `main.py` setting up a FastAPI server.
- Serve my existing `jarvis.html` file.
- Setup a WebSocket endpoint (`/ws`) to receive messages from the UI and send responses back.

**Step 2: Database Connection & Context**
- Create `memory.py` to connect to the existing SQLite DB.
- Write functions to: save a message, get the last 5 messages, get user profile, save a note, get notes.

**Step 3: Define Tools (Functions)**
- Create `tools.py` containing the actual Python logic for `open_application`, `search_files`, `save_note`, `get_notes`, `search_web`.

**Step 4: The Groq Agent (The Brain)**
- Create `brain.py`.
- Initialize Groq client.
- Define the JSON schemas for the Tools for the Groq API.
- Implement the Agentic Loop: Send message -> Check for `tool_calls` -> Execute Python function -> Send tool result back -> Get final text response.

**Step 5: Wire It All Together**
- Connect the WebSocket endpoint in `main.py` to `brain.py` and `memory.py`.
- Ensure the UI messages trigger the agent, and the agent's final response is sent back to the UI.

## 9. Expected Output from You (The AI)
1. A clear folder structure for the Python project.
2. The complete code for `main.py`, `brain.py`, `memory.py`, `tools.py`, and `requirements.txt`.
3. Instructions on how to run it and connect it to my existing frontend.

Do NOT give me placeholder code or "TODO: implement this". Give me fully functional, production-ready code for Windows.