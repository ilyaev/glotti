import { useState } from 'react';
import { CongratulationsOverlay } from './session/CongratulationsOverlay';
import type { CelebrationVariant } from './session/CongratulationsOverlay';
import { SessionEndingOverlay } from './session/SessionEndingOverlay';
import type { Mode } from '../App';

const MODES: Mode[] = ['pitch_perfect', 'empathy_trainer', 'veritalk', 'impromptu'];

const VARIANT_PRESETS: Array<{ label: string; emoji: string; variant: CelebrationVariant; description: string }> = [
    { label: 'First Session', emoji: '🎉', variant: { kind: 'first_session' }, description: 'Shown on first completion' },
    { label: 'Milestone 5', emoji: '🔥', variant: { kind: 'milestone', count: 5 }, description: 'Building a habit' },
    { label: 'Milestone 10', emoji: '🔥', variant: { kind: 'milestone', count: 10 }, description: 'Double digits — intensity 2' },
    { label: 'Milestone 25', emoji: '👑', variant: { kind: 'milestone', count: 25 }, description: 'Crown icon — intensity 2' },
    { label: 'Milestone 50', emoji: '👑', variant: { kind: 'milestone', count: 50 }, description: 'Max intensity 3' },
    { label: 'Milestone 100', emoji: '👑', variant: { kind: 'milestone', count: 100 }, description: 'Legend tier' },
    { label: 'High Score 8/10', emoji: '🏅', variant: { kind: 'high_score', score: 8 }, description: 'Baseline high score' },
    { label: 'High Score 9/10', emoji: '🏅', variant: { kind: 'high_score', score: 9 }, description: 'Intensity 2' },
    { label: 'High Score 10/10', emoji: '🏅', variant: { kind: 'high_score', score: 10 }, description: 'Max intensity 3' },
];

type ActiveOverlay = { type: 'congrats'; variant: CelebrationVariant } | { type: 'ending' } | null;

/**
 * Secret preview page for visual overlays.
 * Access via #/_preview
 */
export function OverlayPreview() {
    const [activeMode, setActiveMode] = useState<Mode>('pitch_perfect');
    const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);

    const launch = (overlay: ActiveOverlay) => {
        localStorage.removeItem('glotti_first_session_celebrated');
        setActiveOverlay(overlay);
    };

    if (activeOverlay?.type === 'congrats') {
        return (
            <CongratulationsOverlay
                mode={activeMode}
                variant={activeOverlay.variant}
                onComplete={() => setActiveOverlay(null)}
            />
        );
    }

    if (activeOverlay?.type === 'ending') {
        return <SessionEndingOverlay mode={activeMode} elapsed={142} />;
    }

    const sectionStyle: React.CSSProperties = { marginBottom: 28 };
    const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-muted)' };
    const btnBase: React.CSSProperties = {
        padding: '10px 16px',
        borderRadius: 10,
        border: '2px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        textAlign: 'left' as const,
        transition: 'all 0.15s ease',
    };

    return (
        <div style={{
            padding: '48px 24px',
            maxWidth: 700,
            margin: '0 auto',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)',
        }}>
            <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                marginBottom: 4,
            }}>
                🎨 Overlay Preview
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
                Secret testing page — preview all celebration overlays in isolation.
            </p>

            {/* Mode selector */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Mode</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {MODES.map(m => (
                        <button
                            key={m}
                            onClick={() => setActiveMode(m)}
                            style={{
                                ...btnBase,
                                borderColor: m === activeMode ? 'var(--accent-blue)' : 'var(--border-subtle)',
                                background: m === activeMode ? 'rgba(91,135,130,0.1)' : 'var(--bg-secondary)',
                                fontWeight: m === activeMode ? 600 : 400,
                            }}
                        >
                            {m.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Celebration variants */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Celebration Variants</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {VARIANT_PRESETS.map((preset, i) => (
                        <button
                            key={i}
                            onClick={() => launch({ type: 'congrats', variant: preset.variant })}
                            style={{
                                ...btnBase,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            <span style={{ fontSize: 15, fontWeight: 600 }}>{preset.emoji} {preset.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{preset.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Session ending overlay */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Other Overlays</label>
                <button
                    onClick={() => launch({ type: 'ending' })}
                    style={{
                        ...btnBase,
                        padding: '12px 20px',
                        fontSize: 14,
                    }}
                >
                    ⏳ Session Ending Overlay
                </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                Celebration overlays auto-dismiss after ~4s. Session ending overlay stays — use browser back to return.
            </p>
        </div>
    );
}
