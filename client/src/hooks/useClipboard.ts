import { useState, useCallback } from 'react';

/**
 * Reusable clipboard copy hook with "copied" feedback state.
 * Automatically resets after the specified duration.
 */
export function useClipboard(resetMs = 2500) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
    }, [resetMs]);

    return { copied, copy } as const;
}
