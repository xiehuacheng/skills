---
name: creating-skills
description: Use when the user wants to create a new skill, write a SKILL.md, scaffold skill structure, improve an existing skill, or discuss skill design. Triggers on phrases like "create a skill", "new skill", "write a skill", "skill design", "validate skill", or when the user describes a reusable workflow, technique, or domain guide they want Kimi Code to learn.
metadata:
  author: xiehuacheng
  version: "1.2.0"
---

# Creating Skills

Create effective Kimi Code skills through collaborative brainstorming, clear standards, and human-in-the-loop checkpoints.

## What a Good Skill Does

A skill turns Kimi from a general-purpose agent into a specialist for a specific domain, workflow, or tool. It contains a `SKILL.md` plus optional resources (`scripts/`, `references/`, `assets/`). Good skills are reusable across projects, trigger-aware, concise, and composable.

## What a Skill Must Declare

Every skill must make its boundaries and defaults obvious to the agent. Add a short section near the top of `SKILL.md` that covers:

- **Can do** — concrete capabilities the skill provides.
- **Cannot do (without explicit approval)** — operations the skill must never perform automatically.
- **Default behavior** — whether commands are read-only by default, what requires user confirmation, and what assumptions are forbidden.

See `references/skill-standards.md` for a concrete example and writing guidance.

## Core Principles

## Core Principles

1. **Brainstorm Before Building** — explore through dialogue and challenge assumptions before designing.
2. **Human Checkpoints** — never write files until scope, triggers, structure, and draft are approved.
3. **Challenge the Plan Before Approving It** — name the weakest assumption and realistic failure modes before asking for approval.
4. **Standards-First Design** — apply `references/skill-standards.md` by default.
5. **Prefer stdin/stdout** — compose scripts through pipes, avoid temporary files.
6. **Progressive Disclosure** — keep `SKILL.md` lean, move details to `references/`.
7. **Use Structured Interaction** — prefer multiple-choice and confirmations over walls of text.
8. **Document Boundaries & Defaults** — make capabilities, limits, and defaults explicit.
9. **Provide Checklists & Patterns** — teach the agent how to work with the user, not just what commands to run.

Detailed guidance, examples, and question templates for each principle are in `references/core-principles.md`.

## Skill Creation Workflow

Follow these steps in order. Do not skip checkpoints.

### Step 1: Explore & Brainstorm

Understand the user's intent through dialogue. Do not accept the first description at face value — ask the question that could change the entire design.

Identify:

- Concrete trigger phrases
- File types, tools, or APIs involved
- Scope boundaries
- Skill type: workflow, technique, reference, or tool integration
- The weakest assumption in the user's request

If the request is large, propose decomposition before detailing anything.

Before moving to Step 2, state the most fragile assumption and ask the user to confirm or correct it. Example: "You said 'focus skill'. My weakest assumption is that you mean a Pomodoro timer. If you actually mean 'prevent effort from drifting to low-return projects', the design changes completely. Which is it?"

### Step 2: Define Scope & Triggers

Summarize what the skill will and won't do. Draft the `description` field:

- Include what the skill is for
- Include specific user phrases and contexts that trigger it
- Do **not** summarize the workflow or process steps
- Keep under 500 characters if possible; max 1024

Before asking for approval, list 2-3 realistic ways the scope could fail or be misunderstood. Example:

> Scope risks:
> 1. "Focus" could mean time-blocking or direction-guarding. This skill assumes the latter.
> 2. Users might expect the skill to block apps or notifications, which it cannot do.
> 3. The drift judgment is agent-driven, which can be wrong for edge cases.

Present the scope, risks, and proposed description to the user. Wait for approval.

### Step 3: Choose Name & Structure

**Confirm install location first.** This decision is hard to undo cleanly and determines whether the skill is shared with the current project.

**Install location:**

- **User-level scope** — the agent's user-level skills directory (e.g., `~/.kimi-code/skills/`). Use this for reusable, personal skills.
- **Project scope** — the current project's `skills/` directory. Use this when the skill belongs to the repo, will be committed, or is tightly coupled to the project.

If the current project is a skills collection or the user has asked to "push" the skill, default to project scope. Otherwise, ask the user to choose.

Then propose 2-3 naming options with rationale:

| Form | Example | Best For |
|------|---------|----------|
| Verb-led / gerund | `creating-skills`, `writing-plans` | Process, technique, workflow skills |
| Noun / domain | `frontend-design`, `kimi-webbridge` | Reference, domain, tool-kit skills |

Also propose the directory structure:

```
skill-name/
├── SKILL.md
├── scripts/          # if deterministic helpers are needed
├── references/       # if detailed docs are needed
└── assets/           # if templates or media are needed
```

Only include directories that are actually needed. Wait for user approval on location, name, structure, and resources.

### Step 4: Design Data Flow

If the skill involves scripts:

- Design them to compose through stdin/stdout where possible
- Document the data flow in SKILL.md
- Avoid intermediate files unless one of the exceptions applies

### Step 5: Draft SKILL.md in Chat

Write the complete SKILL.md content in the conversation first. Include:

- Frontmatter with approved `name` and `description`
- Overview
- When to use / triggers
- **Can do / Cannot do / Default behavior** declarations
- **Pre-run checks** (authentication, scopes, environment, target)
- **Core instructions** with exact commands and options
- **User approval points** — when must the agent stop and ask
- **Expected output examples** so the agent knows what success looks like
- **Error handling & edge cases** — common failures and how to recover
- **Sub-agent prompts** if the skill delegates work to sub-agents
- Any resource references

Do **not** write it to disk yet.

Before asking for approval, append a short "Remaining assumptions" section to the draft. List 1-3 things you are still assuming that, if wrong, would require redesign. Example:

> Remaining assumptions:
> 1. The user wants automatic checks rather than manual triggers.
> 2. The user accepts storing personal direction in `~/.config/<skill-name>/profile.md`.
> 3. Moderate-drift intervention feels helpful rather than annoying.

Wait for user approval.

### Step 6: Implement

Once the draft is approved, use the location agreed upon in Step 3:

1. Run `scripts/init_skill.py <name> --path <approved-dir> [--resources ...] [--examples]`
2. Replace the generated `SKILL.md` with the approved draft
3. Create or adapt `scripts/`, `references/`, `assets/` as needed
4. Ensure scripts are executable and tested

### Step 7: Validate & Iterate

Run structural validation:

```bash
scripts/quick_validate.py <path/to/skill-folder>
```

Fix reported issues. Then follow the type-specific validation approach and pre-ship checklist in `references/validation-checklist.md`. Iterate based on findings and user feedback. Bump the skill `version` whenever behavior changes.

## Quick Reference

| Task | Command | Resource |
|------|---------|----------|
| Scaffold a skill | `scripts/init_skill.py <name> --path <dir>` | — |
| Scaffold with resources | `scripts/init_skill.py <name> --path <dir> --resources scripts,references` | — |
| Validate a skill | `scripts/quick_validate.py <skill-dir>` | `references/validation-checklist.md` |
| Check standards | — | `references/skill-standards.md` |

- **`references/skill-standards.md`** — Detailed standards for frontmatter, writing style, directory structure, and naming.
- **`references/validation-checklist.md`** — Pre-ship review checklist for documentation, implementation, testing, and sub-agent forward-testing.
