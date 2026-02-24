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
};

export const MODES = {
  pitch_perfect: 'server/agents/prompts/pitch-perfect.md',
  empathy_trainer: 'server/agents/prompts/empathy-trainer.md',
  veritalk: 'server/agents/prompts/veritalk.md',
  impromptu: 'server/agents/prompts/impromptu.md',
} as const;

export type Mode = keyof typeof MODES;

export function loadPrompt(mode: Mode): string {
  // In production, the compiled file is at /app/dist/server/config.js
  // The prompts are at /app/server/agents/prompts/
  // So we need to go up two levels (dist/server) to reach the root /app/
  const isProd = process.env.NODE_ENV === 'production';
  const rootDir = isProd ? join(__dirname, '..', '..') : join(__dirname, '..');
  const promptPath = join(rootDir, MODES[mode]);
  return readFileSync(promptPath, 'utf-8');
}
