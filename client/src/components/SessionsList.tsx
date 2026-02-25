import { useEffect, useState } from 'react';
import type { SessionSummary } from '../types';
import { navigateTo } from '../App';
import { Target, Handshake, Swords, Zap, MessageSquareText, ChevronRight, User } from 'lucide-react';

const MODE_LABELS: Record<string, string> = {
    pitch_perfect: 'Pitch Perfect',
    empathy_trainer: 'Empathy Trainer',
    veritalk: 'Veritalk',
    impromptu: 'Impromptu',
    feedback: 'Feedback',
};

const MODE_COLORS: Record<string, string> = {
    pitch_perfect: 'badge--blue',
    empathy_trainer: 'badge--green',
    veritalk: 'badge--purple',
    impromptu: 'badge--orange',
    feedback: 'badge--gray',
};

const MODE_ICONS: Record<string, React.ReactNode> = {
    pitch_perfect: <Target size={18} />,
    empathy_trainer: <Handshake size={18} />,
    veritalk: <Swords size={18} />,
    impromptu: <Zap size={18} />,
    feedback: <MessageSquareText size={18} />,
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

    // console.log(sessions);
    if (sessions[0]) {
        sessions[0].preview_text = "I really want to improve my public speaking skills, especially for work presentations. I get really nervous and tend to rush through my slides. I want to learn how to pace myself better and engage the audience more effectively. Can you give me some tips on how to stay calm and deliver a more confident presentation?";
        sessions[0].voiceName = "Alice";
    }

    return (
        <div className="sessions-page">
            {/* Header */}
            <div className="sessions-page__header">
                <div className="sessions-page__header-inner">
                    <button className="sessions-logo" onClick={() => { window.location.hash = ''; }}>
                        <img className="logo-img--small" src="/glotti_logo.png" alt="Glotti" />
                    </button>
                    <button className="sessions-back-btn" onClick={() => { window.location.hash = ''; }}>
                        ← Back
                    </button>
                    <h1 className="sessions-page__title">Past Sessions</h1>
                    <span className="sessions-page__count">
                        {!loading && !error ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}` : ''}
                    </span>
                </div>
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
                            className="sessions-list__card"
                            onClick={() => navigateTo(`sessions/${s.id}`)}
                        >
                            <div className="sessions-list__card-main">
                                <div className="sessions-list__card-header">
                                    <div className="sessions-list__type-group">
                                        <span className={`sessions-list__icon-box ${MODE_COLORS[s.mode] ?? 'badge--blue'}`}>
                                            {MODE_ICONS[s.mode] || <MessageSquareText size={18} />}
                                        </span>
                                        <div className="sessions-list__meta">
                                            <span className="sessions-list__mode-name">{MODE_LABELS[s.mode] ?? s.mode}</span>
                                            <div className="sessions-list__details">
                                                <span className="sessions-list__date-text">{formatDate(s.startedAt)}</span>
                                                <span className="sessions-list__dot">•</span>
                                                <span className="sessions-list__time-text">{formatTime(s.startedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sessions-list__card-right">
                                        <span className="sessions-list__duration">{formatDuration(s.duration_seconds)}</span>
                                        {s.overall_score > 0 ? (
                                            <div className="sessions-list__score-pill">
                                                <span className="score-val">{s.overall_score}</span>
                                                <span className="score-label">/10</span>
                                            </div>
                                        ) : (
                                            <div className="sessions-list__score-pill sessions-list__score-pill--empty">
                                                <MessageSquareText size={14} />
                                                <span>Talk</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {s.preview_text && (
                                    <p className="sessions-list__preview">
                                        {s.preview_text}
                                    </p>
                                )}

                                <div className="sessions-list__footer">
                                    {s.voiceName && (
                                        <div className="sessions-list__voice">
                                            <User size={12} />
                                            <span>Partner: {s.voiceName}</span>
                                        </div>
                                    )}
                                    <div className="sessions-list__view-link">
                                        <span>View Report</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
