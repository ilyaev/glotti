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
  /** Scenario-specific extra data */
  extra?: Record<string, unknown>;
  /** Which metric keys from `metrics` are relevant for this mode */
  displayMetrics?: string[];
}

export interface TranscriptCue {
  text: string;
  timestamp: number;
}

// ─── Extra field types per scenario ──────────────────────────────────────────

export interface PitchPerfectExtra {
  pitch_structure_score: number;
  recommended_next_step: string;
}

export interface EmpathyTrainerExtra {
  escalation_moments: string[];
  best_empathy_phrases: string[];
  alternative_phrases: string[];
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
}

export interface SessionFull {
  id: string;
  mode: string;
  startedAt: string;
  transcript: string[];
  report: SessionReport;
}
