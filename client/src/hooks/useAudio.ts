import { useRef, useCallback } from 'react';

// Global playback context to ensure we can unlock it from a user gesture
let globalPlaybackContext: AudioContext | null = null;
let globalAiAnalyser: AnalyserNode | null = null;

export function initGlobalAudio() {
  if (!globalPlaybackContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalPlaybackContext = new AudioContextClass({ sampleRate: 24000 });
    globalAiAnalyser = globalPlaybackContext.createAnalyser();
    globalAiAnalyser.fftSize = 2048;
  }
  if (globalPlaybackContext.state === 'suspended') {
    globalPlaybackContext.resume().catch(console.error);
  }
}

interface UseAudioReturn {
  initPlayback: () => void;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  playChunk: (audioData: ArrayBuffer) => void;
  handleInterrupt: () => void;
  userAnalyserRef: React.RefObject<AnalyserNode | null>;
  aiAnalyserRef: React.RefObject<AnalyserNode | null>;
}

export function useAudio(sendBinary: (data: ArrayBuffer) => void): UseAudioReturn {
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);

  // Playback state
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialize playback context immediately so we can hear the AI before opening the mic
  const initPlayback = useCallback(() => {
    initGlobalAudio();
    playbackContextRef.current = globalPlaybackContext;
    aiAnalyserRef.current = globalAiAnalyser;
    nextPlayTimeRef.current = 0;
    console.log('🔊 Playback audio context initialized/resumed');
  }, []);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const context = new AudioContext({ sampleRate: 16000 });
      context.resume().catch(console.error);
      contextRef.current = context;

      // Create analyser for waveform visualization
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      userAnalyserRef.current = analyser;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      let audioChunkCount = 0;
      // Use ScriptProcessor as fallback (AudioWorklet requires HTTPS)
      const processor = context.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcm = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        audioChunkCount++;
        if (audioChunkCount === 1 || audioChunkCount % 50 === 0) {
          console.log(`🎤 [Audio] Captured chunk #${audioChunkCount}: ${pcm.buffer.byteLength} bytes`);
        }

        // Prefix with JSON header so backend knows it's audio, not video
        const headerString = JSON.stringify({ type: 'audio' }) + '\n';
        const header = new TextEncoder().encode(headerString);
        const payload = new Uint8Array(header.length + pcm.buffer.byteLength);
        payload.set(header, 0);
        payload.set(new Uint8Array(pcm.buffer), header.length);

        sendBinary(payload.buffer);
      };

      source.connect(processor);
      processor.connect(context.destination);

      console.log('🎤 Audio capture started');
    } catch (err) {
      console.error('Failed to start audio capture:', err);
      throw err;
    }
  }, [sendBinary]);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }

    // Stop any active sources since session is ending
    activeSourcesRef.current.forEach(source => {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch (err) { }
    });
    activeSourcesRef.current.clear();
    isPlayingRef.current = false;

    console.log('🎤 Audio capture stopped');
  }, []);

  const playChunk = useCallback((audioData: ArrayBuffer) => {
    const ctx = playbackContextRef.current;
    if (!ctx) return;

    // Convert raw PCM Int16 to Float32 for Web Audio API
    const int16 = new Int16Array(audioData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x7FFF;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Connect to both the analyser (for waveform) and the destination (speakers)
    if (aiAnalyserRef.current) {
      source.connect(aiAnalyserRef.current);
      aiAnalyserRef.current.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    // Schedule playback sequentially to avoid gaps
    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    activeSourcesRef.current.add(source);

    nextPlayTimeRef.current = startTime + buffer.duration;
    isPlayingRef.current = true;

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (nextPlayTimeRef.current <= ctx.currentTime + 0.01) {
        isPlayingRef.current = false;
      }
    };
  }, []);

  const handleInterrupt = useCallback(() => {
    // Stop current playback by stopping all active sources
    activeSourcesRef.current.forEach(source => {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch (err) { }
    });
    activeSourcesRef.current.clear();

    nextPlayTimeRef.current = 0;
    isPlayingRef.current = false;
    console.log('⚡ Playback interrupted');
  }, []);

  return { initPlayback, startCapture, stopCapture, playChunk, handleInterrupt, userAnalyserRef, aiAnalyserRef };
}
