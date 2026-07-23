# Agent Patterns, Workflows & Outputs

Complements SKILL.md. Read when working through a command interactively.

## Conversational Patterns

1. **Propose, do not assume.** "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese. Does that work?"
2. **Use tables and lists** so the user can scan and approve.
3. **Pause at every decision point** — language, tech stack, featured projects, classification strategy, writes.
4. **Confirm with the exact action.** "I will replace `README.md` and add `docs/README.en.md` and `docs/README.ja.md`. Approve?"
5. **Surface trade-offs.** "GitHub only allows one About description. Chinese, English, or combined?"
6. **Show the result.** Commit URLs, file paths, or short summary.

## Workflow Guidance

1. **Start with `audit`** unless the user asked for something specific.
2. **Discuss findings**: stars cleanup, repo metadata, profile, or specific repos?
3. **Repo cleanup** (`repos` + `draft`): identify missing metadata; for repos the user cares about, run `draft`; refine; apply via web UI or `gh` CLI after confirmation.
4. **Profile README** (`profile`): align each section. Tech Stack — confirm list. Featured Projects — confirm inclusion, count, repos (GitHub already shows "Popular repositories", so this is optional). For `highlight` style, recommend 1–2 projects. Push only after explicit confirmation.
5. **Classify stars** if the user wants to organize Lists. Always confirm before applying.
6. **Re-run audit** periodically to track progress.

## Expected Output Examples

### `audit` summary

```markdown
## GitHub Health Check for xiehuacheng

### Stars (1,247 total)
- Archived: 23 · Stale (no commits in 12 months): 89 · Missing description: 156
- Top languages: Python, TypeScript, Go · Top topics: ai-agents, llm, rag

### Own Repositories (42 total)
- Public: 38 / Private: 4
- Missing description: 7 · Missing topics: 12 · Missing license: 3 · Stale (inactive >1 year): 5

Recommended next steps:
1. Run `draft` for `xiehuacheng/project-a` to fill description and topics.
2. Consider archiving stale repositories: `xiehuacheng/old-repo-b`, ...
```

### `draft` recommendations

```markdown
### xiehuacheng/tokmon

| Field | Current | Recommended |
|---|---|---|
| Description | (empty) | A macOS menu bar token usage tracker |
| Topics | (empty) | `macos`, `swift`, `token-usage`, `claude-code`, `kimi-code` |
| Homepage | (empty) | https://github.com/xiehuacheng/TokMon/releases |

README suggestions:
- Add a "Quick Start" section with `swift run TokMon`.
- Add badges for build status and license.
- Include screenshots in `docs/images/`.
```