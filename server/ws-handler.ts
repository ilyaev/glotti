import { GoogleGenAI, type LiveServerMessage, Modality } from '@google/genai';
import type { WebSocket } from 'ws';
import { config, loadPrompt, type Mode, MODES } from './config.js';
import { createStore, type MetricSnapshot } from './store.js';
import { generateReport } from './report.js';
import { randomUUID } from 'crypto';

// --- DEBUG LOGGER FOR WEBSOCKET PAYLOADS OUT ---
// Intercept native WebSocket
if (typeof globalThis.WebSocket !== 'undefined') {
  const origSend = globalThis.WebSocket.prototype.send;
  globalThis.WebSocket.prototype.send = function(data: any) {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        console.error("➡️ [GEMINI WS OUT]:", JSON.stringify(parsed, null, 2));
      } catch {
        console.error("➡️ [GEMINI WS OUT]:", data);
      }
    }
    return origSend.call(this, data);
  };
}

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });
const store = createStore();

// Simple filler word detection for real-time metrics
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'right', 'well', 'i mean'];

function extractMetrics(text: string, elapsedSeconds: number): MetricSnapshot {
  const lower = text.toLowerCase();
  const fillerCounts: Record<string, number> = {};
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      fillerCounts[filler] = matches.length;
    }
  }

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.max(elapsedSeconds / 60, 0.1);
  const wpm = Math.round(wordCount / minutes);

  // Simple tone heuristic
  let tone = 'neutral';
  if (lower.includes('!') || lower.includes('confident') || lower.includes('sure')) tone = 'confident';
  else if (lower.includes('?') && wordCount < 10) tone = 'uncertain';
  else if (lower.includes('sorry') || lower.includes('maybe')) tone = 'nervous';

  return {
    filler_words: fillerCounts,
    words_per_minute: wpm,
    tone,
    key_phrases: [],
    improvement_hint: Object.keys(fillerCounts).length > 0
      ? `Try reducing filler words like "${Object.keys(fillerCounts)[0]}"`
      : '',
    timestamp: Date.now(),
  };
}

export async function handleConnection(ws: WebSocket, modeStr: string) {
  // Validate mode
  if (!(modeStr in MODES)) {
    console.error(`❌ Invalid mode: ${modeStr}`);
    ws.send(JSON.stringify({ type: 'error', message: `Invalid mode: ${modeStr}` }));
    ws.close();
    return;
  }

  const mode = modeStr as Mode;
  const sessionId = randomUUID();
  const startedAt = new Date();
  const transcript: { role: 'user' | 'ai'; text: string; timestamp: number }[] = [];
  const metrics: MetricSnapshot[] = [];
  let sessionClosed = false;
  let endingSession = false;
  let userTranscriptBuffer = '';
  let aiTranscriptBuffer = '';
  let audioChunkCount = 0;

  console.log(`🎙️  New session: ${sessionId} [${mode}]`);
  console.log(`   System prompt loaded: ${MODES[mode]}`);

  try {
    const systemPrompt = loadPrompt(mode);
    console.log(`   Prompt length: ${systemPrompt.length} chars`);
    console.log(`   Connecting to Gemini Live API (${config.geminiModel})...`);

    // Open a Gemini Live API session using the callbacks pattern
    const session = await genai.live.connect({
      model: config.geminiModel,
      callbacks: {
        onopen: () => {
          console.log(`   ✅ Gemini Live API connected for session ${sessionId}`);
        },
        onmessage: (message: LiveServerMessage) => {
          try {
            if (ws.readyState !== ws.OPEN) return;

            const serverContent = message.serverContent;

            // Log what type of message we received
            if (message.setupComplete) {
              console.log(`   [${sessionId}] ← setupComplete`);
              // Send initial trigger to get the AI to start speaking
              try {
                session.sendClientContent({
                  turns: [{ role: 'user', parts: [{ text: "Hello! Let's begin the scenario." }] }],
                  turnComplete: true,
                });
                console.log(`   [${sessionId}] Initial greeting sent to trigger AI intro`);
              } catch (err) {
                console.error(`   [${sessionId}] Failed to send initial greeting:`, err);
              }
              return;
            }

            if (!serverContent) {
              if (message.toolCall) {
                console.log(`   [${sessionId}] ← toolCall:`, JSON.stringify(message.toolCall).slice(0, 200));
              }
              return;
            }

            // Handle interruption (barge-in)
            if (serverContent.interrupted) {
              console.log(`   [${sessionId}] ← interrupted (barge-in)`);
              ws.send(JSON.stringify({ type: 'interrupted' }));
              return;
            }

            // Handle user speech transcription (what the user said)
            if (serverContent.inputTranscription?.text) {
              const text = serverContent.inputTranscription.text;
              userTranscriptBuffer += text;

              // Flush user metrics on sentence boundary or enough words
              const isSentenceEnd = /[.?!]$/.test(userTranscriptBuffer.trim());
              const wordCount = userTranscriptBuffer.trim().split(/\s+/).length;
              if (isSentenceEnd || wordCount >= 10) {
                const finishedSentence = userTranscriptBuffer.trim();
                console.log(`   [${sessionId}] ← user: "${finishedSentence.slice(0, 100)}"`);

                // Send to client so it appears in transcript feed
                if (ws.readyState === ws.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'coaching_cue',
                    text: `[User]: ${finishedSentence}`,
                    timestamp: Math.round((Date.now() - startedAt.getTime()) / 1000),
                  }));
                }

                const elapsed = Math.round((Date.now() - startedAt.getTime()) / 1000);
                transcript.push({ role: 'user', text: finishedSentence, timestamp: elapsed });

                // We still need all user text concatenated for metrics extraction
                const allUserText = transcript.filter(t => t.role === 'user').map(t => t.text).join(' ');
                const metric = extractMetrics(allUserText, elapsed);
                metrics.push(metric);
                ws.send(JSON.stringify({ type: 'metrics', data: metric }));
                userTranscriptBuffer = '';
              }
            }

            // Handle AI speech transcription (what the AI said)
            if (serverContent.outputTranscription?.text) {
              const text = serverContent.outputTranscription.text;
              aiTranscriptBuffer += text;

              // Flush to client on sentence boundary or enough words
              const isSentenceEnd = /[.?!:"]$/.test(aiTranscriptBuffer.trim());
              const wordCount = aiTranscriptBuffer.trim().split(/\s+/).length;
              if (isSentenceEnd || wordCount >= 15) {
                const flushed = aiTranscriptBuffer.trim();
                console.log(`   [${sessionId}] ← AI: "${flushed.slice(0, 120)}"`);
                ws.send(JSON.stringify({
                  type: 'coaching_cue',
                  text: flushed,
                  timestamp: Math.round((Date.now() - startedAt.getTime()) / 1000),
                }));

                const elapsed = Math.round((Date.now() - startedAt.getTime()) / 1000);
                transcript.push({ role: 'ai', text: flushed, timestamp: elapsed });

                aiTranscriptBuffer = '';
              }
            }

            // Handle model output (audio chunks)
            if (serverContent.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                // Audio response
                if (part.inlineData?.data) {
                  const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
                  ws.send(audioBuffer);
                }

                // Text response (often includes AI's internal "thought process" for this preview model)
                // We just log it, but do NOT add it to aiTranscript as it's not spoken out loud.
                if (part.text) {
                  console.log(`   [${sessionId}] ← text part (thought): "${part.text.split('\n')[0].slice(0, 100)}..."`);
                }
              }
            }

            // Handle turn completion
            if (serverContent.turnComplete) {
              console.log(`   [${sessionId}] ← turnComplete`);
              ws.send(JSON.stringify({ type: 'turn_complete' }));
            }
          } catch (err) {
            console.error(`   [${sessionId}] Error processing Gemini response:`, err);
          }
        },
        onerror: (error: ErrorEvent) => {
          console.error(`   [${sessionId}] Gemini Live error:`, error.message || error);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'AI session error' }));
          }
        },
        onclose: (event: CloseEvent) => {
          console.log(`   [${sessionId}] Gemini Live connection closed (code: ${event.code}, reason: "${event.reason}")`);
          sessionClosed = true;

          // Flush any remaining transcript buffer
          if (aiTranscriptBuffer.trim()) {
            ws.send(JSON.stringify({
              type: 'coaching_cue',
              text: aiTranscriptBuffer.trim(),
              timestamp: Math.round((Date.now() - startedAt.getTime()) / 1000),
            }));
            aiTranscriptBuffer = '';
          }

          // Notify client that AI disconnected (don't auto-end — let user click End Session)
          if (!endingSession && ws.readyState === ws.OPEN) {
            console.log(`   [${sessionId}] Notifying client of AI disconnect`);
            ws.send(JSON.stringify({
              type: 'ai_disconnected',
              message: event.code === 1000 ? 'Session completed' : 'AI connection interrupted',
            }));
          }
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: { parts: [{ text: systemPrompt }] },
      },
    });

    console.log(`   [${sessionId}] Session object created, waiting for setupComplete...`);

    // Notify client that session is ready
    ws.send(JSON.stringify({ type: 'session_started', sessionId, mode }));

    // Forward browser audio → Gemini
    ws.on('message', (data: Buffer, isBinary: boolean) => {
      try {
        // Text messages are JSON commands (ws library always passes Buffer, use isBinary flag)
        if (!isBinary) {
          const msg = JSON.parse(data.toString('utf-8'));
          console.log(`   [${sessionId}] → client command: ${msg.type}`);
          if (msg.type === 'end_session') {
            endSession();
          }
          return;
        }

        // Don't forward audio if session is ending
        if (endingSession || sessionClosed) return;

        audioChunkCount++;

        // Extract JSON header from binary payload (terminated by \n)
        const newlineIdx = data.indexOf(10); // \n is 10
        if (newlineIdx === -1) {
          console.error(`   [${sessionId}] ❌ Invalid binary payload: no JSON header found`);
          return;
        }

        const headerBytes = data.subarray(0, newlineIdx);
        const rawData = data.subarray(newlineIdx + 1);

        let header;
        try {
          header = JSON.parse(headerBytes.toString('utf-8'));
        } catch {
          console.error(`   [${sessionId}] ❌ Invalid binary payload: bad JSON header`);
          return;
        }
        if (header.type === 'video') {
          try {
            session.sendRealtimeInput({
              video: {
                data: rawData.toString('base64'),
                mimeType: 'image/jpeg',
              },
            });
          } catch (err: any) {
            console.error(`   [${sessionId}] ❌ Video send error (chunk #${audioChunkCount}):`, err.message || err);
          }
        } else if (header.type === 'audio') {
          const b64 = rawData.toString('base64');
          if (audioChunkCount <= 3 || audioChunkCount % 100 === 0) {
            console.log(`   [${sessionId}] → audio #${audioChunkCount}: ${rawData.length} bytes, b64_len=${b64.length}`);
          }
          try {
            session.sendRealtimeInput({
              audio: {
                data: b64,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (err: any) {
            console.error(`   [${sessionId}] ❌ Audio send error (chunk #${audioChunkCount}):`, err.message || err);
          }
        }
      } catch (err) {
        if (!endingSession) {
          console.error(`   [${sessionId}] Error forwarding to Gemini:`, err);
        }
      }
    });

    // Handle WebSocket close
    ws.on('close', () => {
      console.log(`🔌 Client disconnected: ${sessionId}`);
      if (!sessionClosed) {
        try { session.close(); } catch (_) { /* already closed */ }
        sessionClosed = true;
      }
    });

    ws.on('error', (err) => {
      console.error(`   [${sessionId}] WebSocket error:`, err);
    });

    // End session function
    async function endSession() {
      if (endingSession) return;
      endingSession = true;

      const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
      console.log(`⏹️  Session ending: ${sessionId} (duration: ${durationSeconds}s, entries: ${transcript.length})`);

      // Close the Gemini session first
      if (!sessionClosed) {
        try {
          session.close();
        } catch (_) { /* already closed */ }
        sessionClosed = true;
      }

      // Generate post-session report
      try {
        console.log(`   [${sessionId}] Generating post-session report...`);
        const report = await generateReport(sessionId, mode, transcript, metrics, durationSeconds);
        console.log(`   [${sessionId}] Report generated: overall_score=${report.overall_score}`);

        // Save session data
        await store.save({
          id: sessionId,
          mode,
          startedAt,
          transcript: transcript.map(t => `[${t.role === 'user' ? 'User' : 'AI'}] ${t.text}`),
          metrics,
          report,
        });

        // Send report to client
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'report', data: report }));
          console.log(`   [${sessionId}] ✅ Report sent to client`);
        } else {
          console.log(`   [${sessionId}] ⚠️ Client already disconnected, report not sent`);
        }
      } catch (err) {
        console.error(`   [${sessionId}] ❌ Error generating report:`, err);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to generate report. Please try again.',
          }));
        }
      }
    }

  } catch (error) {
    console.error(`❌ Failed to initialize session ${sessionId}:`, error);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to connect to AI. Check your API key.',
      }));
      ws.close();
    }
  }
}
