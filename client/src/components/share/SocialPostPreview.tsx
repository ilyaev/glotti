import { Linkedin, Facebook } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';

interface Props {
    platform: 'linkedin' | 'facebook';
    postText: string;
    shareGatewayUrl: string;
}

const PLATFORM_CONFIG = {
    linkedin: {
        label: 'LinkedIn Post',
        icon: Linkedin,
        shareUrl: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    facebook: {
        label: 'Facebook Post',
        icon: Facebook,
        shareUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
} as const;

export function SocialPostPreview({ platform, postText, shareGatewayUrl }: Props) {
    const { copied, copy } = useClipboard();
    const config = PLATFORM_CONFIG[platform];
    const Icon = config.icon;
    const fullText = `${postText}\n\n${shareGatewayUrl}`;

    const handleCopyAndShare = async () => {
        await copy(fullText);
        setTimeout(() => {
            window.open(config.shareUrl(shareGatewayUrl), '_blank', 'noopener,noreferrer');
        }, 500);
    };

    return (
        <div className="share-modal__social-item">
            <div className="share-modal__social-header">{config.label}</div>
            <div className="share-modal__social-box share-modal__social-box--preview">
                <div className="share-modal__post-content">
                    {postText}
                </div>
                <div className="share-modal__social-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                        className="btn btn--icon"
                        title={`Share on ${config.label.split(' ')[0]}`}
                        onClick={handleCopyAndShare}
                    >
                        <Icon size={18} />
                    </button>
                    <button
                        className={`share-modal__copy-btn ${copied ? 'share-modal__copy-btn--copied' : ''}`}
                        style={{ margin: 0 }}
                        onClick={() => copy(fullText)}
                    >
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
