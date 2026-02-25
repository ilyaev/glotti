import { forwardRef } from 'react';
import type { SessionReport, PitchPerfectExtra } from '../../../types';
import { formatMetricValue } from '../ReportBase';
import { Users, Clock, FileText } from 'lucide-react';

interface CardProps {
    report: SessionReport;
}

export const PitchPerfectCard = forwardRef<HTMLDivElement, CardProps>(({ report }, ref) => {
    const { overall_score, metrics, voiceName, extra, social_share_texts, improvement_tips } = report;
    const metricsMap = metrics as unknown as Record<string, number | string>;
    const summaryText = social_share_texts?.performance_card_summary || improvement_tips[0];
    const pitchExtra = extra as unknown as PitchPerfectExtra;

    // Top right design style: White background, asymmetrical layout, clean borders
    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px',
                background: '#ffffff',
                color: '#334155', // Slate 700
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                border: '1px solid #e2e8f0', // Light slate border matching the soft card edge
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
                borderRadius: '40px',
                overflow: 'hidden'
            }}
        >
            {/* Top / Main Body Padding */}
            <div style={{ padding: '80px 80px 0 80px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div style={{ width: '60%' }}>
                        <h1 style={{ fontSize: '64px', fontWeight: '800', color: '#64748b', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
                            Pitch Perfect<br />Evaluation
                        </h1>
                    </div>
                    <div style={{ width: '35%', textAlign: 'right', paddingTop: '16px' }}>
                        <span style={{ fontSize: '34px', color: '#94a3b8', fontWeight: 600 }}>
                            AI Partner: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{voiceName || 'Glotti'}</span>
                        </span>
                    </div>
                </div>

                {/* Quote Block */}
                <div style={{
                    fontSize: '38px',
                    lineHeight: 1.4,
                    color: '#475569',
                    fontStyle: 'italic',
                    marginBottom: '40px',
                    fontWeight: 500,
                    // maxWidth: '90%'
                }}>
                    "{summaryText}"
                </div>

                {/* Lower Layout - Gauge (Left) & Metrics (Right) */}
                <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between' }}>

                    {/* Visual Score Gauge (Left Side) */}
                    <div style={{ position: 'relative', width: '400px', height: '400px', alignSelf: 'center', marginLeft: '20px' }}>
                        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                            <defs>
                                <linearGradient id="pitchScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    {/* Clean blue theme */}
                                    <stop offset="0%" stopColor="#2563eb" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                            <circle cx="50%" cy="50%" r="52" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                            <circle
                                cx="50%" cy="50%" r="52"
                                fill="none"
                                stroke="url(#pitchScoreGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${(overall_score / 10) * 327} 327`}
                                transform="rotate(-90 60 60)"
                            />
                            <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a">
                                <tspan style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-0.03em' }}>{overall_score}</tspan>
                                <tspan style={{ fontSize: '22px', fill: '#64748b', fontWeight: 600 }}>/10</tspan>
                            </text>
                        </svg>
                    </div>

                    {/* Stacked Vertical Metrics (Right Side) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '45%', gap: '40px', justifyContent: 'center', paddingRight: '20px' }}>

                        {/* Filler Words Metric */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', borderBottom: '2px solid #f1f5f9', paddingBottom: '24px' }}>
                            <div style={{ width: '72px', height: '72px', background: '#e0e7ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
                                <Users size={36} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontSize: '32px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>Filler Words</div>
                                <div style={{ fontSize: '48px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{formatMetricValue('total_filler_words', metricsMap['total_filler_words'])}</div>
                            </div>
                        </div>

                        {/* WPM Metric */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', borderBottom: '2px solid #f1f5f9', paddingBottom: '24px' }}>
                            <div style={{ width: '72px', height: '72px', background: '#e0f2fe', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
                                <Clock size={36} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontSize: '32px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>WPM</div>
                                <div style={{ fontSize: '48px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{formatMetricValue('avg_words_per_minute', metricsMap['avg_words_per_minute'])}</div>
                            </div>
                        </div>

                        {/* Structure Score Metric */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <div style={{ width: '72px', height: '72px', background: '#e0e7ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#312e81' }}>
                                <FileText size={36} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontSize: '32px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>Structure Score</div>
                                <div style={{ fontSize: '48px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{pitchExtra?.pitch_structure_score || 'N/A'}<span style={{ fontSize: '28px', color: '#64748b' }}>/10</span></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Footer Accent Bar */}
            <div style={{ display: 'flex', height: '36px', width: '100%', background: '#2563eb', marginTop: '40px' }} />
        </div>
    );
});
