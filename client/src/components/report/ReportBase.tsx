import React from 'react';
import type { SessionReport } from '../../types';


import { METRIC_LABELS, scoreColor, formatMetricValue } from './ReportUtils';

// Re-export for any existing external dependencies that might rely on them via ReportBase
export { METRIC_LABELS, scoreColor, formatMetricValue };

// ─── Score Gauge ──────────────────────────────────────────────────────────────

export function ScoreGauge({ score }: { score: number }) {
    return (
        <div className="report__overall">
            <svg className="score-gauge" viewBox="0 0 120 120">
                <circle
                    cx="50%" cy="50%" r="52"
                    fill="none" stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                />
                <circle
                    cx="50%" cy="50%" r="52"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 10) * 327} 327`}
                    transform="rotate(-90 60 60)"
                    className="score-gauge__fill"
                />
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f8cff" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle">
                    <tspan className="score-gauge__text">{score}</tspan>
                    <tspan className="score-gauge__subtext"> / 10</tspan>
                </text>
            </svg>
            <span className="report__overall-label">Overall Score</span>
        </div>
    );
}

// ─── Category Cards ───────────────────────────────────────────────────────────

export function CategoryCards({ categories }: { categories: SessionReport['categories'] }) {
    return (
        <div className="report__categories">
            {Object.entries(categories).map(([key, cat]) => (
                <div key={key} className="report__category-card">
                    <h3>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                    <div className={`report__category-score ${scoreColor(cat.score)}`}>
                        {cat.score}/10
                    </div>
                    <p>{cat.feedback}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Metrics Strip ────────────────────────────────────────────────────────────

export function MetricsStrip({ metrics, displayMetrics }: {
    metrics: SessionReport['metrics'];
    displayMetrics?: string[];
}) {
    const keys = displayMetrics ?? ['total_filler_words', 'avg_words_per_minute', 'dominant_tone', 'avg_talk_ratio', 'avg_clarity_score'];
    const metricsMap = metrics as unknown as Record<string, number | string>;

    return (
        <div className="report__metrics-strip">
            {keys.map(key => (
                <div key={key} className="report__metric-col">
                    <span className="report__metric-value">
                        {formatMetricValue(key, metricsMap[key] ?? '—')}
                    </span>
                    <span className="report__metric-label">{METRIC_LABELS[key] ?? key}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Key Moments Timeline ─────────────────────────────────────────────────────

export function KeyMoments({ moments }: { moments: SessionReport['key_moments'] }) {
    if (!moments.length) return null;
    return (
        <div className="report__moments">
            <h2>Key Moments</h2>
            <div className="timeline">
                {moments.map((m, i) => (
                    <div key={i} className={`timeline__item timeline__item--${m.type}`}>
                        <span className="timeline__dot" />
                        <span className="timeline__time">{m.timestamp}</span>
                        <span className="timeline__note">{m.note}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Improvement Tips ─────────────────────────────────────────────────────────

export function ImprovementTips({ tips }: { tips: string[] }) {
    if (!tips.length) return null;
    return (
        <div className="report__tips">
            <h2>Improvement Tips</h2>
            <ol>
                {tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ol>
        </div>
    );
}
// ─── Partner Info ───────────────────────────────────────────────────────────

export function PartnerInfo({ voiceName, roleHint }: { voiceName?: string; roleHint?: string }) {
    if (!voiceName) return null;
    return (
        <div className="report__partner-oneliner">
            <span className="report__partner-label">{roleHint || 'AI Partner'}:</span>
            <span className="report__partner-name">{voiceName}</span>
        </div>
    );
}

// ─── Transcript ────────────────────────────────────────────────────

export function Transcript({ lines, aiName }: { lines?: string[]; aiName?: string }) {
    if (!lines || lines.length === 0) return null;
    return (
        <div className="session-detail__transcript">
            <h2 className="session-detail__transcript-title">Full Transcript</h2>
            <div className="session-detail__transcript-lines">
                {lines.map((line, i) => {
                    const isUser = line.startsWith('[User]');
                    const text = line.replace(/^\[(User|AI)\]\s*/, '');
                    return (
                        <div key={i} className={`session-detail__line ${isUser ? 'session-detail__line--user' : 'session-detail__line--ai'}`}>
                            <span className="session-detail__line-role">{isUser ? 'You' : (aiName || 'AI')}</span>
                            <span className="session-detail__line-text">{text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

import { ShareModal } from '../ShareModal';
import { FeedbackModal } from './FeedbackModal';
import { Play } from 'lucide-react';
import { initGlobalAudio } from '../../hooks/useAudio';

export function PartnerInsightCard({ sessionId, userId, voiceName }: { sessionId?: string; userId?: string; voiceName?: string }) {
    const [showFeedback, setShowFeedback] = React.useState(false);

    if (!sessionId || !userId) return null;

    return (
        <>
            <div className="partner-insight">
                <div className="partner-insight__content">
                    <div className="partner-insight__header">
                        {/* <Sparkles size={16} className="partner-insight__icon" /> */}
                        <span>Partner Perspective</span>
                    </div>
                    <div className="partner-insight__body">
                        <p className="partner-insight__text">
                            "{voiceName || 'Your partner'} has some thoughts on this performance. Hear them out or discuss it with them live."
                        </p>
                        <button
                            className="partner-insight__play-btn"
                            onClick={() => {
                                initGlobalAudio();
                                setShowFeedback(true);
                            }}
                        >
                            <Play size={20} fill="currentColor" />
                            <span>Listen & Discuss</span>
                        </button>
                    </div>
                </div>
            </div>

            {showFeedback && (
                <FeedbackModal
                    sessionId={sessionId}
                    userId={userId}
                    onClose={() => setShowFeedback(false)}
                />
            )}
        </>
    );
}

interface ReportActionsProps {
    onRestart: () => void;
    sessionId?: string;
    userId?: string;
    isShared?: boolean;
    report?: SessionReport; // Pass down the report for image generation
}

export function ReportActions({ onRestart, sessionId, userId, isShared, report }: ReportActionsProps) {
    const [showShare, setShowShare] = React.useState(false);

    const handleShare = () => {
        if (!sessionId || !userId) return;
        setShowShare(true);
    };

    return (
        <>
            <div className="report__actions">
                {!isShared && sessionId && userId && (
                    <button className="btn btn--outline report__share-btn" onClick={handleShare}>
                        Share
                    </button>
                )}
                <button className="btn btn--primary" onClick={onRestart}>
                    {isShared ? 'Practice with Glotti' : 'Try Again'}
                </button>
            </div>

            {showShare && sessionId && userId && (
                <ShareModal sessionId={sessionId} userId={userId} onClose={() => setShowShare(false)} report={report} />
            )}
        </>
    );
}
