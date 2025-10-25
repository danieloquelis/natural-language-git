import { describe, expect, it, jest } from '@jest/globals';

// Mock node modules to avoid issues with __filename
jest.mock('node:child_process');
jest.mock('node:fs/promises');
jest.mock('node:os');
jest.mock('node:path', () => ({
  join: (...args: string[]) => args.join('/'),
  tmpdir: () => '/tmp',
}));
jest.mock('node:util', () => ({
  promisify: (fn: unknown) => fn,
}));
jest.mock('../../ui/index.js');

import { parseRebaseCommand } from '../interactive-rebase.js';

describe('interactive-rebase module', () => {
  describe('parseRebaseCommand', () => {
    it('should parse HEAD~N format', () => {
      expect(parseRebaseCommand('git rebase -i HEAD~2')).toBe(2);
      expect(parseRebaseCommand('git rebase -i HEAD~5')).toBe(5);
      expect(parseRebaseCommand('git rebase -i HEAD~10')).toBe(10);
      expect(parseRebaseCommand('git rebase -i HEAD~100')).toBe(100);
    });

    it('should parse command with additional flags', () => {
      expect(parseRebaseCommand('git rebase -i --autosquash HEAD~3')).toBe(3);
      expect(parseRebaseCommand('git rebase --interactive HEAD~4')).toBe(4);
    });

    it('should return null for invalid formats', () => {
      expect(parseRebaseCommand('git rebase -i main')).toBe(null);
      expect(parseRebaseCommand('git rebase -i origin/main')).toBe(null);
      expect(parseRebaseCommand('git rebase -i abc123')).toBe(null);
      expect(parseRebaseCommand('git rebase HEAD~5')).toBe(null); // Missing -i
    });

    it('should return null for empty or malformed strings', () => {
      expect(parseRebaseCommand('')).toBe(null);
      expect(parseRebaseCommand('rebase -i HEAD~2')).toBe(null); // Missing git
      expect(parseRebaseCommand('git rebase -i HEAD~')).toBe(null); // Missing number
    });

    it('should handle whitespace variations', () => {
      expect(parseRebaseCommand('git  rebase  -i  HEAD~3')).toBe(3);
      expect(parseRebaseCommand('  git rebase -i HEAD~2  ')).toBe(2);
    });

    it('should parse single digit counts', () => {
      expect(parseRebaseCommand('git rebase -i HEAD~1')).toBe(1);
      expect(parseRebaseCommand('git rebase -i HEAD~9')).toBe(9);
    });

    it('should parse multi-digit counts', () => {
      expect(parseRebaseCommand('git rebase -i HEAD~25')).toBe(25);
      expect(parseRebaseCommand('git rebase -i HEAD~999')).toBe(999);
    });

    it('should not match HEAD^ format', () => {
      expect(parseRebaseCommand('git rebase -i HEAD^')).toBe(null);
      expect(parseRebaseCommand('git rebase -i HEAD^^')).toBe(null);
    });

    it('should not match commit hashes', () => {
      expect(parseRebaseCommand('git rebase -i abc123def')).toBe(null);
      expect(parseRebaseCommand('git rebase -i HEAD')).toBe(null);
    });
  });
});
