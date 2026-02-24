// ─── Share key ─────────────────────────────────────────────────────────────────
// Derives a 24-char hex key from SHA-256(sessionId + userId).
// Uses the Web Crypto API so it works in any browser without a bundled library.

export async function generateShareKey(sessionId: string, userId: string): Promise<string> {
    const data = new TextEncoder().encode(sessionId + userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
