import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config, getReportConfig, type Mode, type ScenarioReportConfig } from './config.js';
import type { MetricSnapshot, SessionReport } from './store.js';

const genai = new GoogleGenAI({ apiKey: config.googleApiKey });

export interface TranscriptEntry {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const CategorySchema = z.object({
  score: z.number().min(1).max(10),
  feedback: z.string(),
});

const KeyMomentSchema = z.object({
  timestamp: z.string(),
  type: z.enum(['strength', 'weakness']),
  note: z.string(),
});

const MetricsSchema = z.object({
  total_filler_words: z.number(),
  avg_words_per_minute: z.number(),
  dominant_tone: z.string(),
  interruption_recovery_avg_ms: z.number(),
  avg_talk_ratio: z.number(),
  avg_clarity_score: z.number(),
});

const BaseReportSchema = z.object({
  overall_score: z.number().min(1).max(10),
  categories: z.record(z.string(), CategorySchema),
  metrics: MetricsSchema,
  key_moments: z.array(KeyMomentSchema),
  improvement_tips: z.array(z.string()),
});

// Extra field schemas per scenario
const PitchPerfectExtraSchema = z.object({
  pitch_structure_score: z.number().min(1).max(10),
  recommended_next_step: z.string(),
});

const EmpathyTrainerExtraSchema = z.object({
  escalation_moments: z.array(z.string()),
  best_empathy_phrases: z.array(z.string()),
  alternative_phrases: z.array(z.string()),
});

const VeritalkExtraSchema = z.object({
  fallacies_detected: z.array(z.object({
    name: z.string(),
    timestamp: z.string(),
    quote: z.string(),
  })),
  missed_counter_arguments: z.array(z.string()),
  strongest_moment: z.string(),
  weakest_moment: z.string(),
});

const ImpromptuExtraSchema = z.object({
  assigned_topic: z.string(),
  best_moment_quote: z.string(),
  next_challenge: z.string(),
  silence_gaps_seconds: z.number(),
});

const EXTRA_SCHEMAS: Record<string, z.ZodTypeAny> = {
  pitch_perfect: PitchPerfectExtraSchema,
  empathy_trainer: EmpathyTrainerExtraSchema,
  veritalk: VeritalkExtraSchema,
  impromptu: ImpromptuExtraSchema,
};

// ─── Prompt Building ──────────────────────────────────────────────────────────

function buildReportPrompt(
  mode: Mode,
  reportConfig: ScenarioReportConfig,
  transcript: TranscriptEntry[],
  metrics: MetricSnapshot[],
  durationSeconds: number
): string {
  const totalFillers = metrics.reduce((sum, m) => {
    return sum + Object.values(m.filler_words).reduce((a, b) => a + b, 0);
  }, 0);

  const avgWpm = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.words_per_minute, 0) / metrics.length)
    : 0;

  const validTalkRatios = metrics.filter(m => m.talk_ratio !== undefined);
  const avgTalkRatio = validTalkRatios.length > 0
    ? Math.round(validTalkRatios.reduce((sum, m) => sum + m.talk_ratio, 0) / validTalkRatios.length)
    : 0;

  const validClarityScores = metrics.filter(m => m.clarity_score !== undefined);
  const avgClarityScore = validClarityScores.length > 0
    ? Math.round(validClarityScores.reduce((sum, m) => sum + m.clarity_score, 0) / validClarityScores.length)
    : 0;

  const tones = metrics.map(m => m.tone);
  const dominantTone = tones.length > 0
    ? tones.sort((a, b) =>
        tones.filter(v => v === b).length - tones.filter(v => v === a).length
      )[0]
    : 'unknown';

  const userEntriesCount = transcript.filter(t => t.role === 'user').length;

  const dialogueScript = transcript.length > 0
    ? transcript.map(t => {
        const mins = Math.floor(t.timestamp / 60).toString().padStart(2, '0');
        const secs = (t.timestamp % 60).toString().padStart(2, '0');
        const prefix = t.role === 'user' ? '[User]' : '[AI Partner]';
        return `[${mins}:${secs}] ${prefix}: ${t.text}`;
      }).join('\n')
    : '(No dialogue recorded during this session)';

  // Build category schema block for the prompt
  const categorySchemaBlock = Object.entries(reportConfig.categories)
    .map(([key, cat]) => `    "${key}": {"score": <1-10>, "feedback": "<2-3 sentences: ${cat.description}>"}`)
    .join(',\n');

  // Build extra fields block for the prompt
  const hasExtra = Object.keys(reportConfig.extraFields).length > 0;
  const extraSchemaLines = Object.entries(reportConfig.extraFields)
    .map(([key, desc]) => `    "${key}": <${desc}>`)
    .join(',\n');
  const extraBlock = hasExtra
    ? `,\n  "extra": {\n${extraSchemaLines}\n  }`
    : '';

  return `
${reportConfig.promptIntro}

IMPORTANT: You must evaluate the USER's performance ONLY, NOT the AI partner.
The transcript below is a chronological script of the conversation. Lines starting
with [User] are what the person being trained said. Lines starting with [AI Partner]
are what the AI partner said. You MUST evaluate ONLY the [User] lines.

If the user did not speak or said very little, score them LOW (1-3) and provide
constructive feedback encouraging them to actively participate.

MODE: ${mode}
DURATION: ${durationSeconds} seconds

=== FULL SESSION DIALOGUE SCRIPT ===
${dialogueScript}

USER'S AGGREGATED METRICS:
- Total filler words used by user: ${totalFillers}
- Average words per minute: ${avgWpm}
- Average talk ratio: ${avgTalkRatio}%
- Average clarity score (unique words / total words): ${avgClarityScore}/100
- Dominant tone: ${dominantTone}
- Total times user spoke: ${userEntriesCount}

Generate a detailed performance report evaluating the USER's performance
as a JSON object with this exact structure:
{
  "overall_score": <number 1-10>,
  "categories": {
${categorySchemaBlock}
  },
  "metrics": {
    "total_filler_words": ${totalFillers},
    "avg_words_per_minute": ${avgWpm},
    "dominant_tone": "${dominantTone}",
    "interruption_recovery_avg_ms": <estimated number>,
    "avg_talk_ratio": ${avgTalkRatio},
    "avg_clarity_score": ${avgClarityScore}
  },
  "key_moments": [
    {"timestamp": "<mm:ss>", "type": "strength"|"weakness", "note": "<description of USER's moment, referencing the dialogue>"}
  ],
  "improvement_tips": ["<tip 1>", "<tip 2>", "<tip 3>"]${extraBlock}
}

Return ONLY the JSON object, no markdown fences or explanation.
`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateReport(mode: Mode, raw: unknown): { base: z.infer<typeof BaseReportSchema>; extra?: Record<string, unknown> } {
  const base = BaseReportSchema.parse(raw);

  const extraSchema = EXTRA_SCHEMAS[mode];
  let extra: Record<string, unknown> | undefined;
  if (extraSchema && typeof raw === 'object' && raw !== null && 'extra' in raw) {
    try {
      extra = extraSchema.parse((raw as Record<string, unknown>).extra) as Record<string, unknown>;
    } catch (err) {
      console.warn(`   [report] Extra field validation failed for mode ${mode}, using partial:`, err);
      // Use the raw extra even if validation fails — better than nothing
      extra = (raw as Record<string, unknown>).extra as Record<string, unknown>;
    }
  }

  return { base, extra };
}

// ─── Report Generation ────────────────────────────────────────────────────────

export async function generateReport(
  sessionId: string,
  mode: Mode,
  transcript: TranscriptEntry[],
  metrics: MetricSnapshot[],
  durationSeconds: number
): Promise<SessionReport> {
  const reportConfig = getReportConfig(mode);

  try {
    const prompt = buildReportPrompt(mode, reportConfig, transcript, metrics, durationSeconds);
    const userEntriesCount = transcript.filter(t => t.role === 'user').length;
    console.log(`   [${sessionId}] Report prompt length: ${prompt.length} chars, user entries: ${userEntriesCount}, total turns: ${transcript.length}`);

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    const text = response.text || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const { base, extra } = validateReport(mode, parsed);

    return {
      session_id: sessionId,
      mode,
      duration_seconds: durationSeconds,
      ...base,
      extra,
      displayMetrics: reportConfig.displayMetrics,
    };
  } catch (error) {
    console.error('Report generation failed:', error);

    // Build fallback using scenario's own category keys
    const fallbackCategories: Record<string, { score: number; feedback: string }> = {};
    for (const key of Object.keys(reportConfig.categories)) {
      fallbackCategories[key] = { score: 5, feedback: 'Report generation failed. Please try again later.' };
    }

    return {
      session_id: sessionId,
      mode,
      duration_seconds: durationSeconds,
      overall_score: 5,
      categories: fallbackCategories,
      metrics: {
        total_filler_words: 0,
        avg_words_per_minute: 0,
        dominant_tone: 'unknown',
        interruption_recovery_avg_ms: 0,
        avg_talk_ratio: 0,
        avg_clarity_score: 0,
      },
      key_moments: [],
      improvement_tips: ['Unable to generate report. Please try again.'],
      displayMetrics: reportConfig.displayMetrics,
    };
  }
}
