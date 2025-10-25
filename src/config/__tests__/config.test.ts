import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { CACHE_DIR_NAME, DEFAULT_CONFIG, LOG_RETENTION_MS } from '../config-common.js';
import {
  cleanupOldLogs,
  getConfigPaths,
  initializeConfig,
  readConfig,
  updateConfig,
  writeConfig,
} from '../config.js';

// Mock node:fs and node:fs/promises
jest.mock('node:fs');
jest.mock('node:fs/promises');
jest.mock('node:os');

const mockExistsSync = existsSync as unknown as Mock<typeof existsSync>;
const mockMkdir = mkdir as unknown as Mock<typeof mkdir>;
const mockReadFile = readFile as unknown as Mock<typeof readFile>;
const mockWriteFile = writeFile as unknown as Mock<typeof writeFile>;
const mockReaddir = readdir as unknown as Mock<typeof readdir>;
const mockStat = stat as unknown as Mock<typeof stat>;
const mockUnlink = unlink as unknown as Mock<typeof unlink>;
const mockHomedir = homedir as unknown as Mock<typeof homedir>;

describe('config module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHomedir.mockReturnValue('/home/test');
  });

  describe('getConfigPaths', () => {
    it('should return correct paths', () => {
      const paths = getConfigPaths();

      expect(paths.cacheDir).toBe(join('/home/test', CACHE_DIR_NAME));
      expect(paths.configFile).toBe(join('/home/test', CACHE_DIR_NAME, 'config.json'));
      expect(paths.modelsDir).toBe(join('/home/test', CACHE_DIR_NAME, 'models'));
      expect(paths.historyFile).toBe(join('/home/test', CACHE_DIR_NAME, 'history.json'));
      expect(paths.logsDir).toBe(join('/home/test', CACHE_DIR_NAME, 'logs'));
    });

    it('should use user home directory', () => {
      mockHomedir.mockReturnValue('/custom/home');

      const paths = getConfigPaths();

      expect(paths.cacheDir).toBe('/custom/home/.nlgit');
    });
  });

  describe('initializeConfig', () => {
    it('should create all directories when they do not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await initializeConfig();

      expect(mockMkdir).toHaveBeenCalledTimes(3);
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('.nlgit'),
        expect.objectContaining({ recursive: true })
      );
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('models'),
        expect.objectContaining({ recursive: true })
      );
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        expect.objectContaining({ recursive: true })
      );
    });

    it('should create config file with default values', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await initializeConfig();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        JSON.stringify(DEFAULT_CONFIG, null, 2),
        'utf-8'
      );
    });

    it('should create empty history file', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await initializeConfig();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('history.json'),
        JSON.stringify([], null, 2),
        'utf-8'
      );
    });

    it('should not recreate existing directories', async () => {
      mockExistsSync.mockReturnValue(true);
      mockMkdir.mockResolvedValue(undefined);

      await initializeConfig();

      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it('should not recreate existing files', async () => {
      mockExistsSync.mockReturnValue(true);
      mockWriteFile.mockResolvedValue(undefined);

      await initializeConfig();

      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('readConfig', () => {
    it('should read and parse config file', async () => {
      const configData = {
        selectedModel: 'llama-3-8b',
        lastUsed: '2024-01-01T00:00:00.000Z',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(configData));

      const config = await readConfig();

      expect(config).toEqual(configData);
      expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining('config.json'), 'utf-8');
    });

    it('should return default config on read error', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const config = await readConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should return default config on JSON parse error', async () => {
      mockReadFile.mockResolvedValue('invalid json');

      const config = await readConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('writeConfig', () => {
    it('should write config to file', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const config = {
        selectedModel: 'llama-3-8b',
        lastUsed: '2024-01-01T00:00:00.000Z',
      };

      await writeConfig(config);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    });

    it('should format JSON with indentation', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      await writeConfig(DEFAULT_CONFIG);

      const writeCall = mockWriteFile.mock.calls[0];
      const jsonContent = writeCall[1] as string;

      expect(jsonContent).toContain('\n');
      expect(jsonContent).toContain('  ');
    });
  });

  describe('updateConfig', () => {
    it('should merge updates with existing config', async () => {
      const existingConfig = {
        selectedModel: 'old-model',
        lastUsed: '2024-01-01T00:00:00.000Z',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(existingConfig));
      mockWriteFile.mockResolvedValue(undefined);

      await updateConfig({ selectedModel: 'new-model' });

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        expect.stringContaining('new-model'),
        'utf-8'
      );
    });

    it('should preserve unmodified fields', async () => {
      const existingConfig = {
        selectedModel: 'model-1',
        lastUsed: '2024-01-01T00:00:00.000Z',
      };

      mockReadFile.mockResolvedValue(JSON.stringify(existingConfig));
      mockWriteFile.mockResolvedValue(undefined);

      await updateConfig({ selectedModel: 'model-2' });

      const writeCall = mockWriteFile.mock.calls[0];
      const jsonContent = JSON.parse(writeCall[1] as string);

      expect(jsonContent.lastUsed).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle partial updates', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      mockWriteFile.mockResolvedValue(undefined);

      await updateConfig({ lastUsed: '2024-12-01T00:00:00.000Z' });

      const writeCall = mockWriteFile.mock.calls[0];
      const jsonContent = JSON.parse(writeCall[1] as string);

      expect(jsonContent.lastUsed).toBe('2024-12-01T00:00:00.000Z');
      expect(jsonContent.selectedModel).toBe(null);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than retention period', async () => {
      const now = Date.now();
      const oldTimestamp = now - LOG_RETENTION_MS - 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddir.mockResolvedValue(['old.log', 'recent.log'] as never);
      mockStat.mockImplementation(async (path) => {
        const fileName = (path as string).split('/').pop();
        return {
          mtimeMs: fileName === 'old.log' ? oldTimestamp : now,
        } as never;
      });
      mockUnlink.mockResolvedValue(undefined);

      await cleanupOldLogs();

      expect(mockUnlink).toHaveBeenCalledTimes(1);
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('old.log'));
    });

    it('should not delete recent logs', async () => {
      const now = Date.now();

      mockExistsSync.mockReturnValue(true);
      mockReaddir.mockResolvedValue(['recent1.log', 'recent2.log'] as never);
      mockStat.mockResolvedValue({
        mtimeMs: now - 1000,
      } as never);
      mockUnlink.mockResolvedValue(undefined);

      await cleanupOldLogs();

      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should handle missing logs directory', async () => {
      mockExistsSync.mockReturnValue(false);

      await cleanupOldLogs();

      expect(mockReaddir).not.toHaveBeenCalled();
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should handle empty logs directory', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddir.mockResolvedValue([] as never);

      await cleanupOldLogs();

      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should process multiple old files', async () => {
      const now = Date.now();
      const oldTimestamp = now - LOG_RETENTION_MS - 1000;

      mockExistsSync.mockReturnValue(true);
      mockReaddir.mockResolvedValue(['old1.log', 'old2.log', 'old3.log'] as never);
      mockStat.mockResolvedValue({
        mtimeMs: oldTimestamp,
      } as never);
      mockUnlink.mockResolvedValue(undefined);

      await cleanupOldLogs();

      expect(mockUnlink).toHaveBeenCalledTimes(3);
    });
  });
});
