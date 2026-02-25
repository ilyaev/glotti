import { useState } from 'react';
import { Download, Share2, Twitter, Linkedin, Facebook } from 'lucide-react';
import type { SessionReport } from '../types';

interface Props {
    url: string;
    onClose: () => void;
    report?: SessionReport; // Pass report data down for the card
}

export function ShareModal({ url, onClose, report }: Props) {
    const [copied, setCopied] = useState(false);
    const [copiedFb, setCopiedFb] = useState(false);
    const [copiedLi, setCopiedLi] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const fallbackShareText = `I just scored ${report?.overall_score}/10 on a Glotti ${report?.mode.replace('_', ' ')} session! Check out my performance:`;
    const twitterText = report?.social_share_texts?.twitter_template || fallbackShareText;
    const linkedinText = report?.social_share_texts?.linkedin_template || fallbackShareText;
    const facebookText = report?.social_share_texts?.facebook_template || fallbackShareText;

    // Deriving server-side image URL
    // URL format expected (from React router): http://domain/#/sessions/:id/:key
    const match = url.match(/\/sessions\/(.+?)\/(.+?)(?:$|\?)/);
    const sessionId = match ? match[1] : '';
    const sessionKey = match ? match[2] : '';

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

    console.log({ twitterText, facebookText, linkedinText })

    return (
        <div className="share-modal__backdrop" onClick={handleBackdrop} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="share-modal" style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '24px', width: '100%', maxWidth: '400px' }}>
                <button className="share-modal__close" onClick={onClose} aria-label="Close">✕</button>

                {/* <div className="share-modal__icon">🔗</div> */}
                <h2 className="share-modal__title">Share your report</h2>
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
                        {copied ? '✓ Copied' : 'Copy'}
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
                        title="Share on Twitter"
                        onClick={() => {
                            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareGatewayUrl)}&text=${encodeURIComponent(twitterText)}`;
                            openShareWindow(twitterUrl);
                        }}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <Twitter size={20} />
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
                </div>

                {/* Manual Social Copy Blocks */}
                {report && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', width: '100%' }}>
                        {/* LinkedIn Post Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Linkedin size={14} /> LinkedIn Post Text
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
                                <Facebook size={14} /> Facebook Post Text
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
                        className="btn btn--outline"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '24px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, height: '48px', color: '#334155', borderColor: '#cbd5e1' }}
                        onClick={handleDownloadCard}
                        disabled={isDownloading || !serverImageUrl}
                    >
                        <Download size={18} />
                        {isDownloading ? 'Downloading...' : 'Download Image'}
                    </button>

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
