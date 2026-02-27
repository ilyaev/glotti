import { config, loadPrompt, type Mode } from '../config.js';

/**
 * Creates a Coaching Agent configuration for the given mode.
 *
 * The Coaching Agent is the primary persona that interacts with the user
 * via voice. It uses the mode-specific system prompt to determine behavior
 * (e.g., skeptical VC, upset customer, debate opponent).
 *
 * @deprecated Use `createCoachingAgent` from `server/adk/agents.ts` instead.
 * This legacy module is kept for backward compatibility. The ADK version
 * returns a proper LlmAgent instance with tools and callbacks.
 */
export interface CoachingAgentConfig {
  name: string;
  model: string;
  instruction: string;
  tools: string[];
}

export function createCoachingAgent(mode: Mode, tools: string[] = []): CoachingAgentConfig {
  const systemPrompt = loadPrompt(mode);

  return {
    name: `coaching_agent_${mode}`,
    model: config.geminiModel,
    instruction: systemPrompt,
    tools,
  };
}
