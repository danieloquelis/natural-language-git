# NLGit - Natural Language Git

## Project Overview

Build a cross-platform command-line tool named **nlgit** that interprets natural language instructions and performs Git operations locally. The tool must be:

- **Fast**: Optimized performance for quick responses
- **Safe**: Asks confirmation for destructive operations
- **Offline-first**: Works without internet connection (except cloud operations)
- **Agentic**: Makes intelligent decisions based on context
- **Git-focused**: Only responds to Git-related operations

## Technical Stack

### Core Technologies

- **Language**: TypeScript only (target Node LTS "iron")
- **LLM Runtime**: `https://github.com/withcatai/node-llama-cpp` for LLaMa wrapper
- **Terminal UI**: Use a well-maintained library for rich terminal UI and interactions
- **Testing**: Jest for unit tests (meaningful tests required)
- **Linting**: Biome

### Installation & Distribution

- Global installation via: `npm install -g nlgit`
- Command invocation: `nlgit`

## Project Structure Requirements

### Directory Layout

```
src/
  ├── [feature-name]/
  │   ├── index.ts                    # Public exports
  │   ├── [feature-name].ts           # Main implementation
  │   ├── [feature-name]-common.ts    # Type definitions
  │   └── __tests__/                  # Jest tests (if needed)
```

### Code Conventions

- **Naming**: Use kebab-case for all folders and file names
- **Types**: Use `type` declarations instead of `interface`
- **Structure**: Clear separation of concerns
- **Each module**: Must have main file, common types file, and index.ts for exports
- **Testing**: Comprehensive unit tests with meaningful coverage

## Data Storage & Configuration

### Local Cache Directory: `.nlgit`

Store all static data in system cache under `.nlgit/` folder:

- Downloaded LLM models
- Configuration files
- Temporary operation logs (auto-delete after 24 hours)
- Volatile memory for operation history

### Models Management

- Models defined in hardcoded `models.json` file
- Download during initial setup/onboarding
- Allow switching between models after installation
- Store downloaded models in `.nlgit/` cache

### Prompts & Static Data

- All LLM prompts hardcoded in the project
- Configuration stored in static file inside `.nlgit/`

## Core Features

### 1. Initial Setup & Onboarding

- **Model Selection**: Interactive UI to pick from available models
  - Show human-readable names and descriptions only
  - No technical details or model IDs visible to user
  - Beautiful, easy-to-understand interface
- **Welcome Screen**: Display ASCII art logo (convert `nlgit-portrait.png` to terminal characters)

### 2. Agentic Behavior

- **Context-aware**: Make intelligent decisions based on user prompts
- **Auto-append**: Smart enough to chain multiple operations when needed
- **No manual prompts**: Don't ask users to perform manual Git commands
- **Simplified interactions**: Only ask yes/no questions or provide selection lists when clarification needed
- **Clear explanations**: Provide proper context when asking for user input

### 3. Safety & Confirmations

- **Destructive operations**: Always ask for confirmation
  - Examples: force push, hard reset, branch deletion
- **Non-destructive operations**: Auto-execute without prompts
  - Examples: status, log, diff, fetch
- **Cloud operations**: ALWAYS require confirmation
  - Examples: push, pull requests, remote operations to GitHub/GitLab/etc.

### 4. User Experience

#### Terminal UI

- **Interactive lists**: Beautiful selection menus
- **Loading feedback**: Async operations with funny/random loading messages
- **Configuration menu**: Beautiful, easy-to-read settings interface
- **Human-readable**: All text should be clear and understandable

#### Operation History

- **Volatile memory**: Keep recent operations in memory
- **Revert capability**: User can say "revert last operation(s)"
- **Audit logs**: Temporary logs stored for 24 hours, then auto-deleted
- **Operation chaining**: Smart enough to combine related operations

### 5. Scope & Boundaries

- **Git-only**: Only respond to Git-related operations
- **Non-Git requests**: Return friendly feedback explaining NLGit is Git-focused
- **No manual actions**: Never instruct users to run commands themselves

## Implementation Priorities

1. **Setup**: Project structure, dependencies, and build configuration
2. **Onboarding**: Model download and selection flow
3. **Core Git operations**: Implement basic Git command interpretation
4. **Safety layer**: Confirmation system for destructive/cloud operations
5. **Memory system**: Operation history and revert functionality
6. **UI polish**: Terminal UI, loading states, configuration menu
7. **Testing**: Comprehensive unit tests
8. **Documentation**: README and usage instructions including nlgit-portrait.png as portrait.

## Best Practices

- Follow Node.js CLI best practices
- Use async/await for all asynchronous operations
- Provide clear error messages and recovery suggestions
- Graceful degradation when offline
- Proper signal handling (SIGINT, SIGTERM)
- Cross-platform compatibility (Windows, macOS, Linux)

## Git Commit Guidelines

Follow the EU Component Library Git Conventions: https://ec.europa.eu/component-library/v1.14.2/ec/docs/conventions/git/

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line should not exceed 72 characters
- Reference issues and pull requests in the footer
- Separate subject from body with a blank line
- Wrap body at 72 characters
