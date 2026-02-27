import type { GoogleGenAI } from '@google/genai';
import { InMemoryRunner, LlmAgent } from '@google/adk';
import { TONE_CHECK_INTERVAL_MS, TONE_ANALYSIS_TEXT_LIMIT, TONE_MIN_WORDS } from './constants.js';

export interface ToneResult {
  tone: string;
  hint: string;
}

const toneAgent = new LlmAgent({
  name: 'tone_analyzer',
  model: 'gemini-2.5-flash',
  instruction: `You are a speech tone analyzer. Analyze text from a user in a speech training session.
Return a JSON object with two fields:
- "tone": exactly one word describing the emotional tone (e.g., Confident, Nervous, Defensive, Excited, Thoughtful, Frustrated)
- "hint": a very short, one-sentence actionable training hint. Empty string if no hint needed.
Return ONLY the JSON object.`,
  description: 'Analyzes emotional tone and provides coaching hints',
});

const toneRunner = new InMemoryRunner({
  agent: toneAgent,
  appName: 'glotti',
});

export class ToneAnalyzer {
  private lastCheck = Date.now();
  private currentTone = 'Neutral';
  private currentHint = '';
  private genai: GoogleGenAI;
  private sessionId: string;

  constructor(genai: GoogleGenAI, sessionId: string) {
    this.genai = genai;
    this.sessionId = sessionId;
  }

  getTone(): string {
    return this.currentTone;
  }

  getHint(): string {
    return this.currentHint;
  }

  /**
   * Trigger a background tone analysis via ADK Runner if enough time has passed.
   * Returns a promise that resolves to the new tone/hint if analysis was triggered, null otherwise.
   */
  tryAnalyze(allUserText: string): Promise<ToneResult | null> | null {
    const now = Date.now();
    const wordCount = allUserText.split(' ').length;

    if (now - this.lastCheck <= TONE_CHECK_INTERVAL_MS || wordCount <= TONE_MIN_WORDS) {
      return null;
    }

    this.lastCheck = now;

    const analyzeAsync = async (): Promise<ToneResult | null> => {
      try {
        let result = '';
        for await (const event of toneRunner.runEphemeral({
          userId: 'system',
          newMessage: {
            role: 'user',
            parts: [{ text: `Analyze this text:\n\n"${allUserText.slice(-TONE_ANALYSIS_TEXT_LIMIT)}"` }],
          },
        })) {
          if (event.content?.parts) {
            for (const part of event.content.parts) {
              if (part.text) result += part.text;
            }
          }
        }

        const cleaned = (result || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const json = JSON.parse(cleaned);
        const newTone = json.tone ? json.tone.trim().replace(/[^a-zA-Z]/g, '') : null;
        const newHint = json.hint ? `${json.hint}` : '';

        if (newTone) {
          this.currentTone = newTone;
          this.currentHint = newHint;
          return { tone: this.currentTone, hint: this.currentHint };
        }
        return null;
      } catch (e) {
        console.error(`   [${this.sessionId}] Tone analysis failed:`, e);
        return null;
      }
    };

    return analyzeAsync();
  }
}
