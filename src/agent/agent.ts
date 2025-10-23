import { generate } from '../llm/index.js';
import type { ParsedIntent } from './agent-common.js';
import { SYSTEM_PROMPT, IntentType } from './agent-common.js';
import { OperationSafety } from '../git-operations/index.js';

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
