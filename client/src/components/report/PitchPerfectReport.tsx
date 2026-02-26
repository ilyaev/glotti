import type { SessionReport, PitchPerfectExtra } from '../../types';
import {
    ScoreGauge, CategoryCards, MetricsStrip,
    KeyMoments, ImprovementTips, ReportActions, Transcript,
    PartnerInfo, PartnerInsightCard
} from './ReportBase';

interface Props {
    data: SessionReport;
    onRestart: () => void;
    transcript?: string[];
    sessionId?: string;
    userId?: string;
    isShared?: boolean;
}

export function PitchPerfectReport({ data, onRestart, transcript, sessionId, userId, isShared }: Props) {
    const extra = data.extra as PitchPerfectExtra | undefined;
    return (
        <div className="report">
            <h1 className="report__title">Pitch Evaluation</h1>
            <PartnerInfo voiceName={data.voiceName} roleHint="Skeptical VC" />
            {/* <p className="report__subtitle">Post-Session Evaluation</p> */}
            <ScoreGauge score={data.overall_score} />
            <PartnerInsightCard sessionId={sessionId} userId={userId} voiceName={data.voiceName} />
            
            {extra && (
                <div className="report__grid-row">
                    <div className="report__extra-card report__extra-card--investment">
                        <div className="report__extra-card-header"><h3>Strongest Asset</h3></div>
                        <div className="report__extra-card-body">
                            <p className="report__asset-text report__asset-text--strong">{extra.strongest_asset}</p>
                        </div>
                    </div>
                    <div className="report__extra-card report__extra-card--investment">
                        <div className="report__extra-card-header"><h3>Weakest Link</h3></div>
                        <div className="report__extra-card-body">
                            <p className="report__asset-text report__asset-text--weak">{extra.weakest_link}</p>
                        </div>
                    </div>
                </div>
            )}

            <CategoryCards categories={data.categories} />
            <MetricsStrip metrics={data.metrics} displayMetrics={data.displayMetrics} />
            <KeyMoments moments={data.key_moments} />

            {extra?.specific_fixes && extra.specific_fixes.length > 0 && (
                <div className="report__extra-card report__extra-card--action">
                    <div className="report__extra-card-header"><h3>Specific Fixes for Your Deck</h3></div>
                    <div className="report__extra-card-body">
                        <ul className="report__fixes-list">
                            {extra.specific_fixes.map((fix, i) => (
                                <li key={i} className="report__fix-item">{fix}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            <ImprovementTips tips={data.improvement_tips} />
            <Transcript lines={transcript} aiName={data.voiceName} />
            <ReportActions onRestart={onRestart} sessionId={sessionId} userId={userId} isShared={isShared} report={data} />
        </div>
    );
}
