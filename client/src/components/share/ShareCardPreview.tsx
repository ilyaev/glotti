import { useState, useCallback } from 'react';
import { Download, Share2 } from 'lucide-react';
import { XIcon } from './XIcon';
import type { SessionReport } from '../../types';

interface Props {
    serverImageUrl: string | null;
    sessionKey: string;
    sessionId: string;
    shareGatewayUrl: string;
    report: SessionReport;
}

export function ShareCardPreview({ serverImageUrl, sessionKey, sessionId, shareGatewayUrl, report }: Props) {
    const [isDownloading, setIsDownloading] = useState(false);
    const canNativeShare = Boolean(navigator.share);

    const twitterText = report.social_share_texts?.twitter_template
        || `I just scored ${report.overall_score}/10 on a Glotti ${report.mode.replace('_', ' ')} session! Check out my performance:`;

    const handleNativeShare = useCallback(async () => {
        if (!canNativeShare) return;
        try {
            await navigator.share({
                title: 'Glotti Report',
                text: `I just scored ${report.overall_score}/10 on a Glotti ${report.mode.replace('_', ' ')} session! Check out my performance:`,
                url: shareGatewayUrl
            });
        } catch (err) {
            console.error('Error sharing natively:', err);
        }
    }, [canNativeShare, report, shareGatewayUrl]);

    const handleDownloadCard = useCallback(async () => {
        if (!serverImageUrl) return;
        try {
            setIsDownloading(true);
            const response = await fetch(serverImageUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = `glotti-${report.mode}-score.png`;
            link.href = downloadUrl;
            link.click();

            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Failed to download image', err);
        } finally {
            setIsDownloading(false);
        }
    }, [serverImageUrl, report.mode]);

    return (
        <>
            <div className="share-modal__card-preview">
                {serverImageUrl ? (
                    <img src={serverImageUrl} alt="Performance Card Preview" style={{ width: '90%', paddingTop: '20px', paddingBottom: '20px' }} />
                ) : (
                    <div className="share-modal__preview-placeholder">
                        {sessionId && !sessionKey ? 'Generating preview...' : 'Preview unavailable'}
                    </div>
                )}
            </div>

            <div className="share-modal__socials">
                {canNativeShare && (
                    <button className="btn btn--icon" title="Share via device..." onClick={handleNativeShare}>
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
                <button
                    className="btn btn--icon"
                    title="Share on X"
                    onClick={() => {
                        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareGatewayUrl)}&text=${encodeURIComponent(twitterText)}`;
                        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
                    }}
                >
                    <XIcon size={18} />
                </button>
            </div>
        </>
    );
}
