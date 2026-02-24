# Glotti — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Audio    │  │  Video       │  │  Dashboard   │              │
│  │ Capture  │  │  Capture     │  │  UI          │              │
│  │ (mic)    │  │  (webcam)    │  │  (metrics)   │              │
│  └────┬─────┘  └──────┬───────┘  └──────▲───────┘              │
│       │               │                 │                       │
│       └───────┬───────┘                 │                       │
│               ▼                         │                       │
│  ┌────────────────────────┐   ┌────────┴────────┐              │
│  │   WebSocket Client     │   │  Event Stream   │              │
│  │   (audio/video out,    │◄──┤  Renderer       │              │
│  │    audio/events in)    │   │  (metrics, UI)  │              │
│  └────────────┬───────────┘   └─────────────────┘              │
└───────────────┼─────────────────────────────────────────────────┘
                │ WebSocket
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js on Cloud Run)                │
│                                                                 │
│  ┌────────────────────────────────────────────────┐             │
│  │            Express + ws Server                  │             │
│  │                                                 │             │
│  │  ┌──────────────────────────────────────────┐  │             │
│  │  │         ADK Agent Orchestrator           │  │             │
│  │  │         (TypeScript SDK)                 │  │             │
│  │  │                                          │  │             │
│  │  │  ┌────────────┐  ┌───────────────────┐  │  │             │
│  │  │  │  Coaching   │  │   Analytics       │  │  │             │
│  │  │  │  Agent      │  │   Agent           │  │  │             │
│  │  │  │  (persona)  │  │   (metrics)       │  │  │             │
│  │  │  └──────┬──────┘  └────────┬──────────┘  │  │             │
│  │  │         │                  │              │  │             │
│  │  │         ▼                  ▼              │  │             │
│  │  │  ┌─────────────────────────────────────┐ │  │             │
│  │  │  │       Gemini Live API Session       │ │  │             │
│  │  │  │  (WebSocket ↔ Gemini 2.5 Flash)     │ │  │             │
│  │  │  └─────────────────────────────────────┘ │  │             │
│  │  └──────────────────────────────────────────┘  │             │
│  │                                                 │             │
│  │  ┌──────────────┐  ┌───────────────────────┐   │             │
│  │  │  Google      │  │  Firestore            │   │             │
│  │  │  Search      │  │  (sessions, reports)  │   │             │
│  │  │  Grounding   │  │                       │   │             │
│  │  └──────────────┘  └───────────────────────┘   │             │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Client — React + TypeScript + Vite

| Component | Technology | Responsibility |
|---|---|---|
| Audio Capture | Web Audio API / `AudioWorklet` | Captures microphone input as raw PCM 16-bit 16kHz |
| Video Capture | `getUserMedia` | Captures webcam frames for body language analysis |
| WebSocket Client | Native `WebSocket` API (custom hook) | Sends audio/video chunks to backend; receives audio responses and metric events |
| Audio Playback | Web Audio API | Plays back Gemini's voice responses with interrupt handling |
| Dashboard UI | React components (TSX) | Renders live metrics (filler count, pace, tone gauge) and session controls |
| Session Report | React component | Displays post-session summary with timestamps and scores |
| Build/Dev | Vite | Fast HMR dev server and optimized production builds |

**Key design decisions:**
- **React + TypeScript.** Component-based UI with type safety. React's state management (hooks + context) is well-suited for the real-time dashboard and screen transitions.
- **Vite.** Fast dev server with HMR. Produces an optimized static bundle for production that the Express backend serves.
- **WebSocket as a custom hook.** `useWebSocket` hook manages the connection lifecycle, auto-reconnection, and message dispatch to React state.
- **Audio format:** Client sends raw PCM 16-bit, 16kHz, little-endian. Client receives PCM 16-bit, 24kHz from Gemini.

### 2. Backend — Node.js + Express + ws on Cloud Run

| Component | Technology | Responsibility |
|---|---|---|
| HTTP Server | Node.js + Express | Serves static files and health check endpoint |
| WebSocket Server | `ws` library | Handles WebSocket connections from browser clients |
| ADK Orchestrator | `@google/adk` (TypeScript) | Manages agent lifecycle, tool routing, and multi-agent coordination |
| Coaching Agent | ADK Agent | Holds the persona's system prompt; processes audio via Gemini Live API; generates coaching interruptions |
| Analytics Agent | ADK Agent | Runs in parallel; counts filler words, measures speaking pace, evaluates tone; emits real-time metric events |
| Google Search Tool | ADK built-in | Provides real-time fact-checking for Veritalk mode |
| Gemini Live API Client | `@google/genai` | Opens bidirectional WebSocket to Gemini for audio/video streaming |
| Session Store | `@google-cloud/firestore` | Persists session metadata, transcripts, and metrics for post-session reports |

**Key design decisions:**
- **Express + `ws` over Fastify.** Express is the most widely understood Node.js framework. The `ws` library provides raw WebSocket control needed for binary audio streaming.
- **TypeScript throughout.** Type safety across agent definitions, message protocols, and config. Compiled with `tsx` for development, `tsc` for production.
- **ADK multi-agent.** Coaching and Analytics are separate agents because they have orthogonal concerns. The Coaching Agent talks to the user; the Analytics Agent silently monitors and emits metrics. ADK orchestrates them in parallel.
- **WebSocket proxy pattern.** The backend sits between the browser and Gemini Live API. The browser sends audio → backend pipes it to Gemini → Gemini responds → backend pipes audio back to client while simultaneously extracting metrics.

### 3. Gemini Live API Integration

| Aspect | Detail |
|---|---|
| Model | `gemini-2.5-flash-native-audio` (or latest available native audio model) |
| Connection | Server-to-server WebSocket from Cloud Run to Gemini Live API |
| SDK | `@google/genai` npm package |
| Input | Streaming audio (PCM 16kHz) + optional video frames (JPEG/PNG) |
| Output | Streaming audio (PCM 24kHz) + text transcriptions + tool call results |
| Barge-in | Enabled. When user speaks over the agent, Gemini sends `interrupted` signal. Client stops playback immediately. |
| Voice Activity Detection | Built-in. Gemini detects when user starts/stops speaking. |
| System Prompt | Mode-specific. Loaded from config per scenario (PitchPerfect, EmpathyTrainer, Veritalk). |
| Tools | `google_search` (Veritalk mode), custom function calls for metric logging |
| Session Duration | ~15 min max per session (configurable) |

### 4. Google Cloud Services

| Service | Usage |
|---|---|
| **Cloud Run** | Hosts the Node.js container. Scales to zero when idle. Supports WebSocket connections. |
| **Firestore** | Stores session records, transcripts, metric snapshots, and generated reports. |
| **Artifact Registry** | Stores the Docker container image for Cloud Run deployment. |
| **Cloud Build** | CI/CD pipeline for building and deploying the container. |
| **Secret Manager** | Stores API keys (Gemini API key). |

---

## Data Flow — Real-time Coaching Session

```
Browser                    Backend (Cloud Run)              Gemini Live API
  │                              │                              │
  │── audio chunk (PCM) ────────▶│                              │
  │                              │── forward audio ────────────▶│
  │                              │                              │
  │                              │◀── agent voice response ─────│
  │◀── audio response ──────────│                              │
  │                              │                              │
  │                              │◀── "interrupted" signal ─────│
  │◀── stop_playback event ─────│   (user spoke over agent)    │
  │   (client stops audio)       │                              │
  │                              │                              │
  │                              │── [Analytics Agent] ────────▶│
  │                              │   analyze transcript chunk   │
  │◀── metrics_update event ────│                              │
  │   {fillers: 3, pace: 142wpm}│                              │
  │                              │                              │
  │── "end_session" ────────────▶│                              │
  │                              │── close connection ─────────▶│
  │                              │                              │
  │                              │── generate report ──────────▶│
  │◀── session_report JSON ─────│  (via standard Gemini call)  │
  │                              │                              │
```

---

## Data Flow — Post-Session Report Generation

After the user ends the session, the backend:

1. Collects the full transcript from the Live API session.
2. Collects all accumulated metrics from the Analytics Agent.
3. Makes a standard (non-Live) Gemini API call with the transcript + metrics + rubric prompt to generate a structured report.
4. Saves the report to Firestore.
5. Returns the report JSON to the client for rendering.

---

## Development & Deployment

### Local Development

The application is developed and tested entirely locally. No Google Cloud infrastructure is needed during development — only a Gemini API key.

```
┌──────────────┐     localhost:8080    ┌──────────────────────────┐
│   Browser    │◄─────────────────────▶│   Node.js Dev Server     │
│   (User)     │       WebSocket       │   (Express + ws + ADK)   │
└──────────────┘                       └────────────┬─────────────┘
                                                    │
                                    ┌───────────────┼──────────────┐
                                    │               │              │
                                    ▼               ▼              ▼
                            ┌──────────────┐  ┌──────────┐  ┌───────────┐
                            │ Gemini Live  │  │ In-memory│  │  .env     │
                            │ API (remote) │  │ store    │  │  (API key)│
                            └──────────────┘  └──────────┘  └───────────┘
```

- **Gemini Live API:** Accessed directly over the internet (same as production). No emulator needed.
- **Firestore:** During local development, use **in-memory storage** (a simple Map/object) instead of Firestore. The session store is abstracted behind an interface, so switching is a config change. Optionally, you can use the [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite) for Firestore if you need persistence during development.
- **API Key:** Stored in a local `.env` file, loaded via `dotenv`. Never committed to git.
- **Hot reload:** Backend uses `tsx watch server/main.ts`. Client uses Vite dev server (`npm run dev:client`) with React HMR. In development, the Vite dev server proxies API/WebSocket requests to the Express backend.

### Production Deployment (Cloud Run)

```
┌──────────────┐     HTTPS      ┌──────────────────────────┐
│   Browser    │◄──────────────▶│   Cloud Run Service      │
│   (User)     │   WebSocket    │   (Node.js + ADK Agents) │
└──────────────┘                └────────────┬─────────────┘
                                             │
                           ┌─────────────────┼─────────────────┐
                           │                 │                 │
                           ▼                 ▼                 ▼
                   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                   │ Gemini Live  │  │  Firestore   │  │  Secret Mgr  │
                   │ API          │  │              │  │              │
                   └──────────────┘  └──────────────┘  └──────────────┘
```

Cloud Run is used **only for production deployment** — the final hosted version submitted for the contest.

### Container Spec (Production Only)
- **Base image:** `node:22-slim`
- **Port:** 8080
- **Concurrency:** 1 (each WebSocket session is long-lived and stateful)
- **Min instances:** 0 (scale to zero)
- **Max instances:** 10 (contest demo scale)
- **Timeout:** 3600s (to support long WebSocket sessions)

---

## Security Considerations

- **API Keys:** In production, stored in Secret Manager, injected as environment variables. Locally, stored in `.env`.
- **Authentication:** For the contest demo, no user auth is required. In production, Firebase Auth or Google Identity Platform would gate access.
- **CORS:** Restricted to the deployed frontend domain (production). Wide open on localhost (development).
- **Rate Limiting:** Cloud Run's built-in concurrency limits + optional Cloud Armor rules.

---

## File Structure (Projected)

```
gemili/
├── docs/
│   ├── initial_requirements.md
│   └── ideas.md
├── specs/
│   ├── overview.md
│   ├── architecture.md          ← this file
│   ├── implementation_plan.md
│   └── pitch.md
├── client/                       # React + TypeScript + Vite
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Root component, screen router
│       ├── index.css             # Global styles
│       ├── components/
│       │   ├── ModeSelect.tsx    # Mode selection cards
│       │   ├── Session.tsx       # Active session screen
│       │   ├── Dashboard.tsx     # Live metrics dashboard
│       │   ├── Report.tsx        # Post-session report
│       │   └── Waveform.tsx      # Audio waveform visualization
│       └── hooks/
│           ├── useWebSocket.ts   # WebSocket connection hook
│           ├── useAudio.ts       # Audio capture/playback hook
│           └── useVideo.ts       # Webcam capture hook
├── server/                       # Node.js + Express + ADK
│   ├── main.ts                  # Express app entrypoint
│   ├── ws-handler.ts            # WebSocket endpoint logic
│   ├── agents/
│   │   ├── coaching-agent.ts    # ADK Coaching Agent definition
│   │   ├── analytics-agent.ts   # ADK Analytics Agent definition
│   │   └── prompts/
│   │       ├── pitch-perfect.md
│   │       ├── empathy-trainer.md
│   │       └── veritalk.md
│   ├── tools/
│   │   └── search-tool.ts       # Google Search grounding wrapper
│   ├── store.ts                 # Session store interface (in-memory / Firestore)
│   ├── report.ts                # Post-session report generation
│   └── config.ts                # Environment config, constants
├── Dockerfile
├── package.json                  # Root — server deps + workspace scripts
├── tsconfig.json                 # Server tsconfig
├── .env.example
├── .gitignore
└── README.md
```
