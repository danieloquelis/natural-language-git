export {
  loadHistory,
  saveHistory,
  addHistoryEntry,
  getRecentHistory,
  getHistoryEntry,
  clearHistory,
  getLastOperations,
} from './history.js';

export type { HistoryEntry, HistoryStorage } from './history-common.js';
export { MAX_HISTORY_ENTRIES } from './history-common.js';
