import { select, confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { getRandomLoadingMessage, ASCII_LOGO } from './ui-common.js';

/**
 * Display the welcome screen with ASCII logo
 */
export function displayWelcome(): void {
  console.log(chalk.cyan(ASCII_LOGO));
  console.log(chalk.bold('Natural Language Git\n'));
  console.log('Interact with Git using natural language\n');
}

/**
 * Create a spinner with a random loading message
 */
export function createSpinner(customMessage?: string): Ora {
  const message = customMessage || getRandomLoadingMessage();
  return ora({
    text: message,
    spinner: 'dots',
  });
}

/**
 * Display a success message
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Display an error message
 */
export function displayError(message: string): void {
  console.log(chalk.red('✗'), message);
}

/**
 * Display a warning message
 */
export function displayWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Display an info message
 */
export function displayInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Prompt user to select from a list
 */
export async function selectFromList<T extends string>(
  message: string,
  choices: Array<{ value: T; name: string; description?: string }>
): Promise<T> {
  return select({
    message,
    choices,
  });
}

/**
 * Ask for confirmation
 */
export async function askConfirmation(message: string, defaultValue = false): Promise<boolean> {
  return confirm({
    message,
    default: defaultValue,
  });
}

/**
 * Get text input from user
 */
export async function getTextInput(message: string, defaultValue?: string): Promise<string> {
  return input({
    message,
    default: defaultValue,
  });
}

/**
 * Display a section header
 */
export function displayHeader(text: string): void {
  console.log();
  console.log(chalk.bold.underline(text));
  console.log();
}

/**
 * Display formatted code/command output
 */
export function displayCode(code: string): void {
  console.log(chalk.dim(code));
}

/**
 * Clear the console
 */
export function clearConsole(): void {
  console.clear();
}
