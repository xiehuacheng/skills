---
name: creating-skills
description: Use when the user wants to create a new skill, write a SKILL.md, scaffold skill structure, improve an existing skill, or discuss skill design. Triggers on phrases like "create a skill", "new skill", "write a skill", "skill design", "validate skill", or when the user describes a reusable workflow, technique, or domain guide they want Kimi Code to learn.
metadata:
  author: xiehuacheng
  version: "1.1.0"
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

## What a Skill Must Declare

Every skill must make its boundaries and defaults obvious to the agent. Add a short section near the top of `SKILL.md` that covers:

- **Can do** — concrete capabilities the skill provides.
- **Cannot do (without explicit approval)** — operations the skill must never perform automatically.
- **Default behavior** — whether commands are read-only by default, what requires user confirmation, and what assumptions are forbidden.

Example from a GitHub-facing skill:

> **Can do:** read public and private GitHub data, generate reports, draft READMEs and metadata recommendations.  
> **Cannot do:** push commits, update repository metadata, or delete Star Lists without explicit user approval.  
> **Default behavior:** all commands are read-only. Any write operation requires the user to confirm the exact change.

This prevents the agent from overstepping and makes approval gates explicit.

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

### 7. Document Boundaries & Defaults Explicitly

The agent using your skill has no external context. If a default value, a required permission, or an approval gate is not written in `SKILL.md`, the agent will guess — and often guess wrong.

Document:

- Required tools, versions, and authentication scopes
- Default values and when they may be overridden
- Operations that require explicit user approval
- Assumptions the agent must not make (e.g., "do not auto-select languages")

Keep documentation and implementation in sync. When you change code, update `SKILL.md` and bump the skill `version`.

### 8. Provide Agent Checklists & Conversational Patterns

A workflow skill should teach the agent *how* to work with the user, not just *what* commands to run.

Include:

- **A standard execution workflow** — e.g., authenticate → clarify intent → run command → summarize → propose next step → get approval → apply.
- **A pre-run checklist** — authentication, scope, target, expected output, and whether approval is needed.
- **Conversational patterns** — how to propose options, pause at decision points, confirm exact actions, and present results.

Example pattern: instead of "Which languages do you want?", say "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese. Does that work, or would you prefer a different set?"

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
- **Can do / Cannot do / Default behavior** declarations
- **Pre-run checks** (authentication, scopes, environment, target)
- **Core instructions** with exact commands and options
- **User approval points** — when must the agent stop and ask
- **Expected output examples** so the agent knows what success looks like
- **Error handling & edge cases** — common failures and how to recover
- **Sub-agent prompts** if the skill delegates work to sub-agents
- Any resource references

Do **not** write it to disk yet. Wait for user approval.

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

Fix reported issues. Then run quality checks appropriate to the skill type:

| Skill Type | Validation Approach |
|---|---|
| Reference / technique | `quick_validate.py` + read-through for accuracy |
| Workflow with scripts | `quick_validate.py` + run each documented command + inspect output |
| Multi-step / sub-agent workflow | `quick_validate.py` + dispatch a sub-agent with a realistic end-to-end request + review its report |
| Write-operation skill | Verify every write path requires explicit user approval and shows the result |

For sub-agent testing, give the sub-agent:

- The skill root path
- A realistic user request
- A checklist of things to verify (documentation clarity, command success, output quality, edge cases)
- Instructions to report issues, not fix them

Iterate based on sub-agent findings and user feedback. Bump the skill `version` whenever behavior changes.

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

## Appendix: Skill Validation Checklist

Use this checklist when reviewing or testing a skill before shipping it.

### Documentation

- [ ] Frontmatter `name` and `description` are present and under 1024 characters.
- [ ] `description` explains what the skill is for and what user phrases trigger it.
- [ ] The body declares **Can do / Cannot do / Default behavior**.
- [ ] Every command has a clear invocation example.
- [ ] Pre-run checks (authentication, scopes, environment) are documented.
- [ ] Approval points for write operations are explicit.
- [ ] Expected output shape is shown with examples.
- [ ] Common errors and recovery steps are listed.
- [ ] Sub-agent prompts are provided if the skill delegates work.

### Implementation

- [ ] Scripts run from the skill root without requiring global installs.
- [ ] Commands produce the output promised in the documentation.
- [ ] Default values in code match the defaults in `SKILL.md`.
- [ ] Write operations do not execute without explicit user approval.
- [ ] Temporary files are cleaned up unless the user asked to keep them.
- [ ] Cache behavior, if any, is documented and manually clearable.

### Quality & Testing

- [ ] `scripts/quick_validate.py <skill-dir>` passes.
- [ ] Each documented command was run successfully.
- [ ] Output artifacts match the expected shape and content.
- [ ] Edge cases were tested (missing inputs, bad auth, unwritable paths).
- [ ] For workflow skills, a sub-agent completed an end-to-end realistic request and reported no blockers.
- [ ] The skill `version` was bumped if behavior changed.
