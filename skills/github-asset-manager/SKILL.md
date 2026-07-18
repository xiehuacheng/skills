---
name: github-asset-manager
description: Organize GitHub stars, audit personal repositories, generate GitHub profile READMEs, beautify repository READMEs, create multilingual READMEs, and draft missing repository metadata. Use when the user wants to clean up their GitHub account, analyze starred repositories, improve their GitHub profile, polish a README, add translations, or complete repository descriptions and topics.
metadata:
  author: xiehuacheng
  version: "1.1.0"
---

# GitHub Asset Manager

This skill helps manage and improve a GitHub presence. It reads data from GitHub (via the GitHub CLI or `GITHUB_TOKEN`), runs analysis locally, and returns structured markdown reports through stdout so you can discuss the results with the user and act on them.

## What This Skill Can and Cannot Do

**Can do:**

- Read your public and (with proper scopes) private GitHub data: profile, repositories, stars, activity.
- Generate structured reports about starred repositories and your own repositories.
- Draft recommendations for repository metadata (description, topics, homepage, license).
- Beautify an existing repository README while preserving its original sections.
- Generate multilingual README skeletons and delegate body translation to sub-agents.
- Generate a GitHub Profile README and help you push it to `username/username`.
- Draft and apply GitHub Star Lists classifications.

**Cannot do (without explicit user approval):**

- Modify any GitHub repository, metadata, Star List, or profile README.
- Assume default languages, tech stacks, featured projects, or classification strategies.
- Push, commit, delete, or overwrite anything automatically.

**Default behavior:** all commands are read-only. Any write operation (updating About sections, pushing READMEs, applying Star Lists) requires explicit user confirmation.

## Standard Agent Workflow

For every command, follow this pattern:

1. **Authenticate**: run `gh auth status` and verify required scopes.
2. **Clarify intent**: confirm what the user wants and which repository/user is the target.
3. **Run the command**: use the appropriate `node scripts/github-asset-manager.js ...` invocation.
4. **Summarize output**: do not dump raw markdown; present findings in tables, lists, or concise paragraphs.
5. **Propose next steps**: be concrete (e.g., "Shall I run `draft` for `xiehuacheng/tokmon`?").
6. **Get explicit approval** before any write operation.
7. **Apply changes** manually or via `gh api`, then show the user the result.

## Agent Checklist Before Running Any Command

- [ ] I have run `gh auth status` and confirmed the active account.
- [ ] I have verified the token has the scopes required for this command (see [Required scopes by command](#required-scopes-by-command)).
- [ ] I have confirmed the target user or repository with the user.
- [ ] I have explained what the command will do and what output to expect.
- [ ] For write operations, I have obtained explicit approval.

## When to Use

Activate this skill when the user says things like:

- "整理我的 GitHub Stars"
- "把我的 GitHub Stars 分类"
- "审计我的 GitHub 仓库"
- "帮我生成 GitHub 主页"
- "补全仓库信息"
- "分析我 star 的项目"
- "我的仓库哪些该归档了"
- "润色 README" / "美化 README"
- "生成多语言 README" / "翻译 README"
- "给我的仓库写 About 描述"

## Authentication

The skill requires GitHub authentication. Before running any command, check availability using:

```bash
# Preferred: verify GitHub CLI auth and scopes
gh auth status

# Fallback: verify environment token
printenv GITHUB_TOKEN
```

Acceptable authentication methods:

1. **GitHub CLI**: the user has run `gh auth login`.
2. **Environment variable**: the user has set `GITHUB_TOKEN`.

If neither is available, stop and ask the user to authenticate. Public repositories and public starred repositories can be read without any token scope. For commands that read **private** profile data, starred repos, or activity (`profile`, `stars`, `audit`), ensure the token has at least `read:user` scope. For `classify --apply`, the token also needs the `user` scope.

### Required scopes by command

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

## Prerequisites

Before running commands, ensure the local environment is ready:

- **Node.js**: version 18 or higher. Verify with `node --version`.
- **Dependencies**: this skill uses only Node.js built-in modules (`fs`, `path`, `child_process`, etc.). No `npm install` or external packages are required.
- **Working directory**: run all `node scripts/github-asset-manager.js ...` commands from the skill root directory (for example, the directory where this `SKILL.md` is located).

If `node` is missing, ask the user to install Node.js first. Do not install global packages on the user's system without permission.

## Commands

All commands print their result to stdout by default. Use `--output <dir>` when you need to save reports or generated files (for example, to pass a beautified README into `i18n`, or to let the user review drafts before pushing). If the output directory does not exist, the script will create it automatically.

Available commands:

- `stars` — Analyze and report on GitHub starred repositories
- `repos` — Audit your own GitHub repositories
- `profile` — Generate a GitHub Profile README
- `draft` — Generate completion draft for a specific repository
- `beautify` — Beautify a repository README
- `i18n` — Generate multilingual READMEs and descriptions
- `audit` — Run both stars and repos analysis
- `classify` — Generate or apply GitHub Star Lists classification

### Analyze GitHub Stars

```bash
node scripts/github-asset-manager.js stars [--user <username>] [--refresh]
```

Use this when the user wants to understand or clean up their starred repositories. The output includes:

- Total stars, archived count, stale count, and repositories without descriptions.
- Top languages among starred repos.
- Top topics among starred repos.
- Lists of archived, stale, and description-less repositories.

A starred repository is considered **stale** if it has had no commits in the last 12 months.

After receiving the output, summarize the findings and offer next steps, such as un-starring stale repos or grouping favorites by topic.

### Audit Personal Repositories

```bash
node scripts/github-asset-manager.js repos [--user <username>] [--refresh]
```

Use this when the user wants to clean up or complete their own repositories. The output includes:

- Total repositories, public/private split, forks, archived, and stale counts.
- Counts of repositories missing description, topics, homepage, or license.
- Top languages across repositories.
- Lists of repositories missing metadata or that have been inactive for over a year.

After receiving the output, identify the most impactful improvements and ask the user whether to generate drafts for specific repositories.

### Generate Profile README

```bash
node scripts/github-asset-manager.js profile [--user <username>] [--refresh] [--email <email>] [--featured-sort stars|recent] [--featured-style static|shields|compact|highlight] [--featured-limit <n>] [--featured-repos <repo1,repo2,...>] [--tech-stack <tech1,tech2,...>] [--theme <theme>]
```

Use this when the user wants to improve their GitHub profile page. The output is a complete README markdown suitable for the `username/username` repository.

Before running, verify the token has `read:user` scope (and `read:org` if the user belongs to organizations you need to read). Use `gh auth status` to check.

Default profile layout:

1. **Header + Contact** — display name from the GitHub profile, plus email, blog, Twitter, and GitHub badges.
2. **Tech Stack** — a row of tool/framework badges.
3. **GitHub Stats** — GitHub Stats card and Streak card side by side, themed for dark mode (`tokyonight` by default).
4. **Featured Projects** — selected public repositories, sorted by stars or recent activity. This section is optional; set `--featured-limit 0` to hide it.

Workflow:

1. **Fetch the user's GitHub data** (profile, repositories, stars, activity).
2. **Align each section with the user one by one** before generating the full README. Typical sections to review:
   - **Tech Stack**: which tools/frameworks to highlight. Present the proposed list to the user and ask for confirmation or edits. Do not use the default stack without checking, because it may not match the user's actual focus.
   - **Featured Projects**: whether to include this section at all, how many repositories to show (`--featured-limit`), which specific repositories to include, and the sort order (`stars` or `recent`). Always confirm with the user before selecting projects; do not assume the top-N sorted list is what they want to highlight.
   - **Stats Cards**: theme choice and which cards to include.
   - **Contact / Social Links**: email, website, blog, LinkedIn, etc. (the skill can read some from the GitHub profile; ask the user to confirm or add missing ones).
3. **Generate the full README** based on the confirmed sections.
4. **Show the complete result to the user** and ask for final tweaks.
5. **Only after the user explicitly approves**, ask whether to push it to their profile repository (`username/username`).
6. Do not push without explicit confirmation.

When presenting each section, use tables or lists so the user can easily approve or request changes.

| Option | Description | Default |
|---|---|---|
| `--email` | Contact email to show in the README | Read from GitHub profile |
| `--featured-sort` | Sort featured projects by `stars` or `recent` | `stars` |
| `--featured-style` | Render featured projects as `static` text, `shields` live badges (table), `compact` list, or `highlight` single project | `static` |
| `--featured-limit` | Number of featured projects to display; `0` hides the section entirely | `6` |
| `--featured-repos` | Comma-separated repository names to highlight (overrides sorting) | Top sorted repos |
| `--tech-stack` | Comma-separated list of technologies for the Tech Stack badge row | Inferred from repository languages and topics; must be shown to the user for confirmation |
| `--theme` | Theme for GitHub stats cards | `tokyonight` |

### Draft Repository Completion

```bash
node scripts/github-asset-manager.js draft --repo <owner/repo-name>
```

Use this when the user wants to improve a specific repository. The output includes:

- Current metadata (description, topics, homepage, license, language, visibility).
- A recommended description.
- Recommended topics.
- README analysis and improvement suggestions.
- A recommended README structure.

After generating the draft, present the recommendations to the user and ask for explicit approval before applying anything. Apply changes manually or through the GitHub web UI / `gh` CLI only after the user confirms. Do **not** modify the repository automatically unless the user explicitly asks.

If the user approves, apply the recommended description and topics using the GitHub CLI or API:

```bash
# Update repository About section
gh api --method PATCH repos/<owner>/<repo> \
  -f description="Recommended description from the draft" \
  -f homepage="https://example.com" \
  -F topics='["topic-one", "topic-two", "topic-three"]'
```

Always double-check the owner/repo name and topic list with the user before running the command.

### Beautify Repository README

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name>
```

Use this when the user wants a polished, ready-to-use README for a specific repository. The command fetches the repository metadata and existing README, then generates a beautified README that includes badges and preserves the original sections and content.

The output is a draft saved as `README-beautified.md` (or printed to stdout). **Mandatory: show the draft to the user and get explicit approval before replacing the repository's actual README or pushing to GitHub.** Do not overwrite the live README automatically.

To beautify a local README file instead of fetching from GitHub, use `--from-file <path>`:

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name> --from-file ./README.md
```

### Multilingual README and Description

```bash
node scripts/github-asset-manager.js i18n --repo <owner/repo-name> --langs <primary>,<additional...>
```

Use this when the user wants READMEs in multiple languages.

**Mandatory: do not run the `i18n` command until the user has explicitly confirmed both the primary language and the list of additional languages.** The agent must ask; it must not assume a default set (for example, do not auto-select `en,zh,ja`) based on repository conventions or the current conversation language.

The CLI command generates the file structure and translates **common section headings** that it recognizes (for example, `快速开始` → `Quick Start` / `クイックスタート`). Custom headings that are not in the predefined map remain in the source language. **The actual body content is translated by sub-agents** — one per target language — which also finish translating any remaining custom headings and polish the one-line description.

Workflow:

1. Analyze the existing README and detect its source language. Present the detection to the user and ask them to confirm, for example: "你的 README 看起来是中文，对吗？".
2. Ask the user which language should be the primary language for `README.md`.
3. Ask the user which additional languages to generate. Supported language codes: `en`, `zh`, `ja`, `es`, `de`, `fr`. Wait for an explicit answer; do not proceed with a default list.
4. Explain that the additional language files will be placed in `docs/README.<lang>.md`.
5. Only after the user confirms the full language list, run the command with `--langs <primary>,<additional...>`.
6. The command generates `README.md` and `docs/README.<lang>.md`. At this point the body text is still in the source language. Only the recognized common headings, language switcher, and one-line description placeholder are pre-translated; custom headings and all prose await the sub-agent.
7. **Delegate body translation to sub-agents.** Spawn one sub-agent per target language and have it translate the body of its assigned `docs/README.<lang>.md`.

The command generates:

- `README.md` in the primary language.
- `docs/README.<lang>.md` for each additional requested language.
- Each file includes a language switcher linking to the other translations.
- A recommended description for the repository About section.

The first code in the `--langs` list becomes the primary output language. If it does not match the detected source language, the command warns and suggests putting the source language first.

Because GitHub only supports one description in the repository About section, the primary language description is recommended. The `i18n-summary.md` lists the same description under "Alternative Descriptions" for each target language; this is a placeholder that the sub-agent should polish into the target language. Discuss with the user whether to use the primary description as-is or combine it with another language.

**Important boundaries:**

- If the repository has no README, stop and ask the user whether to create one from scratch or abort.
- If the detected source language is not in the supported list (`en`, `zh`, `ja`, `es`, `de`, `fr`), tell the user and ask whether to proceed with one of the supported languages as primary.
- If `docs/README.<lang>.md` files already exist, warn the user that they will be overwritten, and only proceed after explicit approval.
- **Mandatory: show the generated files to the user and get explicit approval before pushing to GitHub.** Do not commit or push automatically.

To generate multilingual READMEs from a local file (for example, the output of `beautify`), use `--from-file <path>`:

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name> --from-file ./README.md --output ./drafts
# Replace <primary> and <additional...> with the language codes the user confirmed.
node scripts/github-asset-manager.js i18n --repo <owner/repo-name> --langs <primary>,<additional...> --from-file ./drafts/README-beautified.md --output ./drafts
```

Output files (when `--output <dir>` is used):

- `README.md`
- `docs/README.en.md`, `docs/README.ja.md`, etc.
- `i18n-summary.md` — overview of generated files and the recommended description.

#### Sub-agent translation prompt

For each target language, spawn a sub-agent with a prompt like this (replace `<lang>` with the target language name, e.g., English):

> Translate the body content of `docs/README.<lang>.md` into <lang>. Keep the following unchanged:
> - The language switcher line at the top.
> - The repository title in the `# Title` heading.
> - All shields.io badge lines.
> - All Markdown links, inline code, file paths, and repository names such as `owner/repo`.
> - Actual CLI commands in fenced code blocks.
> - The section structure and heading levels.
>
> Translate all prose paragraphs, list items, section headings, table cells, image alt text, and **example user prompts** in ` ```text ` blocks into natural, fluent <lang>. For example prompts, preserve any `owner/repo` references but translate the surrounding text so users know how to ask in <lang>.
>
> The one-line description in the `> ...` blockquote may be a machine-translated placeholder. You may polish it into natural, fluent <lang> while keeping the original meaning.
>
> If you translate a heading that appears in the Table of Contents (TOC), update the corresponding TOC anchor link so it still points to the translated heading. For example, if you translate `## 界面预览` to `## UI Preview`, change the TOC entry from `[界面预览](#界面预览)` to `[UI Preview](#ui-preview)`.
>
> Do not add or remove sections. Return the complete translated Markdown file content.

Do not attempt to translate the body inline in a single pass; parallel sub-agents produce better results and are easier to review.

### Classify GitHub Stars into Lists

```bash
# Generate classification input for the agent (read-only)
node scripts/github-asset-manager.js classify [--user <username>] [--refresh]

# Apply a confirmed classification plan (writes to GitHub Lists)
node scripts/github-asset-manager.js classify --apply --plan ./plan.json
```

Use this when the user wants to organize their GitHub starred repositories into GitHub Lists (the folder-like categories shown on the Your Stars page).

Workflow:

1. Run the draft command to fetch all starred repositories and existing lists.
2. **Ask the user which strategy they prefer.** Present these options, offer your own recommendation, and tell the user: *"After you choose, I will design the corresponding plan and show it to you. I will only execute it after you confirm."*
   - **Reorganize from scratch**: design a completely new set of Lists and reassign all repositories.
   - **Incremental cleanup**: keep existing Lists, fix misplaced or uncategorized repositories, and create new Lists only for categories that are genuinely missing.
   - Recommendation: if the existing Lists are already mostly reasonable, prefer "Incremental cleanup" as the safest option.
3. As the agent, **design the classification yourself** based on repository names, descriptions, languages, and topics. Do not rely on a fixed rule set.
4. Present your proposed lists and repository assignments as a table to the user.
5. Discuss adjustments: rename lists, move repositories, merge or split categories.
6. Once the user confirms, **apply the plan directly**. The agent can build the plan in memory and pipe it via `--plan -`, or write a temporary plan file and clean it up afterward. Do not require the user to manage a plan file.

Important:

- Before running `--apply`, verify the token has the `user` scope:
  ```bash
  gh auth status
  ```
  If scopes do not include `user`, ask the user to run `gh auth refresh --scopes user` first. Do not attempt `--apply` with insufficient scopes.
- Never run `--apply` without explicit user confirmation.
- The draft command is read-only and safe to run anytime.

Classification plan JSON format:

```json
{
  "listsToCreate": [{"name": "AI Agents", "description": "Agent frameworks and assistants"}],
  "listsToUpdate": [{"listId": "LIST_ID", "name": "RAG", "description": "RAG tools"}],
  "listsToDelete": ["LIST_ID"],
  "repoAssignments": [
    {"repoFullName": "owner/repo", "listIds": ["LIST_ID_1", "LIST_ID_2"]}
  ]
}
```

### Run Full Audit

```bash
node scripts/github-asset-manager.js audit [--user <username>] [--refresh]
```

Shortcut that runs both `stars` and `repos`. Use this for an overall GitHub health check.

## Common Options

| Option | Description | Example |
|--------|-------------|---------|
| `--user, -u` | Target GitHub username | `--user octocat` |
| `--output, -o` | Write output to files in this directory | `--output ./reports` |
| `--refresh, -r` | Force refresh GitHub API cache | `--refresh` |
| `--repo` | Repository for draft, beautify, and i18n commands | `--repo owner/repo-name` |
| `--from-file` | Read README from a local file for `beautify`/`i18n` | `--from-file ./README.md` |
| `--langs` | Comma-separated language codes for `i18n` (must be confirmed by the user first) | `--langs <primary>,<additional...>` |
| `--apply` | Apply a classification plan (requires `--plan`) | `--apply --plan ./plan.json` |
| `--plan` | Path to classification plan JSON | `--plan ./plan.json` |

## Default Entry Point

When this skill is activated by a general GitHub-related request (for example, "帮我看看 GitHub", "整理一下我的 GitHub"), **start with the `audit` command** by default. This gives both you and the user a high-level view of stars and repositories, and lets you ask what to focus on next.

If the user's intent is already specific (for example, "分类我的 GitHub Stars" or "生成 GitHub 主页"), jump straight to the matching command instead.

## Expected Output Examples

### `audit` output shape

The `audit` command returns two markdown reports concatenated in stdout. Summarize them for the user rather than dumping raw text. A typical summary looks like:

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

The `draft` command returns structured recommendations. Present them as a table or list, for example:

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

## Conversational Patterns

When using this skill, interact with the user as a collaborator, not a wizard. Follow these patterns:

1. **Propose, do not assume.** Instead of "Which languages do you want?", say "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese as translations. Does that work, or would you prefer a different set?"
2. **Use tables and lists** when presenting options or findings so the user can scan and approve quickly.
3. **Pause at every decision point.** Key decision points include: language selection, tech stack, featured projects, classification strategy, and any write operation.
4. **Confirm with the exact action.** Before pushing, say "I will replace `README.md` and add `docs/README.en.md` and `docs/README.ja.md`. Approve?"
5. **Surface trade-offs.** For example: "GitHub only allows one About description. I can use the Chinese one, the English one, or a combined version. Which do you prefer?"
6. **Show the result.** After applying changes, share commit URLs, file paths, or a short summary of what changed.

## Workflow Guidance

1. **Start with the audit command** to get a high-level view, unless the user already asked for something specific.
2. **Discuss the findings** with the user: What matters most to them? Stars cleanup, repo metadata, profile, or specific repositories?
3. **Repository cleanup workflow** (`repos` + `draft`):
   - Run `repos` to identify repositories missing description, topics, homepage, or license.
   - For repositories the user cares about, run `draft` to generate concrete suggestions.
   - Review the draft output and improve recommendations using your own judgment (the command provides a starting point, but you should refine topics/descriptions based on the actual project).
   - After the user confirms, help them apply metadata changes through the GitHub web UI or `gh` CLI. The `draft` command does not modify repositories automatically; only update metadata on the user's behalf if they explicitly ask.
4. **Profile README workflow** (`profile`):
   - Align each section with the user one by one before generating.
   - **Tech Stack**: present the proposed list of technologies and ask the user to confirm, add, or remove items. The default list is a starting point, not a final decision.
   - **Featured Projects**: explicitly confirm whether to include this section. GitHub already shows a "Popular repositories" panel on the profile, so this section is optional. If the user wants it, confirm how many repositories (`--featured-limit`) and which specific repositories to highlight. Do not auto-select projects without user approval.
   - Choose how featured projects display their star counts: `static` (snapshot at generation time), `shields` (live shields.io badges in a table), `compact` (live badges in a minimal list), or `highlight` (a focused sentence or short list). For `highlight`, recommend 1–2 projects and ask the user to decide; do not default to a long list.
   - Show the complete result to the user and discuss any final tweaks.
   - Only push to the profile repository after explicit user confirmation.
5. **Classify stars** if the user wants to organize their GitHub Star Lists. Always confirm before applying.
6. **Re-run the audit** periodically to track progress and catch newly missing metadata or stale stars.

## Error Handling, Caching, and Edge Cases

### Common failures

When a command fails, diagnose before retrying:

| Symptom | Likely cause | What to do |
|---|---|---|
| `401 Bad credentials` or `gh auth status` shows no active account | Not authenticated or token expired | Ask the user to run `gh auth login` or refresh `GITHUB_TOKEN`. |
| `404 Not Found` for a repository | Repo does not exist, is private, or the name is wrong | Verify the repo name with the user; check that the token has `repo` scope for private repos. |
| `403 API rate limit exceeded` | Too many requests, especially without `--refresh` | Wait a minute and retry; if persistent, use `--refresh` only when necessary. |
| `Resource not accessible by personal access token` | Token scope insufficient | Check `gh auth status` scopes and ask the user to refresh with the required scope. |
| Empty output for `stars` / `repos` / `profile` | Private data but token lacks `read:user` | Ask the user to add `read:user` scope. |

If a failure persists after checking the above, summarize the error for the user and ask whether to retry, skip, or abort.

### Cache behavior

- GitHub API responses are cached in `.cache/` for up to one hour to avoid rate limits.
- Use `--refresh` to force a fresh fetch when the user says data looks stale or after they have made external changes.
- To manually clear the cache, delete the `.cache/` directory inside the skill root.
- If the user switches GitHub accounts or tokens, clear `.cache/` before the next command to prevent mixed data.

### Pushing generated content to GitHub

For `beautify`, `i18n`, and `profile`, the generated files are drafts. Follow this uniform rule:

1. Show the generated content to the user.
2. Ask for explicit approval to commit / push.
3. Only after approval, use `gh api` (for single-file updates) or guide the user through the GitHub web UI.
4. Never force-push or overwrite unreviewed changes.

For batch updates (e.g., replacing README.md plus adding `docs/README.en.md` and `docs/README.ja.md`), prefer creating a single commit per logical change and show the user each commit URL.

### Commit message conventions

Use concise, descriptive commit messages for README and metadata changes:

- `docs: polish README` — for beautify output.
- `docs: add English and Japanese README translations` — for i18n output.
- `docs: update repository About description and topics` — for metadata changes from `draft`.
- `docs: generate GitHub profile README` — for profile README push.

Do not include marketing language or AI co-author tags unless the user requests them.

## Agent Best Practices

- **Do not trust generic output blindly**: the `draft` command gives a starting point, but you should refine suggestions based on the repository's actual content and the user's goals.
- **Be concrete in proposals**: present specific topics, descriptions, and lists rather than asking open-ended questions without suggestions.
- **Confirm before destructive or public changes**: always get explicit approval before updating repository metadata, deleting lists, or pushing to the profile repository.

## Privacy and Safety

- GitHub API responses are cached locally in `.cache/` for up to one hour (see [Error Handling, Caching, and Edge Cases](#error-handling-caching-and-edge-cases) for cleanup instructions).
- No data is sent to any third-party service.
- The skill does **not** modify GitHub repositories automatically.
- The `classify --apply` command modifies GitHub Star Lists only after explicit user confirmation and only when the token has the required `user` scope.
- Do not ask the user to paste their `GITHUB_TOKEN` into the chat. If a token change is needed, ask them to set it in their environment and restart the session.
