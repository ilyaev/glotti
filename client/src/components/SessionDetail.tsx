import { useEffect, useState } from 'react';
import type { SessionFull } from '../types';
import { Report } from './Report';
import { navigateTo } from '../App';

interface Props {
    sessionId: string;
    userId: string;
    shareKey?: string;
    onRestart: () => void;
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

export function SessionDetail({ sessionId, userId, shareKey, onRestart }: Props) {
    const [session, setSession] = useState<SessionFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL ?? '';
        // Use share key if present (public link), otherwise fall back to own userId
        const params = shareKey
            ? `key=${encodeURIComponent(shareKey)}`
            : userId ? `userId=${encodeURIComponent(userId)}` : '';
        const url = `${apiBase}/api/sessions/${encodeURIComponent(sessionId)}${params ? `?${params}` : ''}`;

        fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(r.status === 404 ? 'Session not found' : r.status === 403 ? 'Access denied' : `Server error ${r.status}`);
                return r.json();
            })
            .then((data: SessionFull) => { setSession(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [sessionId, userId, shareKey]);

    return (
        <div className="session-detail">
            <div className={`session-detail__nav ${shareKey ? 'session-detail__nav--shared' : ''}`}>
                <div className="session-detail__nav-inner">
                    <button
                        className={`sessions-logo ${shareKey ? 'sessions-logo--shared' : ''}`}
                        onClick={() => { window.location.hash = ''; }}
                    >
                        <img className="logo-img--small" src="/glotti_logo.png" alt="Glotti" />
                    </button>
                    {!shareKey && (
                        <button className="sessions-back-btn" onClick={() => navigateTo('sessions')}>
                            ← All Sessions
                        </button>
                    )}
                    {session && !shareKey && (
                        <span className="session-detail__nav-meta">
                            {formatDateTime(session.startedAt)}
                        </span>
                    )}
                </div>
            </div>

            {loading && (
                <div className="sessions-page__state">
                    <div className="sessions-spinner" />
                    <p>Loading session…</p>
                </div>
            )}

            {error && (
                <div className="sessions-page__state sessions-page__state--error">
                    <p>{error}</p>
                    <button className="btn btn--outline" onClick={() => navigateTo('sessions')}>Back to Sessions</button>
                </div>
            )}

            {!loading && !error && session && (
                <Report
                    data={session.report}
                    transcript={session.transcript}
                    userId={userId}
                    isShared={!!shareKey}
                    onRestart={onRestart}
                />
            )}
        </div>
    );
}
