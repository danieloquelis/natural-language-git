export {
  parseUserPrompt,
  isLikelyGitRelated,
  getNonGitResponse,
  generateCommitMessage,
} from './agent.js';

export type { ParsedIntent } from './agent-common.js';
export { SYSTEM_PROMPT, IntentType } from './agent-common.js';
