import { LlmAgent, InMemoryRunner, type Event, isFinalResponse } from '@google/adk';
import type { MetricSnapshot } from '../store.js';

/**
 * Analytics Agent — processes transcript chunks and returns structured metrics.
 *
 * Now implemented as an ADK LlmAgent using InMemoryRunner.runAsync().
 * This agent runs separately from the voice session. It receives periodic
 * transcript text and returns JSON metrics (filler words, WPM, tone, etc.)
 * that are displayed on the client dashboard in real-time.
 */

const ANALYTICS_PROMPT = `
You are a speech analytics engine. You receive transcript chunks
and return structured metrics.

For each chunk, return ONLY a JSON object with this exact structure:
{
  "filler_words": {"um": 0, "like": 0, "you know": 0, "uh": 0, "so": 0, "basically": 0},
  "words_per_minute": 0,
  "tone": "neutral",
  "key_phrases": [],
  "improvement_hint": ""
}

Rules:
- "tone" must be one of: "confident", "nervous", "defensive", "neutral", "aggressive", "uncertain"
- "words_per_minute" should be estimated from the text length and typical speaking pace
- "filler_words" should count occurrences of common filler words in the transcript
- "improvement_hint" should be a single actionable suggestion
- Return ONLY the JSON, no markdown fences or explanation
`;

const analyticsAgent = new LlmAgent({
  name: 'analytics_agent',
  model: 'gemini-2.5-flash',
  instruction: ANALYTICS_PROMPT,
  description: 'Analyzes speech transcript chunks and returns structured metrics',
  outputKey: 'latest_metrics',
});

const runner = new InMemoryRunner({
  agent: analyticsAgent,
  appName: 'glotti',
});

export async function analyzeTranscript(
  transcriptChunk: string
): Promise<MetricSnapshot | null> {
  try {
    let result = '';
    for await (const event of runner.runEphemeral({
      userId: 'system',
      newMessage: {
        role: 'user',
        parts: [{ text: `Analyze this transcript chunk:\n\n"${transcriptChunk}"` }],
      },
    })) {
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            result += part.text;
          }
        }
      }
    }

    const cleaned = (result || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      ...parsed,
      timestamp: Date.now(),
    } as MetricSnapshot;
  } catch (error) {
    console.error('Analytics agent error:', error);
    return null;
  }
}
