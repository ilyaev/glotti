import type { SessionReport, EmpathyTrainerExtra } from '../../types';
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

export function EmpathyTrainerReport({ data, onRestart, transcript, sessionId, userId, isShared }: Props) {
    const extra = data.extra as EmpathyTrainerExtra | undefined;
    return (
        <div className="report">
            <h1 className="report__title">Empathy Evaluation</h1>
            <PartnerInfo voiceName={data.voiceName} roleHint="Emotional Sparring Partner" />
            {/* <p className="report__subtitle">Emotional Intelligence Review</p> */}
            <ScoreGauge score={data.overall_score} />
            <PartnerInsightCard sessionId={sessionId} userId={userId} voiceName={data.voiceName} />
            <CategoryCards categories={data.categories} />
            <MetricsStrip metrics={data.metrics} displayMetrics={data.displayMetrics} />
            <KeyMoments moments={data.key_moments} />

            {extra?.trigger_moments && extra.trigger_moments.length > 0 && (
                <div className="report__extra-card report__extra-card--warning">
                    <div className="report__extra-card-header"><h3>Trigger Moments</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__extra-hint">Times you escalated tension or used "corporate speak":</p>
                        <ul className="report__phrase-list">
                            {extra.trigger_moments.map((t, i) => (
                                <li key={i} className="report__phrase-item report__phrase-item--bad">
                                    <span className="report__timestamp-chip report__timestamp-chip--warning">{t.timestamp}</span>
                                    {t.reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {extra?.golden_phrases && extra.golden_phrases.length > 0 && (
                <div className="report__extra-card report__extra-card--success">
                    <div className="report__extra-card-header"><h3>Golden Phrases</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__extra-hint">Your most effective empathetic responses:</p>
                        <ul className="report__phrase-list">
                            {extra.golden_phrases.map((phrase, i) => (
                                <li key={i} className="report__phrase-item report__phrase-item--good">"{phrase}"</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            {extra?.better_alternatives && extra.better_alternatives.length > 0 && (
                <div className="report__extra-card report__extra-card--info">
                    <div className="report__extra-card-header"><h3>Better Alternatives</h3></div>
                    <div className="report__extra-card-body">
                        <ul className="report__phrase-list">
                            {extra.better_alternatives.map((phrase, i) => (
                                <li key={i} className="report__phrase-item">{phrase}</li>
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
