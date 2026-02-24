import type { SessionReport } from '../types';

interface Props {
    data: SessionReport;
    onRestart: () => void;
}

export function Report({ data, onRestart }: Props) {
    return (
        <div className="report">
            <h1 className="report__title">Session Report</h1>

            {/* Overall score */}
            <div className="report__overall">
                <svg className="score-gauge" viewBox="0 0 120 120">
                    <circle
                        cx="60" cy="60" r="52"
                        fill="none" stroke="rgba(255,255,255,0.08)"
                        strokeWidth="8"
                    />
                    <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(data.overall_score / 10) * 327} 327`}
                        transform="rotate(-90 60 60)"
                        className="score-gauge__fill"
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f8cff" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <text x="60" y="55" textAnchor="middle" className="score-gauge__text">
                        {data.overall_score}
                    </text>
                    <text x="60" y="72" textAnchor="middle" className="score-gauge__subtext">
                        / 10
                    </text>
                </svg>
                <span className="report__overall-label">Overall Score</span>
            </div>

            {/* Category cards */}
            <div className="report__categories">
                {Object.entries(data.categories).map(([key, cat]) => (
                    <div key={key} className="report__category-card">
                        <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                        <div className={`report__category-score ${scoreColor(cat.score)}`}>
                            {cat.score}/10
                        </div>
                        <p>{cat.feedback}</p>
                    </div>
                ))}
            </div>

            {/* Metrics strip */}
            <div className="report__metrics-strip">
                <div className="report__metric-col">
                    <span className="report__metric-value">{data.metrics.total_filler_words}</span>
                    <span className="report__metric-label">Filler Words</span>
                </div>
                <div className="report__metric-col">
                    <span className="report__metric-value">{data.metrics.avg_words_per_minute}</span>
                    <span className="report__metric-label">Avg WPM</span>
                </div>
                <div className="report__metric-col">
                    <span className="report__metric-value">{data.metrics.dominant_tone}</span>
                    <span className="report__metric-label">Dominant Tone</span>
                </div>
                <div className="report__metric-col">
                    <span className="report__metric-value">{(data.metrics.interruption_recovery_avg_ms / 1000).toFixed(1)}s</span>
                    <span className="report__metric-label">Recovery Time</span>
                </div>
                <div className="report__metric-col">
                    <span className="report__metric-value">{data.metrics.avg_talk_ratio}%</span>
                    <span className="report__metric-label">Talk Ratio</span>
                </div>
                <div className="report__metric-col">
                    <span className="report__metric-value">{data.metrics.avg_clarity_score}</span>
                    <span className="report__metric-label">Clarity</span>
                </div>
            </div>

            {/* Key moments */}
            {data.key_moments.length > 0 && (
                <div className="report__moments">
                    <h2>Key Moments</h2>
                    <div className="timeline">
                        {data.key_moments.map((m, i) => (
                            <div key={i} className={`timeline__item timeline__item--${m.type}`}>
                                <span className="timeline__dot" />
                                <span className="timeline__time">{m.timestamp}</span>
                                <span className="timeline__note">{m.note}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Improvement tips */}
            {data.improvement_tips.length > 0 && (
                <div className="report__tips">
                    <h2>Improvement Tips</h2>
                    <ol>
                        {data.improvement_tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Action buttons */}
            <div className="report__actions">
                <button className="btn btn--primary" onClick={onRestart}>
                    Try Again
                </button>
            </div>
        </div>
    );
}

function scoreColor(score: number): string {
    if (score >= 7) return 'score--green';
    if (score >= 4) return 'score--orange';
    return 'score--red';
}
