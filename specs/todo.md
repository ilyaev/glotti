# Glotti — Implementation TODO

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
- [x] Create Stitch project "Glotti"
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
- [x] npm run build (server + client)
- [x] Build Docker image (multi-stage)
- [x] Store API key in Secret Manager
- [x] Deploy to Cloud Run
- [x] Verify production deployment
## Phase 8: Partner Feedback & Interactivity
- [x] Create Partner Feedback agent persona and mode config
- [x] Implement context-aware feedback (transcript injection)
- [x] Design and implement Partner Insight Card UI
- [x] Implement FeedbackModal with live audio & early barge-in
- [x] Fix audio context synchronization for interruptions
- [x] Optimize report layout for mobile responsiveness

## Phase 9: Social Sharing & Polish
- [x] Implement report sharing via public link (ShareModal, copy link)
- [x] Add social share cards for LinkedIn/Facebook previews
- [x] Refine mobile layout for standard sessions (fixed headers, loader)
- [x] Refine mobile layout for shared reports (scrolling header)

## Phase 10: Enhanced Visualization
- [x] Spec out "Clashing Tides" visualization concept
- [x] Refactor Waveform component to support multiple visualizers
- [x] Implement ClassicWaveform (Legacy)
- [x] Implement TidesVisualizer (Clash & Overlay modes)
- [x] Update config to map modes to visualization types

## Phase 11: Server WebSocket Handler Refactoring
- [x] Analyze ws-handler.ts and create specs/voice_agent_websockets.md
- [x] Backup original to ws-handler-legacy.ts
- [x] Extract constants.ts (magic numbers, filler word list)
- [x] Extract metrics.ts (pure function, fix regex bug)
- [x] Extract transcript-buffer.ts (TranscriptBuffer class)
- [x] Extract protocol.ts (binary parsing + message helpers)
- [x] Extract tone-analyzer.ts (ToneAnalyzer class)
- [x] Create state.ts (SessionState type + factory)
- [x] Extract feedback-context.ts (feedback mode injection)
- [x] Extract gemini-bridge.ts (Gemini Live connection + handlers)
- [x] Rewrite ws-handler.ts as slim orchestrator (~120 LOC)
- [x] Add dependency injection via setDependencies() in main.ts
- [x] Remove debug monkey-patch (globalThis.WebSocket.prototype.send)
- [x] Fix duplicate createStore() bug
- [x] Verify clean TypeScript compilation
- [x] Update spec documentation to reflect changes

## Phase 12: Client Session.tsx Refactoring
- [x] Analyze Session.tsx and create specs/session_refactoring.md
- [x] Add ServerMessage discriminated union + SessionStatus type to types.ts
- [x] Extract MODE_CONFIG, formatTime, session constants to config.ts
- [x] Extract useSessionLogic hook (WS dispatch, status state machine, timer, metrics)
- [x] Extract SessionTopbar sub-component
- [x] Extract SessionEndingOverlay sub-component
- [x] Extract SessionStatusDisplay sub-component
- [x] Extract TranscriptFeed sub-component
- [x] Slim Session.tsx to ~50 LOC orchestrator
- [x] Verify clean TypeScript compilation (no new errors)
- [x] Update architecture.md file structure and component table

## Phase 13: Client ShareModal.tsx Refactoring
- [x] Analyze ShareModal.tsx and create specs/share_modal_refactoring.md
- [x] Backup original to ShareModal-legacy.tsx
- [x] Extract useClipboard hook (reusable clipboard copy with feedback)
- [x] Extract useShareUrls hook (share key generation + URL construction)
- [x] Extract XIcon sub-component
- [x] Extract SocialPostPreview sub-component (LinkedIn/Facebook)
- [x] Extract ShareCardPreview sub-component (OG image + download + social)
- [x] Extract ShareLinkSection sub-component (toggle + link + copy)
- [x] Slim ShareModal.tsx to ~80 LOC orchestrator
- [x] Verify clean TypeScript compilation (no new errors)
- [x] Update architecture.md file structure and component table

## Phase 14: Visual Rewards — Celebration Overlays
- [x] Create specs/visual_rewards.md with full celebration overlay spec
- [x] Create CongratulationsOverlay component (confetti + fireworks canvas particle system)
- [x] Add celebration CSS animations to index.css (keyframes, sparkles, reduced-motion)
- [x] Implement CelebrationVariant types (first_session, milestone, high_score)
- [x] Implement firework particle system (radial bursts, trails, glow effects)
- [x] Implement intensity scaling (1–3) based on variant kind and thresholds
- [x] Integrate celebrations into Session.tsx (report interception, pendingReportRef)
- [x] Implement first-session detection via localStorage
- [x] Implement milestone detection via sessions API (thresholds: 5, 10, 25, 50, 100)
- [x] Implement high-score detection via report interception (score ≥ 80%)
- [x] Create OverlayPreview.tsx secret testing page (#/_preview) with 9 variant presets
- [x] Add overlay-preview route to App.tsx hash router
- [x] Verify clean TypeScript compilation
- [x] Update architecture.md with new components

## Phase 15: Google ADK Integration (Partial — Live API Not Available in TS SDK)

> **Key constraint:** ADK TypeScript SDK v0.4.0 does not implement `Runner.runLive()`.
> Live audio streaming remains on raw `genai.live.connect()` via `gemini-bridge.ts`.
> ADK is used only for non-streaming operations.

### Foundation
- [x] Install `@google/adk` (v0.4.0)
- [x] Create `server/adk/` directory (agents.ts, runner.ts, tools.ts, index.ts)
- [x] Define ADK `LlmAgent` for coaching, report, transcript summarizer, metrics analyzer
- [x] Create `FunctionTool` wrapper for `extractMetrics()` with Zod schema
- [x] Set up `InMemorySessionService` singleton + `Runner` factory
- [x] Create `runReportAgent()` using `Runner.runAsync()`

### Integration
- [x] Migrate report generation from raw `genai.models.generateContent()` to ADK `Runner.runAsync()`
- [x] Migrate analytics agent from raw `generateContent()` to ADK `LlmAgent` + `InMemoryRunner.runEphemeral()`
- [x] Migrate tone analyzer from raw `generateContent()` to ADK `LlmAgent` + `InMemoryRunner.runEphemeral()`
- [x] Alias `GOOGLE_API_KEY` → `GOOGLE_GENAI_API_KEY` env var for ADK compatibility

### Config & Model Fixes
- [x] Update `geminiModel` from expired `gemini-2.5-flash-native-audio-preview-12-2025` to `gemini-2.5-flash-native-audio-latest`
- [x] Make model configurable via `GEMINI_MODEL` env var
- [x] Mark legacy `coaching-agent.ts` as `@deprecated`

### Documentation
- [x] Update `specs/adk_review.md` with implementation status and Phase 0/1/2/6 results
- [x] Update `specs/architecture.md` (component table, file structure, ADK notes)
- [x] Update `specs/todo.md` with Phase 15

### Deferred (pending ADK TS SDK `runLive` support)
- [ ] Replace `gemini-bridge.ts` with ADK `Runner.runLive()` + `LiveRequestQueue`
- [ ] Replace manual WS message routing with ADK Event loop
- [ ] Create `ParallelAgent` orchestrator (Coaching + Analytics)
- [ ] Create `SequentialAgent` report pipeline (summarizer → metrics → report writer)
- [ ] Enable session resumption via `RunConfig.sessionResumption`
- [ ] Enable context compression for long sessions

