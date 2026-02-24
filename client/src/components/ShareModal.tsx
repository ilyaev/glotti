import { useState } from 'react';

interface Props {
    url: string;
    onClose: () => void;
}

export function ShareModal({ url, onClose }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="share-modal__backdrop" onClick={handleBackdrop}>
            <div className="share-modal">
                <button className="share-modal__close" onClick={onClose} aria-label="Close">✕</button>

                {/* <div className="share-modal__icon">🔗</div> */}
                <h2 className="share-modal__title">Share your report</h2>
                <p className="share-modal__subtitle">
                    Anyone with this link can view your session report.
                </p>

                {/* Link display */}
                <div className="share-modal__link-row">
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

                {/* Future social sharing buttons go here */}
                <div className="share-modal__socials" />

                <button className="share-modal__dismiss" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
