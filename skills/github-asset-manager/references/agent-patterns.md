# Agent Patterns, Workflows & Outputs

Complements SKILL.md. Read when working through a command interactively.

## Conversational Patterns

When using this skill, interact as a collaborator, not a wizard:

1. **Propose, do not assume.** Instead of "Which languages do you want?", say "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese as translations. Does that work, or would you prefer a different set?"
2. **Use tables and lists** so the user can scan and approve quickly.
3. **Pause at every decision point.** Key: language selection, tech stack, featured projects, classification strategy, any write operation.
4. **Confirm with the exact action.** Before pushing, say "I will replace `README.md` and add `docs/README.en.md` and `docs/README.ja.md`. Approve?"
5. **Surface trade-offs.** E.g., "GitHub only allows one About description. I can use the Chinese one, the English one, or a combined version. Which do you prefer?"
6. **Show the result.** After applying changes, share commit URLs, file paths, or a short summary.

## Workflow Guidance

1. **Start with `audit`** unless the user already asked for something specific.
2. **Discuss findings**: What matters most — stars cleanup, repo metadata, profile, specific repos?
3. **Repository cleanup** (`repos` + `draft`):
   - Run `repos` to identify missing description/topics/homepage/license.
   - For repos the user cares about, run `draft` for concrete suggestions.
   - Review the draft output and refine topics/descriptions based on the actual project. The command is a starting point.
   - After confirmation, apply metadata changes through GitHub web UI or `gh` CLI. `draft` does not modify repos automatically.
4. **Profile README** (`profile`):
   - Align each section with the user one by one.
   - **Tech Stack**: present the proposed list, ask user to confirm/add/remove.
   - **Featured Projects**: confirm whether to include, how many, which repos. GitHub already shows a "Popular repositories" panel, so this section is optional.
   - Choose `--featured-style`: `static`, `shields`, `compact`, `highlight`. For `highlight`, recommend 1–2 projects; do not default to a long list.
   - Show the complete result; discuss final tweaks.
   - Push to profile repo only after explicit confirmation.
5. **Classify stars** if the user wants to organize Lists. Always confirm before applying.
6. **Re-run audit** periodically to track progress.

## Expected Output Examples

### `audit` output shape

The `audit` command returns two markdown reports concatenated in stdout. Summarize rather than dumping raw text. A typical summary:

```markdown
## GitHub Health Check for xiehuacheng

### Stars (1,247 total)
- Archived: 23
- Stale (no commits in 12 months): 89
- Missing description: 156
- Top languages: Python, TypeScript, Go
- Top topics: ai-agents, llm, rag

### Own Repositories (42 total)
- Public: 38 / Private: 4
- Missing description: 7
- Missing topics: 12
- Missing license: 3
- Stale (inactive >1 year): 5

Recommended next steps:
1. Run `draft` for `xiehuacheng/project-a` to fill description and topics.
2. Consider archiving stale repositories: `xiehuacheng/old-repo-b`, ...
```

### `draft` output shape

Present as a table or list:

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