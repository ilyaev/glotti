import { useState, useEffect } from 'react';
import { Download, Share2, Linkedin, Facebook } from 'lucide-react';
import type { SessionReport } from '../types';

interface Props {
    sessionId: string;
    userId: string;
    onClose: () => void;
    report?: SessionReport; // Pass report data down for the card
}

const XIcon = ({ size = 20 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
    </svg>
);

export function ShareModal({ sessionId, userId, onClose, report }: Props) {
    const [copied, setCopied] = useState(false);
    const [copiedFb, setCopiedFb] = useState(false);
    const [copiedLi, setCopiedLi] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [includeTranscript, setIncludeTranscript] = useState(true);
    const [sessionKey, setSessionKey] = useState<string>('');

    // Key generation sync
    useEffect(() => {
        import('../utils/shareKey').then(({ generateShareKey }) => {
            generateShareKey(sessionId, userId, includeTranscript).then(setSessionKey);
        });
    }, [sessionId, userId, includeTranscript]);

    const url = `${window.location.origin}${window.location.pathname}#/sessions/${sessionId}/${sessionKey}`;

    const fallbackShareText = `I just scored ${report?.overall_score}/10 on a Glotti ${report?.mode.replace('_', ' ')} session! Check out my performance:`;
    const twitterText = report?.social_share_texts?.twitter_template || fallbackShareText;
    const linkedinText = report?.social_share_texts?.linkedin_template || fallbackShareText;
    const facebookText = report?.social_share_texts?.facebook_template || fallbackShareText;

    // Safety check: prioritize VITE_API_URL for production (Cloud Run), fallback to local 8080 for dev, else use origin.
    // Ensure we remove any trailing slashes from the environment variable if present.
    const rawApiUrl = import.meta.env.VITE_API_URL;
    const cleanApiUrl = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : null;
    const apiOrigin = cleanApiUrl || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : window.location.origin);

    // Construct the canonical server-side OG image URL
    const serverImageUrl = sessionId && sessionKey ? `${apiOrigin}/api/sessions/shared/og-image/${sessionId}/${sessionKey}` : null;

    // Construct the actual redirect gateway URL that users should visit
    const isLocalhost = window.location.hostname === 'localhost';
    const shareGatewayUrl = sessionId && sessionKey
        ? (isLocalhost
            ? `${apiOrigin}/api/sessions/shared/og/${sessionId}/${sessionKey}`
            : `${window.location.origin}/sessiong/${sessionId}/${sessionKey}`)
        : url;

    const canNativeShare = Boolean(navigator.share);

    const openShareWindow = (targetUrl: string) => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareGatewayUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleCopySocial = async (text: string, type: 'fb' | 'li') => {
        await navigator.clipboard.writeText(text);
        if (type === 'fb') {
            setCopiedFb(true);
            setTimeout(() => setCopiedFb(false), 2500);
        } else {
            setCopiedLi(true);
            setTimeout(() => setCopiedLi(false), 2500);
        }
    };

    const handleNativeShare = async () => {
        if (!canNativeShare) return;
        try {
            await navigator.share({
                title: 'Glotti Report',
                text: fallbackShareText,
                url: shareGatewayUrl
            });
        } catch (err) {
            console.error('Error sharing natively:', err);
        }
    };

    const handleDownloadCard = async () => {
        if (!serverImageUrl || !report) return;
        try {
            setIsDownloading(true);
            const response = await fetch(serverImageUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `glotti-${report.mode}-score.png`;
            link.href = downloadUrl;
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Failed to download image', err);
        } finally {
            setIsDownloading(false);
        }
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };
    // Removed client-side html-to-image effect

    return (
        <div className="share-modal__backdrop" onClick={handleBackdrop} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="share-modal" style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '24px', width: '100%', maxWidth: '400px' }}>
                <button className="share-modal__close" onClick={onClose} aria-label="Close">✕</button>

                {/* <div className="share-modal__icon">🔗</div> */}
                <h2 className="share-modal__title">Share your report</h2>

                <div className="share-modal__toggle-row">
                    <span className="share-modal__toggle-label">Include full transcript</span>
                    <label className="share-modal__switch">
                        <input
                            type="checkbox"
                            checked={includeTranscript}
                            onChange={(e) => setIncludeTranscript(e.target.checked)}
                        />
                        <span className="share-modal__switch-slider"></span>
                    </label>
                </div>

                <p className="share-modal__subtitle">
                    Anyone with this link can view your session report.
                </p>
                {/* Link display */}
                <div className="share-modal__link-row" style={{ alignSelf: 'stretch' }}>
                    <input
                        className="share-modal__link-input"
                        value={shareGatewayUrl}
                        readOnly
                        onFocus={e => e.target.select()}
                    />
                    <button
                        className={`share-modal__copy-btn ${copied ? 'share-modal__copy-btn--copied' : ''}`}
                        onClick={handleCopy}
                    >
                        {copied ? '✓' : 'Copy'}
                    </button>
                </div>

                {/* Performance Card Download */}
                {report && (
                    <div className="share-modal__card-action" style={{ width: '100%', marginTop: '0px' }}>
                        {serverImageUrl ? (
                            <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <img src={serverImageUrl} alt="Performance Card Preview" width={400} height={400} style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '16px', height: '200px', borderRadius: '12px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                Preview unavailable
                            </div>
                        )}

                    </div>
                )}

                {/* Social sharing buttons */}
                <div className="share-modal__socials" style={{ display: 'flex', gap: '12px', marginTop: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn--icon"
                        title="Share on X"
                        onClick={() => {
                            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareGatewayUrl)}&text=${encodeURIComponent(twitterText)}`;
                            openShareWindow(twitterUrl);
                        }}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <XIcon size={18} />
                    </button>
                    <button
                        className="btn btn--icon"
                        title="Share on LinkedIn"
                        onClick={() => {
                            const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareGatewayUrl)}`;
                            openShareWindow(linkedinUrl);
                        }}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <Linkedin size={20} />
                    </button>
                    <button
                        className="btn btn--icon"
                        title="Share on Facebook"
                        onClick={() => {
                            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareGatewayUrl)}`;
                            openShareWindow(facebookUrl);
                        }}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <Facebook size={20} />
                    </button>
                    {canNativeShare && (
                        <button
                            className="btn btn--icon"
                            title="Share via device..."
                            onClick={handleNativeShare}
                            style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                        >
                            <Share2 size={20} />
                        </button>
                    )}
                    <button
                        className="btn btn--icon"
                        title="Download Image"
                        onClick={handleDownloadCard}
                        disabled={isDownloading || !serverImageUrl}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <Download size={20} />
                    </button>
                </div>

                {/* Manual Social Copy Blocks */}
                {report && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', width: '100%' }}>
                        {/* LinkedIn Post Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                LinkedIn Post Text
                            </div>
                            <div className="share-modal__link-row" style={{ alignSelf: 'stretch', background: '#f8fafc', borderRadius: '8px', padding: '1px' }}>
                                <textarea
                                    className="share-modal__link-input"
                                    value={`${linkedinText}\n\n${shareGatewayUrl}`}
                                    readOnly
                                    onFocus={e => e.target.select()}
                                    style={{ background: 'transparent', border: 'none', resize: 'vertical', minHeight: '80px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.4 }}
                                />
                                <button
                                    className={`share-modal__copy-btn ${copiedLi ? 'share-modal__copy-btn--copied' : ''}`}
                                    onClick={() => handleCopySocial(`${linkedinText}\n\n${shareGatewayUrl}`, 'li')}
                                    style={{ alignSelf: 'flex-start', margin: '4px' }}
                                >
                                    {copiedLi ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Facebook Post Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Facebook Post Text
                            </div>
                            <div className="share-modal__link-row" style={{ alignSelf: 'stretch', background: '#f8fafc', borderRadius: '8px', padding: '1px' }}>
                                <textarea
                                    className="share-modal__link-input"
                                    value={`${facebookText}\n\n${shareGatewayUrl}`}
                                    readOnly
                                    onFocus={e => e.target.select()}
                                    style={{ background: 'transparent', border: 'none', resize: 'vertical', minHeight: '80px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.4 }}
                                />
                                <button
                                    className={`share-modal__copy-btn ${copiedFb ? 'share-modal__copy-btn--copied' : ''}`}
                                    onClick={() => handleCopySocial(`${facebookText}\n\n${shareGatewayUrl}`, 'fb')}
                                    style={{ alignSelf: 'flex-start', margin: '4px' }}
                                >
                                    {copiedFb ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primary Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', width: '100%' }}>


                    <button
                        className="share-modal__dismiss"
                        onClick={onClose}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', padding: '12px 24px', borderRadius: '24px', fontSize: '15px', fontWeight: 600, height: '48px', color: '#64748b', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
