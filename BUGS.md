1. Using `ctrl+c` or `fn+c` to scape in macbook throws error

```
An unexpected error occurred:
ExitPromptError: User force closed the prompt with SIGINT
    at Interface.sigint (file:///Users/danieloquelis/Developer/natural-language-git/node_modules/@inquirer/core/dist/esm/lib/create-prompt.js:62:37)
    at Interface.emit (node:events:519:28)
    at [_ttyWrite] [as _ttyWrite] (node:internal/readline/interface:1126:18)
    at ReadStream.onkeypress (node:internal/readline/interface:265:20)
    at ReadStream.emit (node:events:531:35)
    at emitKeys (node:internal/readline/utils:371:14)
    at emitKeys.next (<anonymous>)
    at ReadStream.onData (node:internal/readline/emitKeypressEvents:64:36)
    at ReadStream.emit (node:events:519:28)
    at addChunk (node:internal/streams/readable:559:12)
```

2. Everytime I want to run `nlgit "<any git prompt>"` it opens a question `What would you like to do?` and ideally this question should appear when no prompt is given.
3. running `nlgit --version` does not show up current version and also there is no `nlgit --help` available about how to use.
4. In the welcoming/onboarding we should show the version and copyright (my name)
5. Testing with a simple command `what is my current branch` return this with a failure.

```
✔ What would you like to do? what is my current branch

ℹ I'll execute: Display the current branch name

  git rev-parse --abbrev-ref HEAD

✗ Command failed: git rev-parse --abbrev-ref HEAD
fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
```

6. Error handling show use LLM to translate into hum readable feedback. For instance when I asked this `see last commit`

```
✔ What would you like to do? see last commit

ℹ I'll execute: Show the most recent commit

  git log -1

✗ Command failed: git log -1
fatal: your current branch 'main' does not have any commits yet
```
