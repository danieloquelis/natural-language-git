/**
 * Model definition from models.json
 */
export type ModelDefinition = {
  id: string;
  display_name: string;
  description: string;
  url: string;
  dest_file: string;
};

/**
 * Models configuration file structure
 */
export type ModelsConfig = {
  models: ModelDefinition[];
};

/**
 * Download progress information
 */
export type DownloadProgress = {
  downloaded: number;
  total: number;
  percentage: number;
};

/**
 * Download progress callback
 */
export type ProgressCallback = (progress: DownloadProgress) => void;
