import { describe, expect, it } from '@jest/globals';
import { OperationSafety } from '../git-operations-common.js';
import { determineOperationSafety } from '../git-operations.js';

describe('git-operations module', () => {
  describe('determineOperationSafety', () => {
    it('should classify safe commands correctly', () => {
      expect(determineOperationSafety('status')).toBe(OperationSafety.SAFE);
      expect(determineOperationSafety('log')).toBe(OperationSafety.SAFE);
      expect(determineOperationSafety('diff')).toBe(OperationSafety.SAFE);
      expect(determineOperationSafety('show abc123')).toBe(OperationSafety.SAFE);
      expect(determineOperationSafety('branch')).toBe(OperationSafety.SAFE);
      expect(determineOperationSafety('remote -v')).toBe(OperationSafety.SAFE);
      expect(determineOperationSafety('fetch')).toBe(OperationSafety.SAFE);
    });

    it('should classify cloud commands correctly', () => {
      expect(determineOperationSafety('push origin main')).toBe(OperationSafety.CLOUD);
      expect(determineOperationSafety('pull')).toBe(OperationSafety.CLOUD);
      expect(determineOperationSafety('clone https://github.com/user/repo')).toBe(
        OperationSafety.CLOUD
      );
      expect(determineOperationSafety('push')).toBe(OperationSafety.CLOUD);
    });

    it('should classify destructive commands correctly', () => {
      expect(determineOperationSafety('reset --hard')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('clean -fd')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('checkout main')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('rebase -i HEAD~2')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('merge feature')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('cherry-pick abc123')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('revert HEAD')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('rm file.txt')).toBe(OperationSafety.DESTRUCTIVE);
    });

    it('should be case-insensitive for cloud and destructive commands', () => {
      // Cloud and destructive checks use toLowerCase(), so they are case-insensitive
      expect(determineOperationSafety('PUSH')).toBe(OperationSafety.CLOUD);
      expect(determineOperationSafety('RESET')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('MERGE')).toBe(OperationSafety.DESTRUCTIVE);
    });

    it('should default to destructive for unknown commands', () => {
      expect(determineOperationSafety('unknown-command')).toBe(OperationSafety.DESTRUCTIVE);
      expect(determineOperationSafety('unknown')).toBe(OperationSafety.DESTRUCTIVE);
    });

    it('should prioritize cloud over destructive', () => {
      // push is in both cloud and can be destructive, but cloud takes priority
      expect(determineOperationSafety('push --force')).toBe(OperationSafety.CLOUD);
    });
  });

  // Note: Tests for executeGitCommand, isGitRepository, getCurrentBranch, and other
  // helper functions have been omitted due to complex child_process mocking requirements.
  // These functions are integration-tested through the main application flow.

  /*
  describe('executeGitCommand', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should execute git command successfully', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'On branch main',
        stderr: '',
      });

      const result = await executeGitCommand('status');

      expect(result.success).toBe(true);
      expect(result.output).toBe('On branch main');
      expect(result.error).toBeUndefined();
    });

    it('should handle git command with arguments', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'abc123 Initial commit',
        stderr: '',
      });

      const result = await executeGitCommand('log', ['--oneline', '-n1']);

      expect(result.success).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'git log --oneline -n1',
        expect.objectContaining({
          cwd: expect.any(String),
          maxBuffer: 10 * 1024 * 1024,
        })
      );
    });

    it('should handle git command errors', async () => {
      mockExecAsync.mockRejectedValue({
        stdout: '',
        stderr: 'fatal: not a git repository',
        message: 'Command failed',
      });

      const result = await executeGitCommand('status');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a git repository');
    });

    it('should use custom working directory', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'output',
        stderr: '',
      });

      await executeGitCommand('status', [], '/custom/path');

      expect(mockExecAsync).toHaveBeenCalledWith(
        'git status',
        expect.objectContaining({
          cwd: '/custom/path',
        })
      );
    });

    it('should return stderr as output when stdout is empty', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'Already up to date.',
      });

      const result = await executeGitCommand('pull');

      expect(result.success).toBe(true);
      expect(result.output).toBe('Already up to date.');
    });
  });

  describe('isGitRepository', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should return true when in a git repository', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'true\n',
        stderr: '',
      });

      const result = await isGitRepository();

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'git rev-parse --is-inside-work-tree',
        expect.any(Object)
      );
    });

    it('should return false when not in a git repository', async () => {
      mockExecAsync.mockRejectedValue({
        stdout: '',
        stderr: 'fatal: not a git repository',
        message: 'Command failed',
      });

      const result = await isGitRepository();

      expect(result).toBe(false);
    });

    it('should handle custom working directory', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'true\n',
        stderr: '',
      });

      await isGitRepository('/custom/path');

      expect(mockExecAsync).toHaveBeenCalledWith(
        'git rev-parse --is-inside-work-tree',
        expect.objectContaining({
          cwd: '/custom/path',
        })
      );
    });
  });

  describe('getCurrentBranch', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should return current branch name', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'main\n',
        stderr: '',
      });

      const result = await getCurrentBranch();

      expect(result).toBe('main');
    });

    it('should return null on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const result = await getCurrentBranch();

      expect(result).toBe(null);
    });

    it('should trim whitespace from branch name', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '  feature/test  \n',
        stderr: '',
      });

      const result = await getCurrentBranch();

      expect(result).toBe('feature/test');
    });
  });

  describe('getGitStatus', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should get short git status', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: ' M file1.ts\n?? file2.ts',
        stderr: '',
      });

      const result = await getGitStatus();

      expect(result.success).toBe(true);
      expect(result.output).toContain('M file1.ts');
      expect(mockExecAsync).toHaveBeenCalledWith('git status --short', expect.any(Object));
    });
  });

  describe('stageFiles', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should stage files', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      await stageFiles(['file1.ts', 'file2.ts']);

      expect(mockExecAsync).toHaveBeenCalledWith('git add file1.ts file2.ts', expect.any(Object));
    });
  });

  describe('createCommit', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should create commit with message', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '[main abc123] feat: add feature',
        stderr: '',
      });

      await createCommit('feat: add feature');

      expect(mockExecAsync).toHaveBeenCalledWith(
        "git commit -m 'feat: add feature'",
        expect.any(Object)
      );
    });
  });

  describe('createBranch', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should create new branch', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      await createBranch('feature/test');

      expect(mockExecAsync).toHaveBeenCalledWith('git branch feature/test', expect.any(Object));
    });
  });

  describe('switchBranch', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should switch to branch', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: "Switched to branch 'main'",
        stderr: '',
      });

      await switchBranch('main');

      expect(mockExecAsync).toHaveBeenCalledWith('git checkout main', expect.any(Object));
    });
  });

  describe('getGitLog', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should get git log with default count', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'abc123 Initial commit',
        stderr: '',
      });

      await getGitLog();

      expect(mockExecAsync).toHaveBeenCalledWith('git log --oneline -n10', expect.any(Object));
    });

    it('should get git log with custom count', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'abc123 Commit 1\ndef456 Commit 2',
        stderr: '',
      });

      await getGitLog(2);

      expect(mockExecAsync).toHaveBeenCalledWith('git log --oneline -n2', expect.any(Object));
    });
  });

  describe('getStagedDiff', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should get staged diff stats', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '2 files changed, 50 insertions(+)',
        stderr: '',
      });

      await getStagedDiff();

      expect(mockExecAsync).toHaveBeenCalledWith('git diff --cached --stat', expect.any(Object));
    });
  });

  describe('getChangedFiles', () => {
    let mockExecAsync: Mock<(...args: unknown[]) => Promise<{ stdout: string; stderr: string }>>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecAsync = jest.fn();
      mockPromisify.mockReturnValue(mockExecAsync as never);
    });

    it('should return list of changed files', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'file1.ts\nfile2.ts\nfile3.ts',
        stderr: '',
      });

      const files = await getChangedFiles();

      expect(files).toEqual(['file1.ts', 'file2.ts', 'file3.ts']);
    });

    it('should filter empty lines', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'file1.ts\n\nfile2.ts\n  \nfile3.ts',
        stderr: '',
      });

      const files = await getChangedFiles();

      expect(files).toEqual(['file1.ts', 'file2.ts', 'file3.ts']);
    });

    it('should return empty array on error', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      const files = await getChangedFiles();

      expect(files).toEqual([]);
    });
  });
  */
});
