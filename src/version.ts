import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the current version from package.json
 */
export function getVersion(): string {
  try {
    // Get the directory of this file
    const currentDir = dirname(fileURLToPath(import.meta.url));

    // Navigate to the root directory (one level up from src/)
    const packageJsonPath = join(currentDir, '..', 'package.json');

    // Read and parse package.json
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    return packageJson.version || 'unknown';
  } catch (error) {
    // Fallback if reading fails
    return 'unknown';
  }
}
