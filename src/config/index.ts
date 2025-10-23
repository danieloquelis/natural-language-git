export {
  getConfigPaths,
  initializeConfig,
  readConfig,
  writeConfig,
  updateConfig,
  cleanupOldLogs,
} from './config.js';

export type { NLGitConfig, ConfigPaths } from './config-common.js';
export { DEFAULT_CONFIG, CACHE_DIR_NAME, LOG_RETENTION_MS } from './config-common.js';
