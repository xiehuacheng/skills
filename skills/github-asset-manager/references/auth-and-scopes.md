# Authentication & Required Scopes

## Authentication Methods

Acceptable in priority order:

1. **GitHub CLI** — `gh auth login` already run. Verify with `gh auth status`.
2. **Environment variable** — `GITHUB_TOKEN` exported.

If neither is available, stop and ask the user to authenticate. Public repositories and public starred repos can be read without any token scope.

## Required Scopes by Command

| Command | Public repos | Private repos | Special notes |
|---|---|---|---|
| `stars` | no scope needed | `user` (for starred list) | `read:user` recommended |
| `repos` / `audit` | no scope needed | `repo` | `read:user` if reading private profile data |
| `profile` | no scope needed | `repo`, `read:user` | `read:org` if organizations must be read |
| `draft` | no scope needed | `repo` | only reads metadata and README |
| `beautify` | no scope needed | `repo` | only reads metadata and README |
| `i18n` | no scope needed | `repo` | only reads metadata and README |
| `classify` (draft) | no scope needed | `user` | `read:user` recommended |
| `classify --apply` | `user` | `user` + `repo` | must verify `user` scope before applying |

## Pre-Run Checklist

- [ ] `gh auth status` confirms active account
- [ ] Token has scopes required for this command
- [ ] Target user or repo confirmed with user
- [ ] What the command does + expected output explained
- [ ] For writes: explicit approval obtained

## Prerequisites

- **Node.js 18+** — verify with `node --version`. The skill uses only Node.js built-ins (`fs`, `path`, `child_process`, etc.); no `npm install` needed.
- **Working directory** — run all commands from the skill root.

If `node` is missing, ask the user to install Node.js first. Do not install global packages without permission.