1. Using `ctrl+c` or `fn+c` to quit in macbook throws error (meaning there is not proper way to exit nlgit one doing operations)

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

2. Add a configuration for nlgit so we dont show verbose responses but just the human readable text. As of now for error it works properly but for success responses it shows the entire git response. Ideally we should also transform that into a human readable response.

3. Trying to run more advanced commands like "combine last two commits" which should append operations if needed, ideally should have been using interactive rebase and take last two commits and start combining them and then ask the user which commit message should it keep (showing a list to select and an option to enter a new commit message). Instead the result was this:

```
nlgit "combine last two commits into one"
✔ Model ready!

ℹ I'll execute: Combine the last two commits into a single commit

  git reset --soft HEAD~2
  git add.





  git commit -m 'squashed commit'


✗ Operation failed
ℹ Git error:
git: 'add.' is not a git command. See 'git --help'.

The most similar command is
	add
```

and this as well:

```
nlgit "squash last two commits"
✔ Model ready!

ℹ I'll execute: Squash the last two commits into a single commit

  git reset --soft HEAD~2
  git commit -m ''


✗ Operation failed
ℹ This appears to be a newly initialized repository with no commits.
ℹ Create at least one commit before using this command.
```

Ideally the agent should be smart enough to understand what is the intent of the user.
