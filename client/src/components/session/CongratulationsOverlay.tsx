import { useEffect, useRef, useMemo } from 'react';
import { Trophy, Heart, Swords, Zap, Target, Flame, Award, Crown } from 'lucide-react';

// ─── Public types ─────────────────────────────────────────────────────────────

export type CelebrationVariant =
    | { kind: 'first_session' }
    | { kind: 'milestone'; count: number }       // 5, 10, 25, 50, 100…
    | { kind: 'high_score'; score: number };      // score ≥ 80

export interface CongratulationsOverlayProps {
    mode: string;
    variant: CelebrationVariant;
    onComplete: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
    pitch_perfect: '#4f8cff',
    empathy_trainer: '#22c55e',
    veritalk: '#8b5cf6',
    impromptu: '#f59e0b',
};

const BASE_CONFETTI_COLORS = ['#5b8782', '#c49a6c', '#d97757', '#6c8c62', '#FFD700', '#C0C0C0'];
const FIREWORK_COLORS = ['#ff4444', '#ff8800', '#ffdd00', '#44ff44', '#4488ff', '#aa44ff', '#ff44aa', '#FFD700'];
const OVERLAY_DURATION = 3500;

// ─── Particle types ───────────────────────────────────────────────────────────

interface ConfettiParticle {
    kind: 'confetti';
    x: number; y: number;
    vx: number; vy: number;
    w: number; h: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    shape: 'rect' | 'circle';
    opacity: number;
    life: number;
}

interface FireworkParticle {
    kind: 'firework';
    x: number; y: number;
    vx: number; vy: number;
    color: string;
    radius: number;
    opacity: number;
    life: number;
    trail: Array<{ x: number; y: number; opacity: number }>;
}

type Particle = ConfettiParticle | FireworkParticle;

// ─── Particle factories ──────────────────────────────────────────────────────

function createConfetti(x: number, y: number, colors: string[]): ConfettiParticle {
    const isCircle = Math.random() > 0.6;
    return {
        kind: 'confetti',
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -12 - 4,
        w: isCircle ? 0 : 6 + Math.random() * 6,
        h: isCircle ? 0 : 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        shape: isCircle ? 'circle' : 'rect',
        opacity: 1,
        life: 160 + Math.random() * 40,
    };
}

function createFireworkBurst(cx: number, cy: number, count: number, colors: string[]): FireworkParticle[] {
    const result: FireworkParticle[] = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
        const speed = 2 + Math.random() * 4;
        result.push({
            kind: 'firework',
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: colors[Math.floor(Math.random() * colors.length)],
            radius: 2 + Math.random() * 2,
            opacity: 1,
            life: 60 + Math.random() * 40,
            trail: [],
        });
    }
    return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomSparkleStyle(): React.CSSProperties {
    const size = 4 + Math.random() * 8;
    return {
        position: 'absolute',
        left: `${20 + Math.random() * 60}%`,
        top: `${15 + Math.random() * 70}%`,
        width: size,
        height: size,
        animationDelay: `${Math.random() * 2.5}s`,
        animationDuration: `${0.8 + Math.random() * 0.7}s`,
    };
}

function getModeIcon(mode: string) {
    switch (mode) {
        case 'pitch_perfect': return <Target size={64} strokeWidth={1.5} />;
        case 'empathy_trainer': return <Heart size={64} strokeWidth={1.5} />;
        case 'veritalk': return <Swords size={64} strokeWidth={1.5} />;
        case 'impromptu': return <Zap size={64} strokeWidth={1.5} />;
        default: return <Trophy size={64} strokeWidth={1.5} />;
    }
}

function getVariantIcon(variant: CelebrationVariant) {
    switch (variant.kind) {
        case 'milestone': return variant.count >= 25
            ? <Crown size={64} strokeWidth={1.5} />
            : <Award size={64} strokeWidth={1.5} />;
        case 'high_score': return <Flame size={64} strokeWidth={1.5} />;
        default: return null; // use mode icon
    }
}

function getVariantTitle(variant: CelebrationVariant): string {
    switch (variant.kind) {
        case 'first_session': return 'Congratulations!';
        case 'milestone': return `${variant.count} Sessions!`;
        case 'high_score': return 'Outstanding!';
    }
}

function getVariantSubtitle(variant: CelebrationVariant): string {
    switch (variant.kind) {
        case 'first_session': return 'You crushed your first session!';
        case 'milestone': {
            if (variant.count >= 100) return "You're a communication legend!";
            if (variant.count >= 50) return 'Half a century of growth — unstoppable!';
            if (variant.count >= 25) return 'A true dedication to mastery!';
            if (variant.count >= 10) return 'Double digits — you\'re on fire!';
            return 'You\'re building a real habit!';
        }
        case 'high_score': return `Score: ${variant.score}% — exceptional performance!`;
    }
}

/** Intensity 1–3 controls particle counts & firework frequency */
function getIntensity(variant: CelebrationVariant): number {
    switch (variant.kind) {
        case 'first_session': return 1;
        case 'milestone': {
            if (variant.count >= 50) return 3;
            if (variant.count >= 10) return 2;
            return 1;
        }
        case 'high_score': {
            if (variant.score >= 95) return 3;
            if (variant.score >= 90) return 2;
            return 1;
        }
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CongratulationsOverlay({ mode, variant, onComplete }: CongratulationsOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    const modeColor = MODE_COLORS[mode] ?? '#5b8782';
    const intensity = getIntensity(variant);

    const confettiColors = useMemo(() => {
        const colors = [...BASE_CONFETTI_COLORS];
        colors.push(modeColor, modeColor, modeColor);
        return colors;
    }, [modeColor]);

    const fireworkColors = useMemo(() => {
        return [...FIREWORK_COLORS, modeColor, modeColor];
    }, [modeColor]);

    const sparkles = useMemo(
        () => Array.from({ length: 12 + intensity * 4 }, () => randomSparkleStyle()),
        [intensity]
    );

    // Mark first session as celebrated (only for first_session variant)
    useEffect(() => {
        if (variant.kind === 'first_session') {
            localStorage.setItem('glotti_first_session_celebrated', 'true');
        }
    }, [variant]);

    // Auto-transition after duration
    useEffect(() => {
        const timer = setTimeout(onComplete, OVERLAY_DURATION + 500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    // ─── Canvas animation ─────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const particles: Particle[] = [];
        const startTime = performance.now();

        // ── Initial confetti burst ──
        const cx = canvas.width / 2;
        const confettiCount = 40 + intensity * 20;
        for (let i = 0; i < confettiCount; i++) {
            particles.push(createConfetti(cx + (Math.random() - 0.5) * 60, -10, confettiColors));
        }

        // ── Firework scheduling ──
        interface FireworkSchedule { time: number; x: number; y: number; count: number; done: boolean }

        const fireworkSchedule: FireworkSchedule[] = [];

        // Always at least 1 firework burst
        fireworkSchedule.push({
            time: 300, x: cx, y: canvas.height * 0.35, count: 30 + intensity * 10, done: false,
        });

        if (intensity >= 2) {
            fireworkSchedule.push(
                { time: 800, x: canvas.width * 0.25, y: canvas.height * 0.3, count: 25, done: false },
                { time: 1000, x: canvas.width * 0.75, y: canvas.height * 0.35, count: 25, done: false },
            );
        }

        if (intensity >= 3) {
            fireworkSchedule.push(
                { time: 1500, x: canvas.width * 0.4, y: canvas.height * 0.25, count: 35, done: false },
                { time: 1800, x: canvas.width * 0.6, y: canvas.height * 0.2, count: 35, done: false },
                { time: 2200, x: cx, y: canvas.height * 0.3, count: 40, done: false },
            );
        }

        // ── Confetti side bursts ──
        let burst2Done = false;
        let rainStopped = false;

        function animate(now: number) {
            if (!ctx || !canvas) return;
            const elapsed = now - startTime;

            // Confetti burst 2 at 800ms
            if (!burst2Done && elapsed > 800) {
                burst2Done = true;
                const lx = canvas.width * 0.25;
                const rx = canvas.width * 0.75;
                const sideCount = 15 + intensity * 5;
                for (let i = 0; i < sideCount; i++) {
                    particles.push(createConfetti(lx + (Math.random() - 0.5) * 40, -10, confettiColors));
                    particles.push(createConfetti(rx + (Math.random() - 0.5) * 40, -10, confettiColors));
                }
            }

            // Confetti rain
            if (!rainStopped && elapsed < 2500) {
                if (Math.random() < 0.15 + intensity * 0.1) {
                    particles.push(createConfetti(Math.random() * canvas.width, -10, confettiColors));
                }
            } else {
                rainStopped = true;
            }

            // Check firework schedule
            for (const fw of fireworkSchedule) {
                if (!fw.done && elapsed >= fw.time) {
                    fw.done = true;
                    particles.push(...createFireworkBurst(fw.x, fw.y, fw.count, fireworkColors));
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                if (p.kind === 'confetti') {
                    p.vy += 0.15;
                    p.vx *= 0.99;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.rotation += p.rotationSpeed;
                    p.life--;

                    if (p.life < 30) p.opacity = p.life / 30;

                    if (p.life <= 0 || p.y > canvas.height + 20) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.globalAlpha = p.opacity;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;

                    if (p.shape === 'rect') {
                        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();

                } else {
                    // Firework particle — radial expansion with drag + trails
                    p.vx *= 0.97;
                    p.vy *= 0.97;
                    p.vy += 0.03;

                    p.trail.push({ x: p.x, y: p.y, opacity: p.opacity * 0.5 });
                    if (p.trail.length > 6) p.trail.shift();

                    p.x += p.vx;
                    p.y += p.vy;
                    p.life--;

                    if (p.life < 20) p.opacity = p.life / 20;

                    if (p.life <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    // Draw trail
                    for (let t = 0; t < p.trail.length; t++) {
                        const tp = p.trail[t];
                        const trailAlpha = (t / p.trail.length) * tp.opacity * 0.4;
                        ctx.save();
                        ctx.globalAlpha = trailAlpha;
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(tp.x, tp.y, p.radius * 0.6, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }

                    // Draw particle with glow
                    ctx.save();
                    ctx.globalAlpha = p.opacity;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            const allFireworksDone = fireworkSchedule.every(fw => fw.done);
            if (particles.length > 0 || !rainStopped || !allFireworksDone) {
                animFrameRef.current = requestAnimationFrame(animate);
            }
        }

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [confettiColors, fireworkColors, intensity]);

    // ─── Render ───────────────────────────────────────────────────────────

    const variantIcon = getVariantIcon(variant);
    const icon = variantIcon ?? getModeIcon(mode);

    return (
        <div
            className="congrats-overlay"
            style={{ '--mode-accent': modeColor } as React.CSSProperties}
        >
            <canvas
                ref={canvasRef}
                className="congrats-overlay__confetti"
                aria-hidden="true"
            />
            <div className="congrats-overlay__sparkles">
                {sparkles.map((style, i) => (
                    <div key={i} className="congrats-sparkle" style={style} />
                ))}
            </div>
            <div className="congrats-overlay__content" role="status" aria-live="polite">
                <div className="congrats-overlay__icon">
                    {icon}
                </div>
                <h1 className="congrats-overlay__title">{getVariantTitle(variant)}</h1>
                <p className="congrats-overlay__subtitle">
                    {getVariantSubtitle(variant)}
                </p>
                <p className="congrats-overlay__hint">
                    Your report is on the way...
                </p>
            </div>
        </div>
    );
}
