export {
  determineOperationSafety,
  executeGitCommand,
  isGitRepository,
  getCurrentBranch,
  getGitStatus,
  stageFiles,
  createCommit,
  createBranch,
  switchBranch,
  getGitLog,
  getStagedDiff,
  getStagedDiffStat,
  getChangedFiles,
} from './git-operations.js';

export type { GitOperationResult, GitOperation } from './git-operations-common.js';
export {
  OperationSafety,
  SAFE_COMMANDS,
  DESTRUCTIVE_COMMANDS,
  CLOUD_COMMANDS,
} from './git-operations-common.js';
