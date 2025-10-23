import { OperationSafety } from '../git-operations/index.js';
import { generate } from '../llm/index.js';
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
 * Generate a commit message based on file changes
 */
export async function generateCommitMessage(
  changedFiles: string[],
  diffStat: string
): Promise<string> {
  const prompt = `Generate a concise git commit message (one line, max 50 chars) for these changes:

Changed files:
${changedFiles.map((f) => `- ${f}`).join('\n')}

Diff stats:
${diffStat}

Respond with ONLY the commit message, no quotes, no explanation. Follow conventional commit style if applicable (feat:, fix:, docs:, etc).`;

  try {
    const response = await generate(prompt, {
      temperature: 0.5,
      maxTokens: 50,
    });

    return response.text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
  } catch (error) {
    // Fallback to basic message if generation fails
    const mainFile = changedFiles[0] || 'files';
    const action = changedFiles.length > 1 ? 'update' : 'change';
    return `${action} ${mainFile}`;
  }
}
