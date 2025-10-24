/**
 * Action types for interactive rebase
 */
export enum RebaseAction {
  PICK = 'pick',
  SQUASH = 'squash',
  FIXUP = 'fixup',
  REWORD = 'reword',
  EDIT = 'edit',
  DROP = 'drop',
}

/**
 * A single commit in the rebase plan
 */
export type RebaseCommit = {
  hash: string;
  shortHash: string;
  message: string;
  action: RebaseAction;
};

/**
 * Interactive rebase plan
 */
export type RebasePlan = {
  commits: RebaseCommit[];
  originalCommitCount: number;
};

/**
 * Result of interactive rebase
 */
export type InteractiveRebaseResult = {
  success: boolean;
  finalMessage?: string;
  error?: string;
};
