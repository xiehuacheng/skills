---
name: github-asset-manager
description: Organize GitHub stars, audit personal repositories, generate GitHub profile READMEs, and draft missing repository metadata. Use when the user wants to clean up their GitHub account, analyze starred repositories, improve their GitHub profile, or complete repository descriptions and topics.
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# GitHub Asset Manager

This skill helps manage and improve a GitHub presence. It reads data from GitHub (via the GitHub CLI or `GITHUB_TOKEN`), runs analysis locally, and returns structured markdown reports through stdout so you can discuss the results with the user and act on them.

## When to Use

Activate this skill when the user says things like:

- "整理我的 GitHub Stars"
- "把我的 GitHub Stars 分类"
- "审计我的 GitHub 仓库"
- "帮我生成 GitHub 主页"
- "补全仓库信息"
- "分析我 star 的项目"
- "我的仓库哪些该归档了"

## Authentication

The skill requires GitHub authentication. Before running any command, ensure one of the following is available:

1. **GitHub CLI**: the user has run `gh auth login`.
2. **Environment variable**: the user has set `GITHUB_TOKEN`.

If neither is available, stop and ask the user to authenticate.

## Commands

Run commands from the skill root directory. When installed via `npx skills add`, the skill is usually located at `~/.claude/skills/github-asset-manager/`.

All commands print their result to stdout by default. Add `--output <dir>` only if the user explicitly asks to save reports as files.

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
node scripts/github-asset-manager.js profile [--user <username>] [--refresh] [--email <email>] [--featured-sort stars|recent] [--theme <theme>]
```

Use this when the user wants to improve their GitHub profile page. The output is a complete README markdown suitable for the `username/username` repository.

Default profile layout:

1. **Header + Contact** — display name from the GitHub profile, plus email, blog, Twitter, and GitHub badges.
2. **Tech Stack** — a row of tool/framework badges.
3. **GitHub Stats** — GitHub Stats card and Streak card side by side, themed for dark mode (`tokyonight` by default).
4. **Featured Projects** — selected public repositories, sorted by stars or recent activity.

Workflow:

1. **Fetch the user's GitHub data** (profile, repositories, stars, activity).
2. **Align each section with the user one by one** before generating the full README. Typical sections to review:
   - **Tech Stack**: which tools/frameworks to highlight.
   - **Featured Projects**: proposed repositories and the sort order (`stars` or `recent`).
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

After generating the draft, discuss the recommendations with the user and apply them manually or through the GitHub web UI. Do **not** modify the repository automatically unless the user explicitly asks.

### Beautify Repository README

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name>
```

Use this when the user wants a polished, ready-to-use README for a specific repository. The command fetches the repository metadata and existing README, then generates a beautified README that includes badges and preserves the original sections and content.

The output is a draft saved as `README-beautified.md` (or printed to stdout). Review it with the user before replacing the repository's actual README.

To beautify a local README file instead of fetching from GitHub, use `--from-file <path>`:

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name> --from-file ./README.md
```

### Multilingual README and Description

```bash
node scripts/github-asset-manager.js i18n --repo <owner/repo-name> --langs <primary>,<additional...>
```

Use this when the user wants READMEs in multiple languages.

Workflow:

1. Analyze the existing README and detect its source language. Present the detection to the user and ask them to confirm, for example: "你的 README 看起来是中文，对吗？".
2. Ask the user which language should be the primary language for `README.md`.
3. Ask the user which additional languages to generate. Supported language codes: `en`, `zh`, `ja`, `es`, `de`, `fr`.
4. Explain that the additional language files will be placed in `i18n/README.<lang>.md`.
5. Only after the user confirms the full language list, run the command with `--langs <primary>,<additional...>`.

The command then generates:

- `README.md` in the primary language.
- `i18n/README.<lang>.md` for each additional requested language.
- Each file includes a language switcher linking to the other translations.
- A recommended description for the repository About section.

The first code in the `--langs` list becomes the primary output language. If it does not match the detected source language, the command warns and suggests putting the source language first.

Because GitHub only supports one description in the repository About section, the primary language description is recommended. Discuss with the user whether to use it as-is or combine it with another language.

To generate multilingual READMEs from a local file (for example, the output of `beautify`), use `--from-file <path>`:

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name> --from-file ./README.md --output ./drafts
node scripts/github-asset-manager.js i18n --repo <owner/repo-name> --langs zh,en,ja --from-file ./drafts/README-beautified.md --output ./drafts
```

Output files (when `--output <dir>` is used):

- `README.md`
- `i18n/README.en.md`, `i18n/README.ja.md`, etc.
- `i18n-summary.md` — overview of generated files and the recommended description.

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

- Applying changes requires the `user` scope on the GitHub token. If using the GitHub CLI and `gh auth status` shows only `repo`/`gist`/`read:org`, ask the user to run `gh auth refresh --scopes user` first.
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
| `--langs` | Comma-separated language codes for `i18n` (asked by the agent) | `--langs en,zh,ja` |
| `--apply` | Apply a classification plan (requires `--plan`) | `--apply --plan ./plan.json` |
| `--plan` | Path to classification plan JSON | `--plan ./plan.json` |

## Default Entry Point

When this skill is activated by a general GitHub-related request (for example, "帮我看看 GitHub", "整理一下我的 GitHub"), **start with the `audit` command** by default. This gives both you and the user a high-level view of stars and repositories, and lets you ask what to focus on next.

If the user's intent is already specific (for example, "分类我的 GitHub Stars" or "生成 GitHub 主页"), jump straight to the matching command instead.

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
   - Show the complete result to the user and discuss any final tweaks.
   - Only push to the profile repository after explicit user confirmation.
5. **Classify stars** if the user wants to organize their GitHub Star Lists. Always confirm before applying.
6. **Re-run the audit** periodically to track progress and catch newly missing metadata or stale stars.

## Agent Best Practices

- **Do not trust generic output blindly**: the `draft` command gives a starting point, but you should refine suggestions based on the repository's actual content and the user's goals.
- **Be concrete in proposals**: present specific topics, descriptions, and lists rather than asking open-ended questions without suggestions.
- **Confirm before destructive or public changes**: always get explicit approval before updating repository metadata, deleting lists, or pushing to the profile repository.

## Privacy and Safety

- GitHub API responses are cached locally in `.cache/` for up to one hour.
- No data is sent to any third-party service.
- The skill does **not** modify GitHub repositories automatically.
- The `classify --apply` command modifies GitHub Star Lists only after explicit user confirmation and only when the token has the required `user` scope.
