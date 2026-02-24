import { useEffect, useState } from 'react';
import type { Mode } from '../App';
import { navigateTo } from '../App';
import { Target, Handshake, Swords, Zap, ArrowRight } from 'lucide-react';

interface Props {
    onStart: (mode: Mode) => void;
    userId: string;
}

const modes = [
    {
        id: 'pitch_perfect' as Mode,
        title: 'Pitch Perfect',
        subtitle: 'Investor Pitch',
        description: 'Face a skeptical VC who will challenge every claim you make.',
        icon: <Target size={48} strokeWidth={1.5} />,
        iconUrl: '/icons/pitch_perfect.png',
        color: '#4f8cff',
    },
    {
        id: 'empathy_trainer' as Mode,
        title: 'Empathy Trainer',
        subtitle: 'Difficult Conversations',
        description: 'Practice handling upset customers, struggling employees, and tense situations.',
        icon: <Handshake size={48} strokeWidth={1.5} />,
        iconUrl: '/icons/empathy_trainer.png',
        color: '#22c55e',
    },
    {
        id: 'veritalk' as Mode,
        title: 'Veritalk',
        subtitle: 'Debate Sparring',
        description: 'Defend your thesis against real-time fact-checks and logical traps.',
        icon: <Swords size={48} strokeWidth={1.5} />,
        iconUrl: '/icons/veritalk.png',
        color: '#8b5cf6',
    },
    {
        id: 'impromptu' as Mode,
        title: 'Impromptu',
        subtitle: 'Think on Your Feet',
        description: 'Get a random topic and speak for 2 minutes — no prep, no safety net.',
        icon: <Zap size={48} strokeWidth={1.5} />,
        iconUrl: '/icons/impromptu.png',
        color: '#f59e0b',
    },
];

const steps = [
    { title: 'Choose a Persona', desc: 'Pick a sparring partner built for your high-stakes goal.' },
    { title: 'Speak Naturally', desc: 'Talk to the AI; it will listen, challenge, and intervene in real-time.' },
    { title: 'Master the Moment', desc: 'Get a data-driven training report to refine your communication.' },
];

export function ModeSelect({ onStart, userId }: Props) {
    const [sessionCount, setSessionCount] = useState<number>(0);

    useEffect(() => {
        if (!userId) return;
        const apiBase = import.meta.env.VITE_API_URL ?? '';
        fetch(`${apiBase}/api/sessions?userId=${encodeURIComponent(userId)}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: unknown[]) => setSessionCount(data.length))
            .catch(() => {/* silently ignore */ });
    }, [userId]);

    return (
        <div className="mode-select">
            <div className="mode-select__header">
                <h1 className="logo-text">Glotti</h1>
                <p className="tagline">Master high-stakes conversations with real-time AI sparring.</p>

                <div className="how-it-works">
                    {steps.map((s, idx) => (
                        <div key={idx} className="how-it-works__step">
                            <span className="how-it-works__number">{idx + 1}</span>
                            <div className="how-it-works__content">
                                <h4 className="how-it-works__title">{s.title}</h4>
                                <p className="how-it-works__desc">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="subtitle">Choose your sparring partner to begin</p>
            </div>

            <div className="mode-cards">
                {modes.map((m) => (
                    <button
                        key={m.id}
                        className="mode-card"
                        onClick={() => onStart(m.id)}
                        style={{ '--card-accent': m.color } as React.CSSProperties}
                    >
                        <span className="mode-card__icon">
                            {m.iconUrl ? (
                                <img
                                    src={m.iconUrl}
                                    alt={m.title}
                                    className="mode-card__image-icon"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.querySelector('.lucide-icon-fallback')!.removeAttribute('style');
                                    }}
                                />
                            ) : null}
                            <span
                                className="lucide-icon-fallback"
                                style={m.iconUrl ? { display: 'none' } : {}}
                            >
                                {m.icon}
                            </span>
                        </span>
                        <h2 className="mode-card__title">{m.title}</h2>
                        <h3 className="mode-card__subtitle">{m.subtitle}</h3>
                        <p className="mode-card__desc">{m.description}</p>
                        <div className="mode-card__footer">
                            <span className="mode-card__start-text">Start Session</span>
                            <ArrowRight size={18} className="mode-card__arrow" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Sessions link — bottom of content on mobile, absolute top-right on desktop */}
            {sessionCount > 0 && (
                <div className="home-sessions-bar">
                    <button
                        className="home-sessions-btn"
                        onClick={() => navigateTo('sessions')}
                    >
                        <span className="home-sessions-btn__label">Past Sessions</span>
                        <span className="home-sessions-btn__count">{sessionCount}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
