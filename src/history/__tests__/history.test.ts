import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import type { HistoryEntry } from '../history-common.js';
import { MAX_HISTORY_ENTRIES } from '../history-common.js';
import {
  addHistoryEntry,
  clearHistory,
  getHistoryEntry,
  getLastOperations,
  getRecentHistory,
  loadHistory,
  saveHistory,
} from '../history.js';

// Mock modules
jest.mock('node:crypto');
jest.mock('node:fs');
jest.mock('node:fs/promises');
jest.mock('../../config/index.js', () => ({
  getConfigPaths: jest.fn(),
}));

const mockRandomUUID = randomUUID as unknown as Mock<() => string>;
const mockExistsSync = existsSync as unknown as Mock<typeof existsSync>;
const mockReadFile = readFile as unknown as Mock<typeof readFile>;
const mockWriteFile = writeFile as unknown as Mock<typeof writeFile>;

// Import after mocking
import { getConfigPaths } from '../../config/index.js';
const mockGetConfigPaths = getConfigPaths as unknown as Mock<typeof getConfigPaths>;

describe('history module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfigPaths.mockReturnValue({
      cacheDir: '/home/test/.nlgit',
      configFile: '/home/test/.nlgit/config.json',
      modelsDir: '/home/test/.nlgit/models',
      historyFile: '/home/test/.nlgit/history.json',
      logsDir: '/home/test/.nlgit/logs',
    });
  });

  describe('loadHistory', () => {
    it('should load history from file', async () => {
      const historyData: HistoryEntry[] = [
        {
          id: '123',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'show status',
          gitCommands: ['git status'],
          success: true,
          output: 'On branch main',
        },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(historyData));

      const history = await loadHistory();

      expect(history).toEqual(historyData);
    });

    it('should return empty array when file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const history = await loadHistory();

      expect(history).toEqual([]);
    });

    it('should return empty array on parse error', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue('invalid json');

      const history = await loadHistory();

      expect(history).toEqual([]);
    });

    it('should return empty array on read error', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockRejectedValue(new Error('Read error'));

      const history = await loadHistory();

      expect(history).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('should save history to file', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const history: HistoryEntry[] = [
        {
          id: '123',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'show status',
          gitCommands: ['git status'],
          success: true,
        },
      ];

      await saveHistory(history);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/home/test/.nlgit/history.json',
        JSON.stringify(history, null, 2),
        'utf-8'
      );
    });

    it('should trim history to MAX_HISTORY_ENTRIES', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const history: HistoryEntry[] = [];
      for (let i = 0; i < MAX_HISTORY_ENTRIES + 10; i++) {
        history.push({
          id: `${i}`,
          timestamp: new Date(2024, 0, i).toISOString(),
          userPrompt: `prompt ${i}`,
          gitCommands: ['git status'],
          success: true,
        });
      }

      await saveHistory(history);

      const writeCall = mockWriteFile.mock.calls[0];
      const savedHistory = JSON.parse(writeCall[1] as string);

      expect(savedHistory.length).toBe(MAX_HISTORY_ENTRIES);
      expect(savedHistory[0].id).toBe('10'); // First 10 should be trimmed
    });

    it('should keep only most recent entries', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const history: HistoryEntry[] = [
        {
          id: 'old',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'old',
          gitCommands: [],
          success: true,
        },
        {
          id: 'new',
          timestamp: '2024-01-02T00:00:00.000Z',
          userPrompt: 'new',
          gitCommands: [],
          success: true,
        },
      ];

      await saveHistory(history);

      const writeCall = mockWriteFile.mock.calls[0];
      const savedHistory = JSON.parse(writeCall[1] as string);

      expect(savedHistory[savedHistory.length - 1].id).toBe('new');
    });
  });

  describe('addHistoryEntry', () => {
    it('should add new entry to history', async () => {
      mockRandomUUID.mockReturnValue('test-uuid');
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify([]));
      mockWriteFile.mockResolvedValue(undefined);

      const realDate = Date;
      const mockDate = jest.fn(() => ({
        toISOString: () => '2024-01-01T00:00:00.000Z',
      })) as unknown as DateConstructor;
      global.Date = mockDate;

      await addHistoryEntry('show status', ['git status'], true, 'On branch main');

      global.Date = realDate;

      const writeCall = mockWriteFile.mock.calls[0];
      const savedHistory = JSON.parse(writeCall[1] as string);

      expect(savedHistory).toHaveLength(1);
      expect(savedHistory[0]).toMatchObject({
        id: 'test-uuid',
        timestamp: '2024-01-01T00:00:00.000Z',
        userPrompt: 'show status',
        gitCommands: ['git status'],
        success: true,
        output: 'On branch main',
      });
    });

    it('should add entry with error', async () => {
      mockRandomUUID.mockReturnValue('error-uuid');
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify([]));
      mockWriteFile.mockResolvedValue(undefined);

      const realDate = Date;
      const mockDate = jest.fn(() => ({
        toISOString: () => '2024-01-01T00:00:00.000Z',
      })) as unknown as DateConstructor;
      global.Date = mockDate;

      await addHistoryEntry('invalid command', ['git invalid'], false, undefined, 'Command failed');

      global.Date = realDate;

      const writeCall = mockWriteFile.mock.calls[0];
      const savedHistory = JSON.parse(writeCall[1] as string);

      expect(savedHistory[0]).toMatchObject({
        success: false,
        error: 'Command failed',
      });
    });

    it('should append to existing history', async () => {
      const existingHistory: HistoryEntry[] = [
        {
          id: 'existing',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'old prompt',
          gitCommands: ['git log'],
          success: true,
        },
      ];

      mockRandomUUID.mockReturnValue('new-uuid');
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(existingHistory));
      mockWriteFile.mockResolvedValue(undefined);

      const realDate = Date;
      const mockDate = jest.fn(() => ({
        toISOString: () => '2024-01-02T00:00:00.000Z',
      })) as unknown as DateConstructor;
      global.Date = mockDate;

      await addHistoryEntry('new prompt', ['git status'], true);

      global.Date = realDate;

      const writeCall = mockWriteFile.mock.calls[0];
      const savedHistory = JSON.parse(writeCall[1] as string);

      expect(savedHistory).toHaveLength(2);
      expect(savedHistory[0].id).toBe('existing');
      expect(savedHistory[1].id).toBe('new-uuid');
    });
  });

  describe('getRecentHistory', () => {
    it('should return recent entries in reverse order', async () => {
      const history: HistoryEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'first',
          gitCommands: [],
          success: true,
        },
        {
          id: '2',
          timestamp: '2024-01-02T00:00:00.000Z',
          userPrompt: 'second',
          gitCommands: [],
          success: true,
        },
        {
          id: '3',
          timestamp: '2024-01-03T00:00:00.000Z',
          userPrompt: 'third',
          gitCommands: [],
          success: true,
        },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(history));

      const recent = await getRecentHistory(10);

      expect(recent[0].id).toBe('3');
      expect(recent[1].id).toBe('2');
      expect(recent[2].id).toBe('1');
    });

    it('should limit results to count parameter', async () => {
      const history: HistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        userPrompt: `prompt ${i}`,
        gitCommands: [],
        success: true,
      }));

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(history));

      const recent = await getRecentHistory(5);

      expect(recent).toHaveLength(5);
      expect(recent[0].id).toBe('19');
    });

    it('should use default count of 10', async () => {
      const history: HistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        userPrompt: `prompt ${i}`,
        gitCommands: [],
        success: true,
      }));

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(history));

      const recent = await getRecentHistory();

      expect(recent).toHaveLength(10);
    });
  });

  describe('getHistoryEntry', () => {
    it('should find entry by ID', async () => {
      const history: HistoryEntry[] = [
        {
          id: 'target',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'target prompt',
          gitCommands: [],
          success: true,
        },
        {
          id: 'other',
          timestamp: '2024-01-02T00:00:00.000Z',
          userPrompt: 'other prompt',
          gitCommands: [],
          success: true,
        },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(history));

      const entry = await getHistoryEntry('target');

      expect(entry).not.toBeNull();
      expect(entry?.userPrompt).toBe('target prompt');
    });

    it('should return null when ID not found', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify([]));

      const entry = await getHistoryEntry('nonexistent');

      expect(entry).toBeNull();
    });
  });

  describe('clearHistory', () => {
    it('should save empty array', async () => {
      mockWriteFile.mockResolvedValue(undefined);

      await clearHistory();

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/home/test/.nlgit/history.json',
        JSON.stringify([], null, 2),
        'utf-8'
      );
    });
  });

  describe('getLastOperations', () => {
    it('should return last N operations in reverse order', async () => {
      const history: HistoryEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'first',
          gitCommands: [],
          success: true,
        },
        {
          id: '2',
          timestamp: '2024-01-02T00:00:00.000Z',
          userPrompt: 'second',
          gitCommands: [],
          success: true,
        },
        {
          id: '3',
          timestamp: '2024-01-03T00:00:00.000Z',
          userPrompt: 'third',
          gitCommands: [],
          success: true,
        },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(history));

      const last = await getLastOperations(2);

      expect(last).toHaveLength(2);
      expect(last[0].id).toBe('3');
      expect(last[1].id).toBe('2');
    });

    it('should default to 1 operation', async () => {
      const history: HistoryEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00.000Z',
          userPrompt: 'first',
          gitCommands: [],
          success: true,
        },
        {
          id: '2',
          timestamp: '2024-01-02T00:00:00.000Z',
          userPrompt: 'second',
          gitCommands: [],
          success: true,
        },
      ];

      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(JSON.stringify(history));

      const last = await getLastOperations();

      expect(last).toHaveLength(1);
      expect(last[0].id).toBe('2');
    });
  });
});
