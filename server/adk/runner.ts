import {
  Runner,
  InMemorySessionService,
  type RunConfig,
  StreamingMode,
} from '@google/adk';
import type { BaseAgent } from '@google/adk';
import type { Mode } from '../config.js';
import { createReportAgent } from './agents.js';

const APP_NAME = 'glotti';

// ─── Singleton Session Service ────────────────────────────────────────────────

let sessionService: InMemorySessionService | null = null;

export function getSessionService(): InMemorySessionService {
  if (!sessionService) {
    sessionService = new InMemorySessionService();
  }
  return sessionService;
}

// ─── Runner Factory ───────────────────────────────────────────────────────────

/**
 * Creates an ADK Runner for a given agent.
 */
export function createRunner(agent: BaseAgent): Runner {
  return new Runner({
    appName: APP_NAME,
    agent,
    sessionService: getSessionService(),
  });
}

// ─── Run Configs ──────────────────────────────────────────────────────────────

/**
 * RunConfig for non-streaming operations (report generation, analytics).
 */
export function getTextRunConfig(): RunConfig {
  return {
    streamingMode: StreamingMode.NONE,
  };
}

// ─── Report Generation via ADK Runner ─────────────────────────────────────────

/**
 * Runs the report agent via ADK Runner.runAsync() and collects the response.
 */
export async function runReportAgent(
  userId: string,
  mode: Mode,
  prompt: string,
): Promise<string> {
  const agent = createReportAgent(mode);
  const runner = createRunner(agent);

  const service = getSessionService();
  const session = await service.createSession({
    appName: APP_NAME,
    userId,
    state: { 'app:mode': mode },
  });

  let result = '';
  for await (const event of runner.runAsync({
    userId,
    sessionId: session.id,
    newMessage: {
      role: 'user',
      parts: [{ text: prompt }],
    },
    runConfig: getTextRunConfig(),
  })) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (part.text) {
          result += part.text;
        }
      }
    }
  }

  return result;
}

export { APP_NAME };
