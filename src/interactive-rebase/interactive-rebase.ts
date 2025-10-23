import { exec } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  askConfirmation,
  displayCode,
  displayInfo,
  getTextInput,
  selectFromList,
} from '../ui/index.js';
import type { InteractiveRebaseResult, RebaseCommit } from './interactive-rebase-common.js';
import { RebaseAction } from './interactive-rebase-common.js';

const execPromise = promisify(exec);

/**
 * Get list of commits for rebase
 */
async function getRebaseCommits(count: number, cwd?: string): Promise<RebaseCommit[]> {
  const { stdout } = await execPromise(`git log -${count} --format=%H|%h|%s`, {
    cwd: cwd || process.cwd(),
  });

  const commits = stdout
    .trim()
    .split('\n')
    .map((line) => {
      const [hash, shortHash, message] = line.split('|');
      return {
        hash,
        shortHash,
        message,
        action: RebaseAction.PICK,
      };
    })
    .reverse(); // Oldest first (rebase order)

  return commits;
}

/**
 * Handle interactive rebase with custom UI
 */
export async function handleInteractiveRebase(
  commitCount: number,
  cwd?: string
): Promise<InteractiveRebaseResult> {
  try {
    console.log();
    displayInfo(`Interactive rebase for last ${commitCount} commits`);
    console.log();

    // Get commits
    const commits = await getRebaseCommits(commitCount, cwd);

    if (commits.length === 0) {
      return {
        success: false,
        error: 'No commits found',
      };
    }

    // Show commits and let user choose actions
    displayInfo('Current commits (oldest to newest):');
    console.log();

    for (const commit of commits) {
      displayCode(`  ${commit.shortHash} ${commit.message}`);
    }

    console.log();

    // Detect if this is a squash operation
    const wantToSquash = await askConfirmation(
      'Do you want to squash/combine commits?',
      true
    );

    if (!wantToSquash) {
      return {
        success: false,
        error: 'Operation cancelled',
      };
    }

    // For squash, mark all but first as squash
    commits[0].action = RebaseAction.PICK; // Keep first
    for (let i = 1; i < commits.length; i++) {
      commits[i].action = RebaseAction.SQUASH;
    }

    // Ask for final commit message
    displayInfo('Select commit message for the combined commit:');
    console.log();

    const messageChoices = [
      ...commits.map((c, idx) => ({
        value: `commit-${idx}`,
        name: c.message,
        description: `Use message from ${c.shortHash}`,
      })),
      {
        value: 'custom',
        name: 'Write custom message',
        description: 'Enter a new commit message',
      },
    ];

    const messageChoice = await selectFromList(
      'Choose commit message:',
      messageChoices
    );

    let finalMessage: string;

    if (messageChoice === 'custom') {
      finalMessage = await getTextInput(
        'Enter commit message:',
        commits[0].message
      );
    } else {
      const idx = Number.parseInt(messageChoice.split('-')[1]);
      finalMessage = commits[idx].message;
    }

    // Create rebase todo file
    const rebaseTodo = commits
      .map((c) => `${c.action} ${c.hash} ${c.message}`)
      .join('\n');

    const todoFile = join(tmpdir(), `nlgit-rebase-${Date.now()}`);
    await writeFile(todoFile, rebaseTodo, 'utf-8');

    // Execute rebase with our todo file
    displayInfo('Executing rebase...');
    console.log();

    const baseCommit = commits[0].hash;
    const rebaseCmd = `git rebase -i ${baseCommit}~1`;

    // Set environment variables to use our editor script
    const env = {
      ...process.env,
      GIT_SEQUENCE_EDITOR: `cat ${todoFile} >`,
      GIT_EDITOR: `echo "${finalMessage}" >`,
    };

    await execPromise(rebaseCmd, {
      cwd: cwd || process.cwd(),
      env,
    });

    return {
      success: true,
      finalMessage,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse rebase command to extract commit count
 */
export function parseRebaseCommand(command: string): number | null {
  // Match patterns like: rebase -i HEAD~2, rebase -i HEAD~10
  const match = command.match(/HEAD~(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}
