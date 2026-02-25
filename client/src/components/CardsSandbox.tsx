import type { SessionReport } from '../types';
import { PerformanceCard } from './report/PerformanceCard';

const MOCK_REPORTS: SessionReport[] = [
    {
        session_id: 'mock-1',
        mode: 'pitch_perfect',
        duration_seconds: 185,
        overall_score: 9.2,
        categories: { structure: { score: 9, feedback: 'Great flow.' } },
        metrics: {
            total_filler_words: 2,
            avg_words_per_minute: 145,
            dominant_tone: 'confident',
            interruption_recovery_avg_ms: 500,
            avg_talk_ratio: 85,
            avg_clarity_score: 92
        },
        key_moments: [],
        improvement_tips: ['Keep your hook snappy.'],
        social_share_texts: {
            performance_card_summary: 'Your confidence during the opening statement was exceptional. A truly compelling pitch!',
            linkedin_template: '', twitter_template: '', facebook_template: ''
        },
        extra: {
            pitch_structure_score: 9.5,
            recommended_next_step: 'Focus on the call to action.'
        },
        voiceName: 'Glotti',
        displayMetrics: ['total_filler_words', 'avg_words_per_minute']
    },
    {
        session_id: 'mock-2',
        mode: 'empathy_trainer',
        duration_seconds: 240,
        overall_score: 8.5,
        categories: { listening: { score: 8, feedback: 'Good active listening.' } },
        metrics: {
            total_filler_words: 5,
            avg_words_per_minute: 120,
            dominant_tone: 'empathetic',
            interruption_recovery_avg_ms: 1200,
            avg_talk_ratio: 45,
            avg_clarity_score: 88
        },
        key_moments: [],
        improvement_tips: ['Validate their feelings earlier.'],
        social_share_texts: {
            performance_card_summary: 'You demonstrated excellent patience and understanding during tense moments.',
            linkedin_template: '', twitter_template: '', facebook_template: ''
        },
        extra: {
            escalation_moments: ['01:23', '03:45'],
            best_empathy_phrases: ['I hear what you are saying'],
            alternative_phrases: []
        },
        voiceName: 'Sage',
        displayMetrics: ['avg_talk_ratio', 'dominant_tone']
    },
    {
        session_id: 'mock-3',
        mode: 'veritalk',
        duration_seconds: 300,
        overall_score: 7.8,
        categories: { logic: { score: 7, feedback: 'Watch out for ad hominem.' } },
        metrics: {
            total_filler_words: 8,
            avg_words_per_minute: 160,
            dominant_tone: 'analytical',
            interruption_recovery_avg_ms: 800,
            avg_talk_ratio: 60,
            avg_clarity_score: 85
        },
        key_moments: [],
        improvement_tips: ['Focus on addressing the core argument.'],
        social_share_texts: {
            performance_card_summary: 'You successfully defended your stance and backed it up with strong core facts.',
            linkedin_template: '', twitter_template: '', facebook_template: ''
        },
        extra: {
            fallacies_detected: [{ name: 'Strawman', timestamp: '02:15', quote: 'So you hate freedom' }],
            missed_counter_arguments: [],
            strongest_moment: 'Your opening rebuttal.',
            weakest_moment: 'Defending the budget cuts.'
        },
        voiceName: 'Socrates',
        displayMetrics: ['avg_words_per_minute', 'total_filler_words']
    },
    {
        session_id: 'mock-4',
        mode: 'impromptu',
        duration_seconds: 120,
        overall_score: 8.9,
        categories: { flow: { score: 9, feedback: 'Very natural transitions.' } },
        metrics: {
            total_filler_words: 0,
            avg_words_per_minute: 135,
            dominant_tone: 'engaged',
            interruption_recovery_avg_ms: 300,
            avg_talk_ratio: 95,
            avg_clarity_score: 95
        },
        key_moments: [],
        improvement_tips: ['Use body language more.'],
        social_share_texts: {
            performance_card_summary: 'Quick on your feet and composed. A fantastic display of improvisational speaking!',
            linkedin_template: '', twitter_template: '', facebook_template: ''
        },
        extra: {
            assigned_topic: 'The impact of AI on modern art',
            best_moment_quote: 'Art is evolving, not dying.',
            next_challenge: 'Try a controversial topic.',
            silence_gaps_seconds: 2.5
        },
        voiceName: 'Spark',
        displayMetrics: ['avg_clarity_score', 'total_filler_words']
    }
];

export function CardsSandbox() {
    return (
        <div style={{ flex: 1, padding: '40px', background: '#f1f5f9', overflowY: 'auto', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#1e293b' }}>Performance Cards Sandbox</h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '40px',
                justifyItems: 'center'
            }}>
                {MOCK_REPORTS.map((report) => (
                    <div key={report.mode} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h2 style={{ marginBottom: '16px', color: '#475569', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {report.mode.replace('_', ' ')}
                        </h2>
                        {/* Wrapper to scale down the 1080x1080 design cleanly without causing scrollbars */}
                        <div style={{
                            position: 'relative',
                            width: '540px',
                            height: '540px',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '1080px',
                                height: '1080px',
                                transform: 'scale(0.5)',
                                transformOrigin: 'top left'
                            }}>
                                <PerformanceCard report={report} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
