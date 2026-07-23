# Core Principles — Detail

Expanded guidance for each principle in `creating-skills/SKILL.md`. Read when you need examples or question templates; the SKILL.md body already summarizes the rule.

## 1. Brainstorm Before Building

Start with natural, exploratory dialogue. Follow the user's lead, ask one question at a time, prefer multiple-choice when a decision has clear options. For every answer, ask: "What would make this assumption collapse?"

Concrete questions to explore (pick what fits): trigger phrases + 2-3 example user requests; skill type (workflow / technique / reference / tool integration); install location (user-level vs project); frameworks or tools in scope; when the skill should NOT be used; the weakest assumption; the core tone.

## 2. Human Checkpoints

Never write or modify files until the user has approved the design. Before each checkpoint, run a fragility check: state the one assumption most likely to invalidate the current plan.

Checkpoints:

1. Scope approved — what the skill covers and what it doesn't
2. Triggers approved — the description and example user phrases
3. Structure approved — name, directory layout, resources needed
4. Draft approved — frontmatter + SKILL.md body shown in chat first
5. Implementation complete — files written and validated

## 3. Challenge the Plan Before Approving It

A plan that has not been attacked is not ready. Before asking for approval:

- Name the most fragile assumption
- List 2-3 realistic ways the skill could fail or be misused
- Ask one question that, if answered differently, would change the design

Only proceed when the user has confirmed the assumption or changed the plan to remove it.

## 4. Standards-First Design

Every generated skill must follow the standards in `references/skill-standards.md`. Apply them by default, do not ask the user whether to follow them.

## 5. Prefer stdin/stdout Over Intermediate Files

Default design: script A writes to stdout → agent reads → passes to script B via stdin. Avoid temporary JSON/TXT/log files just to pass data between steps.

Only write files when: the user explicitly asked for a persistent artifact, a downstream external tool can only read files, or the data volume makes pipes impractical. If temporary files are unavoidable, clean them up before finishing.

## 6. Progressive Disclosure

Structure content in three levels:

1. Metadata (`name` + `description`) — always in context
2. SKILL.md body — loaded when skill triggers
3. Bundled resources — loaded only when needed

Keep SKILL.md lean. Move detailed guides, schemas, API docs, multi-framework variants to `references/`.

## 7. Use Structured Interaction for User Input

Prefer structured interaction (multiple-choice, confirmations) over walls of text questions. Group related questions into a single structured turn when it makes sense. For binary or scoped decisions, use single-choice or multi-choice prompts. Fall back to free-text only when the answer is genuinely open-ended.

**Important: structured interaction is for collecting choices, not for displaying content that must be read.** Output reviewable content (scope summary, SKILL.md draft, risks) to the chat first, then use `AskUserQuestion` only for the approval or selection. Never embed long reviewable content inside the question field.

## 8. Document Boundaries & Defaults Explicitly

The agent using your skill has no external context. Document required tools, default values, approval gates, and forbidden assumptions in `SKILL.md`. See `references/skill-standards.md` for the full list. Keep documentation and implementation in sync; bump `version` when behavior changes.

## 9. Provide Agent Checklists & Conversational Patterns

A workflow skill should teach the agent *how* to work with the user, not just *what* commands to run.

Include:

- **Standard execution workflow** — e.g., authenticate → clarify intent → run command → summarize → propose next step → get approval → apply
- **Pre-run checklist** — authentication, scope, target, expected output, whether approval is needed
- **Conversational patterns** — propose options, pause at decision points, confirm exact actions, present results