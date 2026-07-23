---
name: github-asset-manager
description: Organize GitHub stars, audit personal repositories, generate GitHub profile READMEs, beautify repository READMEs, create multilingual READMEs, and draft missing repository metadata. Use when the user wants to clean up their GitHub account, analyze starred repositories, improve their GitHub profile, polish a README, add translations, or complete repository descriptions and topics.
metadata:
  author: xiehuacheng
  version: "1.2.0"
---

# GitHub Asset Manager

Manage and improve a GitHub presence. Reads data via `gh` CLI or `GITHUB_TOKEN`, runs analysis locally, returns structured markdown reports through stdout so you can discuss results with the user before acting.

## What This Skill Does

**Can do:** read public + (with proper scopes) private GitHub data (profile, repos, stars, activity); generate structured reports on starred repos and own repos; draft recommendations for repo metadata; beautify an existing README while preserving its sections; generate multilingual README skeletons and delegate body translation to sub-agents; generate a GitHub Profile README; draft and apply GitHub Star Lists classifications.

**Cannot do (without explicit user approval):** modify any GitHub repository, metadata, Star List, or profile README; assume default languages, tech stacks, featured projects, or classification strategies; push, commit, delete, or overwrite anything automatically.

**Default behavior:** all commands are read-only. Any write operation (updating About sections, pushing READMEs, applying Star Lists) requires explicit user confirmation.

## When to Use

Activate when the user says things like:

- 整理我的 GitHub Stars / 分类我的 star
- 审计我的 GitHub 仓库 / 我的仓库哪些该归档
- 帮我生成 GitHub 主页
- 润色 README / 美化 README
- 生成多语言 README / 翻译 README
- 补全仓库信息 / 给我的仓库写 About 描述
- 分析我 star 的项目

## Standard Workflow

For every command:

1. **Authenticate** — `gh auth status`; verify required scopes.
2. **Clarify intent** — confirm what the user wants and which repo/user is the target.
3. **Run the command** — `node scripts/github-asset-manager.js ...`
4. **Summarize output** — present findings in tables/lists, not raw markdown dumps.
5. **Propose next steps** — concrete ("Shall I run `draft` for `xiehuacheng/tokmon`?").
6. **Get explicit approval** before any write.
7. **Apply changes** manually or via `gh api`, then show the result.

## Default Entry Point

For a general GitHub-related request ("帮我看看 GitHub", "整理一下我的 GitHub"), **start with `audit`** to get both stars and repos overviews, then ask what to focus on. If the user's intent is already specific ("分类我的 GitHub Stars", "生成 GitHub 主页"), jump to the matching command.

## Commands

| Command | Purpose |
|---|---|
| `audit` | Run both `stars` and `repos` (recommended default) |
| `stars` | Analyze starred repositories |
| `repos` | Audit own repositories |
| `profile` | Generate GitHub Profile README |
| `draft` | Completion draft for one repo (description + topics + README suggestions) |
| `beautify` | Polish a repo's README, preserving original sections |
| `i18n` | Generate multilingual READMEs |
| `classify` | Generate or apply GitHub Star Lists classification |

Full syntax, flags, output shapes, and per-command workflows: `references/commands.md`.

## Authentication

Verify before any command:

```bash
gh auth status   # preferred
printenv GITHUB_TOKEN   # fallback
```

If neither is set, ask the user to authenticate (`gh auth login` or export `GITHUB_TOKEN`). Public repos and public stars read with no scope; private data needs `read:user`; `classify --apply` needs `user`. Full scope matrix: `references/auth-and-scopes.md`.

## Conversational Patterns

When interacting, be a collaborator not a wizard:

- **Propose, do not assume.** "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese. Does that work?"
- **Use tables and lists** so the user can scan and approve.
- **Pause at every decision point** — language selection, tech stack, featured projects, classification strategy, write operations.
- **Confirm with the exact action.** "I will replace `README.md` and add `docs/README.en.md` and `docs/README.ja.md`. Approve?"
- **Surface trade-offs.** "GitHub only allows one About description. Chinese, English, or combined?"
- **Show the result.** Commit URLs, file paths, or a short summary after applying.

Full patterns + expected output examples: `references/agent-patterns.md`.

## Error Handling, Caching, Privacy

Common failures (`401`, `404`, `403`, insufficient scope, empty output), cache lifecycle, push safety rules, commit message conventions, and privacy guarantees: `references/errors-and-safety.md`.

**Critical reminder:** do not ask the user to paste `GITHUB_TOKEN` into chat. If a token change is needed, ask them to set it in their environment and restart the session.

## References

- `references/commands.md` — per-command syntax, flags, workflows
- `references/auth-and-scopes.md` — auth methods + scope matrix + pre-run checklist
- `references/agent-patterns.md` — conversational patterns + output examples
- `references/errors-and-safety.md` — failures, caching, push safety, privacy