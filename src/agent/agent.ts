import { OperationSafety } from '../git-operations/index.js';
import { generate, generateFresh } from '../llm/index.js';
import type { ParsedIntent } from './agent-common.js';
import { IntentType, SYSTEM_PROMPT } from './agent-common.js';

/**
 * Parse user prompt and determine intent
 */
export async function parseUserPrompt(prompt: string): Promise<ParsedIntent> {
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${prompt}`;

  try {
    const response = await generate(fullPrompt, {
      temperature: 0.3, // Lower temperature for more deterministic outputs
      maxTokens: 300,
    });

    // Try to extract JSON from the response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // If no JSON found, assume non-git request
      return {
        type: IntentType.NON_GIT,
        confidence: 0.5,
        description: 'Could not parse intent',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedIntent;

    // Validate and normalize the response
    return {
      type: parsed.type || IntentType.NON_GIT,
      confidence: parsed.confidence || 0.5,
      gitCommands: parsed.gitCommands,
      description: parsed.description,
      safety: parsed.safety ? (parsed.safety as OperationSafety) : OperationSafety.SAFE,
    };
  } catch (error) {
    console.error('Error parsing prompt:', error);
    return {
      type: IntentType.NON_GIT,
      confidence: 0,
      description: 'Error parsing intent',
    };
  }
}

/**
 * Check if a prompt is git-related using simple heuristics
 * (Used as a fast pre-filter before LLM)
 */
export function isLikelyGitRelated(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();

  const gitKeywords = [
    'git',
    'commit',
    'branch',
    'push',
    'pull',
    'merge',
    'rebase',
    'status',
    'log',
    'diff',
    'checkout',
    'stash',
    'remote',
    'clone',
    'fetch',
    'reset',
    'revert',
    'cherry-pick',
    'tag',
    'repository',
    'repo',
  ];

  return gitKeywords.some((keyword) => lowerPrompt.includes(keyword));
}

/**
 * Generate a friendly response for non-git requests
 */
export function getNonGitResponse(): string {
  return `I'm NLGit, a specialized tool for Git operations. I can only help with Git-related tasks like:

• Checking status and viewing changes
• Creating commits and branches
• Merging and rebasing
• Pushing and pulling
• Managing remotes
• And much more!

For non-Git tasks, please use other tools. How can I help you with Git?`;
}

/**
 * Generate a commit message based on file changes following EU Component Library Git Conventions
 */
export async function generateCommitMessage(
  changedFiles: string[],
  fullDiff: string
): Promise<string> {
  // Truncate diff if too long to avoid token limits
  const maxDiffLength = 1500;
  const truncatedDiff = fullDiff.length > maxDiffLength
    ? fullDiff.substring(0, maxDiffLength) + '\n...(truncated)'
    : fullDiff;

  // Extract scope from first file
  const firstFile = changedFiles[0] || '';
  const scopeGuess = firstFile.split('/').pop()?.replace(/\.(ts|js|tsx|jsx|md)$/, '') || 'core';

  const prompt = `Write a git commit message.

Format: type(scope): description
Types: feat, fix, refactor, chore, docs
Scope: ${scopeGuess}

Files: ${changedFiles.join(', ')}

${truncatedDiff}

Commit message:`;

  try {
    // Use generateFresh to avoid JSON context from previous agent prompts
    const response = await generateFresh(prompt, {
      temperature: 0.5,
      maxTokens: 80,
    });

    // Clean up the response - extract just the commit message
    let message = response.text.trim();

    // Remove common conversational prefixes the LLM might add
    message = message.replace(/^(based on|commit message|your message|message|here is|here's|commit|suggested commit message):?\s*/gi, '');

    // If still has introductory text, try to find the actual commit message
    const lines = message.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Look for a line that starts with a type (feat|fix|etc)
      if (/^(feat|fix|refactor|chore|docs|test|perf|style)\(/i.test(trimmed)) {
        message = trimmed;
        break;
      }
    }

    message = message.split('\n')[0]; // First line only
    message = message.replace(/^["']|["']$/g, ''); // Remove quotes

    return message.trim();
  } catch (error) {
    // Fallback to basic message if generation fails
    const mainFile = changedFiles[0] || 'files';
    const action = changedFiles.length > 1 ? 'update' : 'change';
    return `chore: ${action} ${mainFile}`;
  }
}
