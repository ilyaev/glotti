import { navigateTo } from '../App';
import { ArrowLeft, MessageSquareDashed } from 'lucide-react';
import { FullscreenLoader } from './FullscreenLoader';
import { useSessionsList } from '../hooks/useSessionsList';
import { SessionCard } from './SessionCard';

interface Props {
    userId: string;
}

export function SessionsList({ userId }: Props) {
    const { sessions, loading, error } = useSessionsList(userId);

    return (
        <div className="sessions-page">
            {/* Header */}
            <div className="sessions-page__header">
                <div className="sessions-page__header-inner">
                    <button className="sessions-logo" onClick={() => { window.location.hash = ''; }}>
                        <img className="logo-img--small" src="/glotti_logo.png" alt="Glotti" />
                    </button>
                    <button className="sessions-back-btn" onClick={() => { window.location.hash = ''; }}>
                        <ArrowLeft size={16} /> <span>Back</span>
                    </button>
                    <h1 className="sessions-page__title">Past Sessions</h1>
                    <span className="sessions-page__count">
                        {!loading && !error ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}` : ''}
                    </span>
                </div>
            </div>

            {/* States */}
            {loading && (
                <FullscreenLoader message="Loading sessions..." />
            )}

            {error && (
                <div className="sessions-page__state sessions-page__state--error">
                    <p>Could not load sessions: {error}</p>
                    <button className="btn btn--outline" onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}

            {!loading && !error && sessions.length === 0 && (
                <div className="sessions-page__state sessions-page__state--empty">
                    <div className="sessions-page__empty-icon">
                        <MessageSquareDashed size={48} strokeWidth={1.5} />
                    </div>
                    <h2 className="sessions-page__empty-title">No sessions yet</h2>
                    <p className="sessions-page__empty-sub">Complete a training session to see your history here.</p>
                    <button className="btn btn--primary" onClick={() => { window.location.hash = ''; }}>
                        Start a Session
                    </button>
                </div>
            )}

            {!loading && !error && sessions.length > 0 && (
                <div className="sessions-list">
                    {sessions.map(s => (
                        <SessionCard 
                            key={s.id} 
                            session={s} 
                            onClick={() => navigateTo(`sessions/${s.id}`)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
