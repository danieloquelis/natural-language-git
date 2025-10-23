import type { PathLike } from 'node:fs';

/**
 * Configuration structure stored in .nlgit/config.json
 */
export type NLGitConfig = {
  selectedModel: string | null;
  lastUsed: string | null;
};

/**
 * Paths used by the application
 */
export type ConfigPaths = {
  cacheDir: PathLike;
  configFile: PathLike;
  modelsDir: PathLike;
  historyFile: PathLike;
  logsDir: PathLike;
};

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: NLGitConfig = {
  selectedModel: null,
  lastUsed: null,
};

/**
 * Cache directory name
 */
export const CACHE_DIR_NAME = '.nlgit';

/**
 * Log retention period in milliseconds (24 hours)
 */
export const LOG_RETENTION_MS = 24 * 60 * 60 * 1000;
