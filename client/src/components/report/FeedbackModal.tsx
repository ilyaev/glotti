import { useEffect, useState, useRef } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { Waveform } from '../Waveform';
import { X, Mic, MicOff, MessageSquareText } from 'lucide-react';
import type { TranscriptCue } from '../../types';

interface Props {
    sessionId: string;
    userId: string;
    onClose: () => void;
}

export function FeedbackModal({ sessionId, userId, onClose }: Props) {
    // We use the same useWebSocket hook but with 'feedback' mode and passing the originalSessionId
    const wsUrlStr = import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`;
    const urlStr = `${wsUrlStr}/ws?mode=feedback&userId=${userId}&originalSessionId=${sessionId}`;

    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'interrupted' | 'ending' | 'disconnected'>('connecting');
    const wsRef = useRef<WebSocket | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [cues, setCues] = useState<TranscriptCue[]>([]);
    const feedEndRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll coaching feed when new cues arrive
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [cues]);

    // Custom connect for the feedback mode that uses the specialized URL
    const connectFeedback = () => {
        console.log(`🔌 [Feedback] Connecting to ${urlStr}`);
        const ws = new WebSocket(urlStr);
        ws.binaryType = 'arraybuffer';
        ws.onopen = () => {
            console.log('🔌 [Feedback] Connected');
        };
        ws.onclose = (e) => {
            console.log(`🔌 [Feedback] Disconnected (${e.code})`);
            setStatus('disconnected');
        };
        wsRef.current = ws;
        return ws;
    };

    const disconnect = () => {
        if (wsRef.current) wsRef.current.close();
    };

    const sendBinary = (data: ArrayBuffer) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        }
    };

    const {
        initPlayback,
        startCapture,
        stopCapture,
        playChunk,
        handleInterrupt,
        userAnalyserRef,
        aiAnalyserRef
    } = useAudio(sendBinary);

    useEffect(() => {
        const ws = connectFeedback();

        ws.onmessage = (event: MessageEvent) => {
            if (event.data instanceof ArrayBuffer) {
                setStatus('speaking');
                playChunk(event.data);
            } else {
                const msg = JSON.parse(event.data as string);
                switch (msg.type) {
                    case 'session_started':
                        console.log('🔌 [Feedback] Session started, initializing audio...');
                        initPlayback();
                        startCapture().catch(err => console.error('Failed to start feedback capture:', err));
                        setStatus('connecting');
                        break;
                    case 'interrupted':
                        setStatus('interrupted');
                        handleInterrupt();
                        setTimeout(() => setStatus('listening'), 1000);
                        break;
                    case 'transcript_cue':
                        setCues(prev => [...prev, { text: msg.text, timestamp: msg.timestamp }]);
                        console.log('📝 [Feedback] Cue:', msg.text);
                        break;
                    case 'turn_complete':
                        console.log('🎤 [Feedback] AI Turn Complete');
                        setStatus('listening');
                        break;
                    case 'error':
                        if (msg.message.includes('time limit')) {
                            setStatus('ending');
                            setTimeout(onClose, 3000);
                        }
                        break;
                }
            }
        };

        const timer = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timer);
            stopCapture();
            disconnect();
        };
    }, []);

    return (
        <div className="feedback-modal">
            <div className="feedback-modal__content">
                <button className="feedback-modal__close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="feedback-modal__header">
                    <div className="feedback-modal__pulse">
                        <div className="pulse-ring"></div>
                        <MessageSquareText size={32} className="feedback-modal__icon" />
                    </div>
                    <h2 className="feedback-modal__title">Partner Feedback</h2>
                    <p className="feedback-modal__subtitle">
                        {status === 'connecting' ? 'Connecting to your partner...' :
                            status === 'speaking' ? 'AI Partner is talking...' :
                                status === 'listening' ? 'Listening to you...' :
                                    status === 'interrupted' ? 'Interrupted' :
                                        status === 'ending' ? 'Feedback complete' : 'Interactive Session'}
                    </p>
                </div>

                <div className="feedback-modal__visualization">
                    <Waveform
                        userAnalyserRef={userAnalyserRef}
                        aiAnalyserRef={aiAnalyserRef}
                        status={status}
                    />
                </div>

                {/* Live transcript feed */}
                <div className="transcript-feed">
                    <h3 className="transcript-feed__title">
                        <span className="transcript-feed__live-dot" />
                        Live Transcript
                    </h3>
                    <div className="transcript-feed__list">
                        {cues.length === 0 ? (
                            <div className="transcript-feed__empty">
                                Waiting for conversation...
                            </div>
                        ) : (
                            cues.map((cue, i) => (
                                <div
                                    key={i}
                                    className={`transcript-feed__item ${i === cues.length - 1 ? 'transcript-feed__item--latest' : ''}`}
                                >
                                    <span className="transcript-feed__time">{formatTime(cue.timestamp)}</span>
                                    <span className="transcript-feed__text">{cue.text}</span>
                                </div>
                            ))
                        )}
                        <div ref={feedEndRef} />
                    </div>
                </div>

                <div className="feedback-modal__footer">
                    <div className="feedback-modal__timer">
                        <span className={`timer-dot ${elapsed > 50 ? 'timer-dot--danger' : ''}`}></span>
                        {60 - elapsed > 0 ? `${60 - elapsed}s remaining` : 'Closing...'}
                    </div>
                    <div className="feedback-modal__status-icon">
                        {status === 'listening' ? <Mic className="status-mic active" /> : <MicOff className="status-mic" />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
