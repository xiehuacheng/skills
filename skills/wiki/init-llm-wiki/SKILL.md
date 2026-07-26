---
name: init-llm-wiki
description: Initialize and maintain an Obsidian-first, Google Cloud OKF 0.1–compatible Karpathy-style LLM Wiki for a given domain. Use when the user wants to build or maintain a Karpathy-style LLM wiki for a new domain.
metadata:
  author: xiehuacheng
  version: "1.3.0"
---

# Building an LLM Wiki

Help the user build a Karpathy-style LLM wiki that follows the Google Cloud Open Knowledge Format (OKF) v0.1 specification.

## When to Use

Use when the user wants to: bootstrap an LLM-maintained wiki for a new domain; standardize an existing wiki to OKF + Obsidian; migrate from an older version of this skill.

Do NOT use when: a static docs site or README (use a docs generator); a personal Zettelkasten without OKF (use Obsidian alone); a blog or content site (this skill is for reference knowledge, not publishing).

## Invocation

```text
/init-llm-wiki
```

The agent will ask which domain you want to build the wiki for, then complete initialization.

## Boundaries and Defaults

**Can do:** scaffold a new wiki (root `index.md`, `log.md`, `00-Raw/`, `01-Wiki/`, `02-Areas/` or `02-Module/`, agent schema doc, `WORKFLOWS.md`); standardize an existing wiki to OKF + Obsidian conventions; run Ingest (read raw materials, discuss takeaways, dispatch sub-agents to write cards); Lint (check structure, links, frontmatter).

**Cannot do (without explicit user approval):** modify any file inside `00-Raw/` (read-only by design); pre-fill knowledge cards without sources; create `02-Areas/<domain>/` subfolders at init (waits for Ingest + confirmation); batch-convert `[[wikilink]]` to standard Markdown (only on explicit external OKF export).

**Default behavior:** read-only mode until the user explicitly approves a write; `00-Raw/` is treated as immutable; subdirectories under `02-*/` are not created at init; Obsidian `[[wikilink]]` is preserved (never converted to Markdown links during editing).

## Generated Directory Structure

```text
wiki/
├── 00-Raw/                 # Raw materials (Markdown + type: source). Read-only.
├── 01-Wiki/                # Knowledge cards
├── 02-Areas/ or 02-Module/ # Second-level classification (only the empty top dir at init)
├── index.md                # Root; frontmatter declares okf_version: "0.1"
└── log.md                  # Append-only update log
```

Pick `02-Areas` or `02-Module` at init; don't switch later. Subdirectories under `02-*/` are **not** created at init — that decision waits for Ingest and user confirmation.

## Core Conventions

1. **Obsidian-first** — `[[Knowledge Point Name]]` for internal links; do not convert to standard Markdown when editing.
2. **OKF-compatible** — every concept `.md` includes YAML frontmatter with at least a `type` field; root `index.md` declares `okf_version`.
3. **Preserve frontmatter** — `type`, `title`, `description`, `tags`, `aliases`, `cssclasses` only change on user request.
4. **External OKF export only** — batch-convert `[[...]]` to `[Text](path.md)` with user consent.
5. **`00-Raw/` is read-only** — never modify files inside after reading.
6. **Subdirectory `index.md`** — may exist as nav/overview; no frontmatter; not a concept page.

Full format rules: `references/okf-conventions.md`.

## Execution Flow

The agent must follow this order. Do not skip the brainstorming phase.

1. If the user has not yet stated a domain, ask: **"Which domain do you want to build the wiki about?"**
2. Refer to Karpathy's LLM Wiki pattern (<https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>) and the OKF spec (<https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md>).
3. **Do not pre-fill initial knowledge** — wait for sources or explicit instructions.
4. If the project has no git repo yet, initialize one first.

Steps 5–9: `references/initialization.md`. Ingest: `references/ingest-flow.md`. Structure: `references/structure-evolution.md`.

## Other Notes

- Ask the user when unsure.
- Applied content (projects, experiments, exam questions, case studies) is **outside this skill's scope**. Do not proactively create `03-Projects/` or similar.
- Optional dependency: [obsidian-skills](https://github.com/kepano/obsidian-skills) — Kepano's Obsidian editing skill. Install at project level only if better editing support is needed.

## References

- `references/initialization.md` — Steps 5-9 + migration
- `references/ingest-flow.md` — Ingest protocol
- `references/structure-evolution.md` — `02-Areas` / `02-Module` three-stage
- `references/okf-conventions.md` — OKF v0.1 + Obsidian rules