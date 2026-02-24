import type { SessionReport, PitchPerfectExtra } from '../../types';
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

export function PitchPerfectReport({ data, onRestart, transcript, sessionId, userId, isShared }: Props) {
    const extra = data.extra as PitchPerfectExtra | undefined;
    return (
        <div className="report">
            <h1 className="report__title">Pitch Evaluation</h1>
            <p className="report__subtitle">Skeptical VC · Post-Session Review</p>
            <ScoreGauge score={data.overall_score} />
            {extra?.pitch_structure_score !== undefined && (
                <div className="report__extra-card report__extra-card--pitch">
                    <div className="report__extra-card-header"><h3>Pitch Structure</h3></div>
                    <div className="report__extra-card-body">
                        <div className="report__structure-gauge">
                            <div className="report__structure-gauge-fill" style={{ width: `${extra.pitch_structure_score * 10}%` }} />
                            <span className="report__structure-gauge-label">{extra.pitch_structure_score}/10</span>
                        </div>
                        <p className="report__structure-note">Problem → Solution → Market → Business Model → Ask</p>
                    </div>
                </div>
            )}
            <CategoryCards categories={data.categories} />
            <MetricsStrip metrics={data.metrics} displayMetrics={data.displayMetrics} />
            <KeyMoments moments={data.key_moments} />
            {extra?.recommended_next_step && (
                <div className="report__extra-card report__extra-card--action">
                    <div className="report__extra-card-header"><h3>Your Next Step</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__next-step">{extra.recommended_next_step}</p>
                    </div>
                </div>
            )}
            <ImprovementTips tips={data.improvement_tips} />
            <Transcript lines={transcript} />
            <ReportActions onRestart={onRestart} sessionId={sessionId} userId={userId} isShared={isShared} />
        </div>
    );
}
