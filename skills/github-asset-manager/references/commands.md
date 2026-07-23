# Commands Reference

Detailed syntax and workflow for each `github-asset-manager` command. SKILL.md only summarizes.

All commands print to stdout by default. Use `--output <dir>` to save reports or generated files. The script creates the output directory if missing.

---

## Read-Only Commands

```bash
node scripts/github-asset-manager.js stars  [--user <u>] [--refresh]   # Analyze starred repos
node scripts/github-asset-manager.js repos  [--user <u>] [--refresh]   # Audit own repos
node scripts/github-asset-manager.js audit  [--user <u>] [--refresh]   # Run both (recommended default)
```

**`stars` output:** total + archived + stale (no commits in 12 months) + description-less counts; top languages and topics; lists of stale / archived / description-less repos.

**`repos` output:** total + public/private split + forks + archived + stale counts; counts of repos missing description / topics / homepage / license; top languages; lists of metadata-missing or inactive >1y.

After output: summarize findings, offer next steps (e.g., run `draft` for specific repos).

---

## `profile` — Generate Profile README

```bash
node scripts/github-asset-manager.js profile [--user <u>] [--refresh] \
  [--email <email>] [--featured-sort stars|recent] \
  [--featured-style static|shields|compact|highlight] [--featured-limit <n>] \
  [--featured-repos <repo1,repo2,...>] [--tech-stack <t1,t2,...>] [--theme <theme>]
```

Verify the token has `read:user` scope (and `read:org` if reading organizations) before running.

**Workflow — align each section with the user one by one:**

1. Fetch profile, repos, stars, activity.
2. For each section, present proposed options and ask the user to confirm:
   - **Tech Stack**: tools/frameworks to highlight (default list is a starting point; user must confirm).
   - **Featured Projects**: whether to include, how many, which specific repos, sort order. Do **not** auto-select top-N without approval. If `highlight` style, recommend 1–2 projects.
   - **Stats Cards**: theme and which cards.
   - **Contact / Social Links**: confirm or add email, website, blog, LinkedIn.
3. Generate the full README based on confirmed sections, show the result, ask for tweaks. **Only after explicit approval**, ask whether to push.

| Option | Default |
|---|---|
| `--email` | Read from GitHub profile |
| `--featured-sort` | `stars` (`stars` / `recent`) |
| `--featured-style` | `static` (`static` / `shields` / `compact` / `highlight`) |
| `--featured-limit` | `6` (`0` hides section) |
| `--featured-repos` | Top sorted (override) |
| `--tech-stack` | Inferred; user must confirm |
| `--theme` | `tokyonight` |

---

## `draft` — Repository Completion Draft

```bash
node scripts/github-asset-manager.js draft --repo <owner/repo>
```

Output: current metadata, recommended description + topics, README analysis + improvement suggestions, recommended README structure.

**Show recommendations and ask for explicit approval before applying anything.** Do not modify the repo automatically. To apply after approval:

```bash
gh api --method PATCH repos/<owner>/<repo> \
  -f description="..." -f homepage="..." -F topics='["a", "b", "c"]'
```

Always double-check the `owner/repo` name and topic list with the user.

---

## `beautify` — Polish Repository README

```bash
node scripts/github-asset-manager.js beautify --repo <owner/repo> [--from-file <path>]
```

Fetches metadata + existing README and generates a beautified version with badges, preserving original sections. Output saved as `README-beautified.md` (or stdout). **Show the draft and get explicit approval before replacing the live README.**

To beautify a local file instead of fetching from GitHub, pass `--from-file <path>`.

---

## `i18n` — Multilingual README

```bash
node scripts/github-asset-manager.js i18n --repo <owner/repo> --langs <primary>,<additional...>
```

**Mandatory: do not run `i18n` until the user has confirmed both the primary language and the list of additional languages.** Do not assume a default (e.g., `en,zh,ja`). Supported codes: `en`, `zh`, `ja`, `es`, `de`, `fr`.

**Workflow:**

1. Analyze existing README, detect source language, ask user to confirm.
2. Ask which language should be primary for `README.md`, and which additional languages. Wait for explicit answers.
3. Only after the user confirms the full list, run the command. It generates the file structure and translates **common section headings** it recognizes; body stays in source language. **Delegate body translation to sub-agents** — one per target language.

**Output:** `README.md` (primary) + `docs/README.<lang>.md` per additional language, each with a language switcher; recommended About description.

The first code in `--langs` becomes the primary output language. If it does not match the detected source, the command warns.

GitHub only supports one description in About. Primary language is recommended; `i18n-summary.md` lists alternatives as placeholders for sub-agents to polish.

**Sub-Agent Translation Prompt** (replace `<lang>`):

> Translate the body of `docs/README.<lang>.md` into <lang>. Keep unchanged: language switcher line, `# Title`, shields.io badges, Markdown links, inline code, file paths, `owner/repo`, CLI commands in fenced blocks, section structure and heading levels.
>
> Translate all prose, list items, headings, table cells, image alt text, and **example user prompts** in ` ```text ` blocks into natural <lang>. Preserve `owner/repo` in example prompts. Polish the one-line `> ...` description if it is a machine-translated placeholder. Update TOC anchor links when you translate headings.
>
> Do not add or remove sections. Return the complete translated Markdown.

Do not translate body inline — parallel sub-agents produce better results.

---

## `classify` — Star Lists Classification

```bash
node scripts/github-asset-manager.js classify [--user <u>] [--refresh]      # Draft (read-only)
node scripts/github-asset-manager.js classify --apply --plan ./plan.json    # Apply a confirmed plan
```

**Workflow:**

1. Run draft to fetch starred repos and existing lists.
2. **Ask the user which strategy** they prefer:
   - **Reorganize from scratch**: design a new set of Lists, reassign all repos.
   - **Incremental cleanup**: keep existing Lists, fix misplaced/uncategorized repos, create new Lists only for missing categories.
   - Recommendation: if existing Lists are mostly reasonable, prefer "Incremental cleanup" as the safest option.
3. **Design the classification yourself** based on repo names, descriptions, languages, topics. Do not rely on a fixed rule set.
4. Present proposed lists + assignments as a table. Discuss adjustments: rename lists, move repos, merge or split categories.
5. Once confirmed, **apply directly**. Build the plan in memory and pipe via `--plan -`, or write a temp file and clean up.

**Important:** before `--apply`, verify the token has `user` scope (`gh auth status`); if not, ask the user to run `gh auth refresh --scopes user`. Never run `--apply` without explicit user confirmation. The draft command is read-only and safe to run anytime.

**Classification plan JSON:**

```json
{
  "listsToCreate": [{"name": "AI Agents", "description": "Agent frameworks and assistants"}],
  "listsToUpdate": [{"listId": "LIST_ID", "name": "RAG", "description": "RAG tools"}],
  "listsToDelete": ["LIST_ID"],
  "repoAssignments": [{"repoFullName": "owner/repo", "listIds": ["LIST_ID_1", "LIST_ID_2"]}]
}
```

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