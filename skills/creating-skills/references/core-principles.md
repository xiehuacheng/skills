# Core Principles Detail

Expanded guidance for each principle in `creating-skills/SKILL.md`.

## 1. Brainstorm Before Building

Start with natural, exploratory dialogue. Follow the user's lead, ask one question at a time, and prefer multiple-choice questions when a decision has clear options. Do not jump to implementation until the design is approved.

While exploring, actively challenge assumptions. The user's first description is rarely the final design. For every answer, ask: "What would make this assumption collapse?" If you cannot name the most fragile premise, you have not brainstormed enough.

Concrete questions to explore:

- "What real user requests should trigger this skill? Give me 2-3 examples of what you'd say."
- "Is this a workflow, a technique, a reference guide, or a tool integration?"
- "Where should it live — your user-level skills directory, or this project's `skills/` directory?"
- "Are there frameworks, file types, or tools this skill should focus on?"
- "When should this skill NOT be used?"
- "What is the weakest assumption in what you just told me? If that assumption is wrong, what changes?"
- "What tone should this skill have — should it ask the user for help, expand its own capabilities, guard boundaries, or coach the user?"

**Fragile assumption example:** "You said 'focus skill'. My weakest assumption is that you mean a Pomodoro timer. If you actually mean 'prevent effort from drifting to low-return projects', the design changes completely. Which is it?"

## 2. Human Checkpoints

Never write or modify files until the user has approved the design. Before each checkpoint, run a quick fragility check: state the one assumption most likely to invalidate the current plan. The checkpoints are:

1. **Scope approved** — what the skill covers and what it doesn't
2. **Triggers approved** — the description and example user phrases
3. **Structure approved** — name, directory layout, resources needed
4. **Draft approved** — frontmatter + SKILL.md body shown in chat first
5. **Implementation complete** — files written and validated

## 3. Challenge the Plan Before Approving It

A plan that has not been attacked is not ready. Before asking for approval:

- Name the most fragile assumption.
- List 2-3 realistic ways the skill could fail or be misused.
- Ask one question that, if answered differently, would change the design.

Only proceed when the user has either confirmed the assumption or changed the plan to remove it.

**Scope risk example:**

> Scope risks:
> 1. "Focus" could mean time-blocking or direction-guarding. This skill assumes the latter.
> 2. Users might expect the skill to block apps or notifications, which it cannot do.
> 3. The drift judgment is agent-driven, which can be wrong for edge cases.

**Broad scope pushback example:** "You said all tool types. Should API keys and system permissions require explicit approval every time, while CLI tools and packages are checked first and only asked about if missing?"

## 4. Standards-First Design

Every generated skill must follow the standards in `references/skill-standards.md`. The agent should apply them by default, not ask the user whether to follow them.

## 5. Prefer stdin/stdout Over Intermediate Files

When a skill's workflow involves multiple scripts or steps:

- **Default design**: script A writes to stdout → agent reads → passes to script B via stdin
- **Avoid** creating temporary JSON, TXT, or log files just to pass data between steps
- Only write files when:
  - The user explicitly asks for a persistent artifact
  - A downstream external tool can only read files
  - The data volume or format makes pipes impractical
- If temporary files are unavoidable, clean them up before finishing

## 6. Progressive Disclosure

Structure content in three levels:

1. **Metadata** (`name` + `description`) — always in context
2. **SKILL.md body** — loaded when skill triggers
3. **Bundled resources** — loaded only when needed

Keep SKILL.md lean. Move detailed guides, schemas, API docs, and multi-framework variants to `references/`.

## 7. Use Structured Interaction for User Input

When a skill needs information or decisions from the user, prefer structured interaction (multiple-choice questions, confirmations) over dumping a wall of text questions into the chat. This keeps the conversation focused and reduces friction.

Guidelines:

- Group related questions into a single structured turn when it makes sense
- Avoid asking the user to reply to long lists of free-text questions
- For binary or scoped decisions, use single-choice or multi-choice prompts
- Fall back to free-text only when the answer is genuinely open-ended

**Important: structured interaction is for collecting choices, not for displaying content that must be read.** If the user needs to review a scope summary, a SKILL.md draft, or a list of risks, output that text to the chat first, then use `AskUserQuestion` only for the approval or selection. Never embed long reviewable content inside the question field itself.

## 8. Document Boundaries & Defaults Explicitly

The agent using your skill has no external context. Document required tools, default values, approval gates, and forbidden assumptions in `SKILL.md`. See `references/skill-standards.md` for the full list.

Keep documentation and implementation in sync; bump `version` when behavior changes.

## 9. Provide Agent Checklists & Conversational Patterns

A workflow skill should teach the agent *how* to work with the user, not just *what* commands to run.

Include:

- **A standard execution workflow** — e.g., authenticate → clarify intent → run command → summarize → propose next step → get approval → apply.
- **A pre-run checklist** — authentication, scope, target, expected output, and whether approval is needed.
- **Conversational patterns** — how to propose options, pause at decision points, confirm exact actions, and present results.

Example pattern: instead of "Which languages do you want?", say "I detected the README is in Chinese. I recommend Chinese as primary plus English and Japanese. Does that work, or would you prefer a different set?"

## Remaining Assumptions Example

Use this format at the end of a draft before asking for approval:

> Remaining assumptions:
> 1. The user wants automatic checks rather than manual triggers.
> 2. The user accepts storing personal direction in `~/.config/<skill-name>/profile.md`.
> 3. If the user does not respond to a tool request, the agent defaults to downgrade rather than stop.
