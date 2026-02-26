import { useEffect, useState, useRef, useCallback } from 'react';
import { useSessionLogic } from '../hooks/useSessionLogic';
import { Dashboard } from './Dashboard';
import { Waveform } from './Waveform';
import { SessionTopbar } from './session/SessionTopbar';
import { SessionEndingOverlay } from './session/SessionEndingOverlay';
import { CongratulationsOverlay } from './session/CongratulationsOverlay';
import type { CelebrationVariant } from './session/CongratulationsOverlay';
import { SessionStatusDisplay } from './session/SessionStatusDisplay';
import { TranscriptFeed } from './session/TranscriptFeed';
import type { SessionReport } from '../types';

const MILESTONE_THRESHOLDS = [5, 10, 25, 50, 100];

interface Props {
    mode: string;
    userId: string;
    onEnd: (report: SessionReport) => void;
}

export function Session({ mode, userId, onEnd }: Props) {
    const [celebration, setCelebration] = useState<CelebrationVariant | null>(null);
    const pendingReportRef = useRef<SessionReport | null>(null);
    const celebrationCheckedRef = useRef(false);

    // Wrap onEnd to intercept report for high-score check
    const handleReportReceived = useCallback((report: SessionReport) => {
        // If already celebrating (first_session/milestone), stash the report
        if (celebration) {
            pendingReportRef.current = report;
            return;
        }
        // Check for high score celebration
        if (report.overall_score >= 80) {
            setCelebration({ kind: 'high_score', score: report.overall_score });
            pendingReportRef.current = report;
            return;
        }
        onEnd(report);
    }, [celebration, onEnd]);

    const {
        status, metrics, cues, elapsed,
        isConnected, handleEnd,
        userAnalyserRef, aiAnalyserRef, feedEndRef,
    } = useSessionLogic(mode, userId, handleReportReceived);

    // When entering 'ending', check for first_session / milestone
    useEffect(() => {
        if (status !== 'ending' || celebrationCheckedRef.current) return;
        celebrationCheckedRef.current = true;

        // First session check
        const celebrated = localStorage.getItem('glotti_first_session_celebrated');
        if (!celebrated) {
            setCelebration({ kind: 'first_session' });
            return;
        }

        // Milestone check — fetch session count
        const apiBase = import.meta.env.VITE_API_URL ?? '';
        fetch(`${apiBase}/api/sessions?userId=${encodeURIComponent(userId)}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: unknown[]) => {
                // +1 because current session isn't saved yet
                const nextCount = data.length + 1;
                if (MILESTONE_THRESHOLDS.includes(nextCount)) {
                    setCelebration({ kind: 'milestone', count: nextCount });
                }
            })
            .catch(() => { /* silently ignore — no celebration on error */ });
    }, [status, userId]);

    const handleCelebrationComplete = useCallback(() => {
        setCelebration(null);
        const pending = pendingReportRef.current;
        if (pending) {
            pendingReportRef.current = null;
            onEnd(pending);
        }
    }, [onEnd]);

    // Show celebration overlay
    if (celebration) {
        return (
            <CongratulationsOverlay
                mode={mode}
                variant={celebration}
                onComplete={handleCelebrationComplete}
            />
        );
    }

    if (status === 'ending') {
        return <SessionEndingOverlay mode={mode} elapsed={elapsed} />;
    }

    return (
        <div className="session">
            <SessionTopbar mode={mode} elapsed={elapsed} />
            <SessionStatusDisplay status={status} />

            <Waveform
                userAnalyserRef={userAnalyserRef}
                aiAnalyserRef={aiAnalyserRef}
                status={status}
                mode={mode}
            />

            <Dashboard metrics={metrics} elapsed={elapsed} />
            <TranscriptFeed cues={cues} feedEndRef={feedEndRef} />

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
