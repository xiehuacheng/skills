# Initialization Steps — Detail

Complements `SKILL.md`. The specific files and content to create during init, after Step 1-5 approval.

## Step 6 — Create the Wiki Skeleton

Three base directories plus root files. Subdirectories under `02-*/` (e.g., `02-Module/数据结构/`) are **not** created at init — that decision waits for Ingest.

- `00-Raw/` — raw source materials. Must contain two empty subdirs: `classified/`, `uncategorized/`. **Read-only**: never modify any file inside. Neither this dir nor its subdirs need `index.md`.
- `01-Wiki/` — topic cards.
- `02-Areas/` *or* `02-Module/` — second-level classification; create only this empty layer. Choice is fixed at init. See `references/structure-evolution.md` for when to add subfolders.

This skill does **not** define `03-Projects/`. How applied content is organized is intentionally open.

## Step 7 — Agent Schema Documents

- `CLAUDE.md` for Claude Code, `AGENTS.md` for Codex / OpenCode.
- `WORKFLOWS.md` from `templates/WORKFLOWS.md` in this skill. Should include: wiki content types (from Karpathy); the `type` field required by OKF; roles of root `index.md` and `log.md`; rules for naming, links, frontmatter; core workflows (Ingest, Query, Lint) with boundaries, triggers, execution steps; handling of scanned / non-text materials.

## Step 8 — Root `index.md`

Frontmatter: `okf_version: "0.1"`. Body: directory entries.

Linking:

- `00-Raw/` should **not** be a `[[00-Raw]]` wikilink target (no `index.md` there). Write as plain text.
- Other directories: `[[Title]]` or `[Title](relative-path)`.

## Step 9 — log.md

ISO 8601 `YYYY-MM-DD` date headings; write the init record.

## Optional — HTML Dashboard

Ask first; do not auto-create.

## Git Repository

If the project has no git repo yet, initialize one before Step 6.

## Upgrades and Migration

When `init-llm-wiki` itself has a major update, wiki projects initialized with the old version do not update automatically. Main session steps:

1. **Sync `WORKFLOWS.md`** and schema docs with the current skill template (project files are not auto-overwritten).
2. **Clean up outdated structures** — older versions created `00-Raw/index.md`, `00-Raw/classified/index.md`, `00-Raw/uncategorized/index.md`. Current version says none need `index.md`; delete them.
3. **Update root `index.md`** — remove or convert links to no-longer-existing pages (`[[00-Raw]]` → plain text).
4. **Record migration in `log.md`** — explain what changed.

After migration, continue Ingest / Query / Lint per the new process.