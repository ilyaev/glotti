import { useRef, useCallback, useState } from 'react';

interface UseWebSocketReturn {
  wsRef: React.RefObject<WebSocket | null>;
  isConnected: boolean;
  connect: () => WebSocket;
  disconnect: () => void;
  sendBinary: (data: ArrayBuffer) => void;
  sendJSON: (obj: unknown) => void;
}

export function useWebSocket(mode: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const chunkCountRef = useRef(0);

  const connect = useCallback(() => {
    // Default to relative connection (same host) for local dev
    // If VITE_WS_URL is set, use it for connection to the remote backend
    const wsUrlStr = import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`;
    const urlStr = `${wsUrlStr}/ws?mode=${mode}`;

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
  }, [mode]);

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
