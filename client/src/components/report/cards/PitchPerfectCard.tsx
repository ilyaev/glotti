import { forwardRef } from 'react';
import type { SessionReport, PitchPerfectExtra } from '../../../types';
import { formatMetricValue } from '../ReportUtils.js';
import { Users, Clock, TrendingUp } from 'lucide-react';

interface CardProps {
    report: SessionReport;
    isOgImage?: boolean;
    ogBackgroundImage?: string;
}

export const PitchPerfectCard = forwardRef<HTMLDivElement, CardProps>(({ report, isOgImage, ogBackgroundImage }, ref) => {
    const { overall_score, metrics, extra, social_share_texts, improvement_tips } = report;
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
                // background: '#ffffff',
                background: isOgImage ? '#ffffff' : 'url(/cards/bg_pitch.jpg) no-repeat center center',
                backgroundSize: 'cover',
                color: '#334155', // Slate 700
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                border: '1px solid #e2e8f0', // Light slate border matching the soft card edge
                boxShadow: isOgImage ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
                borderRadius: '40px',
                overflow: 'hidden'
            }}
        >
            {/* Background Layer for Satori Data URI */}
            {isOgImage && ogBackgroundImage && (
                <img
                    src={ogBackgroundImage}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            )}

            {/* Top / Main Body Padding */}
            <div style={{ padding: '80px 80px 0 80px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '60%' }}>
                        <h1 style={{ display: 'flex', flexDirection: 'column', fontSize: '64px', fontWeight: '800', color: '#64748b', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
                            Pitch Perfect<br />Evaluation
                        </h1>
                    </div>
                    {/* <div style={{ width: '35%', textAlign: 'right', paddingTop: '16px' }}>
                        <span style={{ fontSize: '34px', color: '#94a3b8', fontWeight: 600 }}>
                            AI Partner: <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{voiceName || 'Glotti'}</span>
                        </span>
                    </div> */}
                </div>

                {/* Quote Block */}
                <div style={{
                    fontSize: '38px',
                    lineHeight: 1.4,
                    color: '#475569',
                    fontStyle: 'italic',
                    marginBottom: '40px',
                    fontWeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                    // maxWidth: '90%'
                }}>
                    {`"${summaryText}"`}
                </div>

                {/* Lower Layout - Gauge (Left) & Metrics (Right) */}
                <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between' }}>

                    {/* Visual Score Gauge (Left Side) */}
                    <div style={{ display: 'flex', position: 'relative', width: '400px', height: '400px', alignSelf: 'center', marginLeft: '20px' }}>
                        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                            <defs>
                                <linearGradient id="pitchScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    {/* Clean blue theme */}
                                    <stop offset="0%" stopColor="#2563eb" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                            <circle cx="50%" cy="50%" r="52" fill="none" stroke="#ffffff" strokeWidth="12" />
                            <circle
                                cx="50%" cy="50%" r="52"
                                fill="none"
                                stroke={isOgImage ? '#2563eb' : 'url(#pitchScoreGradient)'}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${(overall_score / 10) * 327} 327`}
                                transform="rotate(-90 60 60)"
                            />
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', color: '#0f172a' }}>
                                <div style={{ display: 'flex', fontSize: '140px', fontWeight: '800', letterSpacing: '-0.03em' }}>{overall_score}</div>
                                <div style={{ display: 'flex', fontSize: '80px', fill: '#64748b', color: '#64748b', fontWeight: 600, marginLeft: '8px' }}>/10</div>
                            </div>
                        </div>
                    </div>

                    {/* Stacked Vertical Metrics (Right Side) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '45%', gap: '40px', justifyContent: 'center', paddingRight: '20px' }}>

                        {/* Filler Words Metric */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', borderBottom: '2px solid rgba(100, 116, 139, 0.15)', paddingBottom: '24px' }}>
                            <div style={{ width: '72px', height: '72px', background: '#e0e7ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
                                <Users size={36} strokeWidth={2.5} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', fontSize: '32px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>Filler Words</div>
                                <div style={{ display: 'flex', fontSize: '48px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{formatMetricValue('total_filler_words', metricsMap['total_filler_words'])}</div>
                            </div>
                        </div>

                        {/* WPM Metric */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', borderBottom: '2px solid rgba(100, 116, 139, 0.15)', paddingBottom: '24px' }}>
                            <div style={{ width: '72px', height: '72px', background: '#e0f2fe', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
                                <Clock size={36} strokeWidth={2.5} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', fontSize: '32px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>WPM</div>
                                <div style={{ display: 'flex', fontSize: '48px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{formatMetricValue('avg_words_per_minute', metricsMap['avg_words_per_minute'])}</div>
                            </div>
                        </div>

                        {/* Investability Score Metric */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <div style={{ width: '72px', height: '72px', background: '#dcfce7', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
                                <TrendingUp size={36} strokeWidth={2.5} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', fontSize: '32px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>Investability</div>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', fontSize: '48px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
                                    {report.categories?.investment_potential?.score || 'N/A'}
                                    <span style={{ fontSize: '30px', color: '#64748b', marginLeft: '8px', fontWeight: 600 }}>/10</span>
                                </div>
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
