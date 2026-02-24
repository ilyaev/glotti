import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { handleConnection } from './ws-handler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', mode: config.isDev ? 'development' : 'production' }));

// For development, serve the Vite-built client files to support local full-stack testing if needed
if (config.isDev) {
  app.use(express.static(join(__dirname, '..', 'client-dist')));
}

// WebSocket connections
wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const mode = url.searchParams.get('mode') || 'pitch_perfect';
  const userId = url.searchParams.get('userId') || 'anonymous';
  handleConnection(ws, mode, userId);
});

server.listen(config.port, () => {
  console.log('');
  console.log('  🎤 DebatePro Server');
  console.log(`  ➜ http://localhost:${config.port}`);
  console.log(`  ➜ Environment: ${config.isDev ? 'development' : 'production'}`);
  console.log('');
});
