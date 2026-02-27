import { LlmAgent } from '@google/adk';
import { type Mode, MODES } from '../config.js';

/**
 * Creates an ADK LlmAgent for analytics/report generation.
 *
 * This agent generates structured post-session reports using the
 * transcript, metrics, and mode-specific evaluation criteria.
 * Uses outputKey to store results in session state.
 */
export function createReportAgent(mode: Mode): LlmAgent {
  const reportConfig = MODES[mode].report;

  return new LlmAgent({
    name: 'report_agent',
    model: 'gemini-2.5-flash',
    instruction: `You are a performance evaluation expert. ${reportConfig.promptIntro}
    
Generate detailed, structured performance reports evaluating users in training sessions.
Always evaluate the USER's performance, not the AI partner.
Return ONLY valid JSON matching the requested schema.`,
    description: 'Generates structured post-session performance reports',
    outputKey: 'report_result',
  });
}
