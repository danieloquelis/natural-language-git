/**
 * A single operation in history
 */
export type HistoryEntry = {
  id: string;
  timestamp: string;
  userPrompt: string;
  gitCommands: string[];
  success: boolean;
  output?: string;
  error?: string;
};

/**
 * History storage structure
 */
export type HistoryStorage = HistoryEntry[];

/**
 * Maximum number of history entries to keep in memory
 */
export const MAX_HISTORY_ENTRIES = 50;
