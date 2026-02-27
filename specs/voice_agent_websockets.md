# Voice Agent WebSocket Handler — Architecture & Protocol

> **Orchestrator:** `server/ws-handler.ts` (~120 LOC)
> **Session modules:** `server/session/` (7 files)
> **Purpose:** Server-side WebSocket handler that bridges browser clients to the Gemini Live API for real-time voice-based AI coaching sessions.
> **Status:** Refactored. Legacy backup available at `server/ws-handler-legacy.ts`.

---

## 1. High-Level Architecture

```
┌──────────┐     WebSocket (binary+JSON)     ┌──────────────────┐    Gemini Live API    ┌───────────┐
│  Browser  │ ◄──────────────────────────────► │  ws-handler.ts   │ ◄──────────────────► │  Gemini   │
│  Client   │   audio PCM / video JPEG / cmds  │  (orchestrator)  │   audio / transcript │  Live     │
└──────────┘                                   └──────────────────┘                      └───────────┘
                                                      │
                                                      ├─► session/state.ts           (session state)
                                                      ├─► session/gemini-bridge.ts   (Gemini connection + message dispatch)
                                                      ├─► session/protocol.ts        (client message serialization)
                                                      ├─► session/metrics.ts         (speech metrics extraction)
                                                      ├─► session/transcript-buffer.ts (buffering + flush)
                                                      ├─► session/tone-analyzer.ts   (background LLM tone analysis)
                                                      ├─► session/feedback-context.ts (feedback mode injection)
                                                      ├─► session/constants.ts       (tunable thresholds)
                                                      ├─► store.ts                   (session persistence)
                                                      ├─► report.ts                  (post-session report via ADK Runner.runAsync())
                                                      └─► config.ts                  (mode definitions, prompts)
```

### Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| **Orchestrator** | `ws-handler.ts` | Validates mode, creates session state, injects feedback context, connects Gemini, wires WS events, manages session lifecycle (end/report/save). ~120 LOC. |
| **Session State** | `session/state.ts` | `SessionState` interface + `createSessionState()` factory. Typed state object replaces 14 loose closure variables. Exposes `getElapsedSeconds()` and `getAllTextByRole()` helpers. |
| **Gemini Bridge** | `session/gemini-bridge.ts` | `connectGemini()` creates the Gemini Live API session with callbacks. Dispatches incoming messages to focused handlers: `handleSetupComplete`, `handleInterrupted`, `handleUserTranscription`, `handleAiTranscription`, `handleModelTurn`, `handleTurnComplete`. Also provides `forwardClientMessage()` for client → Gemini audio/video forwarding. |
| **Protocol** | `session/protocol.ts` | Binary message parsing (`parseBinaryMessage()`), all server→client message helpers (`sendSessionStarted`, `sendTranscriptCue`, `sendMetrics`, `sendTurnComplete`, `sendInterrupted`, `sendReport`, `sendError`, `sendAiDisconnected`, `sendAudioChunk`), and `isWsOpen()`. |
| **Metrics** | `session/metrics.ts` | `extractMetrics()` pure function — filler word detection, WPM, talk ratio, clarity score, mode-specific hint generation. Fixed regex bug from legacy. |
| **Transcript Buffer** | `session/transcript-buffer.ts` | `TranscriptBuffer` class with configurable flush thresholds per role (user: 10 words, AI: 15 words). `tryFlush()` for threshold-based flushing, `forceFlush()` for session cleanup. |
| **Tone Analyzer** | `session/tone-analyzer.ts` | `ToneAnalyzer` class encapsulating periodic background Gemini Flash calls for tone/hint analysis. Manages `lastCheck` cooldown, `currentTone`/`currentHint` state. |
| **Feedback Context** | `session/feedback-context.ts` | `injectFeedbackContext()` — fetches original session from store, injects transcript summary + report summary into system prompt, preserves voice name. |
| **Constants** | `session/constants.ts` | All tunable thresholds: `TONE_CHECK_INTERVAL_MS`, `USER_FLUSH_WORD_THRESHOLD`, `AI_FLUSH_WORD_THRESHOLD`, `TONE_ANALYSIS_TEXT_LIMIT`, `FEEDBACK_TIMEOUT_MS`, `TONE_MIN_WORDS`, `FILLER_WORDS`. |

### Dependency Injection

`ws-handler.ts` exports `setDependencies()` which `main.ts` calls to inject the shared `SessionStore`. This eliminates the duplicate store instantiation bug from the legacy code. The `GoogleGenAI` client is also injectable for testing.

```ts
interface SessionDependencies {
  genai: GoogleGenAI;
  store: SessionStore;
}
```

---

## 2. WebSocket Protocol (Client ↔ Server)

### 2.1 Connection

Client connects via: `ws://<host>?mode=<mode>&userId=<userId>&originalSessionId=<optional>`

### 2.2 Messages: Server → Client

| Type               | Payload                          | When                                     |
|--------------------|----------------------------------|------------------------------------------|
| `session_started`  | `{ sessionId, mode }`            | After Gemini session created             |
| `transcript_cue`   | `{ text, timestamp }`            | User or AI speech flushed                |
| `metrics`          | `{ data: MetricSnapshot }`       | After each user sentence + tone updates  |
| `turn_complete`    | `{}`                             | Gemini finishes a turn                   |
| `interrupted`      | `{}`                             | User barge-in detected                   |
| `report`           | `{ data: SessionReport }`        | After session ends + report generated    |
| `ai_disconnected`  | `{ message }`                    | Gemini connection dropped                |
| `error`            | `{ message }`                    | Any error condition                      |
| *(binary)*         | Raw PCM audio bytes              | AI speech audio chunks                   |

### 2.3 Messages: Client → Server

| Format            | Payload                                            | Purpose                          |
|-------------------|----------------------------------------------------|----------------------------------|
| JSON text         | `{ type: 'end_session' }`                          | User requests session end        |
| Binary (audio)    | `<JSON header>\n<raw PCM 16kHz>`                   | User microphone audio            |
| Binary (video)    | `<JSON header>\n<JPEG frame>`                      | Video frames (camera)            |

Binary message format: `{"type":"audio"|"video"}\n<raw bytes>`

---

## 3. Session Lifecycle Algorithm

```
1. VALIDATE mode string against MODES registry
2. GENERATE session UUID, initialize state variables
3. LOAD system prompt for the mode
4. IF mode === 'feedback' AND originalSessionId:
   a. FETCH original session from store
   b. INJECT transcript summary + report summary into system prompt
   c. PRESERVE original voice name for consistency
5. CONNECT to Gemini Live API with:
   - Audio output modality
   - Input/output audio transcription enabled
   - System instruction = assembled prompt
   - Random voice selection (or preserved feedback voice)
6. ON setupComplete from Gemini:
   a. SEND initial greeting to trigger AI intro speech
7. SEND `session_started` to client
8. ENTER main loop (event-driven):
   a. Gemini → Server: process serverContent messages
      - interrupted → forward to client
      - inputTranscription → buffer user text, flush on sentence boundary
      - outputTranscription → buffer AI text, flush on sentence boundary  
      - modelTurn.parts → forward audio to client, log text thoughts
      - turnComplete → forward to client
   b. Client → Server: forward audio/video to Gemini, handle commands
9. ON 'end_session' command OR timeout:
   a. CLOSE Gemini session
   b. IF not feedback mode: GENERATE report via report.ts (ADK Runner.runAsync())
   c. SAVE session to store
   d. SEND report to client
10. ON client disconnect: close Gemini session
```

---

## 4. Refactoring Summary (Completed)

The original `ws-handler.ts` was a ~320 LOC "god file" with 9 responsibilities and 14 mutable closure variables. It has been refactored into a modular architecture.

### 4.1 What Was Done

| Phase | Task | Status |
|-------|------|--------|
| 1 | Extract `metrics.ts` (pure function, regex bug fixed) | ✅ Done |
| 2 | Extract `transcript-buffer.ts` (configurable `TranscriptBuffer` class) | ✅ Done |
| 3 | Extract `protocol.ts` (binary parsing + message serialization) | ✅ Done |
| 4 | Extract `tone-analyzer.ts` (`ToneAnalyzer` class) | ✅ Done |
| 5 | Create `SessionState` type + `state.ts` factory | ✅ Done |
| 6 | Decompose Gemini `onmessage` into focused handlers in `gemini-bridge.ts` | ✅ Done |
| 7 | Extract `feedback-context.ts` | ✅ Done |
| 8 | Extract `constants.ts` (all magic numbers) | ✅ Done |
| 9 | Dependency injection (`setDependencies()` in orchestrator, shared store from `main.ts`) | ✅ Done |
| 10 | Remove debug monkey-patch (`globalThis.WebSocket.prototype.send` override) | ✅ Done |
| 11 | Rewrite `ws-handler.ts` as slim orchestrator (~120 LOC) | ✅ Done |

### 4.2 Bugs Fixed During Refactoring

1. **Regex double-escaping** in `extractMetrics` — `[^\\w\\s]` → `[^\w\s]` (was matching literal backslashes instead of word/whitespace classes)
2. **Duplicate store instantiation** — `ws-handler.ts` and `main.ts` each called `createStore()` independently. Now `main.ts` creates the store and injects it via `setDependencies()`.
3. **Debug monkey-patch removed** — `globalThis.WebSocket.prototype.send` override was running unconditionally in production, logging all Gemini payloads to `console.error`.

### 4.3 Remaining Items (Not Yet Addressed)

| Item | Description | Priority |
|------|-------------|----------|
| Backpressure | No rate limiting on audio forwarding between client ↔ Gemini | Low |
| O(n²) metrics | `extractMetrics()` still receives full concatenated transcript each time | Low |
| Graceful shutdown | No SIGTERM handler to wind down active sessions | Low |

---

## 5. File Structure

```
server/
  ws-handler.ts              ← Slim orchestrator (~120 LOC)
  ws-handler-legacy.ts       ← Legacy backup (original ~320 LOC, fully functional)
  session/
    constants.ts             ← Tunable thresholds and filler word list
    state.ts                 ← SessionState type + factory + helpers
    gemini-bridge.ts         ← Gemini Live API connection + message dispatch + forwarding
    transcript-buffer.ts     ← TranscriptBuffer class (user/AI flush logic)
    metrics.ts               ← extractMetrics() pure function
    tone-analyzer.ts         ← ToneAnalyzer class (background LLM analysis)
    protocol.ts              ← Binary message parsing + client message helpers
    feedback-context.ts      ← Feedback mode context injection
  report.ts                  ← Post-session report generation (unchanged)
  store.ts                   ← Session persistence (unchanged, shared singleton)
  config.ts                  ← Mode definitions, prompts (unchanged)
  main.ts                    ← Express + WS server, injects shared store via setDependencies()
```

---

## 6. Constants Reference

All magic numbers have been extracted to `session/constants.ts`:

```ts
export const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'right', 'well', 'i mean'];
export const TONE_CHECK_INTERVAL_MS = 15_000;
export const USER_FLUSH_WORD_THRESHOLD = 10;
export const AI_FLUSH_WORD_THRESHOLD = 15;
export const TONE_ANALYSIS_TEXT_LIMIT = 800;
export const FEEDBACK_TIMEOUT_MS = 60_000;
export const TONE_MIN_WORDS = 10;
```

---

## 7. Testing Strategy

After refactoring, individual modules can be unit tested in isolation:

| Module | Test Approach |
|--------|--------------|
| `metrics.ts` | Pure function — sample text → expected metrics |
| `transcript-buffer.ts` | Flush triggers with various inputs, word counts, sentence endings |
| `tone-analyzer.ts` | Mock GenAI client, test parsing/error handling |
| `protocol.ts` | Binary parsing with crafted buffers, message serialization |
| `state.ts` | Factory output, elapsed time calculations |
| `ws-handler.ts` (orchestrator) | Integration test with mock WS + mock Gemini bridge |
