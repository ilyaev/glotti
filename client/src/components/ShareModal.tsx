import { useState, useEffect } from 'react';
import { Download, Share2, Linkedin, Facebook, X } from 'lucide-react';
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
    const apiOrigin = cleanApiUrl || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : window.location.origin);

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
        <div className="share-modal__backdrop" onClick={handleBackdrop}>
            <div className="share-modal">
                <button className="share-modal__close" onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>

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

                <div className="share-modal__link-row">
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

                {report && (
                    <div className="share-modal__card-preview">
                        {serverImageUrl ? (
                            <img src={serverImageUrl} alt="Performance Card Preview" width={400} height={400} />
                        ) : (
                            <div className="share-modal__preview-placeholder">
                                {sessionId && !sessionKey ? 'Generating preview...' : 'Preview unavailable'}
                            </div>
                        )}
                    </div>
                )}

                <div className="share-modal__socials">
                    <button
                        className="btn btn--icon"
                        title="Share on X"
                        onClick={() => {
                            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareGatewayUrl)}&text=${encodeURIComponent(twitterText)}`;
                            openShareWindow(twitterUrl);
                        }}
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
                    >
                        <Facebook size={20} />
                    </button>
                    {canNativeShare && (
                        <button
                            className="btn btn--icon"
                            title="Share via device..."
                            onClick={handleNativeShare}
                        >
                            <Share2 size={20} />
                        </button>
                    )}
                    <button
                        className="btn btn--icon"
                        title="Download Image"
                        onClick={handleDownloadCard}
                        disabled={isDownloading || !serverImageUrl}
                    >
                        <Download size={20} />
                    </button>
                </div>

                {report && (
                    <div className="share-modal__social-list">
                        <div className="share-modal__social-item">
                            <div className="share-modal__social-header">LinkedIn Post Text</div>
                            <div className="share-modal__social-box">
                                <textarea
                                    className="share-modal__social-textarea"
                                    value={`${linkedinText}\n\n${shareGatewayUrl}`}
                                    readOnly
                                    onFocus={e => e.target.select()}
                                />
                                <button
                                    className={`share-modal__copy-btn share-modal__social-copy ${copiedLi ? 'share-modal__copy-btn--copied' : ''}`}
                                    onClick={() => handleCopySocial(`${linkedinText}\n\n${shareGatewayUrl}`, 'li')}
                                >
                                    {copiedLi ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="share-modal__social-item">
                            <div className="share-modal__social-header">Facebook Post Text</div>
                            <div className="share-modal__social-box">
                                <textarea
                                    className="share-modal__social-textarea"
                                    value={`${facebookText}\n\n${shareGatewayUrl}`}
                                    readOnly
                                    onFocus={e => e.target.select()}
                                />
                                <button
                                    className={`share-modal__copy-btn share-modal__social-copy ${copiedFb ? 'share-modal__copy-btn--copied' : ''}`}
                                    onClick={() => handleCopySocial(`${facebookText}\n\n${shareGatewayUrl}`, 'fb')}
                                >
                                    {copiedFb ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button className="share-modal__dismiss" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
