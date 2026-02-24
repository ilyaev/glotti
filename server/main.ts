import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { handleConnection } from './ws-handler.js';
import { createStore } from './store.js';
import sessionsRouter from './api/sessions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });
const store = createStore();

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Limit each IP to 100 requests per 15 minutes for /api endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api', limiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', mode: config.isDev ? 'development' : 'production' }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/sessions', sessionsRouter);


// ─── For development, serve the Vite-built client files ───────────────────────
if (config.isDev) {
  app.use(express.static(join(__dirname, '..', 'client-dist')));
}

// ─── WebSocket connections ────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const mode = url.searchParams.get('mode') || 'pitch_perfect';
  const userId = url.searchParams.get('userId') || 'anonymous';
  const originalSessionId = url.searchParams.get('originalSessionId');
  handleConnection(ws, mode, userId, originalSessionId);
});

server.listen(config.port, () => {
  console.log('');
  console.log('  Glotti Server');
  console.log(`  ➜ http://localhost:${config.port}`);
  console.log(`  ➜ Environment: ${config.isDev ? 'development' : 'production'}`);
  console.log('');
});
