import { useEffect, useState } from 'react';
import type { SessionSummary } from '../types';
import { navigateTo } from '../App';

const MODE_LABELS: Record<string, string> = {
    pitch_perfect: 'Pitch Perfect',
    empathy_trainer: 'Empathy Trainer',
    veritalk: 'Veritalk',
    impromptu: 'Impromptu',
};

const MODE_COLORS: Record<string, string> = {
    pitch_perfect: 'badge--blue',
    empathy_trainer: 'badge--green',
    veritalk: 'badge--purple',
    impromptu: 'badge--orange',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDuration(seconds: number): string {
    if (seconds === 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Props {
    userId: string;
}

export function SessionsList({ userId }: Props) {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        const apiBase = import.meta.env.VITE_API_URL ?? '';
        fetch(`${apiBase}/api/sessions?userId=${encodeURIComponent(userId)}`)
            .then(r => {
                if (!r.ok) throw new Error(`Server error ${r.status}`);
                return r.json();
            })
            .then((data: SessionSummary[]) => { setSessions(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [userId]);

    return (
        <div className="sessions-page">
            {/* Header */}
            <div className="sessions-page__header">
                <button className="sessions-back-btn" onClick={() => { window.location.hash = ''; }}>
                    ← Back
                </button>
                <h1 className="sessions-page__title">Past Sessions</h1>
                <span className="sessions-page__count">
                    {!loading && !error ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}` : ''}
                </span>
            </div>

            {/* States */}
            {loading && (
                <div className="sessions-page__state">
                    <div className="sessions-spinner" />
                    <p>Loading sessions…</p>
                </div>
            )}

            {error && (
                <div className="sessions-page__state sessions-page__state--error">
                    <p>Could not load sessions: {error}</p>
                    <button className="btn btn--outline" onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}

            {!loading && !error && sessions.length === 0 && (
                <div className="sessions-page__state">
                    <p className="sessions-page__empty-title">No sessions yet</p>
                    <p className="sessions-page__empty-sub">Complete a training session to see your history here.</p>
                    <button className="btn btn--primary" onClick={() => { window.location.hash = ''; }}>
                        Start a Session
                    </button>
                </div>
            )}

            {!loading && !error && sessions.length > 0 && (
                <div className="sessions-list">
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            className="sessions-list__row"
                            onClick={() => navigateTo(`sessions/${s.id}`)}
                        >
                            <div className="sessions-list__row-top">
                                <div className="sessions-list__date">
                                    <span className="sessions-list__date-day">{formatDate(s.startedAt)}</span>
                                    <span className="sessions-list__date-time">{formatTime(s.startedAt)}</span>
                                </div>
                                <div className="sessions-list__row-top-right">
                                    <span className={`sessions-list__badge ${MODE_COLORS[s.mode] ?? 'badge--blue'}`}>
                                        {MODE_LABELS[s.mode] ?? s.mode}
                                    </span>
                                    <span className="sessions-list__duration">{formatDuration(s.duration_seconds)}</span>
                                </div>
                            </div>
                            <div className="sessions-list__row-bottom">
                                <div className="sessions-list__score">
                                    <span
                                        className="sessions-list__score-value"
                                        style={{ color: s.overall_score >= 7 ? 'var(--accent-green)' : s.overall_score >= 4 ? 'var(--accent-orange)' : 'var(--accent-red)' }}
                                    >
                                        {s.overall_score > 0 ? s.overall_score : '—'}
                                    </span>
                                    {s.overall_score > 0 && <span className="sessions-list__score-denom">/10</span>}
                                </div>
                                <span className="sessions-list__arrow">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
