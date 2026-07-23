# Commands Reference

Detailed syntax and workflow for each `github-asset-manager` command. SKILL.md only summarizes.

All commands print to stdout by default. Use `--output <dir>` to save reports or generated files (e.g., to pass a beautified README into `i18n`, or to let the user review drafts before pushing). The script creates the output directory if missing.

---

## `stars` — Analyze Starred Repositories

```bash
node scripts/github-asset-manager.js stars [--user <username>] [--refresh]
```

Use when the user wants to understand or clean up starred repositories. Output includes:

- Total stars, archived count, stale count (no commits in 12 months), repos without descriptions
- Top languages and topics among starred repos
- Lists of archived, stale, and description-less repositories

Summarize findings; offer next steps such as un-starring stale repos or grouping favorites.

---

## `repos` — Audit Personal Repositories

```bash
node scripts/github-asset-manager.js repos [--user <username>] [--refresh]
```

Output:

- Total repos, public/private split, forks, archived, stale counts
- Counts of repos missing description, topics, homepage, or license
- Top languages across repositories
- Lists of repos missing metadata or inactive >1 year

Identify impactful improvements and ask whether to run `draft` for specific repos.

---

## `profile` — Generate Profile README

```bash
node scripts/github-asset-manager.js profile [--user <username>] [--refresh] \
  [--email <email>] [--featured-sort stars|recent] [--featured-style static|shields|compact|highlight] \
  [--featured-limit <n>] [--featured-repos <repo1,repo2,...>] [--tech-stack <tech1,tech2,...>] [--theme <theme>]
```

Use when the user wants to improve their GitHub profile page. Output is a complete README for `username/username`.

**Verify the token has `read:user` scope** (and `read:org` if reading organizations) before running.

Default layout: Header + Contact · Tech Stack badges · GitHub Stats + Streak cards (dark mode `tokyonight`) · Featured Projects (optional; `--featured-limit 0` hides it).

**Workflow — align sections with the user one by one:**

1. Fetch profile, repos, stars, activity.
2. For each section, present proposed options and ask the user to confirm:
   - **Tech Stack**: which tools/frameworks to highlight. Default list is a starting point; user must confirm.
   - **Featured Projects**: whether to include, how many (`--featured-limit`), which specific repos, sort order. Do **not** auto-select top-N without approval. If using `highlight` style, recommend 1–2 projects; do not default to a long list.
   - **Stats Cards**: theme and which cards to include.
   - **Contact / Social Links**: confirm or add email, website, blog, LinkedIn.
3. Generate the full README based on confirmed sections.
4. Show the complete result and ask for final tweaks.
5. **Only after explicit approval**, ask whether to push to `username/username`.

| Option | Description | Default |
|---|---|---|
| `--email` | Contact email | Read from GitHub profile |
| `--featured-sort` | `stars` or `recent` | `stars` |
| `--featured-style` | `static`, `shields`, `compact`, `highlight` | `static` |
| `--featured-limit` | Number of featured projects; `0` hides | `6` |
| `--featured-repos` | Override sort | Top sorted repos |
| `--tech-stack` | Comma-separated tech list | Inferred; user must confirm |
| `--theme` | Stats card theme | `tokyonight` |

---

## `draft` — Repository Completion Draft

```bash
node scripts/github-asset-manager.js draft --repo <owner/repo-name>
```

Output: current metadata, recommended description, recommended topics, README analysis + improvement suggestions, recommended README structure.

**Show recommendations and ask for explicit approval before applying anything.** Do not modify the repository automatically. To apply after approval:

```bash
gh api --method PATCH repos/<owner>/<repo> \
  -f description="..." -f homepage="..." -F topics='["a", "b", "c"]'
```

Always double-check the `owner/repo` name and topic list with the user.

---

## `beautify` — Beautify Repository README

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name> [--from-file <path>]
```

Fetches metadata + existing README and generates a beautified version with badges, preserving original sections. Output is saved as `README-beautified.md` (or stdout). **Show the draft and get explicit approval before replacing the live README.**

To beautify a local file instead of fetching from GitHub, use `--from-file <path>`:

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo-name> --from-file ./README.md
```

---

## `i18n` — Multilingual README

```bash
node scripts/github-asset-manager.js i18n --repo <owner/repo-name> --langs <primary>,<additional...>
```

**Mandatory: do not run `i18n` until the user has confirmed both the primary language and the list of additional languages.** Do not assume a default (e.g., `en,zh,ja`) based on repository conventions or conversation language. Supported codes: `en`, `zh`, `ja`, `es`, `de`, `fr`.

Workflow:

1. Analyze existing README, detect source language, ask user to confirm.
2. Ask user which language should be primary for `README.md`.
3. Ask which additional languages. Wait for explicit answer.
4. Explain that additional files will land in `docs/README.<lang>.md`.
5. Only after the user confirms the full list, run the command.
6. The command generates the file structure and translates **common section headings** that it recognizes. Body content remains in the source language at this point.
7. **Delegate body translation to sub-agents** — one per target language.

Output:

- `README.md` in the primary language
- `docs/README.<lang>.md` per additional requested language
- Each file includes a language switcher linking to other translations
- A recommended description for the repository About section

The first code in `--langs` becomes the primary output language. If it does not match the detected source, the command warns.

GitHub only supports one description in the About section. The primary language description is recommended; `i18n-summary.md` lists the same description under "Alternative Descriptions" for each target language — placeholder for sub-agents to polish. Discuss with the user whether to use the primary as-is or combine.

**Important boundaries:**

- No README in the repo → ask whether to create from scratch or abort
- Detected source language not in the supported list → tell user, ask whether to proceed with a supported language as primary
- `docs/README.<lang>.md` files already exist → warn they will be overwritten, proceed only after explicit approval
- **Always show generated files and get explicit approval before pushing**

To generate multilingual READMEs from a local file (e.g., beautify output):

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo> --from-file ./README.md --output ./drafts
node scripts/github-asset-manager.js i18n --repo <owner/repo> --langs <primary>,<additional...> \
  --from-file ./drafts/README-beautified.md --output ./drafts
```

### Sub-Agent Translation Prompt

For each target language, dispatch a sub-agent with this prompt (replace `<lang>`):

> Translate the body content of `docs/README.<lang>.md` into <lang>. Keep unchanged:
> - The language switcher line at the top
> - The repository title in the `# Title` heading
> - All shields.io badge lines
> - All Markdown links, inline code, file paths, and `owner/repo` references
> - Actual CLI commands in fenced code blocks
> - The section structure and heading levels
>
> Translate all prose, list items, headings, table cells, image alt text, and **example user prompts** in ` ```text ` blocks into natural, fluent <lang>. For example prompts, preserve `owner/repo` but translate the surrounding text.
>
> The one-line description in the `> ...` blockquote may be a machine-translated placeholder; polish it into natural, fluent <lang> while keeping the original meaning.
>
> If you translate a heading that appears in the Table of Contents, update the corresponding TOC anchor link. E.g., `## 界面预览` → `## UI Preview` and `[界面预览](#界面预览)` → `[UI Preview](#ui-preview)`.
>
> Do not add or remove sections. Return the complete translated Markdown.

Do not attempt body translation inline in a single pass — parallel sub-agents produce better results and are easier to review.

---

## `classify` — Star Lists Classification

```bash
# Draft (read-only)
node scripts/github-asset-manager.js classify [--user <username>] [--refresh]

# Apply a confirmed plan
node scripts/github-asset-manager.js classify --apply --plan ./plan.json
```

Workflow:

1. Run draft to fetch starred repos and existing lists.
2. **Ask the user which strategy they prefer.** Present options, offer your recommendation, and say: *"After you choose, I will design the corresponding plan and show it to you. I will only execute it after you confirm."*
   - **Reorganize from scratch**: design a completely new set of Lists and reassign all repositories.
   - **Incremental cleanup**: keep existing Lists, fix misplaced or uncategorized repos, create new Lists only for categories genuinely missing.
   - Recommendation: if existing Lists are mostly reasonable, prefer "Incremental cleanup" as the safest option.
3. **Design the classification yourself** based on repo names, descriptions, languages, topics. Do not rely on a fixed rule set.
4. Present proposed lists and assignments as a table.
5. Discuss adjustments: rename lists, move repos, merge or split categories.
6. Once confirmed, **apply the plan directly**. Build it in memory and pipe via `--plan -`, or write a temp plan file and clean up. Do not require the user to manage a plan file.

Important:

- Before `--apply`, verify the token has the `user` scope: `gh auth status`. If not, ask the user to run `gh auth refresh --scopes user`. Do not attempt `--apply` with insufficient scopes.
- Never run `--apply` without explicit user confirmation.
- The draft command is read-only and safe to run anytime.

Classification plan JSON:

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

---

## `audit` — Full Audit

```bash
node scripts/github-asset-manager.js audit [--user <username>] [--refresh]
```

Shortcut that runs both `stars` and `repos`. Use for an overall GitHub health check.

---

## Common Options

| Option | Description | Example |
|---|---|---|
| `--user, -u` | Target GitHub username | `--user octocat` |
| `--output, -o` | Write output to files in this directory | `--output ./reports` |
| `--refresh, -r` | Force refresh GitHub API cache | `--refresh` |
| `--repo` | Repository for `draft`, `beautify`, `i18n` | `--repo owner/repo-name` |
| `--from-file` | Read README from local file for `beautify`/`i18n` | `--from-file ./README.md` |
| `--langs` | Comma-separated language codes (must be confirmed) | `--langs en,zh,ja` |
| `--apply` | Apply a classification plan (requires `--plan`) | `--apply --plan ./plan.json` |
| `--plan` | Path to classification plan JSON | `--plan ./plan.json` |