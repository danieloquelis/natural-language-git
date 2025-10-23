import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitOperationResult, GitOperation } from './git-operations-common.js';
import {
  OperationSafety,
  SAFE_COMMANDS,
  DESTRUCTIVE_COMMANDS,
  CLOUD_COMMANDS,
} from './git-operations-common.js';

const execAsync = promisify(exec);

/**
 * Determine the safety level of a git command
 */
export function determineOperationSafety(command: string): OperationSafety {
  const lowerCommand = command.toLowerCase();

  // Check for cloud operations
  for (const cloudCmd of CLOUD_COMMANDS) {
    if (lowerCommand.includes(cloudCmd)) {
      return OperationSafety.CLOUD;
    }
  }

  // Check for destructive operations
  for (const destructiveCmd of DESTRUCTIVE_COMMANDS) {
    if (lowerCommand.includes(destructiveCmd)) {
      return OperationSafety.DESTRUCTIVE;
    }
  }

  // Check for safe operations
  const baseCommand = command.split(' ')[0];
  if (SAFE_COMMANDS.has(baseCommand)) {
    return OperationSafety.SAFE;
  }

  // Default to destructive if unsure
  return OperationSafety.DESTRUCTIVE;
}

/**
 * Execute a git command
 */
export async function executeGitCommand(
  command: string,
  args: string[] = [],
  cwd?: string
): Promise<GitOperationResult> {
  const fullCommand = ['git', command, ...args].join(' ');

  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd: cwd || process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    return {
      success: true,
      output: stdout || stderr,
    };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message: string };
    return {
      success: false,
      output: err.stdout || '',
      error: err.stderr || err.message,
    };
  }
}

/**
 * Check if the current directory is a git repository
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  const result = await executeGitCommand('rev-parse', ['--is-inside-work-tree'], cwd);
  return result.success && result.output.trim() === 'true';
}

/**
 * Get the current git branch
 */
export async function getCurrentBranch(cwd?: string): Promise<string | null> {
  const result = await executeGitCommand('branch', ['--show-current'], cwd);
  return result.success ? result.output.trim() : null;
}

/**
 * Get git status
 */
export async function getGitStatus(cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('status', ['--short'], cwd);
}

/**
 * Stage files
 */
export async function stageFiles(files: string[], cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('add', files, cwd);
}

/**
 * Create a commit
 */
export async function createCommit(
  message: string,
  cwd?: string
): Promise<GitOperationResult> {
  return executeGitCommand('commit', ['-m', message], cwd);
}

/**
 * Create a new branch
 */
export async function createBranch(
  branchName: string,
  cwd?: string
): Promise<GitOperationResult> {
  return executeGitCommand('branch', [branchName], cwd);
}

/**
 * Switch to a branch
 */
export async function switchBranch(
  branchName: string,
  cwd?: string
): Promise<GitOperationResult> {
  return executeGitCommand('checkout', [branchName], cwd);
}

/**
 * Get git log
 */
export async function getGitLog(
  maxCount = 10,
  cwd?: string
): Promise<GitOperationResult> {
  return executeGitCommand('log', ['--oneline', `-n${maxCount}`], cwd);
}
