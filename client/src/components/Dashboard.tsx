import type { MetricSnapshot } from '../types';
import { Lightbulb } from 'lucide-react';

interface Props {
    metrics: MetricSnapshot | null;
    elapsed: number;
}

export function Dashboard({ metrics }: Props) {
    const totalFillers = metrics
        ? Object.values(metrics.filler_words).reduce((a, b) => a + b, 0)
        : 0;

    const toneClass = metrics?.tone && metrics.tone !== 'Neutral'
        ? `tone-badge--active`
        : 'tone-badge--neutral';

    return (
        <div className="dashboard">
            <div className="dashboard__metric">
                <span className="dashboard__value">{totalFillers}</span>
                <span className="dashboard__label">Fillers</span>
            </div>
            <div className="dashboard__metric">
                <span className="dashboard__value">
                    {metrics?.words_per_minute || '—'}
                </span>
                <span className="dashboard__label">WPM</span>
            </div>
            <div className="dashboard__metric">
                <span className={`tone-badge ${toneClass}`}>
                    {metrics?.tone || 'Listening...'}
                </span>
                <span className="dashboard__label">Tone</span>
            </div>
            <div className="dashboard__metric">
                <span className="dashboard__value">
                    {metrics?.talk_ratio !== undefined ? `${metrics.talk_ratio}%` : '—'}
                </span>
                <span className="dashboard__label">Talk Ratio</span>
            </div>
            <div className="dashboard__metric">
                <span className="dashboard__value">
                    {metrics?.clarity_score || '—'}
                </span>
                <span className="dashboard__label">Clarity</span>
            </div>
            {metrics?.improvement_hint && (
                <div className="dashboard__hint">
                    <Lightbulb size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    {metrics.improvement_hint}
                </div>
            )}
        </div>
    );
}
