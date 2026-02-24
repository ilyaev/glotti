import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudio } from '../hooks/useAudio';
import { Dashboard } from './Dashboard';
import { Waveform } from './Waveform';
import type { SessionReport, MetricSnapshot, CoachingCue } from '../types';
import { Target, Handshake, Swords, Mic } from 'lucide-react';

interface Props {
    mode: string;
    userId: string;
    onEnd: (report: SessionReport) => void;
}

export function Session({ mode, userId, onEnd }: Props) {
    const { connect, disconnect, sendBinary, sendJSON, isConnected } = useWebSocket(mode, userId);
    const { initPlayback, startCapture, stopCapture, playChunk, handleInterrupt, userAnalyserRef, aiAnalyserRef } = useAudio(sendBinary);
    const [metrics, setMetrics] = useState<MetricSnapshot | null>(null);
    const [cues, setCues] = useState<CoachingCue[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'interrupted' | 'ending' | 'disconnected'>('connecting');
    const timerRef = useRef<number | null>(null);
    const endingRef = useRef(false);
    const feedEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        console.log('🔌 [Session] Connecting to WebSocket...');
        const ws = connect();

        ws.onmessage = (event: MessageEvent) => {
            if (event.data instanceof ArrayBuffer) {
                // Binary = audio response from AI
                console.log(`🔊 [Session] ← audio chunk: ${event.data.byteLength} bytes`);
                setStatus('speaking');
                playChunk(event.data);
            } else {
                const msg = JSON.parse(event.data as string);
                console.log(`📩 [Session] ← ${msg.type}`, msg.type === 'coaching_cue' ? msg.text?.slice(0, 80) : '');
                switch (msg.type) {
                    case 'session_started':
                        console.log(`✅ [Session] Session started: ${msg.sessionId}`);
                        initPlayback(); // Initialize ear piece (speakers) immediately
                        setStatus('connecting'); // Wait for AI intro to finish before opening mic
                        break;
                    case 'interrupted':
                        setStatus('interrupted');
                        handleInterrupt();
                        setTimeout(() => setStatus('listening'), 1000);
                        break;
                    case 'metrics':
                        console.log('📊 [Session] Metrics update:', msg.data);
                        setMetrics(msg.data as MetricSnapshot);
                        break;
                    case 'coaching_cue':
                        setCues(prev => [...prev, { text: msg.text, timestamp: msg.timestamp }]);
                        break;
                    case 'turn_complete':
                        if (!timerRef.current) {
                            console.log('🎤 [Session] AI intro finished, starting mic and timer');
                            startCapture();
                            timerRef.current = window.setInterval(() => {
                                setElapsed(prev => prev + 1);
                            }, 1000);
                        }
                        setStatus(prev => prev === 'ending' ? 'ending' : 'listening');
                        break;
                    case 'report':
                        console.log('📊 [Session] Report received:', msg.data);
                        if (!endingRef.current) {
                            endingRef.current = true;
                            onEnd(msg.data as SessionReport);
                        }
                        break;
                    case 'error':
                        console.error('❌ [Session] Server error:', msg.message);
                        break;
                    case 'ai_disconnected':
                        console.warn('⚠️ [Session] AI disconnected:', msg.message);
                        stopCapture();
                        setStatus('disconnected');
                        break;
                }
            }
        };

        // Timer is now started upon the first 'turn_complete'

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopCapture();
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-scroll coaching feed when new cues arrive
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [cues]);

    // Enforce 3-minute limit (180 seconds)
    useEffect(() => {
        if (elapsed >= 180 && status !== 'ending' && status !== 'disconnected') {
            console.log('⏱️ [Session] 3 minute limit reached. Auto-ending.');
            handleEnd();
        }
    }, [elapsed, status]);

    const handleEnd = () => {
        if (endingRef.current) return;
        console.log('⏹️ [Session] Ending session...');
        stopCapture();
        if (timerRef.current) clearInterval(timerRef.current);
        sendJSON({ type: 'end_session' });
        setStatus('ending');
    };

    const modeLabels: Record<string, { label: string; icon: React.ReactNode; iconUrl?: string }> = {
        pitch_perfect: {
            label: 'PitchPerfect',
            icon: <Target size={18} strokeWidth={2} />,
            iconUrl: '/icons/pitch_perfect.png'
        },
        empathy_trainer: {
            label: 'EmpathyTrainer',
            icon: <Handshake size={18} strokeWidth={2} />,
            iconUrl: '/icons/empathy_trainer.png'
        },
        veritalk: {
            label: 'Veritalk',
            icon: <Swords size={18} strokeWidth={2} />,
            iconUrl: '/icons/veritalk.png'
        },
    };

    const modeInfo = modeLabels[mode] || { label: mode, icon: <Mic size={18} strokeWidth={2} /> };

    const renderBadgeIcon = () => (
        <span className="session__mode-icon">
            {modeInfo.iconUrl ? (
                <img
                    src={modeInfo.iconUrl}
                    alt={modeInfo.label}
                    className="session__mode-image-icon"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.querySelector('.lucide-icon-fallback')!.removeAttribute('style');
                    }}
                />
            ) : null}
            <span
                className="lucide-icon-fallback"
                style={modeInfo.iconUrl ? { display: 'none' } : {}}
            >
                {modeInfo.icon}
            </span>
        </span>
    );

    // Show loading overlay when generating report
    if (status === 'ending') {
        return (
            <div className="session session--ending">
                <div className="session__topbar">
                    <span className="session__mode-badge">
                        {renderBadgeIcon()}
                        {modeInfo.label}
                    </span>
                    <span className={`session__timer ${elapsed >= 150 ? 'session__timer--warning' : ''}`}>{formatTime(elapsed)}</span>
                </div>

                <div className="session__loading">
                    <div className="session__loading-spinner" />
                    <h2 className="session__loading-title">Analyzing your session</h2>
                    <p className="session__loading-subtitle">
                        Generating your personalized performance report...
                    </p>
                    <div className="session__loading-steps">
                        <span className="session__loading-step session__loading-step--done">
                            ✓ Session recorded
                        </span>
                        <span className="session__loading-step session__loading-step--active">
                            ⟳ Analyzing transcript & metrics
                        </span>
                        <span className="session__loading-step">
                            ○ Building report
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="session">
            {/* Top bar */}
            <div className="session__topbar">
                <span className="session__mode-badge">
                    {renderBadgeIcon()}
                    {modeInfo.label}
                </span>
                <span className={`session__timer ${elapsed >= 150 ? 'session__timer--warning' : ''}`}>{formatTime(elapsed)}</span>
            </div>

            {/* Status Text (Moved above waveform for cleaner look) */}
            <div className={`session__status session__status--${status}`}>
                <span className="session__status-text">
                    {status === 'connecting' && 'Connecting...'}
                    {status === 'listening' && "I'm listening..."}
                    {status === 'speaking' && 'AI speaking...'}
                    {status === 'interrupted' && 'Interrupted!'}
                    {status === 'disconnected' && 'AI disconnected — click End Session for your report'}
                </span>
            </div>

            {/* Mirrored Waveform */}
            <Waveform
                userAnalyserRef={userAnalyserRef}
                aiAnalyserRef={aiAnalyserRef}
                status={status}
            />

            {/* Dashboard */}
            <Dashboard metrics={metrics} elapsed={elapsed} />

            {/* Live transcript feed */}
            <div className="coaching-feed">
                <h3 className="coaching-feed__title">
                    <span className="coaching-feed__live-dot" />
                    Live Transcript
                </h3>
                <div className="coaching-feed__list">
                    {cues.length === 0 ? (
                        <div className="coaching-feed__empty">
                            Waiting for conversation...
                        </div>
                    ) : (
                        cues.map((cue, i) => (
                            <div
                                key={i}
                                className={`coaching-feed__item ${i === cues.length - 1 ? 'coaching-feed__item--latest' : ''}`}
                            >
                                <span className="coaching-feed__time">{formatTime(cue.timestamp)}</span>
                                <span className="coaching-feed__text">{cue.text}</span>
                            </div>
                        ))
                    )}
                    <div ref={feedEndRef} />
                </div>
            </div>

            {/* End session button */}
            <button
                className="session__end-btn"
                onClick={handleEnd}
                disabled={!isConnected || status === 'connecting'}
            >
                End Session
            </button>
        </div>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
