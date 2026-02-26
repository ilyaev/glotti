import { forwardRef } from 'react';
import type { SessionReport, VeritalkExtra } from '../../../types';
import { Scale, Mic, MessageSquare } from 'lucide-react';

interface CardProps {
    report: SessionReport;
    isOgImage?: boolean;
    ogBackgroundImage?: string;
}

export const VeritalkCard = forwardRef<HTMLDivElement, CardProps>(({ report, isOgImage, ogBackgroundImage }, ref) => {
    // 1. DATA EXTRACTION
    const { overall_score, metrics, extra, social_share_texts, improvement_tips } = report;
    const metricsMap = metrics as unknown as Record<string, number | string>;
    const summaryText = social_share_texts?.performance_card_summary || improvement_tips?.[0] || "Solid debate performance.";
    const veritalkExtra = extra as unknown as VeritalkExtra;
    
    // Metrics
    const wpm = Math.round(Number(metricsMap.avg_words_per_minute || 0));
    const fallaciesCount = veritalkExtra?.fallacies_detected?.length || 0;
    const clarityScore = Math.round(Number(metricsMap.avg_clarity_score || 0));

    // 2. DESIGN CONSTANTS (Royal Blue & Gold Theme)
    const THEME = {
        bg: '#0f172a', // slate-900
        textMain: '#ffffff',
        textSecondary: '#cbd5e1', // slate-300
        accent: '#fbbf24', // amber-400 (Gold)
        border: '#b45309', // amber-700
        panelBg: 'rgba(30, 41, 59, 0.6)', // slate-800 translucent
        highlight: '#3b82f6', // blue-500
    };

    // 3. RENDER
    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px',
                background: isOgImage ? '#1e293b' : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                // background: isOgImage ? THEME.bg : 'url(/cards/bg_veritalk.jpg) no-repeat center center',
                backgroundSize: 'cover',
                color: THEME.textMain,
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                borderRadius: '40px',
                overflow: 'hidden',
                boxShadow: isOgImage ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Background Layer for Satori Data URI */}
            {isOgImage && ogBackgroundImage && (
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex' }}>
                    <img
                        src={ogBackgroundImage}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt=""
                    />
                </div>
            )}

            {/* Content Container with Gold Border */}
            <div style={{
                flex: 1,
                border: `3px solid ${THEME.accent}`,
                borderRadius: '30px',
                margin: '40px',
                padding: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.3)',
                boxShadow: isOgImage ? 'none' : 'inset 0 0 60px rgba(251, 191, 36, 0.05)',
                backdropFilter: 'blur(10px)',
            }}>
                
                {/* HEADLINE */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                     <h1 style={{ 
                        fontSize: '48px', 
                        fontWeight: 800, 
                        margin: 0, 
                        letterSpacing: '0.15em', 
                        color: THEME.accent,
                        textTransform: 'uppercase',
                        textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)'
                    }}>
                        Veritalk Evaluation
                    </h1>
                    <div style={{ 
                        fontSize: '24px', 
                        color: THEME.textSecondary, 
                        marginTop: '10px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em' 
                    }}>
                        Logic & Rhetoric Analysis
                    </div>
                </div>

                {/* CENTRAL SCORE */}
                <div style={{ position: 'relative', width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                         {/* Track */}
                        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                        {/* Progress */}
                        <circle 
                            cx="100" cy="100" r="90" 
                            fill="none" 
                            stroke={THEME.accent} 
                            strokeWidth="12" 
                            strokeLinecap="round"
                            strokeDasharray={`${(overall_score / 10) * 565} 565`}
                        />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '160px', fontWeight: 800, color: THEME.textMain, lineHeight: 0.8, display: 'flex' }}>
                            {overall_score}
                        </span>
                        <span style={{ fontSize: '32px', fontWeight: 600, color: THEME.textSecondary, marginTop: '10px', display: 'flex' }}>
                            OUT OF 10
                        </span>
                    </div>
                </div>

                {/* QUOTE / SUMMARY */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '36px',
                    // border: '1px solid rgba(255,255,255,0.1)',
                    lineHeight: 1.2,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: THEME.textMain,
                    textAlign: 'center',
                    maxWidth: '100%',
                    borderLeft: `5px solid ${THEME.highlight}`,
                    paddingLeft: '30px',
                }}>
                    {`"${summaryText}"`}
                </div>

                {/* METRICS ROW */}
                <div style={{ 
                    display: 'flex', 
                    width: '100%', 
                    justifyContent: 'space-between',
                    gap: '40px',
                    marginTop: '20px'
                }}>
                    {/* Metric 1: Fallacies */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: THEME.panelBg, padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ color: THEME.accent, marginBottom: '10px', display: 'flex' }}><Scale size={48} /></div>
                        <div style={{ fontSize: '64px', fontWeight: 800, color: THEME.textMain, lineHeight: 1, display: 'flex' }}>{fallaciesCount}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', marginTop: '10px', display: 'flex' }}>Fallacies</div>
                    </div>

                    {/* Metric 2: WPM */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: THEME.panelBg, padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ color: THEME.accent, marginBottom: '10px', display: 'flex' }}><Mic size={48} /></div>
                        <div style={{ fontSize: '64px', fontWeight: 800, color: THEME.textMain, lineHeight: 1, display: 'flex' }}>{wpm}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', marginTop: '10px', display: 'flex' }}>Words / Min</div>
                    </div>

                    {/* Metric 3: Clarity */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: THEME.panelBg, padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ color: THEME.accent, marginBottom: '10px', display: 'flex' }}><MessageSquare size={48} /></div>
                        <div style={{ fontSize: '64px', fontWeight: 800, color: THEME.textMain, lineHeight: 1, display: 'flex' }}>{clarityScore}%</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', marginTop: '10px', display: 'flex' }}>Clarity Score</div>
                    </div>
                </div>

            </div>
        </div>
    );
});
