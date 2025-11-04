import { spawn } from 'node:child_process';
import type { GitOperationResult } from './git-operations-common.js';
import {
  CLOUD_COMMANDS,
  DESTRUCTIVE_COMMANDS,
  OperationSafety,
  SAFE_COMMANDS,
} from './git-operations-common.js';

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
  cwd?: string,
  interactive = false
): Promise<GitOperationResult> {
  // For interactive commands, use spawn with inherited stdio
  if (interactive || args.includes('-i') || args.includes('--interactive')) {
    return executeInteractiveGitCommand(command, args, cwd);
  }

  // Use spawn instead of exec for proper argument handling
  // This ensures special characters in arguments are properly escaped
  return new Promise((resolve) => {
    const gitProcess = spawn('git', [command, ...args], {
      cwd: cwd || process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout || stderr,
        });
      } else {
        resolve({
          success: false,
          output: stdout,
          error: stderr || `Command exited with code ${code}`,
        });
      }
    });

    gitProcess.on('error', (error) => {
      resolve({
        success: false,
        output: '',
        error: error.message,
      });
    });
  });
}

/**
 * Execute an interactive git command (with editor)
 */
function executeInteractiveGitCommand(
  command: string,
  args: string[] = [],
  cwd?: string
): Promise<GitOperationResult> {
  return new Promise((resolve) => {
    const gitProcess = spawn('git', [command, ...args], {
      cwd: cwd || process.cwd(),
      stdio: 'inherit', // Allow user interaction with editor
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: 'Interactive operation completed',
        });
      } else {
        resolve({
          success: false,
          output: '',
          error: `Interactive operation exited with code ${code}`,
        });
      }
    });

    gitProcess.on('error', (error) => {
      resolve({
        success: false,
        output: '',
        error: error.message,
      });
    });
  });
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
export async function createCommit(message: string, cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('commit', ['-m', message], cwd);
}

/**
 * Create a new branch
 */
export async function createBranch(branchName: string, cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('branch', [branchName], cwd);
}

/**
 * Switch to a branch
 */
export async function switchBranch(branchName: string, cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('checkout', [branchName], cwd);
}

/**
 * Get git log
 */
export async function getGitLog(maxCount = 10, cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('log', ['--oneline', `-n${maxCount}`], cwd);
}

/**
 * Get git diff for staged changes
 */
export async function getStagedDiff(cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('diff', ['--cached'], cwd);
}

/**
 * Get git diff stats for staged changes (summary only)
 */
export async function getStagedDiffStat(cwd?: string): Promise<GitOperationResult> {
  return executeGitCommand('diff', ['--cached', '--stat'], cwd);
}

/**
 * Get list of changed files
 */
export async function getChangedFiles(cwd?: string): Promise<string[]> {
  const result = await executeGitCommand('diff', ['--cached', '--name-only'], cwd);
  if (result.success) {
    return result.output.split('\n').filter((line) => line.trim());
  }
  return [];
}
