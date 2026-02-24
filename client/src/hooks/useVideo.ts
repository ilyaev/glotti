import { useRef, useCallback } from 'react';

interface UseVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
}

export function useVideo(sendBinary: (data: ArrayBuffer) => void): UseVideoReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Create offscreen canvas for frame capture
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;

      // Capture frames every 2 seconds
      intervalRef.current = window.setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        canvasRef.current.toBlob((blob) => {
          if (!blob) return;
          blob.arrayBuffer().then((buffer) => {
            // Prefix with JSON header so backend knows it's video
            const headerString = JSON.stringify({ type: 'video' }) + '\n';
            const header = new TextEncoder().encode(headerString);
            const payload = new Uint8Array(header.length + buffer.byteLength);
            payload.set(header, 0);
            payload.set(new Uint8Array(buffer), header.length);

            sendBinary(payload.buffer);
          });
        }, 'image/jpeg', 0.7);
      }, 2000);

      console.log('📷 Video capture started');
    } catch (err) {
      console.warn('Video capture not available:', err);
    }
  }, [sendBinary]);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    console.log('📷 Video capture stopped');
  }, []);

  return { videoRef, startCapture, stopCapture };
}
