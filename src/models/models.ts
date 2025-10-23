import { createWriteStream } from 'node:fs';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { ModelDefinition, ModelsConfig, ProgressCallback } from './models-common.js';
import { getConfigPaths } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load models configuration from models.json
 */
export async function loadModelsConfig(): Promise<ModelsConfig> {
  // models.json is at the project root
  const modelsPath = join(__dirname, '..', '..', 'models.json');
  const content = await readFile(modelsPath, 'utf-8');
  return JSON.parse(content) as ModelsConfig;
}

/**
 * Get all available models
 */
export async function getAvailableModels(): Promise<ModelDefinition[]> {
  const config = await loadModelsConfig();
  return config.models;
}

/**
 * Check if a model is already downloaded
 */
export function isModelDownloaded(modelId: string, destFile: string): boolean {
  const paths = getConfigPaths();
  const modelPath = join(paths.modelsDir.toString(), destFile);
  return existsSync(modelPath);
}

/**
 * Get the full path to a downloaded model
 */
export function getModelPath(destFile: string): string {
  const paths = getConfigPaths();
  return join(paths.modelsDir.toString(), destFile);
}

/**
 * Download a model from the specified URL
 */
export async function downloadModel(
  url: string,
  destFile: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const paths = getConfigPaths();
  const destPath = join(paths.modelsDir.toString(), destFile);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.statusText}`);
  }

  const totalSize = Number.parseInt(response.headers.get('content-length') || '0', 10);
  let downloadedSize = 0;

  const fileStream = createWriteStream(destPath);

  if (!response.body) {
    throw new Error('Response body is null');
  }

  // Create a transform stream to track progress
  const progressStream = new TransformStream({
    transform(chunk, controller) {
      downloadedSize += chunk.length;
      if (onProgress && totalSize > 0) {
        onProgress({
          downloaded: downloadedSize,
          total: totalSize,
          percentage: (downloadedSize / totalSize) * 100,
        });
      }
      controller.enqueue(chunk);
    },
  });

  // Pipe the response through the progress tracker to the file
  await pipeline(response.body.pipeThrough(progressStream), fileStream);
}

/**
 * Find a model by ID
 */
export async function findModelById(modelId: string): Promise<ModelDefinition | null> {
  const models = await getAvailableModels();
  return models.find((m) => m.id === modelId) || null;
}
