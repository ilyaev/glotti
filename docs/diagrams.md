# Glotti — Architecture Diagrams

This document provides visual architecture diagrams at different levels of scope and detail, illustrating how the system components connect — from a high-level cloud overview down to individual module interactions.

---

## 1. High-Level System Overview

**Scope:** Bird's-eye view of the entire system. Shows the three main pillars (Browser, Backend, Google Cloud services) and the primary communication channels between them.

**Audience:** Non-technical stakeholders, contest judges, new team members.

```mermaid
graph TB
    subgraph User["👤 User"]
        Browser["Browser<br/>(React SPA)"]
    end

    subgraph Backend["☁️ Cloud Run"]
        Server["Node.js Server<br/>(Express + WebSocket)"]
    end

    subgraph Google["🔷 Google Cloud & AI"]
        Gemini["Gemini 2.5 Flash<br/>(Live API)"]
        Firestore["Firestore<br/>(Session Storage)"]
        Search["Google Search<br/>(Grounding)"]
    end

    Browser -- "WebSocket<br/>(audio + events)" --> Server
    Server -- "WebSocket<br/>(audio responses + metrics)" --> Browser
    Server -- "WebSocket<br/>(streaming audio)" --> Gemini
    Gemini -- "WebSocket<br/>(voice + transcriptions)" --> Server
    Server -- "REST<br/>(read/write sessions)" --> Firestore
    Gemini -. "Grounding queries<br/>(Veritalk mode)" .-> Search
```

**Key takeaways:**
- The backend acts as a **proxy** between the browser and Gemini Live API — it never exposes the Gemini API key to the client.
- All real-time communication uses **WebSockets** for low-latency bidirectional audio streaming.
- Firestore is used for **persistence** only (session records, reports). All live state is in-memory on the server.
- Google Search grounding is used only in Veritalk (debate) mode for real-time fact-checking.

---

## 2. Client-Server Communication Architecture

**Scope:** Zooms into the WebSocket protocol and REST API layer. Shows what data flows between browser and server, and the message types exchanged.

**Audience:** Frontend/backend developers, integration testers.

```mermaid
sequenceDiagram
    participant B as Browser (React)
    participant S as Server (Express + ws)
    participant G as Gemini Live API
    participant F as Firestore

    Note over B,S: Connection Phase
    B->>S: WS connect ?mode=pitch_perfect&userId=abc
    S->>G: genai.live.connect() with system prompt
    G-->>S: setupComplete
    S->>G: Send initial greeting text
    S-->>B: { type: session_started, sessionId, mode }

    Note over B,S: Real-time Coaching Loop
    loop Every audio frame (~100ms)
        B->>S: Binary: audio PCM 16kHz
        S->>G: Forward audio chunk
    end

    G-->>S: Voice response (PCM 24kHz)
    S-->>B: Binary: audio chunk

    G-->>S: inputTranscription (user speech text)
    S-->>B: { type: transcript_cue, text, timestamp }

    S-->>B: { type: metrics, data: MetricSnapshot }
    G-->>S: turnComplete
    S-->>B: { type: turn_complete }

    Note over B,S: Barge-in (User interrupts AI)
    G-->>S: interrupted signal
    S-->>B: { type: interrupted }
    Note over B: Client stops audio playback

    Note over B,S: Session End
    B->>S: { type: end_session }
    S->>G: Close Gemini session
    S->>G: Generate report (ADK Runner.runAsync)
    G-->>S: Report JSON
    S->>F: Save session + report
    S-->>B: { type: report, data: SessionReport }

    Note over B,F: Post-Session (REST API)
    B->>S: GET /api/sessions?userId=abc
    S->>F: Query sessions
    F-->>S: Session list
    S-->>B: JSON array of SessionSummary
```

**Key takeaways:**
- Binary messages carry raw audio; JSON messages carry commands, transcripts, and metrics.
- The server **buffers** transcript fragments and flushes them on sentence boundaries (10-word threshold for user, 15 for AI).
- Barge-in is a first-class protocol feature — Gemini detects user speech over AI output and signals interruption.
- Report generation happens server-side after session close, using ADK `Runner.runAsync()`.

---

## 3. Backend Internal Architecture

**Scope:** Detailed view of the server-side module structure. Shows how the WebSocket handler orchestrates session modules, agents, and services.

**Audience:** Backend developers, code reviewers, architects.

```mermaid
graph TB
    subgraph Entry["Entry Point"]
        Main["main.ts<br/>Express + WS Server"]
    end

    subgraph WS["WebSocket Layer"]
        Handler["ws-handler.ts<br/>(Orchestrator ~120 LOC)"]
    end

    subgraph Session["Session Modules (server/session/)"]
        State["state.ts<br/>SessionState factory"]
        Bridge["gemini-bridge.ts<br/>Gemini Live connection"]
        Protocol["protocol.ts<br/>Binary parsing + serialization"]
        Metrics["metrics.ts<br/>Filler words, WPM, clarity"]
        TransBuf["transcript-buffer.ts<br/>TranscriptBuffer class"]
        Tone["tone-analyzer.ts<br/>Background LLM tone check"]
        Feedback["feedback-context.ts<br/>Feedback mode injection"]
        Constants["constants.ts<br/>Tunable thresholds"]
    end

    subgraph ADK["ADK Layer (server/adk/)"]
        Agents["agents.ts<br/>LlmAgent definitions"]
        RunnerMod["runner.ts<br/>Runner factory + runReportAgent"]
    end

    subgraph AgentsDir["Specialized Agents"]
        Analytics["analytics-agent.ts<br/>InMemoryRunner.runAsync"]
        Coaching["coaching-agent.ts<br/>(deprecated — raw genai used)"]
    end

    subgraph Services["Services"]
        Store["store.ts<br/>FileStore / Firestore"]
        Report["report.ts<br/>Report prompt + Zod validation"]
        OGRender["og-renderer.ts<br/>Satori + Resvg PNG"]
        OGHtml["og-html.ts<br/>OG meta tags template"]
    end

    subgraph API["REST API"]
        Sessions["api/sessions.ts<br/>Router factory (DI)"]
        Auth["session-auth.ts<br/>Owner / share key middleware"]
    end

    subgraph Config["Configuration"]
        ConfigFile["config.ts<br/>Modes, prompts, report configs"]
        Prompts["agents/prompts/*.md<br/>System prompts per mode"]
    end

    Main -->|"setDependencies()"| Handler
    Main -->|"createSessionsRouter(store)"| Sessions
    Main -->|"createStore()"| Store

    Handler --> State
    Handler --> Bridge
    Handler --> Protocol
    Handler --> Feedback
    Handler --> Report
    Handler --> Store

    Bridge --> Protocol
    Bridge --> Metrics
    Bridge --> TransBuf
    Bridge --> Tone

    Metrics --> Constants
    TransBuf --> Constants
    Tone --> Constants

    Report --> Agents
    Report --> RunnerMod
    Analytics --> RunnerMod

    Sessions --> Auth
    Sessions --> Store
    Sessions --> OGRender
    Sessions --> OGHtml

    Handler --> ConfigFile
    Bridge --> ConfigFile
    Agents --> ConfigFile
    ConfigFile --> Prompts
```

**Key takeaways:**
- `ws-handler.ts` is a **slim orchestrator** (~120 LOC) that delegates to focused modules.
- Dependency injection: `main.ts` creates the shared `SessionStore` and injects it into both the WS handler and REST router.
- The ADK layer is used for report generation (`Runner.runAsync`) and analytics (`InMemoryRunner`). Live audio streaming uses raw `genai.live.connect()` directly because ADK's `runLive()` is not yet available in the TypeScript SDK.
- All tunable thresholds (flush intervals, filler word lists, cooldown timers) are centralized in `constants.ts`.

---

## 4. Real-time Data Flow — Audio + Metrics Pipeline

**Scope:** Traces the journey of a single user utterance from microphone capture to dashboard metric update. Shows audio, transcript, and metric pipelines running in parallel.

**Audience:** Engineers debugging latency, audio issues, or metric accuracy.

```mermaid
flowchart LR
    subgraph Client["Browser"]
        Mic["🎤 Microphone<br/>Web Audio API"]
        Playback["🔊 Speaker<br/>Audio Playback"]
        Dashboard["📊 Dashboard<br/>Live Metrics"]
        Transcript["📝 Transcript<br/>Feed"]
    end

    subgraph Server["Node.js Backend"]
        WS["WebSocket<br/>Handler"]
        TB["Transcript<br/>Buffer"]
        ME["Metrics<br/>Extractor"]
        TA["Tone<br/>Analyzer"]
    end

    subgraph Gemini["Gemini Live API"]
        ASR["Speech-to-Text<br/>(built-in)"]
        LLM["LLM<br/>(coaching logic)"]
        TTS["Text-to-Speech<br/>(built-in)"]
    end

    Mic -- "PCM 16kHz" --> WS
    WS -- "forward audio" --> ASR
    ASR -- "inputTranscription" --> TB
    ASR --> LLM
    LLM --> TTS
    TTS -- "PCM 24kHz" --> WS
    WS -- "audio chunk" --> Playback
    TB -- "flushed sentence" --> ME
    TB -- "transcript_cue" --> Transcript
    ME -- "MetricSnapshot" --> Dashboard
    TA -- "tone + hint<br/>(every 15s)" --> Dashboard

    style Mic fill:#e1f5fe
    style Playback fill:#e1f5fe
    style Dashboard fill:#fff3e0
    style Transcript fill:#f3e5f5
```

**Key takeaways:**
- Audio flows as raw PCM binary — no encoding/decoding overhead.
- Input is 16kHz (mic quality); output is 24kHz (higher fidelity voice).
- Metrics are computed **synchronously** on each sentence flush — zero additional LLM latency for filler words, WPM, clarity.
- Tone analysis runs **asynchronously** in the background every 15 seconds via a separate Gemini Flash call.

---

## 5. ADK Multi-Agent Architecture

**Scope:** Shows how Google's Agent Development Kit (ADK) is used for different tasks — report generation, tone analysis, and analytics — and the relationship between agents, runners, and the Gemini API.

**Audience:** AI/ML engineers, ADK integration developers.

```mermaid
graph TB
    subgraph LiveStream["Live Streaming (NOT via ADK)"]
        Raw["genai.live.connect()<br/>(raw @google/genai SDK)"]
        Voice["Gemini 2.5 Flash<br/>Native Audio"]
    end

    subgraph ADKLayer["ADK Agent Orchestration"]
        subgraph ReportPipeline["Report Generation"]
            RA["Report Agent<br/>(LlmAgent)"]
            RR["Runner.runAsync()"]
            RS["InMemorySessionService"]
        end

        subgraph TonePipeline["Tone Analysis"]
            TA["Tone Analyzer<br/>(raw genai call)"]
        end

        subgraph AnalyticsPipeline["Analytics"]
            AA["Analytics Agent<br/>(LlmAgent)"]
            AR["InMemoryRunner.runAsync()"]
        end
    end

    subgraph Prompts["Mode-Specific Prompts"]
        PP["pitch-perfect.md"]
        ET["empathy-trainer.md"]
        VT["veritalk.md"]
        IM["impromptu.md"]
        FB["feedback.md"]
    end

    subgraph Tools["ADK Tools"]
        Search["google_search<br/>(Veritalk grounding)"]
        SpeechMetrics["analyze_speech_metrics<br/>(FunctionTool)"]
    end

    Raw --> Voice
    Voice -- "audio + transcription" --> TA
    RA --> RR --> RS
    AA --> AR

    Prompts --> Raw
    Prompts --> RA
    Tools --> Voice
    Tools --> AA

    style LiveStream fill:#ffebee
    style ADKLayer fill:#e8f5e9
    style Prompts fill:#fff9c4
    style Tools fill:#f3e5f5
```

**Key takeaways:**
- **Live audio streaming** uses the raw `@google/genai` SDK (`genai.live.connect()`) because ADK's `Runner.runLive()` is not yet available in the TypeScript SDK (v0.4.0).
- **Report generation** uses ADK's `Runner.runAsync()` with `InMemorySessionService` for structured output.
- **Analytics** uses `InMemoryRunner` for stateless, one-shot transcript analysis.
- **Tone analysis** uses a direct Gemini Flash call (not ADK) for lightweight periodic checks.
- Each coaching mode has its own system prompt file and report evaluation config.

---

## 6. Client Component Architecture

**Scope:** React component tree and hook composition. Shows how UI components are organized and which hooks manage state and side effects.

**Audience:** Frontend developers, UX engineers.

```mermaid
graph TB
    subgraph App["App.tsx (Hash Router)"]
        Router{"Route?"}
    end

    subgraph Pages["Pages"]
        Home["ModeSelect<br/>Mode selection cards"]
        SessionPage["Session<br/>Orchestrator (~50 LOC)"]
        SessionsList["SessionsList<br/>Past sessions list"]
        SessionDetail["SessionDetail<br/>Full session + report"]
    end

    subgraph SessionComponents["Session Sub-Components"]
        Topbar["SessionTopbar<br/>Mode badge + timer"]
        StatusDisplay["SessionStatusDisplay<br/>Connection status"]
        TranscriptFeed["TranscriptFeed<br/>Live transcript"]
        DashboardComp["Dashboard<br/>Live metrics cards"]
        Waveform["Waveform<br/>Audio visualization"]
        EndingOverlay["SessionEndingOverlay<br/>Loading screen"]
        CongratOverlay["CongratulationsOverlay<br/>Confetti + fireworks"]
    end

    subgraph ReportComponents["Report Components"]
        ReportComp["Report.tsx<br/>Router by mode"]
        PitchReport["PitchPerfectReport"]
        EmpathyReport["EmpathyTrainerReport"]
        VeritalkReport["VeritalkReport"]
        ImpromptuReport["ImpromptuReport"]
        PerfCard["PerformanceCard<br/>Score gauge + category bars"]
        ShareModal["ShareModal<br/>Orchestrator (~80 LOC)"]
    end

    subgraph ShareComponents["Share Sub-Components"]
        ShareLink["ShareLinkSection"]
        CardPreview["ShareCardPreview"]
        SocialPost["SocialPostPreview"]
    end

    subgraph Hooks["Custom Hooks"]
        useSessionLogic["useSessionLogic<br/>Session state machine"]
        useWebSocket["useWebSocket<br/>WS lifecycle"]
        useAudio["useAudio<br/>Capture + playback"]
        useCelebration["useCelebration<br/>Confetti trigger"]
        useShareUrls["useShareUrls<br/>Share key + URLs"]
        useClipboard["useClipboard<br/>Copy feedback"]
    end

    Router --> Home
    Router --> SessionPage
    Router --> SessionsList
    Router --> SessionDetail

    SessionPage --> Topbar
    SessionPage --> StatusDisplay
    SessionPage --> TranscriptFeed
    SessionPage --> DashboardComp
    SessionPage --> Waveform
    SessionPage --> EndingOverlay
    SessionPage --> CongratOverlay

    SessionDetail --> ReportComp
    ReportComp --> PitchReport
    ReportComp --> EmpathyReport
    ReportComp --> VeritalkReport
    ReportComp --> ImpromptuReport
    ReportComp --> PerfCard
    ReportComp --> ShareModal

    ShareModal --> ShareLink
    ShareModal --> CardPreview
    ShareModal --> SocialPost

    SessionPage --> useSessionLogic
    useSessionLogic --> useWebSocket
    useSessionLogic --> useAudio
    SessionPage --> useCelebration
    ShareModal --> useShareUrls
    ShareModal --> useClipboard

    style Hooks fill:#e3f2fd
    style ShareComponents fill:#fce4ec
    style ReportComponents fill:#f1f8e9
    style SessionComponents fill:#fff8e1
```

**Key takeaways:**
- The app uses **hash-based routing** (`#/sessions`, `#/sessions/:id/:key`) — no server-side routing needed.
- `Session.tsx` is a slim orchestrator (~50 LOC) that composes sub-components and hooks.
- `useSessionLogic` is the core hook — it composes `useWebSocket` + `useAudio` and manages the full session state machine (status, metrics, transcript, timer).
- Reports are **mode-specific** — each mode has its own report component with tailored categories and visualizations.
- Share functionality is decomposed into reusable hooks (`useShareUrls`, `useClipboard`) and sub-components.

---

## 7. Deployment Architecture

**Scope:** Production deployment on Google Cloud. Shows container build pipeline, Cloud Run configuration, and how services are connected in production vs. development.

**Audience:** DevOps engineers, deployment reviewers.

```mermaid
graph TB
    subgraph Dev["🖥️ Local Development"]
        DevBrowser["Browser"]
        ViteDev["Vite Dev Server<br/>(HMR, port 5173)"]
        DevServer["Node.js<br/>(tsx watch, port 8080)"]
        InMemStore["In-memory FileStore<br/>(sessions.json)"]
        DotEnv[".env<br/>(API key)"]
    end

    subgraph Prod["☁️ Google Cloud (Production)"]
        subgraph CloudRun["Cloud Run Service"]
            Container["Docker Container<br/>(node:22-slim)"]
            ExpressApp["Express Server<br/>(port 8080)"]
            StaticFiles["Static Files<br/>(Vite build output)"]
        end

        ArtifactReg["Artifact Registry<br/>(Container images)"]
        CloudBuild["Cloud Build<br/>(CI/CD pipeline)"]
        SecretMgr["Secret Manager<br/>(API keys)"]
        FirestoreProd["Firestore<br/>(sessions, reports)"]
    end

    subgraph External["🔷 Google AI"]
        GeminiAPI["Gemini Live API<br/>(same in dev & prod)"]
    end

    DevBrowser --> ViteDev
    ViteDev -- "proxy /api, /ws" --> DevServer
    DevServer --> InMemStore
    DevServer --> DotEnv
    DevServer -- "WebSocket" --> GeminiAPI

    CloudBuild -- "docker build + push" --> ArtifactReg
    ArtifactReg -- "deploy" --> Container
    Container --> ExpressApp
    ExpressApp --> StaticFiles
    SecretMgr -- "env vars" --> Container
    ExpressApp -- "read/write" --> FirestoreProd
    ExpressApp -- "WebSocket" --> GeminiAPI

    style Dev fill:#e8f5e9
    style Prod fill:#e3f2fd
    style External fill:#fff3e0
```

**Cloud Run Configuration:**
| Setting | Value | Reason |
|---|---|---|
| Concurrency | 1 | Each WebSocket session is long-lived and stateful |
| Min instances | 0 | Scale to zero when idle (cost saving) |
| Max instances | 10 | Contest demo scale |
| Timeout | 3600s | Support long WebSocket sessions |
| Port | 8080 | Standard Cloud Run port |

**Key takeaways:**
- In **development**, Vite proxies API/WS requests to Express — no CORS issues, full HMR.
- In **production**, Express serves the Vite-built static files directly — single container, single port.
- The Gemini Live API connection is **identical** in both environments — same remote WebSocket endpoint.
- Firestore is only used in production; local dev uses a JSON file-based store that survives server restarts.
- API keys flow through `.env` locally and Secret Manager in production — never committed to git.

---

## 8. Session Lifecycle State Machine

**Scope:** The complete lifecycle of a coaching session, from mode selection to report delivery, showing state transitions and the events that trigger them.

**Audience:** Full-stack developers, QA engineers.

```mermaid
stateDiagram-v2
    [*] --> ModeSelect: User opens app

    ModeSelect --> Connecting: User clicks "Start Session"
    Connecting --> SetupComplete: Gemini Live connected
    SetupComplete --> Listening: AI sends greeting

    state "Active Session" as Active {
        Listening --> AIResponding: User speaks
        AIResponding --> Listening: AI finishes turn
        AIResponding --> Interrupted: User barge-in
        Interrupted --> Listening: Ready for next input
    }

    Active --> Ending: User clicks "End Session"
    Active --> Ending: Session timeout
    Active --> AIDisconnected: Gemini connection drops

    AIDisconnected --> Ending: User clicks "End Session"

    Ending --> GeneratingReport: Gemini session closed
    GeneratingReport --> ReportReady: ADK Runner.runAsync() completes
    ReportReady --> SessionSaved: Saved to Firestore/FileStore
    SessionSaved --> [*]: Report displayed to user

    note right of Active
        During active session:
        • Metrics updated on every sentence flush
        • Tone analyzed every 15 seconds
        • Transcript streamed to UI
    end note
```

**Key takeaways:**
- The session is **event-driven** — state transitions are triggered by WebSocket messages from Gemini or user actions.
- **Barge-in** (user interrupting the AI) is a distinct state transition that triggers `interrupted` → client stops audio playback.
- Report generation is **synchronous-blocking** after session end — the user sees a loading overlay while it completes.
- If the Gemini connection drops unexpectedly, the client is notified but the session doesn't auto-end — the user decides when to close.
