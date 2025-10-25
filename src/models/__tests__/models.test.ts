import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import type { ModelsConfig } from '../models-common.js';

// Mock file system
const mockExistsSync = jest.fn();
const mockReadFile = jest.fn();
const mockGetConfigPaths = jest.fn();

jest.mock('node:fs', () => ({
  existsSync: mockExistsSync,
}));

jest.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}));

jest.mock('node:path', () => ({
  join: (...args: string[]) => args.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
}));

jest.mock('node:url', () => ({
  fileURLToPath: (url: string) => url.replace('file://', ''),
}));

jest.mock('../../config/index.js', () => ({
  getConfigPaths: mockGetConfigPaths,
}));

// Import after mocking
import {
  findModelById,
  getAvailableModels,
  getModelPath,
  isModelDownloaded,
  loadModelsConfig,
} from '../models.js';

describe('models module', () => {
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

  const mockModelsConfig: ModelsConfig = {
    models: [
      {
        id: 'llama-3-8b',
        name: 'Meta Llama 3 8B Instruct',
        description: 'High quality model',
        url: 'https://huggingface.co/model1.gguf',
        filename: 'llama-3-8b.gguf',
        size: '8 GB',
      },
      {
        id: 'mistral-7b',
        name: 'Mistral 7B Instruct',
        description: 'Fast and efficient',
        url: 'https://huggingface.co/model2.gguf',
        filename: 'mistral-7b.gguf',
        size: '2 GB',
      },
    ],
  };

  describe('loadModelsConfig', () => {
    it('should load and parse models.json', async () => {
      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify(mockModelsConfig));

      const config = await loadModelsConfig();

      expect(config).toEqual(mockModelsConfig);
      expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining('models.json'), 'utf-8');
    });

    it('should read from correct path relative to module', async () => {
      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify(mockModelsConfig));

      await loadModelsConfig();

      const readPath = (mockReadFile as jest.Mock).mock.calls[0][0] as string;
      expect(readPath).toContain('models.json');
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', async () => {
      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify(mockModelsConfig));

      const models = await getAvailableModels();

      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('llama-3-8b');
      expect(models[1].id).toBe('mistral-7b');
    });

    it('should return model objects with all properties', async () => {
      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify(mockModelsConfig));

      const models = await getAvailableModels();

      expect(models[0]).toMatchObject({
        id: 'llama-3-8b',
        name: 'Meta Llama 3 8B Instruct',
        description: 'High quality model',
        url: expect.any(String),
        filename: 'llama-3-8b.gguf',
        size: '8 GB',
      });
    });
  });

  describe('isModelDownloaded', () => {
    it('should return true when model file exists', () => {
      (mockExistsSync as jest.Mock).mockReturnValue(true);

      const result = isModelDownloaded('llama-3-8b', 'llama-3-8b.gguf');

      expect(result).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/home/test/.nlgit/models/llama-3-8b.gguf');
    });

    it('should return false when model file does not exist', () => {
      (mockExistsSync as jest.Mock).mockReturnValue(false);

      const result = isModelDownloaded('mistral-7b', 'mistral-7b.gguf');

      expect(result).toBe(false);
    });

    it('should check correct path in models directory', () => {
      (mockExistsSync as jest.Mock).mockReturnValue(true);

      isModelDownloaded('test-model', 'test.gguf');

      expect(mockExistsSync).toHaveBeenCalledWith('/home/test/.nlgit/models/test.gguf');
    });
  });

  describe('getModelPath', () => {
    it('should return full path to model file', () => {
      const path = getModelPath('llama-3-8b.gguf');

      expect(path).toBe('/home/test/.nlgit/models/llama-3-8b.gguf');
    });

    it('should handle different filenames', () => {
      const path = getModelPath('custom-model.gguf');

      expect(path).toBe('/home/test/.nlgit/models/custom-model.gguf');
    });

    it('should use models directory from config', () => {
      mockGetConfigPaths.mockReturnValue({
        cacheDir: '/custom/path/.nlgit',
        configFile: '/custom/path/.nlgit/config.json',
        modelsDir: '/custom/path/.nlgit/models',
        historyFile: '/custom/path/.nlgit/history.json',
        logsDir: '/custom/path/.nlgit/logs',
      });

      const path = getModelPath('test.gguf');

      expect(path).toBe('/custom/path/.nlgit/models/test.gguf');
    });
  });

  describe('findModelById', () => {
    beforeEach(() => {
      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify(mockModelsConfig));
    });

    it('should find model by ID', async () => {
      const model = await findModelById('llama-3-8b');

      expect(model).not.toBeNull();
      expect(model?.id).toBe('llama-3-8b');
      expect(model?.name).toBe('Meta Llama 3 8B Instruct');
    });

    it('should find second model', async () => {
      const model = await findModelById('mistral-7b');

      expect(model).not.toBeNull();
      expect(model?.id).toBe('mistral-7b');
    });

    it('should return null when model not found', async () => {
      const model = await findModelById('nonexistent');

      expect(model).toBeNull();
    });

    it('should be case-sensitive', async () => {
      const model = await findModelById('LLAMA-3-8B');

      expect(model).toBeNull();
    });

    it('should return complete model definition', async () => {
      const model = await findModelById('llama-3-8b');

      expect(model).toMatchObject({
        id: 'llama-3-8b',
        name: expect.any(String),
        description: expect.any(String),
        url: expect.any(String),
        filename: expect.any(String),
        size: expect.any(String),
      });
    });
  });

  describe('Model data structure validation', () => {
    it('should handle models with required fields', async () => {
      const minimalConfig: ModelsConfig = {
        models: [
          {
            id: 'test',
            name: 'Test Model',
            description: 'Test',
            url: 'https://example.com/model.gguf',
            filename: 'test.gguf',
            size: '1 GB',
          },
        ],
      };

      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify(minimalConfig));

      const models = await getAvailableModels();

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('test');
    });

    it('should handle empty models array', async () => {
      (mockReadFile as jest.Mock).mockResolvedValue(JSON.stringify({ models: [] }));

      const models = await getAvailableModels();

      expect(models).toEqual([]);
    });
  });
});
