import { describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { IntentType } from '../agent-common.js';
import {
  generateCommitMessage,
  getNonGitResponse,
  isLikelyGitRelated,
  parseUserPrompt,
} from '../agent.js';

// Mock the LLM module
jest.mock('../../llm/index.js', () => ({
  generate: jest.fn(),
}));

// Import after mocking
import { generate } from '../../llm/index.js';
const mockGenerate = generate as Mock<typeof generate>;

describe('agent module', () => {
  describe('isLikelyGitRelated', () => {
    it('should return true for git-related keywords', () => {
      expect(isLikelyGitRelated('show git status')).toBe(true);
      expect(isLikelyGitRelated('commit my changes')).toBe(true);
      expect(isLikelyGitRelated('create a new branch')).toBe(true);
      expect(isLikelyGitRelated('push to remote')).toBe(true);
      expect(isLikelyGitRelated('pull from origin')).toBe(true);
      expect(isLikelyGitRelated('merge feature branch')).toBe(true);
      expect(isLikelyGitRelated('rebase onto main')).toBe(true);
      expect(isLikelyGitRelated('show the log')).toBe(true);
      expect(isLikelyGitRelated('view diff')).toBe(true);
      expect(isLikelyGitRelated('checkout main')).toBe(true);
    });

    it('should return true for repository-related keywords', () => {
      expect(isLikelyGitRelated('clone the repository')).toBe(true);
      expect(isLikelyGitRelated('check repo status')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isLikelyGitRelated('GIT STATUS')).toBe(true);
      expect(isLikelyGitRelated('Commit Changes')).toBe(true);
      expect(isLikelyGitRelated('PUSH TO REMOTE')).toBe(true);
    });

    it('should return false for non-git-related prompts', () => {
      expect(isLikelyGitRelated('what is the weather?')).toBe(false);
      expect(isLikelyGitRelated('hello world')).toBe(false);
      expect(isLikelyGitRelated('tell me a joke')).toBe(false);
      expect(isLikelyGitRelated('how are you?')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isLikelyGitRelated('')).toBe(false);
    });
  });

  describe('getNonGitResponse', () => {
    it('should return a helpful message for non-git requests', () => {
      const response = getNonGitResponse();
      expect(response).toContain('NLGit');
      expect(response).toContain('Git operations');
      expect(response).toContain('status');
      expect(response).toContain('commits');
      expect(response).toContain('branches');
    });

    it('should mention available features', () => {
      const response = getNonGitResponse();
      expect(response).toMatch(/merging|pushing|pulling/i);
    });
  });

  describe('parseUserPrompt', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      // Suppress console.error during tests
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should parse git operation intent correctly', async () => {
      mockGenerate.mockResolvedValue({
        text: JSON.stringify({
          type: 'git_operation',
          confidence: 0.95,
          gitCommands: ['git status'],
          description: 'Display the working tree status',
          safety: 'safe',
        }),
      });

      const result = await parseUserPrompt('show status');

      expect(result.type).toBe(IntentType.GIT_OPERATION);
      expect(result.confidence).toBe(0.95);
      expect(result.gitCommands).toEqual(['git status']);
      expect(result.description).toBe('Display the working tree status');
      expect(result.safety).toBe('safe');
    });

    it('should parse destructive operation intent', async () => {
      mockGenerate.mockResolvedValue({
        text: JSON.stringify({
          type: 'git_operation',
          confidence: 0.85,
          gitCommands: ['git rebase -i HEAD~2'],
          description: 'Start interactive rebase',
          safety: 'destructive',
        }),
      });

      const result = await parseUserPrompt('squash last 2 commits');

      expect(result.type).toBe(IntentType.GIT_OPERATION);
      expect(result.safety).toBe('destructive');
    });

    it('should parse cloud operation intent', async () => {
      mockGenerate.mockResolvedValue({
        text: JSON.stringify({
          type: 'git_operation',
          confidence: 0.9,
          gitCommands: ['git push origin main'],
          description: 'Push to remote',
          safety: 'cloud',
        }),
      });

      const result = await parseUserPrompt('push to origin');

      expect(result.type).toBe(IntentType.GIT_OPERATION);
      expect(result.safety).toBe('cloud');
    });

    it('should handle non-git intent', async () => {
      mockGenerate.mockResolvedValue({
        text: JSON.stringify({
          type: 'non_git',
          confidence: 1.0,
          description: 'This is not a Git-related request',
        }),
      });

      const result = await parseUserPrompt('what is the weather?');

      expect(result.type).toBe(IntentType.NON_GIT);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockGenerate.mockResolvedValue({
        text: 'invalid json response',
      });

      const result = await parseUserPrompt('show status');

      expect(result.type).toBe(IntentType.NON_GIT);
      expect(result.confidence).toBe(0.5);
      expect(result.description).toBe('Could not parse intent');
    });

    it('should handle LLM errors gracefully', async () => {
      mockGenerate.mockRejectedValue(new Error('LLM error'));

      const result = await parseUserPrompt('show status');

      expect(result.type).toBe(IntentType.NON_GIT);
      expect(result.confidence).toBe(0);
      expect(result.description).toBe('Error parsing intent');
    });

    it('should extract JSON from text with surrounding content', async () => {
      mockGenerate.mockResolvedValue({
        text: 'Here is the response: {"type": "git_operation", "confidence": 0.9, "gitCommands": ["git log"], "description": "Show log", "safety": "safe"} End of response',
      });

      const result = await parseUserPrompt('show log');

      expect(result.type).toBe(IntentType.GIT_OPERATION);
      expect(result.gitCommands).toEqual(['git log']);
    });
  });

  describe('generateCommitMessage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should generate commit message from LLM', async () => {
      mockGenerate.mockResolvedValue({
        text: 'feat: add user authentication',
      });

      const changedFiles = ['src/auth.ts', 'src/user.ts'];
      const diffStat = '2 files changed, 50 insertions(+)';

      const message = await generateCommitMessage(changedFiles, diffStat);

      expect(message).toBe('feat: add user authentication');
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.stringContaining('Generate a concise git commit message'),
        expect.objectContaining({
          temperature: 0.5,
          maxTokens: 50,
        })
      );
    });

    it('should strip quotes from commit message', async () => {
      mockGenerate.mockResolvedValue({
        text: '"fix: resolve bug in parser"',
      });

      const message = await generateCommitMessage(['parser.ts'], 'stats');

      expect(message).toBe('fix: resolve bug in parser');
    });

    it('should handle LLM errors with fallback', async () => {
      mockGenerate.mockRejectedValue(new Error('LLM error'));

      const changedFiles = ['src/utils.ts', 'src/helpers.ts'];
      const message = await generateCommitMessage(changedFiles, 'stats');

      expect(message).toBe('update src/utils.ts');
    });

    it('should handle empty changed files array', async () => {
      mockGenerate.mockRejectedValue(new Error('LLM error'));

      const message = await generateCommitMessage([], 'stats');

      expect(message).toBe('change files');
    });

    it('should use correct action for single file', async () => {
      mockGenerate.mockRejectedValue(new Error('LLM error'));

      const message = await generateCommitMessage(['config.ts'], 'stats');

      expect(message).toBe('change config.ts');
    });

    it('should use update action for multiple files', async () => {
      mockGenerate.mockRejectedValue(new Error('LLM error'));

      const message = await generateCommitMessage(['file1.ts', 'file2.ts'], 'stats');

      expect(message).toBe('update file1.ts');
    });
  });
});
