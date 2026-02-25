import { forwardRef } from 'react';
import type { SessionReport, VeritalkExtra } from '../../../types';
import { METRIC_LABELS, formatMetricValue } from '../ReportUtils.js';

interface CardProps {
    report: SessionReport;
    isOgImage?: boolean;
    ogBackgroundImage?: string;
}

export const VeritalkCard = forwardRef<HTMLDivElement, CardProps>(({ report, isOgImage, ogBackgroundImage }, ref) => {
    const { overall_score, metrics, extra, social_share_texts, improvement_tips } = report;
    const metricsMap = metrics as unknown as Record<string, number | string>;
    const summaryText = social_share_texts?.performance_card_summary || improvement_tips[0];
    const veritalkExtra = extra as unknown as VeritalkExtra;

    // Top left design style from Image 1: Prestigious Royal Blue & Gold, formal debate aesthetic
    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px',
                background: isOgImage ? '#111827' : 'linear-gradient(180deg, #111827 0%, #172554 100%)', // Very dark slate to deep royal blue
                // background: 'url(/cards/bg_veritalk.jpg) no-repeat center center',
                backgroundSize: 'cover',
                color: '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                borderRadius: '40px',
                ...(isOgImage ? {} : { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }),
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

            {/* Inner Gold Border Container */}
            <div style={{
                flex: 1,
                border: '3px solid #fbbf24', // Gold border
                borderRadius: '24px',
                padding: '56px 80px',
                margin: '28px', // Added margin instead of root padding
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                ...(isOgImage ? {} : { boxShadow: 'inset 0 0 40px rgba(251, 191, 36, 0.05)' })
            }}>

                {/* Title */}
                <h1 style={{ display: 'flex', fontSize: '48px', fontWeight: '800', margin: 0, letterSpacing: '0.08em', color: '#fbbf24', ...(isOgImage ? {} : { textShadow: '0 4px 12px rgba(251, 191, 36, 0.2)' }) }}>
                    VERITALK EVALUATION
                </h1>

                {/* Concentric Score Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', position: 'relative', width: '380px', height: '380px' }}>
                        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                            <circle cx="50%" cy="50%" r="52" fill="none" stroke="#1e3a8a" strokeWidth="8" />
                            <circle
                                cx="50%" cy="50%" r="52"
                                fill="none"
                                stroke="#3b82f6" // Bright Blue
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(overall_score / 10) * 327} 327`}
                                transform="rotate(-90 60 60)"
                            />
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', color: '#fbbf24' }}>
                                <span style={{ fontSize: '140px', fontWeight: '800' }}>{overall_score}</span>
                                <span style={{ fontSize: '60px', color: '#d1d5db', marginLeft: '4px' }}>/10</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stylized Blue Banner Quote */}
                <div style={{
                    width: '100%', // Removed calc()
                    background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)', // Vivid blue
                    padding: '32px 10px',
                    color: '#ffffff',
                    fontSize: '38px',
                    lineHeight: 1.2,
                    fontStyle: 'italic',
                    fontWeight: 500,
                    textAlign: 'center',
                    ...(isOgImage ? {} : { boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.4)' }),
                    // clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)', // Subtle ribbon taper
                    marginTop: '20px',
                    marginBottom: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {`"${summaryText}"`}
                </div>

                {/* Bottom Row Metrics with Gold Borders */}
                <div style={{ display: 'flex', gap: '24px', width: '100%' }}>

                    {/* Metric 1 */}
                    <div style={{
                        flex: 1, padding: '32px 24px', borderRadius: '16px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '2px solid #fbbf24',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '28px', color: '#d1d5db', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                            <div style={{ display: 'flex' }}>AVG</div>
                            <div style={{ display: 'flex' }}>WPM</div>
                        </div>
                        <div style={{ display: 'flex', fontSize: '56px', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{formatMetricValue('avg_words_per_minute', metricsMap['avg_words_per_minute'])}</div>
                    </div>

                    {/* Metric 2 */}
                    <div style={{
                        flex: 1, padding: '32px 24px', borderRadius: '16px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '2px solid #fbbf24',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '28px', color: '#d1d5db', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                            <div style={{ display: 'flex' }}>{METRIC_LABELS['total_filler_words']}</div>
                        </div>
                        <div style={{ display: 'flex', fontSize: '56px', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{formatMetricValue('total_filler_words', metricsMap['total_filler_words'])}</div>
                    </div>

                    {/* Metric 3: Scenario Specific */}
                    <div style={{
                        flex: 1, padding: '32px 24px', borderRadius: '16px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '2px solid #fbbf24',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }}>
                        <div style={{ display: 'flex', fontSize: '28px', color: '#d1d5db', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                            Fallacies Detected
                        </div>
                        <div style={{ display: 'flex', fontSize: '56px', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{veritalkExtra?.fallacies_detected?.length || 0}</div>
                    </div>

                </div>
            </div>
        </div >
    );
});
