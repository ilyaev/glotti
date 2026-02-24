import { forwardRef } from 'react';
import type { SessionReport } from '../../types';
import { METRIC_LABELS, formatMetricValue } from './ReportBase';

interface PerformanceCardProps {
    report: SessionReport;
}

export const PerformanceCard = forwardRef<HTMLDivElement, PerformanceCardProps>(({ report }, ref) => {
    const { mode, overall_score, metrics, displayMetrics, voiceName } = report;

    // Format the mode string nicely
    const modeLabel = mode.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Get the top 2 metrics to display
    const keys = displayMetrics ?? ['total_filler_words', 'avg_words_per_minute'];
    const topMetrics = keys.slice(0, 2);
    const metricsMap = metrics as unknown as Record<string, number | string>;

    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px', // Square for social feeds
                background: '#fdfbf7', // Light organic theme
                color: '#2d3748',
                padding: '80px',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            {/* Header */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#2d3748' }}>{modeLabel} Evaluation</span>
                </div>
                {/* Subheader */}
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '24px', color: '#a0aec0', fontWeight: 500 }}>
                    AI Partner: <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{voiceName || 'Glotti'}</span>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
                {/* Visual Score Gauge representation */}
                <div style={{ position: 'relative', width: '320px', height: '320px', marginTop: '20px' }}>
                    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                        <defs>
                            <linearGradient id="scoreGradientCard" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#4f8cff" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <circle cx="50%" cy="50%" r="52" fill="none" stroke="rgba(45, 55, 72, 0.08)" strokeWidth="8" />
                        <circle
                            cx="50%" cy="50%" r="52"
                            fill="none"
                            stroke="url(#scoreGradientCard)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(overall_score / 10) * 327} 327`}
                            transform="rotate(-90 60 60)"
                        />
                        <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#2d3748">
                            <tspan style={{ fontSize: '38px', fontWeight: 'bold' }}>{overall_score}</tspan>
                            <tspan style={{ fontSize: '18px', fill: '#718096' }}> / 10</tspan>
                        </text>
                    </svg>
                    <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '20px', color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Overall Score
                    </div>
                </div>

                {/* Metrics & Highlights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                    {report.improvement_tips[0] && (
                        <div style={{
                            fontSize: '28px', lineHeight: '1.4', color: '#2d3748', borderLeft: '6px solid #5b8782',
                            paddingLeft: '24px', fontStyle: 'italic', background: 'rgba(255,255,255,0.6)',
                            padding: '24px 24px 24px 32px', borderRadius: '16px', border: '1px solid rgba(45,55,72,0.1)',
                            fontWeight: 500
                        }}>
                            "{report.improvement_tips[0]}"
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                        {topMetrics.map(key => (
                            <div key={key} style={{ background: '#ffffff', border: '1px solid rgba(45, 55, 72, 0.1)', padding: '28px', borderRadius: '24px', flex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: '20px', color: '#2d3748', fontWeight: 700, marginBottom: '16px' }}>
                                    {METRIC_LABELS[key] ?? key}
                                </div>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#cc5b5b' }}>
                                    {formatMetricValue(key, metricsMap[key] ?? '—')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '40px', paddingBottom: '20px' }}>
                <div style={{ fontSize: '32px', color: '#5b8782', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    glotti.app
                </div>
            </div>
        </div>
    );
});
