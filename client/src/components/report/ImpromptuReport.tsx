import type { SessionReport, ImpromptuExtra } from '../../types';
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

export function ImpromptuReport({ data, onRestart, transcript, sessionId, userId, isShared }: Props) {
    const extra = data.extra as ImpromptuExtra | undefined;
    return (
        <div className="report">
            <h1 className="report__title">Impromptu Evaluation</h1>
            <PartnerInfo voiceName={data.voiceName} roleHint="Improv Coach" />
            {/* <p className="report__subtitle">Spontaneous Speaking Debrief</p> */}
            {extra?.assigned_topic && (
                <div className="report__topic-banner">
                    <span className="report__topic-label">Your Topic Was</span>
                    <p className="report__topic-text">"{extra.assigned_topic}"</p>
                </div>
            )}
            <ScoreGauge score={data.overall_score} />
            <PartnerInsightCard sessionId={sessionId} userId={userId} voiceName={data.voiceName} />
            <CategoryCards categories={data.categories} />
            <MetricsStrip metrics={data.metrics} displayMetrics={data.displayMetrics} />
            {extra?.silence_gaps_seconds !== undefined && extra.silence_gaps_seconds > 0 && (
                <div className="report__extra-card report__extra-card--info">
                    <div className="report__extra-card-header"><h3>Hesitation Time</h3></div>
                    <div className="report__extra-card-body">
                        <p>
                            You spent approximately <strong>{extra.silence_gaps_seconds}s</strong> in silence or searching for words.
                            Work on replacing pauses with deliberate filler-free bridges like "Here's why..." or "Let me put it this way..."
                        </p>
                    </div>
                </div>
            )}
            {extra?.best_moment_quote && (
                <div className="report__extra-card report__extra-card--success">
                    <div className="report__extra-card-header"><h3>Best Moment</h3></div>
                    <div className="report__extra-card-body">
                        <blockquote className="report__best-quote">"{extra.best_moment_quote}"</blockquote>
                    </div>
                </div>
            )}
            <KeyMoments moments={data.key_moments} />
            {extra?.next_challenge && (
                <div className="report__extra-card report__extra-card--action">
                    <div className="report__extra-card-header"><h3>Next Challenge</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__next-step">{extra.next_challenge}</p>
                    </div>
                </div>
            )}
            <ImprovementTips tips={data.improvement_tips} />
            <Transcript lines={transcript} aiName={data.voiceName} />
            <ReportActions onRestart={onRestart} sessionId={sessionId} userId={userId} isShared={isShared} />
        </div>
    );
}
