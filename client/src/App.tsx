import { useEffect, useState } from 'react';
import { ModeSelect } from './components/ModeSelect';
import { Session } from './components/Session';
import { SessionsList } from './components/SessionsList';
import { SessionDetail } from './components/SessionDetail';
import type { SessionReport } from './types';

export type Mode = 'pitch_perfect' | 'empathy_trainer' | 'veritalk' | 'impromptu';

// ─── Hash Router ──────────────────────────────────────────────────────────────

export type Route =
    | { name: 'home' }
    | { name: 'session'; mode: Mode }
    | { name: 'sessions' }
    | { name: 'session-detail'; id: string; shareKey?: string };

function parseHash(): Route {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash === 'sessions') return { name: 'sessions' };
    // Match #/sessions/:id/:key  (shareable)  or  #/sessions/:id  (owner)
    const shareMatch = hash.match(/^sessions\/([^/]+)\/([^/]+)$/);
    if (shareMatch) return { name: 'session-detail', id: shareMatch[1], shareKey: shareMatch[2] };
    const detailMatch = hash.match(/^sessions\/([^/]+)$/);
    if (detailMatch) return { name: 'session-detail', id: detailMatch[1] };
    return { name: 'home' };
}

export function navigateTo(path: string) {
    window.location.hash = path;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
    const [route, setRoute] = useState<Route>(parseHash());
    const [mode, setMode] = useState<Mode>('pitch_perfect');
    // Read userId synchronously so it's available on the very first render
    const [userId] = useState<string>(() => {
        let id = localStorage.getItem('debatepro_user_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('debatepro_user_id', id);
        }
        return id;
    });

    useEffect(() => {
        const onHash = () => setRoute(parseHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const handleStart = (selectedMode: Mode) => {
        setMode(selectedMode);
        setRoute({ name: 'session', mode: selectedMode });
    };

    const handleSessionEnd = (reportData: SessionReport) => {
        navigateTo(`sessions/${reportData.session_id}`);
    };

    const handleRestart = () => {
        window.location.hash = '';
        setRoute({ name: 'home' });
    };

    return (
        <div className="app">
            {route.name === 'home' && <ModeSelect onStart={handleStart} userId={userId} />}
            {route.name === 'session' && (
                <Session mode={mode} onEnd={handleSessionEnd} userId={userId} />
            )}
            {route.name === 'sessions' && <SessionsList userId={userId} />}
            {route.name === 'session-detail' && (
                <SessionDetail
                    sessionId={route.id}
                    userId={userId}
                    shareKey={route.shareKey}
                    onRestart={handleRestart}
                />
            )}
        </div>
    );
}
