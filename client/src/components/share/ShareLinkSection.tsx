import { useClipboard } from '../../hooks/useClipboard';

interface Props {
    shareGatewayUrl: string;
    includeTranscript: boolean;
    onToggleTranscript: (value: boolean) => void;
}

export function ShareLinkSection({ shareGatewayUrl, includeTranscript, onToggleTranscript }: Props) {
    const { copied, copy } = useClipboard();

    return (
        <>
            <div className="share-modal__toggle-row">
                <span className="share-modal__toggle-label">Include full transcript</span>
                <label className="share-modal__switch">
                    <input
                        type="checkbox"
                        checked={includeTranscript}
                        onChange={(e) => onToggleTranscript(e.target.checked)}
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
                    onClick={() => copy(shareGatewayUrl)}
                >
                    {copied ? '✓' : 'Copy'}
                </button>
            </div>
        </>
    );
}
