import type { SessionReport, VeritalkExtra } from '../../types';
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

export function VeritalkReport({ data, onRestart, transcript, sessionId, userId, isShared }: Props) {
    const extra = data.extra as VeritalkExtra | undefined;
    return (
        <div className="report">
            <h1 className="report__title">Debate Evaluation</h1>
            <PartnerInfo voiceName={data.voiceName} roleHint="Rhetorical Opponent" />
            {/* <p className="report__subtitle">Rhetorical Response Analysis</p> */}
            <ScoreGauge score={data.overall_score} />
            <PartnerInsightCard sessionId={sessionId} userId={userId} voiceName={data.voiceName} />
            {(extra?.strongest_moment || extra?.weakest_moment) && (
                <div className="report__highlight-row">
                    {extra.strongest_moment && (
                        <div className="report__extra-card report__extra-card--success report__extra-card--half">
                            <div className="report__extra-card-header"><h3>Strongest Moment</h3></div>
                            <div className="report__extra-card-body"><p>{extra.strongest_moment}</p></div>
                        </div>
                    )}
                    {extra.weakest_moment && (
                        <div className="report__extra-card report__extra-card--warning report__extra-card--half">
                            <div className="report__extra-card-header"><h3>Weakest Moment</h3></div>
                            <div className="report__extra-card-body"><p>{extra.weakest_moment}</p></div>
                        </div>
                    )}
                </div>
            )}
            <CategoryCards categories={data.categories} />
            <MetricsStrip metrics={data.metrics} displayMetrics={data.displayMetrics} />
            {extra?.fallacies_detected && extra.fallacies_detected.length > 0 && (
                <div className="report__extra-card report__extra-card--danger">
                    <div className="report__extra-card-header">
                        <h3>Logical Fallacies Detected</h3>
                        <span className="report__extra-badge">{extra.fallacies_detected.length}</span>
                    </div>
                    <div className="report__extra-card-body">
                        <ul className="report__fallacy-list">
                            {extra.fallacies_detected.map((f, i) => (
                                <li key={i} className="report__fallacy-item">
                                    <span className="report__fallacy-name">{f.name}</span>
                                    <span className="report__timestamp-chip">{f.timestamp}</span>
                                    <blockquote className="report__fallacy-quote">"{f.quote}"</blockquote>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {extra?.fallacies_detected?.length === 0 && (
                <div className="report__extra-card report__extra-card--success">
                    <div className="report__extra-card-header"><h3>No Logical Fallacies Detected</h3></div>
                    <div className="report__extra-card-body"><p>Clean logic throughout the debate — well done.</p></div>
                </div>
            )}
            {extra?.missed_counter_arguments && extra.missed_counter_arguments.length > 0 && (
                <div className="report__extra-card report__extra-card--info">
                    <div className="report__extra-card-header"><h3>Arguments You Missed</h3></div>
                    <div className="report__extra-card-body">
                        <p className="report__extra-hint">Angles you should have anticipated or addressed:</p>
                        <ul className="report__missed-list">
                            {extra.missed_counter_arguments.map((arg, i) => <li key={i}>{arg}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <KeyMoments moments={data.key_moments} />
            <ImprovementTips tips={data.improvement_tips} />
            <Transcript lines={transcript} aiName={data.voiceName} />
            <ReportActions onRestart={onRestart} sessionId={sessionId} userId={userId} isShared={isShared} report={data} />
        </div>
    );
}
