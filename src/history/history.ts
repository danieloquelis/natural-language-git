import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { getConfigPaths } from '../config/index.js';
import type { HistoryEntry, HistoryStorage } from './history-common.js';
import { MAX_HISTORY_ENTRIES } from './history-common.js';

/**
 * Load history from file
 */
export async function loadHistory(): Promise<HistoryStorage> {
  const paths = getConfigPaths();

  if (!existsSync(paths.historyFile)) {
    return [];
  }

  try {
    const content = await readFile(paths.historyFile, 'utf-8');
    return JSON.parse(content) as HistoryStorage;
  } catch {
    return [];
  }
}

/**
 * Save history to file
 */
export async function saveHistory(history: HistoryStorage): Promise<void> {
  const paths = getConfigPaths();

  // Keep only the last MAX_HISTORY_ENTRIES
  const trimmedHistory = history.slice(-MAX_HISTORY_ENTRIES);

  await writeFile(paths.historyFile, JSON.stringify(trimmedHistory, null, 2), 'utf-8');
}

/**
 * Add a new entry to history
 */
export async function addHistoryEntry(
  userPrompt: string,
  gitCommands: string[],
  success: boolean,
  output?: string,
  error?: string
): Promise<void> {
  const history = await loadHistory();

  const entry: HistoryEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    userPrompt,
    gitCommands,
    success,
    output,
    error,
  };

  history.push(entry);
  await saveHistory(history);
}

/**
 * Get recent history entries
 */
export async function getRecentHistory(count = 10): Promise<HistoryEntry[]> {
  const history = await loadHistory();
  return history.slice(-count).reverse();
}

/**
 * Get a specific history entry by ID
 */
export async function getHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const history = await loadHistory();
  return history.find((entry) => entry.id === id) || null;
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}

/**
 * Get the last N operations for revert functionality
 */
export async function getLastOperations(count = 1): Promise<HistoryEntry[]> {
  const history = await loadHistory();
  return history.slice(-count).reverse();
}
