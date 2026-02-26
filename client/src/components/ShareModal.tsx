import { useState } from 'react';
import { X } from 'lucide-react';
import { useShareUrls } from '../hooks/useShareUrls';
import { ShareLinkSection } from './share/ShareLinkSection';
import { ShareCardPreview } from './share/ShareCardPreview';
import { SocialPostPreview } from './share/SocialPostPreview';
import type { SessionReport } from '../types';

interface Props {
    sessionId: string;
    userId: string;
    onClose: () => void;
    report?: SessionReport;
}

export function ShareModal({ sessionId, userId, onClose, report }: Props) {
    const [includeTranscript, setIncludeTranscript] = useState(true);
    const { sessionKey, shareGatewayUrl, serverImageUrl } = useShareUrls({ sessionId, userId, includeTranscript });

    const fallbackShareText = `I just scored ${report?.overall_score}/10 on a Glotti ${report?.mode.replace('_', ' ')} session! Check out my performance:`;
    const linkedinText = report?.social_share_texts?.linkedin_template || fallbackShareText;
    const facebookText = report?.social_share_texts?.facebook_template || fallbackShareText;

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="share-modal__backdrop" onClick={handleBackdrop}>
            <div className="share-modal">
                <button className="share-modal__close" onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>

                <h2 className="share-modal__title">Share your report</h2>

                <div className="share-modal__body">
                    {report && (
                        <div className="share-modal__col-left">
                            <ShareLinkSection
                                shareGatewayUrl={shareGatewayUrl}
                                includeTranscript={includeTranscript}
                                onToggleTranscript={setIncludeTranscript}
                            />
                            <ShareCardPreview
                                serverImageUrl={serverImageUrl}
                                sessionKey={sessionKey}
                                sessionId={sessionId}
                                shareGatewayUrl={shareGatewayUrl}
                                report={report}
                            />
                        </div>
                    )}

                    <div className="share-modal__col-right">
                        {report && (
                            <div className="share-modal__social-list">
                                <SocialPostPreview
                                    platform="linkedin"
                                    postText={linkedinText}
                                    shareGatewayUrl={shareGatewayUrl}
                                />
                                <SocialPostPreview
                                    platform="facebook"
                                    postText={facebookText}
                                    shareGatewayUrl={shareGatewayUrl}
                                />
                            </div>
                        )}

                        <button className="btn btn--outline report__share-btn share-modal__close-mobile" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
