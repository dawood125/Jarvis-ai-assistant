# JARVIS - Premium AI Personal Assistant

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-blue" />
  <img src="https://img.shields.io/badge/Architecture-React%20%2B%20Vite%20%2B%20Tailwind-cyan" />
  <img src="https://img.shields.io/badge/AI-Groq%20%2B%20OpenRouter-purple" />
</p>

## 🌌 Vision

**JARVIS** is an ultra-premium, futuristic AI personal assistant designed to run locally on Windows. It bridges the gap between state-of-the-art AI intelligence and seamless desktop automation, all wrapped in a breathtaking sci-fi, 3D-animated fictional user interface (FUI). 

"An AI companion that knows me, helps me, learns from me, and makes my digital life effortless — like Tony Stark's JARVIS but for a developer's daily workflow."

## 🚀 Features (MVP Roadmap)

*   **Cinematic Interface:** Holographic glass panels, 3D CSS/Framer Motion physics, and deep-space telemetry HUDs.
*   **Chat Workspace:** Natural language interface powered by local/cloud LLMs (Groq).
*   **System Automation:** Open/close applications, run terminal commands, and manage files.
*   **Persistent Memory:** SQLite-backed local memory ensuring context and learning over time without sacrificing privacy.
*   **Project Launcher:** Instantly boot up developer workspaces.

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, TailwindCSS, Framer Motion (for physics & 3D animations), Lucide (Icons).
*   **Core AI Engine:** Groq API (Primary), OpenRouter (Fallback).
*   **Desktop Shell (Upcoming):** Electron.

## 📥 Getting Started

1. Navigate to the frontend directory:
   ```bash
   cd jarvis
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 🔒 Privacy & Data

Built for a **Local-First** privacy model. All conversation memory, telemetry, and user preferences are stored strictly locally via SQLite. API keys are managed safely via local environment variables.
