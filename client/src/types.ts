export interface MetricSnapshot {
  filler_words: Record<string, number>;
  words_per_minute: number;
  tone: string;
  key_phrases: string[];
  improvement_hint: string;
  talk_ratio: number;
  clarity_score: number;
}

export interface SessionReport {
  session_id: string;
  mode: string;
  duration_seconds: number;
  overall_score: number;
  categories: Record<string, { score: number; feedback: string }>;
  metrics: {
    total_filler_words: number;
    avg_words_per_minute: number;
    dominant_tone: string;
    interruption_recovery_avg_ms: number;
    avg_talk_ratio: number;
    avg_clarity_score: number;
  };
  key_moments: Array<{ timestamp: string; type: 'strength' | 'weakness'; note: string }>;
  improvement_tips: string[];
  social_share_texts?: {
    performance_card_summary: string;
    linkedin_template: string;
    twitter_template: string;
    facebook_template: string;
  };
  /** Scenario-specific extra data */
  extra?: Record<string, unknown>;
  /** Which metric keys from `metrics` are relevant for this mode */
  displayMetrics?: string[];
  /** The name of the AI voice used in this session */
  voiceName?: string;
}

export interface TranscriptCue {
  text: string;
  timestamp: number;
}

// ─── Extra field types per scenario ──────────────────────────────────────────

export interface PitchPerfectExtra {
  weakest_link: string;
  strongest_asset: string;
  specific_fixes: string[];
}

export interface EmpathyTrainerExtra {
  trigger_moments: Array<{ timestamp: string; reason: string }>;
  golden_phrases: string[];
  better_alternatives: string[];
}

export interface VeritalkExtra {
  fallacies_detected: Array<{ name: string; timestamp: string; quote: string }>;
  missed_counter_arguments: string[];
  strongest_moment: string;
  weakest_moment: string;
}

export interface ImpromptuExtra {
  assigned_topic: string;
  best_moment_quote: string;
  next_challenge: string;
  silence_gaps_seconds: number;
}

// ─── Session history types ────────────────────────────────────────────────────

export interface SessionSummary {
  id: string;
  mode: string;
  startedAt: string; // ISO string
  duration_seconds: number;
  overall_score: number;
  voiceName?: string;
  preview_text?: string;
}

export interface SessionFull {
  id: string;
  mode: string;
  startedAt: string;
  transcript: string[];
  report: SessionReport;
}
