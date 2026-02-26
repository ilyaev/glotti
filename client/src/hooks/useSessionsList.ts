import { useState, useEffect } from 'react';
import type { SessionSummary } from '../types';

interface UseSessionsListReturn {
    sessions: SessionSummary[];
    loading: boolean;
    error: string | null;
}

export function useSessionsList(userId: string): UseSessionsListReturn {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        
        const controller = new AbortController();
        const signal = controller.signal;
        const apiBase = import.meta.env.VITE_API_URL ?? '';
        
        setLoading(true);
        setError(null);

        fetch(`${apiBase}/api/sessions?userId=${encodeURIComponent(userId)}`, { signal })
            .then(r => {
                if (!r.ok) throw new Error(`Server error ${r.status}`);
                return r.json();
            })
            .then((data: SessionSummary[]) => {
                if (signal.aborted) return;
                setSessions(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                setError(err.message);
                setLoading(false);
            });

        return () => controller.abort();
    }, [userId]);

    return { sessions, loading, error };
}
