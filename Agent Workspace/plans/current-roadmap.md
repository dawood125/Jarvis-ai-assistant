# Current Roadmap

## Product Direction
- Visual identity: Hybrid (Synthetix structure + Aether cinematic accents)
- Theme: Dark only for v1
- Tone: Friendly and witty
- Platform priority: Desktop web first, Electron shell after core stability

## MVP Scope (Phase 1)
- Natural text chat
- Open and close apps
- File search
- Notes capture
- Project launcher
- Music control
- Web search and summarize

## Build Sequence
1. Foundation and design tokens [done]
2. Flagship chat workspace UI [done]
3. Interaction states and motion [done]
4. Command wiring and local memory [done]
5. Model routing (Groq primary, OpenRouter fallback)
6. Electron packaging

## Active Sprint - 2026-04-15
- Milestone 1 [done]: Chat command input wired to real app state.
- Milestone 2 [done]: Chat history persistence enabled with localStorage.
- Milestone 3 [done]: Intel suggestions now trigger the command pipeline.
- Milestone 4 [done]: Added local notes persistence with save/list command actions.
- Milestone 5 [done]: Defined command contract for app launcher and file search.

## Active Sprint - 2026-04-16
- Milestone 1 [done]: Added structured command intent constants and metadata contract.
- Milestone 2 [done]: Implemented launch and file-search execution adapters.
- Milestone 3 [done]: Added safe confirm/cancel gate for launch actions.
- Milestone 4 [done]: Added model-router integration contract for Groq/OpenRouter with local-safe default.
- Milestone 5 [done]: Wired Groq/OpenRouter client adapters with env-based switching and fallback.
- Milestone 6 [next]: Move provider calls to secure backend/Electron bridge to avoid exposing API keys in browser.

## Session Rule
- Daily time budget: about 1 hour
- Suggested split: 45 min build + 15 min learning recap
