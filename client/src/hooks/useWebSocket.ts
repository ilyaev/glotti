import { useRef, useCallback, useState } from 'react';
import { LIVE_DEBUG } from '../config';

interface UseWebSocketReturn {
  wsRef: React.RefObject<WebSocket | null>;
  isConnected: boolean;
  connect: () => WebSocket;
  disconnect: () => void;
  sendBinary: (data: ArrayBuffer) => void;
  sendJSON: (obj: unknown) => void;
}

export function useWebSocket(mode: string, userId: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const chunkCountRef = useRef(0);

  const connect = useCallback(() => {
    if (LIVE_DEBUG) {
      console.log('🧪 [DEBUG] Initializing Mock WebSocket');
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: (data: string) => {
          // console.log('🧪 [DEBUG] Mock WS Sent:', data);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'end_session') {
              // Simulate report generation
              setTimeout(() => {
                const mockReport = {
                  type: 'report',
                  data: {
                    session_id: 'mock-123',
                    mode: mode,
                    duration_seconds: 120,
                    overall_score: 8,
                    categories: {
                      delivery: { score: 9, feedback: "Excellent pace and volume." },
                      content: { score: 7, feedback: "Strong logic, but could use more evidence." },
                      engagement: { score: 8, feedback: "Good eye contact and responsiveness." }
                    },
                    metrics: {
                      total_filler_words: 4,
                      avg_words_per_minute: 145,
                      dominant_tone: "Confident",
                      interruption_recovery_avg_ms: 1200,
                      avg_talk_ratio: 55,
                      avg_clarity_score: 92
                    },
                    key_moments: [
                      { timestamp: "0:15", type: 'strength', note: "Very strong opening hook." },
                      { timestamp: "1:10", type: 'weakness', note: "A bit of hesitation during the Q&A part." }
                    ],
                    improvement_tips: [
                      "Try to maintain a slightly slower pace in the introduction.",
                      "Use more transition words between key points."
                    ]
                  }
                };
                if (mockWs.onmessage) mockWs.onmessage({ data: JSON.stringify(mockReport) } as MessageEvent);
              }, 1500);
            }
          } catch (e) { /* binary data ignored */ }
        },
        close: () => {
          console.log('🧪 [DEBUG] Mock WS Closed');
          setIsConnected(false);
          if (mockWs.onclose) mockWs.onclose({ code: 1000, reason: 'Debug End' } as CloseEvent);
        },
        onopen: null as any,
        onmessage: null as any,
        onclose: null as any,
        onerror: null as any,
        binaryType: 'arraybuffer'
      };

      // Simulate connection delay
      setTimeout(() => {
        setIsConnected(true);
        if (mockWs.onopen) mockWs.onopen({} as Event);

        // Simulate session started
        if (mockWs.onmessage) {
          mockWs.onmessage({
            data: JSON.stringify({ type: 'session_started', sessionId: 'mock-123', mode })
          } as MessageEvent);
        }

        // Delay then turn_complete to start mic/timer
        setTimeout(() => {
          if (mockWs.onmessage) {
            mockWs.onmessage({ data: JSON.stringify({ type: 'turn_complete' }) } as MessageEvent);
          }
        }, 2000);

        // Start periodic simulators
        const transcriptInterval = setInterval(() => {
          const fakeMessages = [
              "[User]: I think we should focus on the main value proposition.",
              "I completely agree. Can you elaborate on that?",
              "[User]: Basically, it's about speed and efficiency.",
              "Interesting. How do you plan to measure that?",
              "[User]: Actually, we'll use NPS scores."
          ];
          const text = fakeMessages[Math.floor(Math.random() * fakeMessages.length)];
          if (mockWs.onmessage) {
            mockWs.onmessage({
              data: JSON.stringify({ type: 'coaching_cue', text, timestamp: Math.floor(Date.now()/1000) })
            } as MessageEvent);
          }
        }, 5000);

        const metricsInterval = setInterval(() => {
          const mockMetrics = {
            type: 'metrics',
            data: {
              filler_words: { um: Math.floor(Math.random() * 3), like: Math.floor(Math.random() * 2) },
              words_per_minute: 130 + Math.floor(Math.random() * 40),
              talk_ratio: 40 + Math.floor(Math.random() * 20),
              clarity_score: 85 + Math.floor(Math.random() * 15),
              tone: ["Confident", "Thoughtful", "Excited"][Math.floor(Math.random() * 3)],
              improvement_hint: "Try to use fewer filler words."
            }
          };
          if (mockWs.onmessage) {
            mockWs.onmessage({ data: JSON.stringify(mockMetrics) } as MessageEvent);
          }
        }, 8000);

        const aiSpeakInterval = setInterval(() => {
          // Send some dummy binary data to trigger "AI Speaking" UI
          if (mockWs.onmessage) {
              const dummyAudio = new ArrayBuffer(1024);
              mockWs.onmessage({ data: dummyAudio } as MessageEvent);

              setTimeout(() => {
                 mockWs.onmessage!({ data: JSON.stringify({ type: 'turn_complete' }) } as MessageEvent);
              }, 2000);
          }
        }, 15000);

        // Cleanup on close
        const originalClose = mockWs.close;
        mockWs.close = () => {
          clearInterval(transcriptInterval);
          clearInterval(metricsInterval);
          clearInterval(aiSpeakInterval);
          originalClose();
        };

      }, 1000);

      wsRef.current = mockWs as any;
      return mockWs as any;
    }

    // Default to relative connection (same host) for local dev
    // If VITE_WS_URL is set, use it for connection to the remote backend
    const wsUrlStr = import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`;
    const urlStr = `${wsUrlStr}/ws?mode=${mode}&userId=${userId}`;

    console.log(`🔌 [WS] Connecting to ${urlStr}`);
    const ws = new WebSocket(urlStr);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log('🔌 [WS] Connected, readyState:', ws.readyState);
      setIsConnected(true);
    };

    ws.onclose = (e) => {
      console.log(`🔌 [WS] Disconnected (code: ${e.code}, reason: "${e.reason}")`);
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('🔌 [WS] Error:', err);
    };

    wsRef.current = ws;
    return ws;
  }, [mode, userId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('🔌 [WS] Closing connection');
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer) => {
    const ws = wsRef.current;
    if (!ws) {
      console.warn('🔌 [WS] sendBinary: no WebSocket ref');
      return;
    }
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn(`🔌 [WS] sendBinary: WS not open (state: ${ws.readyState})`);
      return;
    }
    ws.send(data);
    chunkCountRef.current++;
    // Log every 50th chunk to avoid console spam
    if (chunkCountRef.current % 50 === 1) {
      console.log(`🎤 [WS] Sent audio chunk #${chunkCountRef.current}: ${data.byteLength} bytes`);
    }
  }, []);

  const sendJSON = useCallback((obj: unknown) => {
    const ws = wsRef.current;
    if (!ws) {
      console.warn('🔌 [WS] sendJSON: no WebSocket ref');
      return;
    }
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn(`🔌 [WS] sendJSON: WS not open (state: ${ws.readyState})`);
      return;
    }
    const str = JSON.stringify(obj);
    console.log(`📤 [WS] Sending JSON: ${str}`);
    ws.send(str);
  }, []);

  return { wsRef, isConnected, connect, disconnect, sendBinary, sendJSON };
}
