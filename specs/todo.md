# DebatePro — Implementation TODO

## Phase 1: Project Scaffolding
- [x] Initialize directory structure (client/ + server/)
- [x] Create root package.json (server deps + workspace scripts)
- [x] Initialize Vite + React + TypeScript in client/
- [x] Create vite.config.ts with proxy settings
- [x] Create server tsconfig.json
- [x] Create .env.example
- [x] Create .gitignore
- [x] Create Dockerfile

## Phase 2: Backend — Express + WebSocket Server
- [x] server/config.ts — env config, mode definitions, prompt loader
- [x] server/main.ts — Express app + WebSocket server
- [x] server/ws-handler.ts — Gemini Live API WebSocket proxy
- [x] server/store.ts — SessionStore interface (InMemory + Firestore)
- [x] server/agents/prompts/pitch-perfect.md
- [x] server/agents/prompts/empathy-trainer.md
- [x] server/agents/prompts/veritalk.md

## Phase 3: Backend — ADK Agent Setup
- [x] server/agents/coaching-agent.ts
- [x] server/agents/analytics-agent.ts
- [x] server/tools/search-tool.ts

## Phase 3.5: UI Design with Google Stitch
- [x] Create Stitch project "DebatePro"
- [x] Generate Screen 1: Mode Selection
- [x] Generate Screen 2: Active Session
- [x] Generate Screen 3: Post-Session Report
- [x] Export design screenshots to specs/designs/

## Phase 4: Client — React + TypeScript + Vite
- [x] client/src/App.tsx — root component, screen router
- [x] client/src/index.css — global styles, design tokens
- [x] client/src/types.ts — shared TypeScript types
- [x] client/src/components/ModeSelect.tsx
- [x] client/src/hooks/useWebSocket.ts
- [x] client/src/hooks/useAudio.ts
- [x] client/src/hooks/useVideo.ts
- [x] client/src/components/Session.tsx
- [x] client/src/components/Dashboard.tsx
- [x] client/src/components/Report.tsx
- [x] client/src/components/Waveform.tsx

## Phase 5: Post-Session Report
- [x] server/report.ts — report generation via Gemini API

## Phase 6: Local Development & Testing
- [x] Verify npm run dev starts both servers
- [x] Test full session flow (select → session → report)
- [x] Test audio/visual sync and layout responsiveness

## Phase 7: Production Deployment
- [ ] npm run build (server + client)
- [ ] Build Docker image
- [ ] Store API key in Secret Manager
- [ ] Deploy to Cloud Run
- [ ] Verify production deployment
