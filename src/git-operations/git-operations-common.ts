/**
 * Result of a git operation
 */
export type GitOperationResult = {
  success: boolean;
  output: string;
  error?: string;
};

/**
 * Types of git operations by safety level
 */
export enum OperationSafety {
  /** Non-destructive operations that can be auto-executed */
  SAFE = 'safe',
  /** Destructive operations requiring confirmation */
  DESTRUCTIVE = 'destructive',
  /** Cloud operations requiring confirmation */
  CLOUD = 'cloud',
}

/**
 * Git operation metadata
 */
export type GitOperation = {
  command: string;
  args: string[];
  safety: OperationSafety;
  description: string;
};

/**
 * Common safe git commands that don't require confirmation
 */
export const SAFE_COMMANDS = new Set([
  'status',
  'log',
  'diff',
  'show',
  'branch',
  'remote',
  'fetch',
  'ls-files',
  'ls-remote',
  'describe',
  'rev-parse',
  'symbolic-ref',
]);

/**
 * Destructive commands that require confirmation
 */
export const DESTRUCTIVE_COMMANDS = new Set([
  'reset',
  'clean',
  'checkout',
  'rebase',
  'merge',
  'cherry-pick',
  'revert',
  'rm',
  'branch -d',
  'branch -D',
  'stash drop',
  'stash clear',
]);

/**
 * Cloud operations that require confirmation
 */
export const CLOUD_COMMANDS = new Set(['push', 'pull', 'clone', 'fetch --all']);
