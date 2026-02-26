import { Target, Handshake, Swords, Zap, MessageSquareText } from 'lucide-react';

export const MODE_LABELS: Record<string, string> = {
    pitch_perfect: 'Pitch Perfect',
    empathy_trainer: 'Empathy Trainer',
    veritalk: 'Veritalk',
    impromptu: 'Impromptu',
    feedback: 'Feedback',
};

export const MODE_COLORS: Record<string, string> = {
    pitch_perfect: 'badge--blue',
    empathy_trainer: 'badge--green',
    veritalk: 'badge--purple',
    impromptu: 'badge--orange',
    feedback: 'badge--gray',
};

export const MODE_ICONS: Record<string, React.ReactNode> = {
    pitch_perfect: <Target size={18} />,
    empathy_trainer: <Handshake size={18} />,
    veritalk: <Swords size={18} />,
    impromptu: <Zap size={18} />,
    feedback: <MessageSquareText size={18} />,
};
