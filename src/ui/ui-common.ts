/**
 * Loading message themes
 */
export const LOADING_MESSAGES = [
  'Thinking like git...',
  'Consulting the commit gods...',
  'Traversing the git tree...',
  'Diffing through the possibilities...',
  'Staging some thoughts...',
  'Merging ideas together...',
  'Checking out the situation...',
  'Resolving conflicts in my mind...',
  'Rebasing my understanding...',
  'Cherry-picking the best approach...',
];

/**
 * Get a random loading message
 */
export function getRandomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

/**
 * ASCII art logo (simplified version for now)
 */
export const ASCII_LOGO = `
 _   _ _     ____ _ _
| \\ | | |   / ___(_) |_
|  \\| | |  | |  _| | __|
| |\\  | |__| |_| | | |_
|_| \\_|_____\\____|_|\\__|
`;
