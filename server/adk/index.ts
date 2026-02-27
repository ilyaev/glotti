/**
 * ADK (Agent Development Kit) integration layer for Glotti.
 *
 * Currently used for non-streaming operations only:
 * - Report generation via Runner.runAsync()
 * - Tone analysis via InMemoryRunner.runEphemeral()
 * - Analytics via InMemoryRunner.runEphemeral()
 *
 * Live audio streaming remains on raw genai.live.connect()
 * until ADK TypeScript SDK implements Runner.runLive().
 */
export { createReportAgent } from './agents.js';
export {
  getSessionService,
  createRunner,
  runReportAgent,
  getTextRunConfig,
  APP_NAME,
} from './runner.js';
