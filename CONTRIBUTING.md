# Contributing to NLGit

Thank you for your interest in contributing to NLGit! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- Git
- Yarn 4 (installed via corepack)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/natural-language-git.git
cd natural-language-git
```

2. Enable corepack and install dependencies:
```bash
corepack enable
yarn install
```

3. Build the project:
```bash
yarn build
```

### Project Structure

```
src/
  ├── config/           # Configuration and cache management
  │   ├── config-common.ts    # Type definitions
  │   ├── config.ts           # Implementation
  │   └── index.ts            # Public exports
  ├── models/           # Model download and management
  ├── llm/              # LLM integration (node-llama-cpp)
  ├── git-operations/   # Git command execution
  ├── ui/               # Terminal UI components
  ├── agent/            # Natural language interpretation
  ├── onboarding/       # Initial setup flow
  ├── history/          # Operation tracking
  └── index.ts          # CLI entry point
```

### Code Conventions

- **Naming**: Use kebab-case for all folders and file names
- **Types**: Use `type` declarations instead of `interface`
- **Structure**: Each module must have:
  - `<name>-common.ts`: Type definitions and constants
  - `<name>.ts`: Main implementation
  - `index.ts`: Public exports only
- **Module Resolution**: Use `.js` extensions in imports (e.g., `./config.js`)
- **Testing**: Place tests in `__tests__/` directories (when implemented)

### Available Scripts

- `yarn build`: Compile TypeScript to JavaScript
- `yarn dev`: Watch mode for development
- `yarn lint`: Check code with Biome
- `yarn lint:fix`: Auto-fix linting issues
- `yarn format`: Format code with Biome
- `yarn test`: Run tests (not yet implemented)

## Git Commit Guidelines

We follow the EU Component Library Git Conventions.

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

### Examples

```
feat(agent): add support for interactive rebase

Implement interactive rebase parsing and execution with
conflict resolution guidance.

Closes #123
```

```
fix(llm): prevent memory leak in session management

Release model context properly when switching models
to avoid accumulating memory usage.
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes following the code conventions
4. Commit your changes following the commit guidelines
5. Push to your fork (`git push origin feat/amazing-feature`)
6. Open a Pull Request

### PR Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure the code builds without errors
- Update documentation if needed
- Follow the existing code style

## Testing

**Note**: Unit tests are not yet implemented. When contributing tests:

- Use Jest as the testing framework
- Place tests in `__tests__/` directories within each module
- Aim for meaningful test coverage (not just coverage numbers)
- Test both success and error cases
- Mock external dependencies appropriately

Example test structure:
```typescript
// src/config/__tests__/config.test.ts
describe('Config Module', () => {
  it('should initialize config directory', async () => {
    // Test implementation
  });
});
```

## Code Review

All submissions require review. We use GitHub pull requests for this purpose. The reviewer will check:

- Code quality and style
- Adherence to conventions
- Documentation completeness
- Test coverage (when tests are implemented)
- Potential bugs or edge cases

## Questions or Issues?

- Open an issue for bugs or feature requests
- Use discussions for questions and ideas
- Be respectful and constructive in all interactions

## License

By contributing to NLGit, you agree that your contributions will be licensed under the MIT License.
