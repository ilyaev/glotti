import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = {
  googleApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!,
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT,
  geminiModel: 'gemini-2.5-flash-native-audio-preview-12-2025',
  port: parseInt(process.env.PORT || '8080'),
  isDev: process.env.NODE_ENV !== 'production',
  voices: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] as const,
};

// ─── Report Config Types ─────────────────────────────────────────────────────

export interface ReportCategory {
  label: string;
  description: string; // Injected into the AI prompt to define what to score
}

/** Names of the metrics keys from SessionReport.metrics that are relevant for this mode */
export type MetricKey =
  | 'total_filler_words'
  | 'avg_words_per_minute'
  | 'dominant_tone'
  | 'interruption_recovery_avg_ms'
  | 'avg_talk_ratio'
  | 'avg_clarity_score';

export interface ScenarioReportConfig {
  /** AI evaluator framing — replaces generic "expert specialist" */
  promptIntro: string;
  /** Evaluation categories with descriptions for the AI */
  categories: Record<string, ReportCategory>;
  /** Which standard metric keys to include in the report */
  displayMetrics: MetricKey[];
  /** Additional top-level fields the AI should produce (described in English) */
  extraFields: Record<string, string>;
}

export interface ScenarioConfig {
  promptFile: string;
  report: ScenarioReportConfig;
}

// ─── Mode Definitions ────────────────────────────────────────────────────────

export const MODES: Record<string, ScenarioConfig> = {
  pitch_perfect: {
    promptFile: 'server/agents/prompts/pitch-perfect.md',
    report: {
      promptIntro:
        'You are a Tier-1 Venture Capitalist evaluating a startup pitch. You are skeptical, data-driven, and time-constrained. Your job is to decide if this is investable. Be blunt.',
      categories: {
        investment_potential: {
          label: 'Pass/Invest Verdict',
          description: 'Would you take a second meeting? Rate 1-10 (1=Hard Pass, 10=Term Sheet). Explain why based on the "Weakest Link" and "Strongest Asset".',
        },
        problem_clarity: {
          label: 'Problem Clarity',
          description: 'Did the user make a clear, urgent, and credible case for the problem? did they avoid buzzwords?',
        },
        market_articulation: {
          label: 'Market Reality',
          description: 'Did they know their numbers (CAC, LTV, TAM)? Did they admit competition exists?',
        },
        handling_pressure: {
          label: 'Q&A Performance',
          description: 'Did the founder answer directly or dodge? Did they handle interruptions well?',
        },
      },
      displayMetrics: ['total_filler_words', 'avg_words_per_minute', 'avg_talk_ratio', 'interruption_recovery_avg_ms', 'dominant_tone'],
      extraFields: {
        weakest_link:
          'The single part of the pitch that would kill the deal (string).',
        strongest_asset:
          'The best part of the pitch: Founder, Tech, or Market (string).',
        specific_fixes:
          'Array of 3 strings: specific actionable changes for the deck or script.',
      },
    },
  },

  empathy_trainer: {
    promptFile: 'server/agents/prompts/empathy-trainer.md',
    report: {
      promptIntro:
        'You are a conflict resolution expert evaluating the user\'s performance in a high-tension scenario. Focus on emotional intelligence, effective validation, and de-escalation skills. Be strict about dismissive language.',
      categories: {
        empathy_connection: {
          label: 'Empathy Score',
          description: 'Did the user genuinely connect (validating feelings) or just use scripted corporate speak? Rate 1-10.',
        },
        de_escalation_skill: {
          label: 'De-escalation',
          description: 'Did the user lower the tension? Did they avoid the "Fix-It" trap (solving before listening)?',
        },
        active_listening: {
          label: 'Active Listening',
          description: 'Did the user listen without interrupting? Did they avoid the "But" trap ("I hear you, but...")?',
        },
        language_quality: {
          label: 'Language Precision',
          description: 'Did the user avoid trigger words (calm down, policy, procedure) and use warm, human language?',
        },
      },
      displayMetrics: ['avg_talk_ratio', 'dominant_tone', 'total_filler_words', 'avg_words_per_minute'],
      extraFields: {
        trigger_moments:
          'An array of objects: { "timestamp": string, "reason": string }. Moments where the user triggered an escalation.',
        golden_phrases:
          'An array of strings: The single best things the user said that helped the situation.',
        better_alternatives:
          'An array of strings: Specific phrasing improvements for their weak moments.',
      },
    },
  },

  veritalk: {
    promptFile: 'server/agents/prompts/veritalk.md',
    report: {
      promptIntro:
        'You are a debate coach and logician evaluating the user\'s argumentative performance. Focus on the quality of reasoning, evidence, and resilience under intellectual pressure. Reference specific exchanges from the transcript.',
      categories: {
        argument_coherence: {
          label: 'Argument Coherence',
          description: 'Was the user\'s main thesis clear? Did they defend it consistently throughout the session without contradicting themselves?',
        },
        evidence_quality: {
          label: 'Evidence Quality',
          description: 'Did the user support their claims with specific facts, statistics, examples, or credible sources? Or did they rely on vague assertions?',
        },
        logical_soundness: {
          label: 'Logical Soundness',
          description: 'Did the user reason without logical fallacies? Look for: straw man, ad hominem, false equivalence, appeal to authority, circular reasoning.',
        },
        interruption_recovery: {
          label: 'Interruption Recovery',
          description: 'When challenged or interrupted, how quickly and effectively did the user regain composure and return to their argument?',
        },
      },
      displayMetrics: ['interruption_recovery_avg_ms', 'avg_words_per_minute', 'dominant_tone', 'avg_clarity_score'],
      extraFields: {
        fallacies_detected:
          'An array of objects: { "name": string (fallacy name), "timestamp": string (mm:ss), "quote": string (the user\'s words) }. Empty array if none found.',
        missed_counter_arguments:
          'An array of strings: arguments or angles the user should have anticipated or addressed but did not.',
        strongest_moment:
          'A string describing the user\'s single strongest argumentative moment, including the timestamp and a short quote.',
        weakest_moment:
          'A string describing the user\'s single weakest argumentative moment, including the timestamp and a short quote.',
      },
    },
  },

  impromptu: {
    promptFile: 'server/agents/prompts/impromptu.md',
    report: {
      promptIntro:
        'You are an impromptu speaking and improv coach evaluating the user\'s ability to speak clearly and coherently on an unexpected topic with no preparation time. Focus on structure, spontaneous creativity, and composure.',
      categories: {
        topic_adherence: {
          label: 'Topic Adherence',
          description: 'Did the user stay on the assigned topic throughout? Did their response feel relevant to the prompt they were given?',
        },
        structure: {
          label: 'Speech Structure',
          description: 'Did the response have a recognizable arc: a clear opening, a developed body, and a close or conclusion? Or did it trail off or meander?',
        },
        confidence: {
          label: 'Confidence & Presence',
          description: 'Did the user sound assured and in control? How did they handle silences, hesitations, and unexpected moments?',
        },
        originality: {
          label: 'Originality',
          description: 'Did the user bring a fresh angle, memorable metaphors, or surprising examples? Or did they resort to the most obvious interpretation?',
        },
      },
      displayMetrics: ['total_filler_words', 'avg_words_per_minute', 'dominant_tone'],
      extraFields: {
        assigned_topic:
          'The exact topic that was assigned to the user at the start of this session (a string extracted from the AI\'s opening message).',
        best_moment_quote:
          'A short string quoting or describing the user\'s strongest 10–15 seconds of speech verbatim.',
        next_challenge:
          'One specific, actionable skill for the user to focus on in their next impromptu session (string).',
        silence_gaps_seconds:
          'An estimated number representing the total seconds the user spent in silence or clearly struggling to find words.',
      },
    },
  },
  feedback: {
    promptFile: 'server/agents/prompts/feedback.md',
    report: {
      promptIntro: 'You are providing feedback on a previous session.',
      categories: {},
      displayMetrics: [],
      extraFields: {},
    },
  },
} as const;

export type Mode = keyof typeof MODES;

export function loadPrompt(mode: Mode): string {
  const isProd = process.env.NODE_ENV === 'production';
  const rootDir = isProd ? join(__dirname, '..', '..') : join(__dirname, '..');
  const promptPath = join(rootDir, MODES[mode].promptFile);
  return readFileSync(promptPath, 'utf-8');
}

export function getReportConfig(mode: Mode): ScenarioReportConfig {
  return MODES[mode].report;
}
