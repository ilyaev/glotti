import { MessageSquareText, ChevronRight, User } from 'lucide-react';
import type { SessionSummary } from '../types';
import { MODE_LABELS, MODE_COLORS, MODE_ICONS } from '../utils/modeConfig';
import { formatDate, formatTime, formatDuration } from '../utils/dates';

interface Props {
    session: SessionSummary;
    onClick: () => void;
}

export function SessionCard({ session: s, onClick }: Props) {
    return (
        <div className="sessions-list__card" onClick={onClick}>
            <div className="sessions-list__card-main">
                <div className="sessions-list__card-header">
                    <div className="sessions-list__type-group">
                        <span className={`sessions-list__icon-box ${MODE_COLORS[s.mode] ?? 'badge--blue'}`}>
                            {MODE_ICONS[s.mode] || <MessageSquareText size={18} />}
                        </span>
                        <div className="sessions-list__meta">
                            <span className="sessions-list__mode-name">{MODE_LABELS[s.mode] ?? s.mode}</span>
                            <div className="sessions-list__details">
                                <span className="sessions-list__date-text">{formatDate(s.startedAt)}</span>
                                <span className="sessions-list__dot">•</span>
                                <span className="sessions-list__time-text">{formatTime(s.startedAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="sessions-list__card-right">
                        <span className="sessions-list__duration">{formatDuration(s.duration_seconds)}</span>
                        {s.overall_score > 0 ? (
                            <div className="sessions-list__score-pill">
                                <span className="score-val">{s.overall_score}</span>
                                <span className="score-label">/10</span>
                            </div>
                        ) : (
                            <div className="sessions-list__score-pill sessions-list__score-pill--empty">
                                <MessageSquareText size={14} />
                                <span>Talk</span>
                            </div>
                        )}
                    </div>
                </div>

                {s.preview_text && (
                    <p className="sessions-list__preview">
                        {s.preview_text}
                    </p>
                )}

                <div className="sessions-list__footer">
                    {s.voiceName && (
                        <div className="sessions-list__voice">
                            <User size={12} />
                            <span>Partner: {s.voiceName}</span>
                        </div>
                    )}
                    <div className="sessions-list__view-link">
                        <span>View Report</span>
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
}
