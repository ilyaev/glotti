import { forwardRef } from 'react';
import type { SessionReport, EmpathyTrainerExtra } from '../../../types';
import { METRIC_LABELS, formatMetricValue } from '../ReportBase';
import { MessageCircle, Smile, ShieldAlert } from 'lucide-react';

interface CardProps {
    report: SessionReport;
}

export const EmpathyTrainerCard = forwardRef<HTMLDivElement, CardProps>(({ report }, ref) => {
    const { overall_score, metrics, extra, social_share_texts, improvement_tips } = report;
    const metricsMap = metrics as unknown as Record<string, number | string>;
    const summaryText = social_share_texts?.performance_card_summary || improvement_tips[0];
    const empathyExtra = extra as unknown as EmpathyTrainerExtra;

    // Top right design style from Image 2: Soft purple watercolor vibe, massive score text, rich solid banners
    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px',
                // Simulating a soft, watercolor-like purple gradient landscape
                background: 'radial-gradient(circle at 15% 15%, #f3e8ff 0%, transparent 50%), radial-gradient(circle at 85% 85%, #d8b4fe 0%, transparent 50%), linear-gradient(135deg, #ede9fe 0%, #f5d0fe 100%)',
                color: '#4c1d95', // Deep purple
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                borderRadius: '40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                padding: '80px 0' // We pad Y, but not X so the banner can touch the edges easily
            }}
        >
            {/* Top Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 80px', flex: 1, justifyContent: 'center' }}>
                <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1.1, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4c1d95', opacity: 0.9 }}>
                    Empathy Trainer
                </h1>

                {/* Massive Score Text (No Gauge) */}
                <div style={{ marginTop: '40px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '180px', fontWeight: '800', color: '#6b21a8', lineHeight: 0.8, letterSpacing: '-0.04em' }}>
                        {overall_score}
                    </span>
                    <span style={{ fontSize: '64px', fontWeight: '600', color: '#6b21a8', opacity: 0.7 }}>
                        /10
                    </span>
                </div>
            </div>

            {/* Edge-to-Edge Solid Purple Banner for Quote */}
            <div style={{
                width: '100%',
                background: '#8b5cf6', // Bright purple
                padding: '40px 40px',
                color: '#ffffff',
                fontSize: '42px',
                lineHeight: 1.2,
                fontStyle: 'italic',
                fontWeight: 500,
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)',
                marginBottom: '80px'
            }}>
                "{summaryText}"
            </div>

            {/* Bottom Row Metrics */}
            <div style={{ display: 'flex', width: '100%', padding: '0 80px', justifyContent: 'space-between' }}>

                {/* Metric 1 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#581c87' }}>
                        <MessageCircle size={40} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: '30px', color: '#6b21a8', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '12px' }}>
                        {METRIC_LABELS['avg_talk_ratio'] || 'Talk Ratio'}
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: '800', color: '#4c1d95', lineHeight: 1 }}>{formatMetricValue('avg_talk_ratio', metricsMap['avg_talk_ratio'])}</div>
                </div>

                {/* Metric 2 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#581c87' }}>
                        <Smile size={40} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: '30px', color: '#6b21a8', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '12px' }}>
                        Dominant Tone
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: '800', color: '#4c1d95', lineHeight: 1 }}>{String(metricsMap['dominant_user_tone'] || 'N/A').toLowerCase()}</div>
                </div>

                {/* Metric 3: Scenario Specific */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#581c87' }}>
                        <ShieldAlert size={40} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: '30px', color: '#6b21a8', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '12px' }}>
                        Escalation Moments
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: '800', color: '#4c1d95', lineHeight: 1 }}>{empathyExtra?.escalation_moments?.length || 0}</div>
                </div>

            </div>
        </div>
    );
});
