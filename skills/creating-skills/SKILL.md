---
name: creating-skills
description: Use when the user wants to create a new skill, write a SKILL.md, scaffold skill structure, improve an existing skill, or discuss skill design. Triggers on phrases like "create a skill", "new skill", "write a skill", "skill design", "validate skill", or when the user describes a reusable workflow, technique, or domain guide they want Kimi Code to learn.
---

# Creating Skills

Create effective Kimi Code skills through collaborative brainstorming, clear standards, and human-in-the-loop checkpoints.

## What a Good Skill Does

A skill is a reusable guide that turns Kimi from a general-purpose agent into a specialist for a specific domain, workflow, or tool. It contains a `SKILL.md` plus optional bundled resources (`scripts/`, `references/`, `assets/`).

Good skills are:

- **Reusable** — apply across projects, not one-off solutions
- **Trigger-aware** — loaded only when the task matches
- **Concise** — every token justifies its cost
- **Composable** — scripts prefer stdin/stdout over intermediate files

## Core Principles

### 1. Brainstorm Before Building

Start with natural, exploratory dialogue. Follow the user's lead, ask one question at a time, and prefer multiple-choice questions when a decision has clear options. Do not jump to implementation until the design is approved.

Concrete questions to explore:

- "What real user requests should trigger this skill? Give me 2-3 examples of what you'd say."
- "Is this a workflow, a technique, a reference guide, or a tool integration?"
- "Where should it live — your user-level skills directory, or this project's `skills/` directory?"
- "Are there frameworks, file types, or tools this skill should focus on?"
- "When should this skill NOT be used?"

### 2. Human Checkpoints

Never write or modify files until the user has approved the design. The checkpoints are:

1. **Scope approved** — what the skill covers and what it doesn't
2. **Triggers approved** — the description and example user phrases
3. **Structure approved** — name, directory layout, resources needed
4. **Draft approved** — frontmatter + SKILL.md body shown in chat first
5. **Implementation complete** — files written and validated

### 3. Standards-First Design

Every generated skill must follow the standards in this document. The agent should apply them by default, not ask the user whether to follow them.

### 4. Prefer stdin/stdout Over Intermediate Files

When a skill's workflow involves multiple scripts or steps:

- **Default design**: script A writes to stdout → agent reads → passes to script B via stdin
- **Avoid** creating temporary JSON, TXT, or log files just to pass data between steps
- Only write files when:
  - The user explicitly asks for a persistent artifact
  - A downstream external tool can only read files
  - The data volume or format makes pipes impractical
- If temporary files are unavoidable, clean them up before finishing

### 5. Progressive Disclosure

Structure content in three levels:

1. **Metadata** (`name` + `description`) — always in context
2. **SKILL.md body** — loaded when skill triggers
3. **Bundled resources** — loaded only when needed

Keep SKILL.md lean. Move detailed guides, schemas, API docs, and multi-framework variants to `references/`.

### 6. Use Structured Interaction for User Input

When a skill needs information or decisions from the user, prefer the agent's structured interaction capabilities (e.g., multiple-choice questions, confirmations) over dumping a wall of text questions into the chat. This keeps the conversation focused and reduces friction.

Guidelines:

- Group related questions into a single structured turn when it makes sense
- Avoid asking the user to reply to long lists of free-text questions
- For binary or scoped decisions, use single-choice or multi-choice prompts
- Fall back to free-text only when the answer is genuinely open-ended

## Skill Creation Workflow

Follow these steps in order. Do not skip checkpoints.

### Step 1: Explore & Brainstorm

Understand the user's intent through dialogue. Identify:

- Concrete trigger phrases
- File types, tools, or APIs involved
- Scope boundaries
- Skill type: workflow, technique, reference, or tool integration

If the request is large, propose decomposition before detailing anything.

### Step 2: Define Scope & Triggers

Summarize what the skill will and won't do. Draft the `description` field:

- Include what the skill is for
- Include specific user phrases and contexts that trigger it
- Do **not** summarize the workflow or process steps
- Keep under 500 characters if possible; max 1024

Present the scope and proposed description to the user. Wait for approval.

### Step 3: Choose Name & Structure

Propose 2-3 naming options with rationale:

| Form | Example | Best For |
|------|---------|----------|
| Verb-led / gerund | `creating-skills`, `writing-plans` | Process, technique, workflow skills |
| Noun / domain | `frontend-design`, `kimi-webbridge` | Reference, domain, tool-kit skills |

Also propose the directory structure and install location:

```
skill-name/
├── SKILL.md
├── scripts/          # if deterministic helpers are needed
├── references/       # if detailed docs are needed
└── assets/           # if templates or media are needed
```

**Install location:**

- **User-level scope** — the agent's user-level skills directory (e.g., under the user's home directory). Use this for reusable, personal skills.
- **Project scope** — the current project's `skills/` directory. Use this for project-specific skills.

Ask the user which scope they prefer. If they have no preference and the skill is broadly useful, default to the user-level skills directory. If it is tightly coupled to the current project, use the project directory.

Only include directories that are actually needed. Wait for user approval on name, structure, and location.

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
- Core instructions
- Any resource references

Do **not** write it to disk yet. Wait for user approval.

### Step 6: Implement

Once the draft is approved, use the location agreed upon in Step 3:

1. Run `scripts/init_skill.py <name> --path <approved-dir> [--resources ...] [--examples]`
2. Replace the generated `SKILL.md` with the approved draft
3. Create or adapt `scripts/`, `references/`, `assets/` as needed
4. Ensure scripts are executable and tested

### Step 7: Validate & Iterate

Run:

```bash
scripts/quick_validate.py <path/to/skill-folder>
```

Fix reported issues. For complex skills, forward-test by dispatching subagents with realistic requests. Iterate based on results and user feedback.

## Skill Standards

Generated skills must follow the standards in `references/skill-standards.md`, including:

- `name` and `description` frontmatter requirements
- Imperative body writing style
- Progressive disclosure and directory rules
- Naming conventions
- What not to create

Consult that file when drafting or reviewing a skill.

## Quick Reference

| Task | Command |
|------|---------|
| Scaffold a skill | `scripts/init_skill.py <name> --path <dir>` |
| Scaffold with resources | `scripts/init_skill.py <name> --path <dir> --resources scripts,references` |
| Validate a skill | `scripts/quick_validate.py <skill-dir>` |

## Resources

- **`scripts/init_skill.py`** — Scaffold a new skill directory.
- **`scripts/quick_validate.py`** — Validate SKILL.md structure, frontmatter, and standards.
- **`references/skill-standards.md`** — Detailed standards for frontmatter, writing style, directory structure, and naming.
