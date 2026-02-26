import { forwardRef } from 'react';
import type { SessionReport, EmpathyTrainerExtra } from '../../../types';

import { Heart, MessageCircle, AlertTriangle } from 'lucide-react';

interface CardProps {
    report: SessionReport;
    isOgImage?: boolean; // For OpenGraph image generation mode (Satori)
    ogBackgroundImage?: string; // Background image data URI for Satori
}

export const EmpathyTrainerCard = forwardRef<HTMLDivElement, CardProps>(({ report, isOgImage, ogBackgroundImage }, ref) => {
    // 1. DATA EXTRACTION
    const { overall_score, metrics, extra, social_share_texts, improvement_tips, categories } = report;
    const metricsMap = metrics as unknown as Record<string, number | string>;
    const empathyExtra = extra as unknown as EmpathyTrainerExtra;

    // Use specific empathy score if available, otherwise overall
    const empathyScore = categories?.empathy_connection?.score || overall_score;
    // Fallback text
    const summaryText = social_share_texts?.performance_card_summary || improvement_tips?.[0] || "Great session!";
    
    // Metrics to display
    const talkRatio = metricsMap.talk_ratio 
        ? `${Math.round(Number(metricsMap.talk_ratio) * 100)}%` 
        : '0%';
    
    const triggerCount = empathyExtra?.trigger_moments?.length || 0;
    const goldenPhraseCount = empathyExtra?.golden_phrases?.length || 0;

    // 2. DESIGN CONSTANTS (Emerald Green Theme)
    const THEME = {
        bg: '#ecfdf5', // emerald-50
        textMain: '#064e3b', // emerald-900
        textSecondary: '#047857', // emerald-700
        accent: '#10b981', // emerald-500
        bannerBg: '#059669', // emerald-600
        bannerText: '#ffffff',
        iconBg: '#d1fae5', // emerald-100
        scoreColor: '#065f46', // emerald-800
    };

    // 3. RENDER
    return (
        <div
            ref={ref}
            className="performance-card-export"
            style={{
                width: '1080px',
                height: '1080px',
                background: isOgImage ? THEME.bg : 'url(/cards/bg_empathy.jpg) no-repeat center center',
                backgroundColor: THEME.bg,
                backgroundSize: 'cover',
                color: THEME.textMain,
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                borderRadius: '40px',
                overflow: 'hidden',
                boxShadow: isOgImage ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
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

            {/* HEADER SECTION */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                paddingTop: '100px', 
                flex: 1 
            }}>
                <h1 style={{ 
                    display: 'flex', 
                    fontSize: '48px', 
                    fontWeight: 800, 
                    lineHeight: 1.1, 
                    margin: 0, 
                    letterSpacing: '0.05em', 
                    color: THEME.textMain,
                    textTransform: 'uppercase'
                }}>
                    Empathy Trainer
                </h1>

                {/* BIG SCORE */}
                <div style={{ marginTop: '50px', display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ 
                        fontSize: '220px', 
                        fontWeight: 800, 
                        color: THEME.scoreColor, 
                        lineHeight: 0.8, 
                        letterSpacing: '-0.04em' 
                    }}>
                        {empathyScore}
                    </span>
                    <span style={{ 
                        fontSize: '80px', 
                        fontWeight: 600, 
                        color: THEME.scoreColor, 
                        opacity: 0.6,
                        marginLeft: '10px'
                    }}>
                        /10
                    </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 600, color: THEME.textSecondary, marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Empathy Score
                </div>
                
                {/* BRANDING FOOTER (MOVED UP) */}
                <div style={{ 
                    textAlign: 'center', 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: THEME.textSecondary, 
                    opacity: 0.6,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginTop: '20px'
                }}>
                    Gemili.app
                </div>
            </div>

            {/* QUOTE BANNER */}
            <div style={{
                width: '100%',
                background: THEME.bannerBg,
                padding: '50px 60px',
                color: THEME.bannerText,
                fontSize: '42px',
                lineHeight: 1.3,
                fontStyle: 'italic',
                fontWeight: 500,
                textAlign: 'center',
                marginBottom: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {`"${summaryText}"`}
            </div>

            {/* METRICS ROW */}
            <div style={{ 
                display: 'flex', 
                width: '100%', 
                padding: '0 80px 100px 80px', 
                justifyContent: 'space-between',
                gap: '40px'
            }}>

                {/* Metric 1: Triggers (Avoided or Hit) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: THEME.iconBg, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '24px', 
                        color: THEME.textSecondary 
                    }}>
                       <AlertTriangle size={48} strokeWidth={2.5} />
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: 800, color: THEME.textMain, lineHeight: 1 }}>
                        {triggerCount}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: THEME.textSecondary, marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Triggers Hit
                    </div>
                </div>

                {/* Metric 2: Talk Ratio */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: THEME.iconBg, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '24px', 
                        color: THEME.textSecondary 
                    }}>
                        <MessageCircle size={48} strokeWidth={2.5} />
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: 800, color: THEME.textMain, lineHeight: 1 }}>
                        {talkRatio}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: THEME.textSecondary, marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        You Talked
                    </div>
                </div>

                {/* Metric 3: Golden Phrases */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: THEME.iconBg, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '24px', 
                        color: THEME.textSecondary 
                    }}>
                        <Heart size={48} strokeWidth={2.5} />
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: 800, color: THEME.textMain, lineHeight: 1 }}>
                        {goldenPhraseCount}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: THEME.textSecondary, marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Golden Phrases
                    </div>
                </div>

            </div>
        </div>
    );
});
