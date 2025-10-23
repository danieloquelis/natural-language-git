#!/usr/bin/env node

import { IntentType, getNonGitResponse, parseUserPrompt } from './agent/index.js';
import { cleanupOldLogs } from './config/index.js';
import { isGitRepository } from './git-operations/index.js';
import { OperationSafety, executeGitCommand } from './git-operations/index.js';
import { addHistoryEntry } from './history/index.js';
import { ensureOnboarding } from './onboarding/index.js';
import {
  askConfirmation,
  createSpinner,
  displayCode,
  displayError,
  displayInfo,
  displaySuccess,
  displayWarning,
  getTextInput,
} from './ui/index.js';

/**
 * Main CLI function
 */
async function main() {
  try {
    // Clean up old logs on startup
    await cleanupOldLogs().catch(() => {
      // Silently fail if cleanup fails
    });

    // Ensure onboarding is complete
    const onboardingSuccess = await ensureOnboarding();

    if (!onboardingSuccess) {
      displayError('Onboarding failed. Please try again.');
      process.exit(1);
    }

    // Check if we're in a git repository
    const isGitRepo = await isGitRepository();

    if (!isGitRepo) {
      displayWarning('Not in a git repository!');
      displayInfo('NLGit works best inside a git repository.');

      const shouldContinue = await askConfirmation('Continue anyway?', false);

      if (!shouldContinue) {
        process.exit(0);
      }
    }

    // Get user input
    const userPrompt = await getTextInput('What would you like to do?');

    if (!userPrompt.trim()) {
      displayInfo('No input provided. Exiting.');
      process.exit(0);
    }

    // Parse the user prompt
    const spinner = createSpinner('Understanding your request...');
    spinner.start();

    const intent = await parseUserPrompt(userPrompt);

    spinner.stop();

    // Handle non-git requests
    if (intent.type === IntentType.NON_GIT) {
      console.log();
      console.log(getNonGitResponse());
      process.exit(0);
    }

    // Handle git operations
    if (intent.type === IntentType.GIT_OPERATION && intent.gitCommands) {
      console.log();
      displayInfo(`I'll execute: ${intent.description || 'Git operation'}`);
      console.log();

      // Show the commands
      for (const cmd of intent.gitCommands) {
        displayCode(`  ${cmd}`);
      }
      console.log();

      // Check safety level
      const requiresConfirmation =
        intent.safety === OperationSafety.DESTRUCTIVE || intent.safety === OperationSafety.CLOUD;

      if (requiresConfirmation) {
        const warningMessage =
          intent.safety === OperationSafety.CLOUD
            ? 'This operation will interact with remote repositories.'
            : 'This operation may be destructive.';

        displayWarning(warningMessage);

        const confirmed = await askConfirmation('Proceed?', false);

        if (!confirmed) {
          displayInfo('Operation cancelled.');
          process.exit(0);
        }
      }

      // Execute commands
      let allSuccess = true;
      const outputs: string[] = [];

      for (const cmd of intent.gitCommands) {
        const parts = cmd.split(' ');
        const gitCommand = parts[1]; // Skip 'git'
        const args = parts.slice(2);

        const result = await executeGitCommand(gitCommand, args);

        if (result.success) {
          outputs.push(result.output);
        } else {
          allSuccess = false;
          displayError(`Command failed: ${cmd}`);
          if (result.error) {
            displayCode(result.error);
          }
          break;
        }
      }

      // Record in history
      await addHistoryEntry(
        userPrompt,
        intent.gitCommands,
        allSuccess,
        outputs.join('\n'),
        allSuccess ? undefined : 'Command execution failed'
      );

      if (allSuccess) {
        console.log();
        displaySuccess('Operation completed successfully!');

        // Show output if any
        const combinedOutput = outputs.join('\n').trim();
        if (combinedOutput) {
          console.log();
          displayCode(combinedOutput);
        }
      }

      process.exit(allSuccess ? 0 : 1);
    }

    // Handle other intent types
    if (intent.type === IntentType.HELP) {
      displayInfo('NLGit - Natural Language Git Interface');
      displayInfo("Just describe what you want to do with git, and I'll help!");
      process.exit(0);
    }

    // Unknown intent
    displayWarning("I'm not sure how to help with that.");
    displayInfo('Try describing a git operation, like "show status" or "create a branch"');
    process.exit(0);
  } catch (error) {
    displayError('An unexpected error occurred:');
    console.error(error);
    process.exit(1);
  }
}

// Run the CLI
main();
