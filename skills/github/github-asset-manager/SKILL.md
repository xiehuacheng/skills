---
name: github-asset-manager
description: Organize GitHub stars, audit personal repositories, generate GitHub profile READMEs, beautify repository READMEs, create multilingual READMEs, and draft missing repository metadata. Use when the user wants to clean up their GitHub account, analyze starred repositories, improve their GitHub profile, polish a README, add translations, or complete repository descriptions and topics.
metadata:
  author: xiehuacheng
  version: "1.3.0"
---

# GitHub Asset Manager

Manage and improve a GitHub presence. Reads data via `gh` CLI or `GITHUB_TOKEN`, runs analysis locally, returns structured markdown reports through stdout so you can discuss results with the user before acting.

## What This Skill Does

**Can do:** read public + (with proper scopes) private GitHub data (profile, repos, stars, activity); generate structured reports on starred and own repos; draft repo metadata recommendations; beautify an existing README while preserving sections; generate multilingual README skeletons + delegate body translation to sub-agents; generate a GitHub Profile README; draft and apply Star Lists classifications.

**Cannot do (without explicit user approval):** modify any GitHub repo, metadata, Star List, or profile README; assume default languages, tech stacks, featured projects, or classification strategies; push, commit, delete, or overwrite anything automatically.

**Default behavior:** all commands are read-only. Any write operation requires explicit confirmation.

## When to Use

Activate when the user says things like: 整理 GitHub Stars / 分类我的 star; 审计仓库 / 哪些该归档; 帮我生成 GitHub 主页; 润色 / 美化 README; 生成多语言 README / 翻译; 补全仓库信息 / 写 About 描述; 分析 star 的项目.

## Standard Workflow

For every command: (1) **Authenticate** — `gh auth status`; verify scopes. (2) **Clarify intent** — what the user wants + which repo/user. (3) **Run** — `node scripts/github-asset-manager.js ...`. (4) **Summarize output** — tables/lists, not raw dumps. (5) **Propose next steps** — concrete. (6) **Get explicit approval** before any write. (7) **Apply** manually or via `gh api`, show the result.

## Default Entry Point

For a general GitHub-related request ("帮我看看 GitHub", "整理一下我的 GitHub"), **start with `audit`**. If the user's intent is already specific ("分类我的 GitHub Stars", "生成 GitHub 主页"), jump to the matching command.

## Commands

| Command | Purpose |
|---|---|
| `audit` | Run both `stars` and `repos` (recommended default) |
| `stars` | Analyze starred repositories |
| `repos` | Audit own repositories |
| `profile` | Generate GitHub Profile README |
| `draft` | Completion draft for one repo |
| `beautify` | Polish a repo's README |
| `i18n` | Generate multilingual READMEs |
| `classify` | Generate or apply Star Lists classification |

Full syntax, flags, output shapes, per-command workflows: `references/commands.md`.

## Authentication

```bash
gh auth status   # preferred
printenv GITHUB_TOKEN   # fallback
```

If neither is set, ask the user to authenticate. Public data reads with no scope; private needs `read:user`; `classify --apply` needs `user`. Full scope matrix: `references/auth-and-scopes.md`.

## Conversational Patterns

Be a collaborator not a wizard:

- **Propose, do not assume.** "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese. Does that work?"
- **Use tables and lists** so the user can scan and approve.
- **Pause at every decision point** — language, tech stack, featured projects, classification strategy, writes.
- **Confirm with the exact action.** "I will replace `README.md` and add `docs/README.en.md` and `docs/README.ja.md`. Approve?"
- **Surface trade-offs.** "GitHub only allows one About description. Chinese, English, or combined?"
- **Show the result.** Commit URLs, file paths, or short summary.

Full patterns + output examples: `references/agent-patterns.md`.

## Error Handling, Caching, Privacy

Failures (`401`, `404`, `403`, insufficient scope, empty output), cache lifecycle, push safety, commit conventions, privacy guarantees: `references/errors-and-safety.md`.

**Critical:** do not ask the user to paste `GITHUB_TOKEN` into chat. If a token change is needed, ask them to set it in their environment and restart the session.

## References

- `references/commands.md` — per-command syntax, flags, workflows
- `references/auth-and-scopes.md` — auth + scope matrix + pre-run checklist
- `references/agent-patterns.md` — conversational patterns + output examples
- `references/errors-and-safety.md` — failures, caching, push safety, privacy