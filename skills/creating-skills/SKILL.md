---
name: creating-skills
description: Use when the user wants to create a new skill, write a SKILL.md, scaffold skill structure, improve an existing skill, or discuss skill design. Triggers on phrases like "create a skill", "new skill", "write a skill", "skill design", "validate skill", or when the user describes a reusable workflow, technique, or domain guide they want Kimi Code to learn.
metadata:
  author: xiehuacheng
  version: "1.7.0"
---

# Creating Skills

Create effective Kimi Code skills through collaborative brainstorming, clear standards, and human-in-the-loop checkpoints.

> **🔴 Mandatory pre-flight (READ BEFORE STEP 1).** Skipping any of these is the #1 cause of failed skill creation. Read each item into context, either by opening the file or by `grep`-ing for the relevant section. None of these are optional.
>
> - Skill standards (frontmatter, structure, naming, **language**) → `references/skill-standards.md`
> - Core principles + question templates → `references/core-principles.md`
> - Anti-patterns (per-step Don't list) → `references/skill-creation-checklist.md`
> - Pre-ship checklist → `references/validation-checklist.md`
> - Waiting + forward-test protocol → `references/waiting-and-forward-test.md`
>
> **Default language for `SKILL.md` is English**, unless the user explicitly asks otherwise. The user writing in Chinese does **not** mean they want the skill in Chinese. Confirm at Step 2; default is English.

## What a Skill Does

A skill turns Kimi from a general-purpose agent into a specialist. It contains a `SKILL.md` plus optional `scripts/`, `references/`, `assets/`. Good skills are reusable, trigger-aware, concise, composable.

Every skill must declare near the top of `SKILL.md`: **Can do** (capabilities), **Cannot do (without explicit approval)** (operations the skill must never auto-perform), **Default behavior** (read-only by default, what needs confirmation, forbidden assumptions). See `references/skill-standards.md`.

## Core Principles

1. **Brainstorm before building** — challenge assumptions, ask what would invalidate the design.
2. **Human checkpoints** — never write files until scope, triggers, structure, draft approved.
3. **Challenge the plan before approving** — name the weakest assumption and 2-3 failure modes.
4. **Standards-first design** — apply `references/skill-standards.md` by default.
5. **Progressive disclosure** — SKILL.md lean; dense examples go to `references/`.
6. **Document boundaries & defaults** — capabilities, limits, forbidden assumptions explicit.
7. **Measure the outcome, not the activity** — clearing a word-count warning by relocating content to `references/` is not compression. Verify total `SKILL.md + references/` word count actually decreased.

Detail per principle: `references/core-principles.md`. Per-step Don't anti-patterns: `references/skill-creation-checklist.md`.

## Workflow

**TodoList in phase format** (flat strings, never nested arrays; `drop` a task if the user goes silent):

```json
{ "list": [
  { "phase": "Step 1", "items": ["Explore", "Identify triggers", "Name weakest assumption"] }
]}
```

Full waiting protocol: `references/waiting-and-forward-test.md`.

### Step 1 — Explore & Brainstorm

Understand intent through dialogue. Identify: trigger phrases, file types/tools, scope boundaries, skill type, weakest assumption, core tone. Lock the core tone early. If large, propose decomposition. Before Step 2, state the most fragile assumption and ask the user to confirm or correct it.

### Step 2 — Define Scope & Triggers

Draft the `description`: what the skill is for + which user phrases trigger it. **Do not** summarize the workflow in `description` — agents will follow it instead of reading the body. Keep under 500 chars; max 1024. List 2-3 scope failure modes before approval. **If the user says "include everything," push back** — propose a tiered approach. Output full scope as plain text first, then `AskUserQuestion` only for approval.

### Step 3 — Choose Name & Structure

**Confirm install location first** (user-level `~/.kimi-code/skills/` vs project `skills/`). Ask for a naming strategy before proposing names:

| Strategy | Example | Best for |
|---|---|---|
| Verb-led / gerund | `creating-skills`, `writing-plans` | Process, technique, workflow skills |
| Noun / domain | `frontend-design`, `kimi-webbridge` | Reference, domain, tool-kit skills |
| Branded / homophone | `gogoal`, `go-goal-go` | Distinctive, memorable skills |

Propose 2-3 names within the chosen strategy. If the user rejects all, do not just produce another batch — go back to Step 1 and ask about tone. Propose directory structure (only the `scripts/` / `references/` / `assets/` directories actually needed). Wait for approval on location, name, structure, resources.

### Step 4 — Design Data Flow

If the skill has scripts: design them to compose through stdin/stdout. Avoid intermediate files unless the user asked for a persistent artifact, a downstream tool can only read files, or data volume makes pipes impractical. Document the data flow in SKILL.md.

### Step 5 — Draft SKILL.md in Chat

Write the complete SKILL.md in conversation: frontmatter + overview + when-to-use + Can do/Cannot do/Default + pre-run checks + core instructions + approval points + expected outputs + error handling + sub-agent prompts + resource references. Do **not** write to disk yet. **Default to English.** Before approval, append "Remaining assumptions" (1-3 items that, if wrong, force redesign). Ask the user to confirm or challenge.

### Step 6 — Implement

Once approved: (1) `scripts/init_skill.py <name> --path <approved-dir> [--resources ...] [--examples]`; (2) replace the generated `SKILL.md` with the approved draft; (3) create/adapt `scripts/`, `references/`, `assets/`; (4) `chmod +x` on scripts.

### Step 7 — Validate & Iterate

Run `scripts/quick_validate.py <skill-dir>`. Fix reported issues. Then **forward-test** — protocol in `references/waiting-and-forward-test.md`. If the forward-test fails, **fix the SKILL.md** (do not patch the test). Bump `metadata.version` whenever behavior changes.

## References

- `references/skill-standards.md` — frontmatter, structure, naming, language defaults
- `references/core-principles.md` — question templates per principle
- `references/skill-creation-checklist.md` — per-step Don't anti-patterns
- `references/validation-checklist.md` — pre-ship review checklist
- `references/waiting-and-forward-test.md` — waiting + forward-test + subagent delegation

Commands: `scripts/init_skill.py <name> --path <dir> [--resources ...] [--examples]` to scaffold; `scripts/quick_validate.py <skill-dir>` to validate.