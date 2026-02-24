import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, Twitter, Linkedin, Facebook } from 'lucide-react';
import type { SessionReport } from '../types';
import { PerformanceCard } from './report/PerformanceCard';

interface Props {
    url: string;
    onClose: () => void;
    report?: SessionReport; // Pass report data down for the card
}

export function ShareModal({ url, onClose, report }: Props) {
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const shareText = report
        ? `Just completed a "${report.mode.replace('_', ' ')}" coaching session on Glotti! Scored ${report.overall_score}/10.`
        : "Check out this AI coaching session on Glotti.";

    const canNativeShare = Boolean(navigator.share);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleNativeShare = async () => {
        if (!canNativeShare) return;
        try {
            await navigator.share({
                title: 'Glotti Report',
                text: shareText,
                url: url
            });
        } catch (err) {
            console.error('Error sharing natively:', err);
        }
    };

    const handleDownloadCard = async () => {
        if (!cardRef.current || !report) return;
        try {
            setIsGenerating(true);
            const node = cardRef.current;
            await toPng(node, { cacheBust: true, pixelRatio: 2, skipFonts: true });
            await new Promise(r => setTimeout(r, 100));
            const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, skipFonts: true });

            const link = document.createElement('a');
            link.download = `glotti-${report.mode}-score.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setIsGenerating(false);
        }
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };
    // Generate image on mount
    useEffect(() => {
        let mounted = true;
        if (report && cardRef.current) {
            // Wait briefly for fonts/layout to settle
            setTimeout(async () => {
                try {
                    const node = cardRef.current!;
                    // iOS Safari workaround: run toPng once to prime the pump, then again for the real deal
                    await toPng(node, { cacheBust: true, pixelRatio: 2, skipFonts: true });
                    await new Promise(r => setTimeout(r, 100));
                    const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, skipFonts: true });

                    if (mounted) setPreviewUrl(dataUrl);
                } catch (err) {
                    console.error('Failed to generate preview image', err);
                }
            }, 600);
        }
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [report]);

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
                        value={url}
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
                    <div className="share-modal__card-action" style={{ width: '100%', marginTop: '24px' }}>
                        {previewUrl ? (
                            <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <img src={previewUrl} alt="Performance Card Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '16px', height: '200px', borderRadius: '12px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                Generating preview...
                            </div>
                        )}
                        <button
                            className="btn btn--outline"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={handleDownloadCard}
                            disabled={isGenerating || !previewUrl}
                        >
                            <Download size={18} />
                            {isGenerating ? 'Generating...' : 'Download'}
                        </button>
                    </div>
                )}

                {/* Social sharing buttons */}
                <div className="share-modal__socials" style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn--icon"
                        title="Share on Twitter"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <Twitter size={20} />
                    </button>
                    <button
                        className="btn btn--icon"
                        title="Share on LinkedIn"
                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')}
                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                    >
                        <Linkedin size={20} />
                    </button>
                    <button
                        className="btn btn--icon"
                        title="Share on Facebook"
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')}
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

                <button className="share-modal__dismiss" onClick={onClose} style={{ marginTop: '24px', alignSelf: 'center', padding: '12px 24px' }}>
                    Close
                </button>
            </div>

            {/* Hidden performance card for image generation */}
            {report && (
                <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', pointerEvents: 'none', zIndex: -1000 }}>
                    <PerformanceCard ref={cardRef} report={report} />
                </div>
            )}
        </div>
    );
}
