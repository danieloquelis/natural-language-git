import { describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import {
  clearConsole,
  createSpinner,
  displayCode,
  displayError,
  displayHeader,
  displayInfo,
  displaySuccess,
  displayWarning,
  displayWelcome,
} from '../ui.js';

describe('ui module', () => {
  let consoleLogSpy: Mock<typeof console.log>;
  let consoleClearSpy: Mock<typeof console.clear>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {}) as Mock<
      typeof console.log
    >;
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {}) as Mock<
      typeof console.clear
    >;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
  });

  describe('displayWelcome', () => {
    it('should display ASCII logo and welcome message', () => {
      displayWelcome();

      expect(consoleLogSpy).toHaveBeenCalled();
      const allCalls = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(allCalls).toContain('Natural Language Git');
    });

    it('should display description', () => {
      displayWelcome();

      const allCalls = consoleLogSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(allCalls).toContain('Interact with Git using natural language');
    });
  });

  describe('createSpinner', () => {
    it('should create spinner with custom message', () => {
      const spinner = createSpinner('Loading...');

      expect(spinner).toBeDefined();
      expect(spinner.text).toBe('Loading...');
    });

    it('should create spinner with random message when no message provided', () => {
      const spinner = createSpinner();

      expect(spinner).toBeDefined();
      expect(spinner.text).toBeTruthy();
    });

    it('should have dots spinner type', () => {
      const spinner = createSpinner('test');

      expect(spinner.spinner).toBe('dots');
    });
  });

  describe('displaySuccess', () => {
    it('should display success message with checkmark', () => {
      displaySuccess('Operation completed');

      expect(consoleLogSpy).toHaveBeenCalledWith('✓', 'Operation completed');
    });

    it('should handle empty message', () => {
      displaySuccess('');

      expect(consoleLogSpy).toHaveBeenCalledWith('✓', '');
    });
  });

  describe('displayError', () => {
    it('should display error message with X mark', () => {
      displayError('Something went wrong');

      expect(consoleLogSpy).toHaveBeenCalledWith('✗', 'Something went wrong');
    });

    it('should handle multiline errors', () => {
      displayError('Error:\nLine 2');

      expect(consoleLogSpy).toHaveBeenCalledWith('✗', 'Error:\nLine 2');
    });
  });

  describe('displayWarning', () => {
    it('should display warning message with warning symbol', () => {
      displayWarning('This is a warning');

      expect(consoleLogSpy).toHaveBeenCalledWith('⚠', 'This is a warning');
    });

    it('should handle long warning messages', () => {
      const longWarning = 'This is a very long warning message that might wrap';
      displayWarning(longWarning);

      expect(consoleLogSpy).toHaveBeenCalledWith('⚠', longWarning);
    });
  });

  describe('displayInfo', () => {
    it('should display info message with info symbol', () => {
      displayInfo('Information message');

      expect(consoleLogSpy).toHaveBeenCalledWith('ℹ', 'Information message');
    });

    it('should handle special characters', () => {
      displayInfo('Info: 50% complete');

      expect(consoleLogSpy).toHaveBeenCalledWith('ℹ', 'Info: 50% complete');
    });
  });

  describe('displayHeader', () => {
    it('should display header with blank lines', () => {
      displayHeader('Section Header');

      const calls = consoleLogSpy.mock.calls;
      expect(calls).toContainEqual([]);
      expect(calls).toContainEqual(['Section Header']);
    });

    it('should add spacing around header', () => {
      consoleLogSpy.mockClear();
      displayHeader('Test');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy.mock.calls[0]).toEqual([]);
      expect(consoleLogSpy.mock.calls[2]).toEqual([]);
    });
  });

  describe('displayCode', () => {
    it('should display code with dim styling', () => {
      displayCode('git status');

      expect(consoleLogSpy).toHaveBeenCalledWith('git status');
    });

    it('should handle multiline code', () => {
      const code = 'git add .\ngit commit -m "message"';
      displayCode(code);

      expect(consoleLogSpy).toHaveBeenCalledWith(code);
    });

    it('should handle empty code', () => {
      displayCode('');

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });

  describe('clearConsole', () => {
    it('should clear the console', () => {
      clearConsole();

      expect(consoleClearSpy).toHaveBeenCalled();
    });

    it('should only call clear once', () => {
      consoleClearSpy.mockClear();
      clearConsole();

      expect(consoleClearSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('display functions output format', () => {
    it('should use consistent symbol format', () => {
      consoleLogSpy.mockClear();

      displaySuccess('success');
      displayError('error');
      displayWarning('warning');
      displayInfo('info');

      // All should call with (symbol, message)
      expect(consoleLogSpy.mock.calls[0]).toHaveLength(2);
      expect(consoleLogSpy.mock.calls[1]).toHaveLength(2);
      expect(consoleLogSpy.mock.calls[2]).toHaveLength(2);
      expect(consoleLogSpy.mock.calls[3]).toHaveLength(2);
    });

    it('should have unique symbols for each message type', () => {
      consoleLogSpy.mockClear();

      displaySuccess('test');
      displayError('test');
      displayWarning('test');
      displayInfo('test');

      const symbols = consoleLogSpy.mock.calls.map((call) => call[0]);
      const uniqueSymbols = new Set(symbols);

      expect(uniqueSymbols.size).toBe(4);
    });
  });

  describe('message handling edge cases', () => {
    it('should handle undefined in messages', () => {
      expect(() => displaySuccess(undefined as never)).not.toThrow();
      expect(() => displayError(undefined as never)).not.toThrow();
    });

    it('should handle null in messages', () => {
      expect(() => displayInfo(null as never)).not.toThrow();
      expect(() => displayWarning(null as never)).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(1000);
      expect(() => displaySuccess(longMessage)).not.toThrow();
    });

    it('should handle messages with special unicode characters', () => {
      expect(() => displayInfo('✨ 🎉 Test 中文')).not.toThrow();
    });
  });
});
