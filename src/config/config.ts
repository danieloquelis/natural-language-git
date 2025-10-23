import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ConfigPaths, NLGitConfig } from './config-common.js';
import { CACHE_DIR_NAME, DEFAULT_CONFIG, LOG_RETENTION_MS } from './config-common.js';

/**
 * Get all configuration paths
 */
export function getConfigPaths(): ConfigPaths {
  const cacheDir = join(homedir(), CACHE_DIR_NAME);
  return {
    cacheDir,
    configFile: join(cacheDir, 'config.json'),
    modelsDir: join(cacheDir, 'models'),
    historyFile: join(cacheDir, 'history.json'),
    logsDir: join(cacheDir, 'logs'),
  };
}

/**
 * Initialize the configuration directory structure
 */
export async function initializeConfig(): Promise<void> {
  const paths = getConfigPaths();

  // Create cache directory
  if (!existsSync(paths.cacheDir)) {
    await mkdir(paths.cacheDir, { recursive: true });
  }

  // Create models directory
  if (!existsSync(paths.modelsDir)) {
    await mkdir(paths.modelsDir, { recursive: true });
  }

  // Create logs directory
  if (!existsSync(paths.logsDir)) {
    await mkdir(paths.logsDir, { recursive: true });
  }

  // Create config file if it doesn't exist
  if (!existsSync(paths.configFile)) {
    await writeFile(paths.configFile, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }

  // Create history file if it doesn't exist
  if (!existsSync(paths.historyFile)) {
    await writeFile(paths.historyFile, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * Read the configuration file
 */
export async function readConfig(): Promise<NLGitConfig> {
  const paths = getConfigPaths();

  try {
    const content = await readFile(paths.configFile, 'utf-8');
    return JSON.parse(content) as NLGitConfig;
  } catch {
    // If reading fails, return default config
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Write the configuration file
 */
export async function writeConfig(config: NLGitConfig): Promise<void> {
  const paths = getConfigPaths();
  await writeFile(paths.configFile, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Update specific configuration values
 */
export async function updateConfig(updates: Partial<NLGitConfig>): Promise<void> {
  const current = await readConfig();
  const updated = { ...current, ...updates };
  await writeConfig(updated);
}

/**
 * Clean up old log files (older than 24 hours)
 */
export async function cleanupOldLogs(): Promise<void> {
  const paths = getConfigPaths();

  if (!existsSync(paths.logsDir)) {
    return;
  }

  const now = Date.now();
  const files = await readdir(paths.logsDir);

  for (const file of files) {
    const filePath = join(paths.logsDir.toString(), file);
    const stats = await stat(filePath);

    // Delete if older than retention period
    if (now - stats.mtimeMs > LOG_RETENTION_MS) {
      await unlink(filePath);
    }
  }
}
