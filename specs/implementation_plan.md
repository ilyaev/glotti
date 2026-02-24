# Glotti — Implementation Plan

This document provides a step-by-step implementation plan for a coding agent to build the Glotti application from scratch.

> **Prerequisites:** Read [overview.md](overview.md) and [architecture.md](architecture.md) before starting.

---

## Phase 1: Project Scaffolding

### Step 1.1 — Initialize project structure

Create the directory tree as defined in [architecture.md](architecture.md#file-structure-projected):

```
gemili/
├── client/                       # React + TypeScript + Vite
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── ModeSelect.tsx
│       │   ├── Session.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Report.tsx
│       │   └── Waveform.tsx
│       └── hooks/
│           ├── useWebSocket.ts
│           ├── useAudio.ts
│           └── useVideo.ts
├── server/
│   ├── main.ts
│   ├── ws-handler.ts
│   ├── agents/
│   │   ├── coaching-agent.ts
│   │   ├── analytics-agent.ts
│   │   └── prompts/
│   │       ├── pitch-perfect.md
│   │       ├── empathy-trainer.md
│   │       └── veritalk.md
│   ├── tools/
│   │   └── search-tool.ts
│   ├── store.ts
│   ├── report.ts
│   └── config.ts
├── Dockerfile
├── package.json                  # Root — server deps + workspace scripts
├── tsconfig.json                 # Server tsconfig
├── .env.example
├── .gitignore
└── README.md
```

### Step 1.2 — Create root `package.json` (server)

```json
{
  "name": "debatepro",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev:server": "tsx watch server/main.ts",
    "dev:client": "cd client && npm run dev",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build:server": "tsc",
    "build:client": "cd client && npm run build",
    "build": "npm run build:server && npm run build:client",
    "start": "node dist/server/main.js"
  },
  "dependencies": {
    "@google/genai": "^1.0.0",
    "@google/adk": "^0.5.0",
    "@google-cloud/firestore": "^7.0.0",
    "express": "^5.0.0",
    "ws": "^8.18.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/ws": "^8.5.0",
    "concurrently": "^9.1.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

### Step 1.2b — Create `client/package.json` (Vite + React)

Initialize the client using Vite:

```bash
cd client
npm create vite@latest ./ -- --template react-ts
npm install
```

This creates the standard Vite + React + TypeScript scaffolding. The `client/package.json` will include React, ReactDOM, and Vite as dependencies.

### Step 1.2c — Create `client/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
      '/health': {
        target: 'http://localhost:8080',
      },
    },
  },
  build: {
    outDir: '../client-dist',  // Build output goes to root/client-dist
    emptyOutDir: true,
  },
});
```

> **Note:** In development, Vite runs on port 5173 and proxies WebSocket/API requests to the Express backend on port 8080. In production, Express serves the pre-built static files from `client-dist/`.

### Step 1.3 — Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["server/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 1.4 — Create `.env.example`

```
GOOGLE_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
NODE_ENV=development
PORT=8080
```

### Step 1.5 — Create `.gitignore`

```
node_modules/
dist/
client-dist/
client/node_modules/
.env
```

### Step 1.6 — Create `Dockerfile` (for production deployment only)

```dockerfile
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY dist/ ./dist/
COPY client-dist/ ./client-dist/
COPY server/agents/prompts/ ./server/agents/prompts/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server/main.js"]
```

---

## Phase 2: Backend — Express + WebSocket Server

### Step 2.1 — `server/config.ts`

Create configuration module:

```typescript
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

export const config = {
  googleApiKey: process.env.GOOGLE_API_KEY!,
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT,
  geminiModel: 'gemini-2.5-flash-preview-native-audio-dialog',
  port: parseInt(process.env.PORT || '8080'),
  isDev: process.env.NODE_ENV !== 'production',
};

// Mode definitions — maps mode name to prompt file path
export const MODES = {
  pitch_perfect: 'server/agents/prompts/pitch-perfect.md',
  empathy_trainer: 'server/agents/prompts/empathy-trainer.md',
  veritalk: 'server/agents/prompts/veritalk.md',
} as const;

export type Mode = keyof typeof MODES;

// Load a prompt file
export function loadPrompt(mode: Mode): string {
  const path = join(process.cwd(), MODES[mode]);
  return readFileSync(path, 'utf-8');
}
```

### Step 2.2 — `server/main.ts`

Create Express app with WebSocket upgrade:

```typescript
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { handleConnection } from './ws-handler.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Serve static client files (production: built Vite output)
app.use(express.static('client-dist'));

// WebSocket connections
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const mode = url.searchParams.get('mode') || 'pitch_perfect';
  handleConnection(ws, mode);
});

server.listen(config.port, () => {
  console.log(`Glotti running at http://localhost:${config.port}`);
  console.log(`Environment: ${config.isDev ? 'development' : 'production'}`);
});
```

### Step 2.3 — `server/ws-handler.ts`

This is the core real-time handler. Implement:

1. **On connection:**
   - Load the mode-specific system prompt.
   - Initialize a Gemini Live API session via `@google/genai`.
   - Create a Coaching Agent and Analytics Agent via ADK.
2. **Audio relay loop (async):**
   - **Receive handler:** Read binary audio chunks from the browser WebSocket → forward to Gemini Live API session.
   - **Send handler:** Read audio responses from Gemini Live API → forward to the browser WebSocket.
   - **Metrics handler:** Periodically collect analytics data → send JSON metric events to the browser.
3. **On `interrupted` signal from Gemini:** Send a `{"type": "interrupted"}` JSON event to the browser.
4. **On disconnect:** Close Gemini session, save transcript, generate post-session report.

**Critical implementation detail — Gemini Live API connection:**

```typescript
import { GoogleGenAI } from '@google/genai';
import { config, loadPrompt, Mode } from './config.js';

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });

export async function handleConnection(ws: WebSocket, modeStr: string) {
  const mode = modeStr as Mode;
  const systemPrompt = loadPrompt(mode);

  // Open a Live API session
  const session = await genai.live.connect({
    model: config.geminiModel,
    config: {
      responseModalities: ['AUDIO'],
      systemInstruction: systemPrompt,
      // tools: [googleSearch] for veritalk mode
    },
  });

  // Forward browser audio → Gemini
  ws.on('message', async (data: Buffer) => {
    await session.send({ data: data, mimeType: 'audio/pcm' });
  });

  // Forward Gemini audio → browser
  session.on('message', (response) => {
    if (response.serverContent?.modelTurn?.parts) {
      for (const part of response.serverContent.modelTurn.parts) {
        if (part.inlineData) {
          ws.send(part.inlineData.data);  // Binary audio
        }
      }
    }
    if (response.serverContent?.interrupted) {
      ws.send(JSON.stringify({ type: 'interrupted' }));
    }
  });

  ws.on('close', async () => {
    await session.close();
    // Generate post-session report...
  });
}
```

### Step 2.4 — `server/store.ts`

Abstracted session store with two implementations:

```typescript
export interface SessionData {
  id: string;
  mode: string;
  startedAt: Date;
  transcript: string[];
  metrics: MetricSnapshot[];
  report?: SessionReport;
}

export interface SessionStore {
  save(session: SessionData): Promise<void>;
  get(id: string): Promise<SessionData | null>;
}

// --- In-memory store (local development) ---
export class InMemoryStore implements SessionStore {
  private sessions = new Map<string, SessionData>();

  async save(session: SessionData) {
    this.sessions.set(session.id, session);
  }

  async get(id: string) {
    return this.sessions.get(id) || null;
  }
}

// --- Firestore store (production) ---
export class FirestoreStore implements SessionStore {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    const { Firestore } = require('@google-cloud/firestore');
    this.db = new Firestore();
  }

  async save(session: SessionData) {
    await this.db.collection('sessions').doc(session.id).set(session);
  }

  async get(id: string) {
    const doc = await this.db.collection('sessions').doc(id).get();
    return doc.exists ? (doc.data() as SessionData) : null;
  }
}

// Factory: use InMemoryStore in dev, FirestoreStore in production
export function createStore(): SessionStore {
  if (process.env.NODE_ENV === 'production') {
    return new FirestoreStore();
  }
  console.log('Using in-memory session store (development mode)');
  return new InMemoryStore();
}
```

### Step 2.5 — Persona System Prompts

Create three markdown files in `server/agents/prompts/`:

**`pitch-perfect.md`:**
```
You are a skeptical venture capitalist listening to a startup pitch.
Your job is to challenge the presenter relentlessly but fairly.

BEHAVIOR:
- Interrupt when the user makes an unsubstantiated claim.
- Ask pointed questions: "What's your customer acquisition cost?",
  "How do you plan to scale?", "Who are your competitors?"
- If the user rambles for more than 30 seconds without a clear point,
  interrupt with "I'm losing interest, get to the point."
- Track and mention filler words if excessive: "You've said 'um' 5 times
  in the last minute. That undermines your credibility."

TONE: Professional, skeptical, direct. Not rude, but not encouraging.
You are here to stress-test, not to be nice.

After the session ends, provide a structured evaluation covering:
1. Clarity of problem statement
2. Strength of solution description
3. Market opportunity articulation
4. Confidence and delivery
5. Top 3 things to improve
```

**`empathy-trainer.md`:**
```
You are roleplaying as an upset person in a difficult conversation.
The user is practicing how to handle confrontation with empathy.

PERSONAS (rotate or follow user selection):
- Angry customer whose order was lost
- Employee being told they are underperforming
- Parent upset about their child's school experience

BEHAVIOR:
- Start moderately frustrated.
- If the user uses dismissive language ("calm down", "it's not that bad"),
  ESCALATE your frustration.
- If the user validates your feelings ("I understand that's frustrating"),
  gradually DE-ESCALATE.
- If the user uses defensive language ("that's not our fault"),
  become more demanding.
- Periodically acknowledge good empathetic responses:
  "That... actually helps. Thank you."

METRICS TO CALL OUT:
- "You're speaking really fast right now, slow down."
- "I noticed you haven't asked me what I need."
- "You keep saying 'but' — that negates everything you said before it."

After the session, evaluate the user's empathy score,
de-escalation effectiveness, and provide specific phrases
they could have used instead.
```

**`veritalk.md`:**
```
You are an aggressive debate opponent. Your goal is to dismantle
the user's argument using logic, evidence, and rhetorical technique.

BEHAVIOR:
- When the session starts, ask the user to state their thesis.
- Use Google Search to find counter-arguments and counter-evidence
  in real-time.
- Interrupt the user to present opposing data: "Actually, a 2024
  study from [source] contradicts that claim."
- Identify logical fallacies and call them out by name:
  "That's a straw man argument", "You're making an appeal to authority."
- If the user recovers well from an interruption, acknowledge it:
  "Good recovery. But consider this..."

TONE: Adversarial but intellectually honest. Never use ad hominem
attacks. Focus on the argument, not the person.

After the session, provide:
1. Argument coherence rating (1-10)
2. Number of logical fallacies identified
3. Best and worst moments with timestamps
4. Suggested counter-arguments the user missed
```

---

## Phase 3: Backend — ADK Agent Setup

### Step 3.1 — `server/agents/coaching-agent.ts`

Define the Coaching Agent using ADK TypeScript SDK:

```typescript
import { Agent } from '@google/adk';
import { config, loadPrompt, Mode } from '../config.js';

export function createCoachingAgent(mode: Mode, tools: any[] = []) {
  const systemPrompt = loadPrompt(mode);

  return new Agent({
    name: `coaching_agent_${mode}`,
    model: config.geminiModel,
    instruction: systemPrompt,
    tools,
  });
}
```

The Coaching Agent:
- Receives the streaming audio from the user.
- Uses the mode-specific system prompt to determine persona behavior.
- Generates voice responses (interruptions, challenges, coaching cues).
- Has access to Google Search tool (in Veritalk mode).

### Step 3.2 — `server/agents/analytics-agent.ts`

Define the Analytics Agent:

```typescript
import { Agent } from '@google/adk';

export function createAnalyticsAgent() {
  return new Agent({
    name: 'analytics_agent',
    model: 'gemini-2.5-flash',
    instruction: `
      You are a speech analytics engine. You receive transcript chunks
      and return structured metrics.

      For each chunk, return JSON:
      {
        "filler_words": {"um": 2, "like": 3, "you know": 1},
        "words_per_minute": 145,
        "tone": "nervous",
        "key_phrases": ["I think maybe", "sort of"],
        "improvement_hint": "Reduce hedging phrases like 'I think maybe'"
      }
    `,
  });
}
```

The Analytics Agent:
- Receives periodic transcript chunks (every ~10 seconds).
- Returns structured JSON metrics.
- Does NOT produce audio output — metrics only.
- Results are sent to the client as JSON events over the WebSocket.

### Step 3.3 — `server/tools/search-tool.ts`

Google Search grounding for Veritalk mode:

```typescript
import { googleSearch } from '@google/adk/tools';

export function getSearchTool() {
  return googleSearch;
}
```

---

## Phase 3.5: UI Design with Google Stitch

> **Reference:** See [design.md](design.md) for the complete design system, screen specifications, and ready-to-use Stitch prompts.

Before writing any React components, generate UI mockups using **Google Stitch** to establish the visual direction. This ensures the coding agent has concrete visual targets to implement against, rather than interpreting written descriptions.

### Step 3.5.1 — Create a Stitch project

Create a new Stitch project titled "Glotti" to hold all screen designs.

### Step 3.5.2 — Generate Screen 1: Mode Selection

Use the following prompt in Stitch (desktop device type):

> A dark-themed landing page for "Glotti", a real-time AI speech coaching app. Deep navy background (#0a0e27). Centered layout with a gradient text logo "Glotti" at top. Subtitle "Choose your sparring partner" below. Three horizontal glassmorphism cards with rounded corners: (1) 🎯 PitchPerfect - Startup Pitch Coach, (2) 🤝 EmpathyTrainer - Difficult Conversations, (3) ⚔️ Veritalk - Debate Sparring. Each card has an emoji, title, subtitle, and short description. Cards have subtle glass effect with blur and faint white borders. Premium, modern aesthetic similar to a game character selection screen.

**Review & iterate:** Adjust colors, card proportions, and typography until satisfied. Generate variants if needed.

### Step 3.5.3 — Generate Screen 2: Active Session

Use the following prompt in Stitch (desktop device type):

> A dark-themed real-time coaching dashboard for a speech training app. Deep navy background. Top bar shows mode badge "PitchPerfect 🎯" on the left and timer "03:42" on the right. Center: a glowing blue audio waveform visualization spanning full width. Below it: a pulsing circle indicator with text "Listening...". Below that: a row of three glass-effect metric cards showing "7 Fillers", "142 WPM", and a green "Confident" tone badge. At the bottom: a large rounded "End Session" button. The vibe is like a professional audio monitoring studio. Dark, focused, premium.

**Review & iterate:** Ensure the layout has clear visual hierarchy. The waveform should be the dominant element. Metrics should be scannable at a glance.

### Step 3.5.4 — Generate Screen 3: Post-Session Report

Use the following prompt in Stitch (desktop device type):

> A dark-themed post-session performance report for a speech coaching app. Deep navy background. At the top: "Session Report" title with a large circular score gauge showing "7.2/10" filled with a blue gradient arc. Below: a 2x2 grid of glassmorphism score cards for "Clarity (8/10)", "Confidence (6/10)", "Persuasiveness (7/10)", "Composure (8/10)" — each with a mini circular gauge. Below: a metrics strip showing "23 Fillers | 148 WPM | Nervous Tone | 2.3s Recovery". Below: a vertical timeline of key moments with green (strength) and orange (weakness) dots. At the bottom: "Try Again" blue button and "Download Report" outline button. Premium, data-rich, like a Spotify Wrapped summary.

**Review & iterate:** Make sure the report feels celebratory and data-rich without being overwhelming.

### Step 3.5.5 — Export design reference

Once all three screens are finalized in Stitch:
1. Take screenshots of each approved screen design.
2. Save them to `specs/designs/` (e.g., `screen-1-mode-select.png`, `screen-2-session.png`, `screen-3-report.png`).
3. These images serve as the **pixel-level visual reference** for the React component implementation in Phase 4.

> **Important:** The coding agent implementing Phase 4 should open these screenshots and match the designs as closely as possible — layout, colors, spacing, and visual effects.

---

## Phase 4: Client — React + TypeScript + Vite

### Step 4.1 — `client/src/App.tsx`

Root component managing the three screens via state:

```tsx
import { useState } from 'react';
import { ModeSelect } from './components/ModeSelect';
import { Session } from './components/Session';
import { Report } from './components/Report';

type Screen = 'select' | 'session' | 'report';
type Mode = 'pitch_perfect' | 'empathy_trainer' | 'veritalk';

export default function App() {
  const [screen, setScreen] = useState<Screen>('select');
  const [mode, setMode] = useState<Mode>('pitch_perfect');
  const [report, setReport] = useState<any>(null);

  const handleStart = (selectedMode: Mode) => {
    setMode(selectedMode);
    setScreen('session');
  };

  const handleSessionEnd = (reportData: any) => {
    setReport(reportData);
    setScreen('report');
  };

  return (
    <div className="app">
      {screen === 'select' && <ModeSelect onStart={handleStart} />}
      {screen === 'session' && (
        <Session mode={mode} onEnd={handleSessionEnd} />
      )}
      {screen === 'report' && (
        <Report data={report} onRestart={() => setScreen('select')} />
      )}
    </div>
  );
}
```

### Step 4.2 — `client/src/index.css`

Design a premium, dark-mode UI:

- **Color palette:** Deep navy background (`#0a0e27`), electric blue accents (`#4f8cff`), warm orange for alerts/interruptions (`#ff6b35`).
- **Typography:** Google Font — `Inter` or `Space Grotesk`.
- **Mode cards:** Glassmorphism cards with subtle border glow on hover.
- **Dashboard gauges:** Circular SVG gauges for pace and tone confidence.
- **Animations:** Smooth transitions between screens; pulsing ring animation around the "Listening..." indicator when the agent is processing audio.
- **Responsive:** Desktop-first, but functional on tablet.

### Step 4.3 — `client/src/components/ModeSelect.tsx`

Three clickable cards, one per coaching mode:

```tsx
interface Props {
  onStart: (mode: Mode) => void;
}

const modes = [
  {
    id: 'pitch_perfect',
    title: 'PitchPerfect',
    subtitle: 'Startup Pitch Coach',
    description: 'Face a skeptical VC who will challenge every claim.',
    icon: '🎯',
  },
  {
    id: 'empathy_trainer',
    title: 'EmpathyTrainer',
    subtitle: 'Difficult Conversations',
    description: 'Practice handling upset customers and employees.',
    icon: '🤝',
  },
  {
    id: 'veritalk',
    title: 'Veritalk',
    subtitle: 'Debate Sparring',
    description: 'Defend your thesis against real-time fact-checks.',
    icon: '⚔️',
  },
];

export function ModeSelect({ onStart }: Props) {
  return (
    <div className="mode-select">
      <h1>Glotti</h1>
      <p>Choose your sparring partner</p>
      <div className="mode-cards">
        {modes.map((m) => (
          <button key={m.id} className="mode-card" onClick={() => onStart(m.id as Mode)}>
            <span className="mode-icon">{m.icon}</span>
            <h2>{m.title}</h2>
            <h3>{m.subtitle}</h3>
            <p>{m.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Step 4.4 — `client/src/hooks/useWebSocket.ts`

Custom hook for WebSocket connection:

```typescript
import { useRef, useEffect, useCallback, useState } from 'react';

export function useWebSocket(mode: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    // In dev, Vite proxy handles /ws → backend
    // In prod, same origin
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws?mode=${mode}`);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    wsRef.current = ws;
    return ws;
  }, [mode]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer) => {
    wsRef.current?.send(data);
  }, []);

  const sendJSON = useCallback((obj: any) => {
    wsRef.current?.send(JSON.stringify(obj));
  }, []);

  return { wsRef, isConnected, connect, disconnect, sendBinary, sendJSON };
}
```

### Step 4.5 — `client/src/hooks/useAudio.ts`

Audio capture and playback hook:

```typescript
import { useRef, useCallback } from 'react';

export function useAudio(sendBinary: (data: ArrayBuffer) => void) {
  const contextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<ArrayBuffer[]>([]);

  const startCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext({ sampleRate: 16000 });
    contextRef.current = context;

    // AudioWorklet captures PCM chunks and calls sendBinary()
    // ... (AudioWorklet setup code)
  }, [sendBinary]);

  const stopCapture = useCallback(() => {
    contextRef.current?.close();
  }, []);

  const playChunk = useCallback((audioData: ArrayBuffer) => {
    // Queue and play received PCM audio (24kHz)
  }, []);

  const handleInterrupt = useCallback(() => {
    // Immediately stop playback, clear buffer
    playbackQueueRef.current = [];
  }, []);

  return { startCapture, stopCapture, playChunk, handleInterrupt };
}
```

**Critical: Interrupt handling.** When the server sends `{"type": "interrupted"}`, the client MUST:
1. Immediately stop any audio playback.
2. Clear the playback buffer.
3. Resume listening for new audio from the agent.

### Step 4.6 — `client/src/hooks/useVideo.ts`

Optional webcam capture hook:

```typescript
import { useRef, useCallback } from 'react';

export function useVideo(sendBinary: (data: ArrayBuffer) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Capture JPEG frames every 2 seconds and send via WebSocket
  }, [sendBinary]);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { videoRef, startCapture, stopCapture };
}
```

### Step 4.7 — `client/src/components/Session.tsx`

Active session screen — composes hooks and dashboard:

```tsx
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudio } from '../hooks/useAudio';
import { Dashboard } from './Dashboard';
import { Waveform } from './Waveform';

interface Props {
  mode: string;
  onEnd: (report: any) => void;
}

export function Session({ mode, onEnd }: Props) {
  const { wsRef, isConnected, connect, disconnect, sendBinary, sendJSON } = useWebSocket(mode);
  const { startCapture, stopCapture, playChunk, handleInterrupt } = useAudio(sendBinary);
  const [metrics, setMetrics] = useState<any>({});
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const ws = connect();

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        playChunk(event.data);  // Binary = audio response
      } else {
        const msg = JSON.parse(event.data);
        if (msg.type === 'interrupted') handleInterrupt();
        if (msg.type === 'metrics') setMetrics(msg.data);
        if (msg.type === 'report') { disconnect(); onEnd(msg.data); }
      }
    };

    startCapture();
    return () => { stopCapture(); disconnect(); };
  }, []);

  const handleEnd = () => {
    stopCapture();
    sendJSON({ type: 'end_session' });
  };

  return (
    <div className="session">
      <Waveform />
      <Dashboard metrics={metrics} elapsed={elapsed} />
      <button className="end-btn" onClick={handleEnd}>End Session</button>
    </div>
  );
}
```

### Step 4.8 — `client/src/components/Dashboard.tsx`

Live metrics display:

```tsx
interface Props {
  metrics: {
    filler_words?: Record<string, number>;
    words_per_minute?: number;
    tone?: string;
    improvement_hint?: string;
  };
  elapsed: number;
}

export function Dashboard({ metrics, elapsed }: Props) {
  const totalFillers = Object.values(metrics.filler_words || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="dashboard">
      <div className="metric">
        <span className="metric-value">{totalFillers}</span>
        <span className="metric-label">Filler Words</span>
      </div>
      <div className="metric">
        <span className="metric-value">{metrics.words_per_minute || '—'}</span>
        <span className="metric-label">WPM</span>
      </div>
      <div className="metric">
        <span className={`tone-badge tone-${metrics.tone || 'neutral'}`}>
          {metrics.tone || 'Listening...'}
        </span>
        <span className="metric-label">Tone</span>
      </div>
      <div className="timer">{formatTime(elapsed)}</div>
    </div>
  );
}
```

### Step 4.9 — `client/src/components/Report.tsx`

Post-session report display:

```tsx
interface Props {
  data: SessionReport;
  onRestart: () => void;
}

export function Report({ data, onRestart }: Props) {
  return (
    <div className="report">
      <h1>Session Report</h1>
      <div className="overall-score">{data.overall_score}/10</div>
      <div className="categories">
        {Object.entries(data.categories).map(([key, cat]) => (
          <div key={key} className="category-card">
            <h3>{key}</h3>
            <div className="score">{cat.score}/10</div>
            <p>{cat.feedback}</p>
          </div>
        ))}
      </div>
      <div className="key-moments">
        <h2>Key Moments</h2>
        {data.key_moments.map((m, i) => (
          <div key={i} className={`moment moment-${m.type}`}>
            <span className="timestamp">{m.timestamp}</span>
            <span>{m.note}</span>
          </div>
        ))}
      </div>
      <div className="tips">
        <h2>Improvement Tips</h2>
        <ul>{data.improvement_tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
      <button onClick={onRestart}>Try Again</button>
    </div>
  );
}
```

### Step 4.10 — `client/src/components/Waveform.tsx`

Audio input waveform visualization using Canvas:

```tsx
import { useRef, useEffect } from 'react';

export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use AnalyserNode from Web Audio API to draw real-time waveform
  // ...
  return <canvas ref={canvasRef} className="waveform" />;
}
```

**Message protocol (client → server):**
- Binary: raw PCM audio chunk
- Binary with prefix `0x01`: JPEG video frame
- JSON: `{"type": "end_session"}`

**Message protocol (server → client):**
- Binary: raw PCM audio response
- JSON: `{"type": "interrupted"}`
- JSON: `{"type": "metrics", "data": {...}}`
- JSON: `{"type": "transcript_cue", "text": "..."}`
- JSON: `{"type": "report", "data": {...}}`

---

## Phase 5: Post-Session Report

### Step 5.1 — `server/report.ts`

After session ends:

1. Collect full transcript from the Gemini session.
2. Collect accumulated metrics from the Analytics Agent.
3. Make a standard Gemini API call (non-Live) with a report generation prompt.
4. Return structured JSON report.

```typescript
import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });

export async function generateReport(
  mode: string,
  transcript: string[],
  metrics: MetricSnapshot[]
): Promise<SessionReport> {
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [{ text: buildReportPrompt(mode, transcript, metrics) }],
    }],
  });
  return JSON.parse(response.text!);
}
```

Report structure:
```json
{
    "session_id": "uuid",
    "mode": "pitch_perfect",
    "duration_seconds": 420,
    "overall_score": 7.2,
    "categories": {
        "clarity": {"score": 8, "feedback": "Clear problem statement..."},
        "confidence": {"score": 6, "feedback": "Too many filler words..."},
        "persuasiveness": {"score": 7, "feedback": "Good use of data..."},
        "composure": {"score": 8, "feedback": "Handled interruptions well..."}
    },
    "metrics": {
        "total_filler_words": 23,
        "avg_words_per_minute": 148,
        "dominant_tone": "nervous",
        "interruption_recovery_avg_ms": 2300
    },
    "key_moments": [
        {"timestamp": "1:23", "type": "strength", "note": "Strong opening hook"},
        {"timestamp": "3:45", "type": "weakness", "note": "Lost composure after investor challenge"}
    ],
    "improvement_tips": [
        "Practice your market size slide — you hesitated significantly.",
        "Replace 'I think' with 'I believe' or state facts directly.",
        "When interrupted, pause for 1 second before responding."
    ]
}
```

---

## Phase 6: Local Development

### Step 6.1 — Install and Run Locally

```bash
# Install root (server) dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Create local env file
cp .env.example .env
# Edit .env — add your GOOGLE_API_KEY

# Start both dev servers concurrently
npm run dev
```

This starts **two dev servers**:
- **Backend** at `http://localhost:8080` — Express + WebSocket + ADK agents (via `tsx watch`).
- **Client** at `http://localhost:5173` — Vite dev server with React HMR.

Open `http://localhost:5173` in the browser. The Vite dev server proxies `/ws` and `/health` requests to the Express backend on port 8080 (configured in `vite.config.ts`).

Key features:
- **React HMR** — edit any React component and see changes instantly without a page refresh.
- **Server hot reload** via `tsx watch` — edits to any server `.ts` file restart the backend automatically.
- **In-memory session store** — no Firestore setup needed. Sessions are stored in memory and lost on restart (fine for development).
- **Gemini Live API** — connects to the real Gemini API over the internet. This is the same API used in production; there is no emulator. You need a valid `GOOGLE_API_KEY`.

### Step 6.2 — Test Flow

1. Open `http://localhost:5173` in Chrome (Chrome has the best Web Audio API support).
2. Select "PitchPerfect" mode.
3. Grant microphone access when prompted.
4. Start speaking — verify audio is captured and sent.
5. Verify the agent responds with voice interruptions.
6. Check the Dashboard component updates with metrics.
7. End the session — verify the Report component renders.

### Step 6.3 — Optional: Firestore Local Emulator

If you want to test Firestore persistence locally:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase emulator (select Firestore)
firebase init emulators

# Start the emulator
firebase emulators:start --only firestore

# Set env var to use emulator
FIRESTORE_EMULATOR_HOST=localhost:8080
```

This is **optional** — the in-memory store is sufficient for development.

---

## Phase 7: Production Deployment (Cloud Run)

This phase is only needed for the final contest submission.

### Step 7.1 — Build for production

```bash
# Compile server TypeScript + build client React bundle
npm run build

# Verify output directories
ls dist/server/     # Server JS files
ls client-dist/     # Vite production bundle (index.html + assets)
```

### Step 7.2 — Build and push Docker image

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project $PROJECT_ID

# Build container image
gcloud builds submit --tag gcr.io/$PROJECT_ID/debatepro
```

### Step 7.3 — Store API key in Secret Manager

```bash
# Create secret
echo -n "your-gemini-api-key" | \
  gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 7.4 — Deploy to Cloud Run

```bash
gcloud run deploy debatepro \
  --image gcr.io/$PROJECT_ID/debatepro \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "GOOGLE_API_KEY=gemini-api-key:latest" \
  --set-env-vars "NODE_ENV=production" \
  --timeout=3600 \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi
```

### Step 7.5 — Verify Production Deployment

1. Navigate to the Cloud Run URL printed by the deploy command.
2. Select a mode and run a full session.
3. Verify the report is generated and persisted in Firestore.
4. Check Cloud Run logs for errors: `gcloud run logs read debatepro`.

---

## Implementation Order (Recommended)

| Order | Task | Priority | Estimated Effort |
|---|---|---|---|
| 1 | Project scaffolding + Vite init (1.1-1.6) | High | 30 min |
| 2 | Server config + Express app (2.1-2.2) | High | 30 min |
| 3 | Session store interface (2.4) | High | 20 min |
| 4 | System prompts (2.5) | High | 45 min |
| 5 | WebSocket handler with Gemini Live API (2.3) | Critical | 2-3 hours |
| 6 | **Stitch UI design — generate & iterate all 3 screens (3.5)** | **High** | **1 hour** |
| 7 | React components: App + ModeSelect + CSS (4.1-4.3) | High | 1-2 hours |
| 8 | useAudio hook (4.5) | Critical | 2 hours |
| 9 | useWebSocket hook + Session component (4.4, 4.7) | High | 1 hour |
| 10 | Dashboard + Waveform components (4.8, 4.10) | Medium | 1 hour |
| 11 | Report component (4.9) | Medium | 45 min |
| 12 | ADK agents (3.1-3.3) | High | 1-2 hours |
| 13 | Post-session report (5.1) | Medium | 1 hour |
| 14 | useVideo hook (4.6) | Low | 45 min |
| 15 | Production deployment (7.1-7.5) | High | 1 hour |

**Total estimated effort: 14-17 hours**

---

## Local vs Production — Summary

| Aspect | Local (`npm run dev`) | Production (Cloud Run) |
|---|---|---|
| Client | Vite dev server (port 5173) with React HMR | Pre-built static bundle served by Express |
| Server | `tsx watch` (port 8080) with hot reload | `node dist/server/main.js` |
| Session Store | In-memory (Map) | Firestore |
| API Key | `.env` file | Secret Manager |
| Gemini Live API | Same — real API via internet | Same — real API via internet |
| URL | `http://localhost:5173` (Vite proxies to backend) | `https://debatepro-xxx.run.app` |
| HTTPS | No (localhost) | Yes (Cloud Run auto-TLS) |
| Scaling | Single instance | 0-10 instances (autoscale) |
| When to use | All development and testing | Contest submission only |
