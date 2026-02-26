import { useState, useEffect, useMemo } from 'react';

interface UseShareUrlsOptions {
    sessionId: string;
    userId: string;
    includeTranscript: boolean;
}

interface ShareUrls {
    sessionKey: string;
    shareGatewayUrl: string;
    serverImageUrl: string | null;
}

export function useShareUrls({ sessionId, userId, includeTranscript }: UseShareUrlsOptions): ShareUrls {
    const [sessionKey, setSessionKey] = useState('');

    useEffect(() => {
        import('../utils/shareKey').then(({ generateShareKey }) => {
            generateShareKey(sessionId, userId, includeTranscript).then(setSessionKey);
        });
    }, [sessionId, userId, includeTranscript]);

    const apiOrigin = useMemo(() => {
        const rawApiUrl = import.meta.env.VITE_API_URL;
        const cleanApiUrl = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : null;
        return cleanApiUrl || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : window.location.origin);
    }, []);

    const serverImageUrl = useMemo(() => {
        if (!sessionId || !sessionKey) return null;
        return `${apiOrigin}/api/sessions/shared/og-image/${sessionId}/${sessionKey}`;
    }, [apiOrigin, sessionId, sessionKey]);

    const shareGatewayUrl = useMemo(() => {
        if (!sessionId || !sessionKey) {
            return `${window.location.origin}${window.location.pathname}#/sessions/${sessionId}/`;
        }
        const isLocalhost = window.location.hostname === 'localhost';
        return isLocalhost
            ? `${apiOrigin}/api/sessions/shared/og/${sessionId}/${sessionKey}`
            : `${window.location.origin}/sessiong/${sessionId}/${sessionKey}`;
    }, [apiOrigin, sessionId, sessionKey]);

    return { sessionKey, shareGatewayUrl, serverImageUrl };
}
