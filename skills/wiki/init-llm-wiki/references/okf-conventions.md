# OKF + Obsidian Conventions

Format rules every wiki page must follow. SKILL.md only summarizes; the full rules live here.

## OKF v0.1

- Every concept `.md` must contain parseable YAML frontmatter with at least one non-empty `type` field.
- Recommended fields: `title`, `description`, `resource`, `tags`, `timestamp` (ISO 8601). Custom fields allowed; tools must preserve unrecognized keys.
- **Only the root `index.md`** may carry frontmatter, and only to declare `okf_version`. Subdirectory `index.md` and any `log.md` must **not** contain frontmatter.
- **Subdirectory `index.md`**: may exist as nav/overview; not required. If present, only description + page links; no frontmatter; not a concept page.
- Knowledge graphs prefer Obsidian bidirectional links (`[[text]]`). For strict OKF tool exchange, convert to `[text](path)` at lint/export.
- Concept identity = file path with `.md` removed.
- Broken links are allowed, not formatting errors.

## Obsidian Format Preservation

- **Preserve `[[wikilink]]`**: use `[[Knowledge Point Name]]` for new internal links; do **not** convert existing `[[...]]` to `[...](...)` when editing.
- **External links**: standard Markdown, e.g., `[Source](https://example.com)`.
- **Preserve YAML frontmatter**: do not delete or modify `type`, `title`, `description`, `tags`, `aliases`, `cssclasses` unless the user requests.
- **Preserve file naming**: keep Chinese names as filenames (e.g., `二叉树.md`); do not rename to slugs.
- **Prevent double suffixes**: no `.md.md`. If the concept name contains `.md` (e.g., `CLAUDE.md`), name it `CLAUDE.md 配置文件.md` or similar.
- **External OKF export only**: batch-convert `[[...]]` to standard links; inform user and obtain consent first.