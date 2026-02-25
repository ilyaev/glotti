import { forwardRef } from 'react';
import type { SessionReport, ImpromptuExtra } from '../../../types';
import { formatMetricValue } from '../ReportBase';
import { Users, Clock, Zap } from 'lucide-react';

interface CardProps {
    report: SessionReport;
}

export const ImpromptuCard = forwardRef<HTMLDivElement, CardProps>(({ report }, ref) => {
    const { overall_score, metrics, voiceName, extra, social_share_texts, improvement_tips } = report;
    const metricsMap = metrics as unknown as Record<string, number | string>;
    const summaryText = social_share_texts?.performance_card_summary || improvement_tips[0];
    const impromptuExtra = extra as unknown as ImpromptuExtra;

    // Bottom left design style: Dynamic Orange/Teal gradient, bold banner, white cards
    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px',
                background: 'linear-gradient(135deg, #f97316 0%, #14b8a6 100%)', // Orange to Teal
                color: '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                borderRadius: '40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                padding: '60px 80px 80px 80px' // Less top padding to fit the bold title
            }}
        >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Title */}
                <h1 style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1.1, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    Impromptu Evaluation
                </h1>

                {/* Centered White Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
                    <div style={{ position: 'relative', width: '340px', height: '340px' }}>
                        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>
                            <circle cx="50%" cy="50%" r="52" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
                            <circle
                                cx="50%" cy="50%" r="52"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(overall_score / 10) * 327} 327`}
                                transform="rotate(-90 60 60)"
                            />
                            <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff">
                                <tspan style={{ fontSize: '32px', fontWeight: '800' }}>{overall_score}</tspan>
                                <tspan style={{ fontSize: '16px', fill: 'rgba(255,255,255,0.8)' }}> / 10</tspan>
                            </text>
                        </svg>
                    </div>
                    {/* Partner Info beneath Gauge */}
                    <div style={{ fontSize: '32px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                        AI Partner: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{voiceName || 'Glotti'}</span>
                    </div>
                </div>

                {/* Bold Orange Quote Banner */}
                <div style={{
                    width: 'calc(100% + 160px)', // Bleed out of the padding constraints
                    padding: '26px 70px',
                    background: '#ea580c', // Darker bold orange
                    fontSize: '38px',
                    lineHeight: 1.4,
                    color: '#ffffff',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    textAlign: 'center',
                    boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.4)',
                    marginTop: '30px',
                    marginBottom: '40px'
                }}>
                    "{summaryText}"
                </div>

                {/* Bottom Row White Metric Cards */}
                <div style={{ display: 'flex', gap: '24px', width: '100%' }}>

                    {/* Metric 1 */}
                    <div style={{
                        flex: 1, padding: '32px 24px', borderRadius: '24px',
                        background: '#ffffff',
                        color: '#334155', // Slate shadow text
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ padding: '16px', borderRadius: '16px', background: '#e0f2fe', color: '#0284c7' }}>
                            <Users size={32} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '28px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Filler
                        </div>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#ea580c', lineHeight: 1 }}>{formatMetricValue('total_filler_words', metricsMap['total_filler_words'])}</div>
                    </div>

                    {/* Metric 2 */}
                    <div style={{
                        flex: 1, padding: '32px 24px', borderRadius: '24px',
                        background: '#ffffff',
                        color: '#334155',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ padding: '16px', borderRadius: '16px', background: '#ccfbf1', color: '#0f766e' }}>
                            <Clock size={32} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '28px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            WPM
                        </div>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#ea580c', lineHeight: 1 }}>{formatMetricValue('avg_words_per_minute', metricsMap['avg_words_per_minute'])}</div>
                    </div>

                    {/* Metric 3: Scenario Specific */}
                    <div style={{
                        flex: 1, padding: '32px 24px', borderRadius: '24px',
                        background: '#ffffff',
                        color: '#334155',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ padding: '16px', borderRadius: '16px', background: '#ffedd5', color: '#c2410c' }}>
                            <Zap size={32} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '28px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Topic
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c', lineHeight: 1.2, textAlign: 'center', paddingTop: '8px' }}>{impromptuExtra?.assigned_topic || 'N/A'}</div>
                    </div>

                </div>
            </div>
        </div>
    );
});
