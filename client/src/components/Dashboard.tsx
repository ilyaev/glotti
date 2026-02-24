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

    // Status helpers
    const getFillerClass = (val: number) => {
        if (val === 0) return 'dashboard__value--good';
        if (val <= 3) return 'dashboard__value--warn';
        return 'dashboard__value--bad';
    };

    const getWpmClass = (val: number) => {
        if (val >= 130 && val <= 170) return 'dashboard__value--good';
        if (val >= 110 && val <= 190) return 'dashboard__value--warn';
        return 'dashboard__value--bad';
    };

    const getRatioClass = (val: number) => {
        if (val >= 40 && val <= 60) return 'dashboard__value--good';
        if (val >= 30 && val <= 70) return 'dashboard__value--warn';
        return 'dashboard__value--bad';
    };

    const getClarityClass = (val: number) => {
        if (val >= 90) return 'dashboard__value--good';
        if (val >= 75) return 'dashboard__value--warn';
        return 'dashboard__value--bad';
    };

    return (
        <div className="dashboard">
            <div className="dashboard__metric">
                <span className={`dashboard__value ${getFillerClass(totalFillers)}`}>{totalFillers}</span>
                <span className="dashboard__label">Fillers</span>
            </div>
            <div className="dashboard__metric">
                <span className={`dashboard__value ${metrics ? getWpmClass(metrics.words_per_minute) : ''}`}>
                    {metrics?.words_per_minute || '—'}
                </span>
                <span className="dashboard__label">WPM</span>
            </div>
            <div className="dashboard__metric">
                <span className={`dashboard__value tone-badge ${toneClass}`}>
                    {metrics?.tone || '...'}
                </span>
                <span className="dashboard__label">Tone</span>
            </div>
            <div className="dashboard__metric">
                <span className={`dashboard__value ${metrics ? getRatioClass(metrics.talk_ratio) : ''}`}>
                    {metrics?.talk_ratio !== undefined ? `${metrics.talk_ratio}%` : '—'}
                </span>
                <span className="dashboard__label">Talk Ratio</span>
            </div>
            <div className="dashboard__metric">
                <span className={`dashboard__value ${metrics ? getClarityClass(metrics.clarity_score) : ''}`}>
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
