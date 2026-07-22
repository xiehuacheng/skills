---
name: creating-skills
description: Use when the user wants to create a new skill, write a SKILL.md, scaffold skill structure, improve an existing skill, or discuss skill design. Triggers on phrases like "create a skill", "new skill", "write a skill", "skill design", "validate skill", or when the user describes a reusable workflow, technique, or domain guide they want Kimi Code to learn.
metadata:
  author: xiehuacheng
  version: "1.3.0"
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

**Track progress with TodoList.** Create a todo list with the seven steps and update as you go.

### Step 1: Explore & Brainstorm

Understand the user's intent through dialogue. Do not accept the first description at face value — ask the question that could change the entire design.

Identify:

- Concrete trigger phrases
- File types, tools, or APIs involved
- Scope boundaries
- Skill type: workflow, technique, reference, or tool integration
- The weakest assumption in the user's request
- The core tone or feel the skill should have — e.g., ask the user for help, expand its own capabilities, guard boundaries, coach the user
- Any existing built-in or user skills in the same domain; if one exists, read it first and be ready to explain how the new skill differs

If the request is large, propose decomposition before detailing anything.

Before moving to Step 2, state the most fragile assumption and ask the user to confirm or correct it. See `references/core-principles.md` for question templates and examples.

Also lock the core tone early — `ask-for-tools` feels different from `capability-sense`. If unclear, ask before naming.

### Step 2: Define Scope & Triggers

Summarize what the skill will and won't do. Draft the `description` field:

- Include what the skill is for
- Include specific user phrases and contexts that trigger it
- Do **not** summarize the workflow or process steps
- Keep under 500 characters if possible; max 1024

Before asking for approval, list 2-3 realistic ways the scope could fail or be misunderstood. See `references/core-principles.md` for examples.

**If the user says "include everything," push back.** Broad scopes need risk tiers. Propose a tiered approach and confirm.

**Present the content before asking for a choice.** Output the full scope summary, risks, and proposed `description` to the chat as plain text so the user can read and edit it. Then use `AskUserQuestion` only to collect the approval choice. Do not embed the scope text inside the question itself.

### Step 3: Choose Name & Structure

**Confirm install location first.** This decision is hard to undo cleanly and determines whether the skill is shared with the current project.

**Install location:**

- **User-level scope** — the agent's user-level skills directory (e.g., `~/.kimi-code/skills/`). Use this for reusable, personal skills.
- **Project scope** — the current project's `skills/` directory. Use this when the skill belongs to the repo, will be committed, or is tightly coupled to the project.

If the current project is a skills collection or the user has asked to "push" the skill, default to project scope. Otherwise, ask the user to choose.

**First ask for a naming strategy.** Do not jump straight to 2-3 specific names; the user's mental model may not match the options you pick. Ask which strategy fits best:

| Strategy | Example | Best For |
|----------|---------|----------|
| Verb-led / gerund | `creating-skills`, `writing-plans` | Process, technique, workflow skills |
| Noun / domain | `frontend-design`, `kimi-webbridge` | Reference, domain, tool-kit skills |
| Branded / homophone | `gogoal`, `go-goal-go` | Distinctive, memorable skills |
| Other | — | When the user has a specific name or pattern in mind |

Once the user picks a strategy (or says "Other"), propose 2-3 concrete names within that strategy. If the user chose "Other", ask what feeling, reference, or sound they have in mind before proposing names.

Also propose the directory structure:

```
skill-name/
├── SKILL.md
├── scripts/          # if deterministic helpers are needed
├── references/       # if detailed docs are needed
└── assets/           # if templates or media are needed
```

Only include directories that are actually needed. Wait for user approval on location, name, structure, and resources.

**If the user rejects all naming options, do not just produce another batch.** A rejected name usually means the core tone or scope is still misunderstood. Go back to Step 1 and ask one clarifying question about tone or intent before proposing names again.

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

**Keep the draft concise.** Move dense examples and tables to `references/`; summarize them in the draft.

**Draft `SKILL.md` in English by default.** This keeps the authoritative version consistent across skills and lets a translation skill generate `SKILL.<lang>.md` copies later. Only draft in another language if the user explicitly asks for it.

Before asking for approval, append a short "Remaining assumptions" section. List 1-3 assumptions that, if wrong, would require redesign. Every default behavior that could surprise the user should appear here. See `references/core-principles.md` for examples.

**Explicitly ask the user to confirm or challenge the remaining assumptions.** Do not treat the list as fine print. If any assumption is wrong, redesign before moving to Step 6.

Wait for user approval.

### Step 6: Implement

Once the draft is approved, use the location agreed upon in Step 3:

1. Run `scripts/init_skill.py <name> --path <approved-dir> [--resources ...] [--examples]`
2. Replace the generated `SKILL.md` with the approved draft
3. Create or adapt `scripts/`, `references/`, `assets/` as needed
4. Ensure scripts are executable and tested

See `references/validation-checklist.md` for post-write verification steps.

### Step 7: Validate & Iterate

Run structural validation:

```bash
scripts/quick_validate.py <path/to/skill-folder>
```

Fix reported issues. Then follow the type-specific validation approach and pre-ship checklist in `references/validation-checklist.md`. Iterate based on findings and user feedback. Bump the skill `version` whenever behavior changes.

**After validation passes, propose a forward-test.** Give the skill a realistic user request and check that it triggers, follows its own workflow, and produces output consistent with its declared boundaries. Fix anything that contradicts the SKILL.md before considering the task done.

## Quick Reference

| Task | Command | Resource |
|------|---------|----------|
| Scaffold a skill | `scripts/init_skill.py <name> --path <dir>` | — |
| Scaffold with resources | `scripts/init_skill.py <name> --path <dir> --resources scripts,references` | — |
| Validate a skill | `scripts/quick_validate.py <skill-dir>` | `references/validation-checklist.md` |
| Check standards | — | `references/skill-standards.md` |

- **`references/skill-standards.md`** — Detailed standards for frontmatter, writing style, directory structure, and naming.
- **`references/validation-checklist.md`** — Pre-ship review checklist for documentation, implementation, testing, and sub-agent forward-testing.
