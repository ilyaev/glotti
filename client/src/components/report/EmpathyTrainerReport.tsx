import type { SessionReport, EmpathyTrainerExtra } from '../../types';
import {
    ScoreGauge, CategoryCards, MetricsStrip,
    KeyMoments, ImprovementTips, ReportActions, Transcript,
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
            <h1 className="report__title">Empathy Session Review</h1>
            <p className="report__subtitle">Difficult Conversations · Post-Session Analysis</p>
            <ScoreGauge score={data.overall_score} />
            <CategoryCards categories={data.categories} />
            <MetricsStrip metrics={data.metrics} displayMetrics={data.displayMetrics} />
            {extra?.escalation_moments && extra.escalation_moments.length > 0 && (
                <div className="report__extra-card report__extra-card--warning">
                    <div className="report__extra-card-header"><h3>Escalation Moments</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__extra-hint">Moments where the conversation escalated or your language made things worse:</p>
                        <div className="report__timestamp-chips">
                            {extra.escalation_moments.map((ts, i) => (
                                <span key={i} className="report__timestamp-chip report__timestamp-chip--warning">{ts}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <KeyMoments moments={data.key_moments} />
            {extra?.best_empathy_phrases && extra.best_empathy_phrases.length > 0 && (
                <div className="report__extra-card report__extra-card--success">
                    <div className="report__extra-card-header"><h3>Best Empathetic Phrases</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__extra-hint">Your most effective moments — use these as templates:</p>
                        <ul className="report__phrase-list">
                            {extra.best_empathy_phrases.map((phrase, i) => (
                                <li key={i} className="report__phrase-item report__phrase-item--good">"{phrase}"</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {extra?.alternative_phrases && extra.alternative_phrases.length > 0 && (
                <div className="report__extra-card report__extra-card--info">
                    <div className="report__extra-card-header"><h3>Better Alternatives</h3></div>
                    <div className="report__extra-card-body">
                        <ul className="report__phrase-list">
                            {extra.alternative_phrases.map((phrase, i) => (
                                <li key={i} className="report__phrase-item">{phrase}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            <ImprovementTips tips={data.improvement_tips} />
            <Transcript lines={transcript} />
            <ReportActions onRestart={onRestart} sessionId={sessionId} userId={userId} isShared={isShared} />
        </div>
    );
}
