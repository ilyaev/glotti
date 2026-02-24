import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { handleConnection } from './ws-handler.js';
import { createStore } from './store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const store = createStore();

app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', mode: config.isDev ? 'development' : 'production' }));

// ─── Sessions API ─────────────────────────────────────────────────────────────

// GET /api/sessions?userId=<id>  — list summary for a user
app.get('/api/sessions', async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ error: 'userId query param is required' });
    return;
  }
  try {
    const sessions = await store.listByUser(userId);
    res.json(sessions.map(s => ({
      ...s,
      startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt,
    })));
  } catch (err) {
    console.error('GET /api/sessions error:', err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// GET /api/sessions/:id  — full session with transcript and report
// Access via: ?userId=<id>  (owner)  OR  ?key=<shareKey>  (shared link)
app.get('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string | undefined;
  const shareKey = req.query.key as string | undefined;

  try {
    const session = await store.get(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // If a share key is provided, verify SHA-256(sessionId + userId)
    if (shareKey) {
      const { createHash } = await import('crypto');
      const expected = createHash('sha256')
        .update(session.id + session.userId)
        .digest('hex')
        .slice(0, 24);
      if (shareKey !== expected) {
        res.status(403).json({ error: 'Invalid share key' });
        return;
      }
      // Key matched — serve the session (strip transcript for public view if desired)
    } else if (userId && session.userId !== userId) {
      // No share key — regular ownership check
      res.status(403).json({ error: 'Forbidden' });
      return;
    } else if (!userId) {
      res.status(403).json({ error: 'userId or key required' });
      return;
    }

    res.json({
      ...session,
      startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
    });
  } catch (err) {
    console.error(`GET /api/sessions/${id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});


// ─── For development, serve the Vite-built client files ───────────────────────
if (config.isDev) {
  app.use(express.static(join(__dirname, '..', 'client-dist')));
}

// ─── WebSocket connections ────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const mode = url.searchParams.get('mode') || 'pitch_perfect';
  const userId = url.searchParams.get('userId') || 'anonymous';
  handleConnection(ws, mode, userId);
});

server.listen(config.port, () => {
  console.log('');
  console.log('  Glotti Server');
  console.log(`  ➜ http://localhost:${config.port}`);
  console.log(`  ➜ Environment: ${config.isDev ? 'development' : 'production'}`);
  console.log('');
});
