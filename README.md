![NLGit Logo](assets/nlgit-portrait.png)

# NLGit - Natural Language Git

[![Version](https://badgen.net/npm/v/natural-language-git)](https://www.npmjs.com/package/node-llama-cpp)
[![Build](https://github.com/danieloquelis/natural-language-git/actions/workflows/publish.yml/badge.svg)](https://github.com/danieloquelis/natural-language-git/actions/workflows/publish.yml)
![License](https://badgen.net/badge/color/MIT/green?label=license)

Control Git with natural language! NLGit is a cross-platform CLI tool that interprets your natural language instructions and executes Git operations locally using AI.

![NLGit Demo](assets/demo.gif)

## Features

- **Natural Language Interface**: Just describe what you want to do
- **Safe by Design**: Asks for confirmation on destructive operations
- **Fast & Offline**: Runs locally with downloaded LLM models
- **Agentic**: Makes intelligent decisions based on context
- **Operation History**: Track and potentially revert operations
- **Beautiful CLI**: Interactive menus and clear feedback

## Installation

```bash
npm install -g natural-language-git
```

Or with yarn:

```bash
yarn global add natural-language-git
```

## Usage

Simply run `nlgit` followed by your natural language instruction in quotes:

```bash
nlgit "show me the status"
nlgit "create a new branch called feature-auth"
nlgit "commit all changes with message 'add login feature'"
nlgit "show me the last 5 commits"
nlgit "rebase with main and keep my changes"
```

### First Run & Setup

### Initial Onboarding

On first run, NLGit will automatically guide you through:

1. Selecting an AI model (LLaMA or Mistral)
2. Downloading the model (only happens once, can be several GB)
3. Initializing the model in memory

After onboarding, NLGit is ready to use!

### Manual Setup/Reset

If you want to change your model or reset the configuration:

1. **Remove the config directory**:

```bash
rm -rf ~/.nlgit
```

2. **Run nlgit again** to restart onboarding:

```bash
nlgit "any command"
```

The onboarding will detect the missing configuration and guide you through setup again.

### Configuration Location

All NLGit data is stored in `~/.nlgit/`:

- `config.json` - Selected model and preferences
- `models/` - Downloaded LLM models (large files)
- `history.json` - Operation history
- `logs/` - Temporary logs (auto-cleaned after 24h)

## How It Works

1. **Parse**: NLGit uses a local LLM to understand your natural language request
2. **Analyze**: It determines what Git commands are needed and their safety level
3. **Confirm**: For destructive or cloud operations, it asks for your confirmation
4. **Execute**: It runs the Git commands and shows you the results
5. **Track**: All operations are logged for your reference

## Safety Levels

NLGit classifies operations into three safety levels:

- **Safe**: Auto-executed (status, log, diff, fetch, etc.)
- **Destructive**: Requires confirmation (reset, rebase, force operations)
- **Cloud**: Requires confirmation (push, pull, clone)

## Examples

### Check repository status

```bash
nlgit "what's the current status?"
```

### Create and switch to a branch

```bash
nlgit "create a branch named feature-x and switch to it"
```

### Commit changes

```bash
nlgit "stage all files and commit with message 'initial commit'"
```

### View history

```bash
nlgit "show me the last 10 commits"
```

### Merge branches

```bash
nlgit "merge develop into my current branch"
```

## Supported Models

NLGit comes with two pre-configured models:

- **Meta-LLaMA-3-8B Instruct (Q5_K_M)**: Higher quality, larger size
- **Mistral 7B Instruct v0.2 (Q2_K)**: Faster, smaller size

You can switch models by running the onboarding again.

## Git Operations Supported

- Repository inspection (status, log, diff, show)
- Branch management (create, delete, switch, list)
- Commits (create, amend, revert)
- Staging (add, reset)
- Merging and rebasing
- Remote operations (push, pull, fetch)
- Stash operations
- Tag management
- And more!

## Non-Git Requests

NLGit is focused exclusively on Git operations. If you ask about non-Git topics, it will politely redirect you back to Git-related tasks.

## Requirements

- Node.js >= 20.0.0
- Git installed and configured
- macOS, Linux, or Windows
- At least 2-8 GB free disk space (for model storage)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Development setup
- Code conventions
- Commit message format
- Pull request process

## Project Status

**Note**: This project is in active development. Unit tests are not yet implemented, and the tool has not been fully tested in production environments. Use with caution and always review suggested commands before confirming destructive operations.

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Daniel Oquelis

## Acknowledgments

- Built with [node-llama-cpp](https://github.com/withcatai/node-llama-cpp)
- UI powered by [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js), [chalk](https://github.com/chalk/chalk), and [ora](https://github.com/sindresorhus/ora)
- Models from Hugging Face (Meta LLaMA and Mistral)

---

**Note**: NLGit is an AI-powered tool. While it strives for accuracy, always review suggested commands before confirming destructive operations.
