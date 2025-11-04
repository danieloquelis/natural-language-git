#!/usr/bin/env node

import {
  IntentType,
  generateCommitMessage,
  getNonGitResponse,
  parseUserPrompt,
} from './agent/index.js';
import { cleanupOldLogs } from './config/index.js';
import { getChangedFiles, getStagedDiff, isGitRepository } from './git-operations/index.js';
import { OperationSafety, executeGitCommand } from './git-operations/index.js';
import { addHistoryEntry } from './history/index.js';
import { handleInteractiveRebase, parseRebaseCommand } from './interactive-rebase/index.js';
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
import { getVersion } from './version.js';

/**
 * Show version information
 */
function showVersion() {
  console.log(`nlgit version ${getVersion()}`);
  console.log('Copyright (c) 2025 Daniel Oquelis');
  console.log('MIT License');
}

/**
 * Show help information
 */
function showHelp() {
  console.log('nlgit - Natural Language Git');
  console.log();
  console.log('Usage:');
  console.log('  nlgit "<natural language command>"');
  console.log('  nlgit                                Interactive mode');
  console.log('  nlgit --help                         Show this help');
  console.log('  nlgit --version                      Show version');
  console.log();
  console.log('Examples:');
  console.log('  nlgit "show me the status"');
  console.log('  nlgit "create a branch called feature-x"');
  console.log('  nlgit "commit all changes with message \'fix bug\'"');
  console.log('  nlgit "show last 5 commits"');
  console.log();
  console.log('For more information, visit: https://github.com/danieloquelis/natural-language-git');
}

/**
 * Determine the safety level of a single git command
 */
function getCommandSafety(command: string): OperationSafety {
  const lowerCmd = command.toLowerCase();

  // Check for cloud operations (highest priority)
  if (lowerCmd.includes('push') || lowerCmd.includes('pull') || lowerCmd.includes('clone')) {
    return OperationSafety.CLOUD;
  }

  // Check for destructive operations
  if (
    lowerCmd.includes('reset') ||
    lowerCmd.includes('clean') ||
    lowerCmd.includes('checkout') ||
    lowerCmd.includes('rebase') ||
    lowerCmd.includes('merge') ||
    lowerCmd.includes('cherry-pick') ||
    lowerCmd.includes('revert') ||
    lowerCmd.includes('rm ') ||
    lowerCmd.includes('branch -d') ||
    lowerCmd.includes('branch -D') ||
    lowerCmd.includes('stash drop') ||
    lowerCmd.includes('stash clear')
  ) {
    return OperationSafety.DESTRUCTIVE;
  }

  // Default to safe
  return OperationSafety.SAFE;
}

/**
 * Handle graceful exit on Ctrl+C
 */
function setupGracefulExit() {
  process.on('SIGINT', () => {
    console.log('\n');
    displayInfo('Operation cancelled by user.');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n');
    displayInfo('Operation terminated.');
    process.exit(0);
  });
}

/**
 * Main CLI function
 */
async function main() {
  // Setup graceful exit handlers
  setupGracefulExit();

  // Handle CLI flags
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
  }

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

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

    // Get user input from arguments or prompt
    const commandArgs = process.argv.slice(2);
    let userPrompt: string;

    if (commandArgs.length > 0) {
      // Command provided as argument (flags already handled above)
      userPrompt = commandArgs.join(' ');
    } else {
      // No argument provided, prompt the user
      userPrompt = await getTextInput('What would you like to do?');
    }

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

      // Execute commands
      let allSuccess = true;
      const outputs: string[] = [];

      for (const cmd of intent.gitCommands) {
        // Parse the git command properly
        // Commands come in format: "git <subcommand> [args...]"
        const trimmedCmd = cmd.trim();

        // Remove 'git ' prefix if present
        const commandWithoutGit = trimmedCmd.startsWith('git ')
          ? trimmedCmd.substring(4).trim()
          : trimmedCmd;

        // Check for interactive rebase - use custom UI instead of vim
        if (
          commandWithoutGit.includes('rebase -i') ||
          commandWithoutGit.includes('rebase --interactive')
        ) {
          const commitCount = parseRebaseCommand(commandWithoutGit);

          if (commitCount) {
            const rebaseResult = await handleInteractiveRebase(commitCount);

            if (rebaseResult.success) {
              console.log();
              displaySuccess('Rebase completed successfully!');
              if (rebaseResult.finalMessage) {
                displayInfo(`Combined commit message: ${rebaseResult.finalMessage}`);
              }
            } else {
              console.log();
              displayError('Rebase failed');
              if (rebaseResult.error) {
                displayInfo(rebaseResult.error);
              }
            }

            process.exit(rebaseResult.success ? 0 : 1);
          } else {
            displayError('Could not parse rebase command');
            process.exit(1);
          }
        }

        // Split into command and args, handling quoted strings
        const parts = commandWithoutGit.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const gitCommand = parts[0] || '';
        const args = parts.slice(1).map((arg) => arg.replace(/^"|"$/g, '')); // Remove quotes

        // Check for commit command with empty or missing message (BEFORE safety check)
        // This ensures user sees and approves the commit message before being asked about subsequent operations
        if (gitCommand === 'commit' && (args.includes('-m') || args.includes('--message'))) {
          const messageIndex = args.findIndex((arg) => arg === '-m' || arg === '--message');
          const message = args[messageIndex + 1] || '';

          // If message is empty or very short, generate a better one
          if (!message || message.trim() === '' || message.trim().length < 3) {
            console.log();
            const spinner = createSpinner('Analyzing changes to generate commit message...');
            spinner.start();

            try {
              const changedFiles = await getChangedFiles();
              const diffResult = await getStagedDiff();

              if (changedFiles.length > 0) {
                const generatedMessage = await generateCommitMessage(
                  changedFiles,
                  diffResult.output
                );

                spinner.succeed('Generated commit message');
                console.log();
                displayInfo('Suggested commit message:');
                displayCode(`  ${generatedMessage}`);
                console.log();

                const useGenerated = await askConfirmation('Use this message?', true);

                if (useGenerated) {
                  // Replace the message in args
                  args[messageIndex + 1] = generatedMessage;
                } else {
                  // Ask user for custom message
                  const customMessage = await getTextInput(
                    'Enter commit message:',
                    generatedMessage
                  );
                  args[messageIndex + 1] = customMessage;
                }
              } else {
                spinner.fail('No staged changes to analyze');
              }
            } catch (error) {
              spinner.fail('Failed to generate message');
            }
          }
        }

        // Determine safety level of this specific command and ask for confirmation
        // This happens AFTER commit message generation so user knows what they're committing
        const commandSafety = getCommandSafety(trimmedCmd);

        if (
          commandSafety === OperationSafety.DESTRUCTIVE ||
          commandSafety === OperationSafety.CLOUD
        ) {
          console.log();
          displayInfo(`Next operation: ${trimmedCmd}`);

          const warningMessage =
            commandSafety === OperationSafety.CLOUD
              ? 'This operation will interact with remote repositories.'
              : 'This operation may be destructive.';

          displayWarning(warningMessage);

          const confirmed = await askConfirmation('Proceed with this operation?', false);

          if (!confirmed) {
            displayInfo('Operation cancelled. Stopping execution.');
            break; // Stop executing remaining commands
          }
          console.log();
        }

        // Mark as interactive if it's an interactive command
        const isInteractive =
          commandWithoutGit.includes('rebase -i') ||
          commandWithoutGit.includes('rebase --interactive');

        const result = await executeGitCommand(gitCommand, args, undefined, isInteractive);

        if (result.success) {
          outputs.push(result.output);
        } else {
          allSuccess = false;

          // Provide user-friendly error messages
          console.log();
          displayError('Operation failed');

          if (result.error) {
            // Check for common git errors and provide helpful messages
            if (result.error.includes('not have any commits yet')) {
              displayInfo('This repository has no commits yet. Try creating your first commit:');
              displayCode('  git add <files>');
              displayCode('  git commit -m "Initial commit"');
            } else if (result.error.includes('unknown revision')) {
              displayInfo('This appears to be a newly initialized repository with no commits.');
              displayInfo('Create at least one commit before using this command.');
            } else if (result.error.includes('not a git repository')) {
              displayInfo('This directory is not a git repository.');
              displayInfo('Initialize one with: git init');
            } else {
              // Show the raw error for other cases
              displayInfo('Git error:');
              displayCode(result.error);
            }
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

        // Show output if any and not empty
        const combinedOutput = outputs.join('\n').trim();
        if (combinedOutput) {
          console.log();

          // Provide human-readable summary instead of raw git output
          // Check if output is just a status/branch name/simple response
          const lines = combinedOutput.split('\n').filter((line) => line.trim());

          if (lines.length <= 3 && combinedOutput.length < 200) {
            // Short output - show directly with formatting
            displayInfo('Result:');
            for (const line of lines) {
              console.log(`  ${line}`);
            }
          } else {
            // Longer output - show with code formatting
            displayInfo('Git output:');
            displayCode(combinedOutput);
          }
        } else {
          // No output, provide context-based message
          displayInfo(intent.description || 'Changes applied successfully.');
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
