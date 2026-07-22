---
name: go-goal-go
description: Help users craft well-specified /goal objectives with clear end states, proof, boundaries, and stop rules. Trigger when the user asks for goal writing, wants to turn a multi-turn task into an autonomous run, or describes work that could benefit from goal mode. Proactively suggests goal mode when appropriate, lets users explicitly name skills/system tools to use inside the loop, and pushes back honestly when a task is ill-suited for goal execution.
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# go-goal-go

Help users turn rough intentions into concrete `/goal` objectives that can run autonomously across many turns. Be more proactive than the built-in `write-goal` skill: suggest goal mode when a task looks iterative, verifiable, and bounded, while being honest about when goal mode is the wrong tool.

## Can do

- Evaluate whether a described task is a good fit for goal mode.
- Proactively suggest using `/goal` when the task is multi-turn, repeatable, and verifiable.
- Draft goal wording with the user: end state, proof, boundaries, loop strategy, and stop rule.
- Offer an optional section in the goal plan for explicitly naming skills and system tools to use inside the loop.
- Point out clearly when a task is ill-suited for goal mode and explain why.

## Cannot do without explicit approval

- Start a goal before the user has approved the exact wording.
- Modify or cancel an already-running goal.
- Force a goal onto a task the user has already declined to run in goal mode.
- Auto-select skills or tools for the user; only include those the user explicitly names.

## Default behavior

- Goal drafting is conversational and read-only until `CreateGoal` is called.
- All discrete choices (scope, proof method, whether to add skill declarations, budget) go through `AskUserQuestion`.
- A task that fails the "goal-fit" check gets an honest pushback, not a silently weakened goal.
- Skill/tool declarations are optional; if the user declines, omit the section rather than invent one.

## When to use

Trigger this skill when the user:

- Says phrases like "帮我写个 goal"、"define a goal"、"写一个目标"、"适合 goal 吗".
- Describes a multi-step task that could run unattended: fixing all failing tests, migrating a module, auditing issues, refactoring a directory.
- Asks whether a task should be wrapped in `/goal`.
- Wants to explicitly name skills or tools to use during autonomous execution.

## When NOT to use

Do not trigger this skill for:

- Single-turn questions or one-off explanations.
- Tasks with no observable proof of completion ("make the codebase better").
- Pure exploration or research where the path is unknown and human judgment is needed at every step.
- Tasks that require irreversible destructive actions without real-time approval.

## Relationship to built-in write-goal

The built-in `write-goal` skill is a general-purpose coach for goal wording. `go-goal-go` adds two responsibilities:

1. **Proactive fit assessment** — decide whether to suggest goal mode at all.
2. **Explicit skill/tool declaration** — let users name the skills and system capabilities the autonomous loop should rely on.

If both skills are available, prefer `go-goal-go` when the user might need a fit judgment or wants to declare loop skills; fall back to `write-goal` for pure wording refinement.

## Goal-fit check

Before drafting, score the task against these signals. A task should hit **at least two** to be a good candidate:

| Signal | Example |
|--------|---------|
| Queue-shaped | "Fix all failing tests in `test/auth`" |
| Verifiable | "Done when `npm test` exits 0" |
| Bounded | "Only touch files under `src/payment`" |
| Repeatable loop | "Rerun the check after each fix" |
| Has stop rule | "Stop and ask before touching shared infra" |

If the task hits **zero or one** signal, push back and explain which signal is missing.

## Workflow

1. **Assess fit.** Run the goal-fit check. If the task is unsuitable, state why and stop.
2. **Confirm intent.** Ask what outcome the user wants and what would prove it is done. Use `AskUserQuestion` for any discrete choice.
3. **Draft the goal.** Write a concrete objective covering end state, proof, boundaries, loop, and stop rule. Use the user's language.
4. **Offer skill/tool declaration.** Ask whether to add an explicit "Use these skills/tools" section to the goal plan.
5. **Show the full goal.** Present the exact wording and walk through the choices.
6. **Revise together.** Repeat drafting until the user approves.
7. **Start the goal.** Call `CreateGoal` only after explicit approval.

## Goal contract checklist

A strong goal should include:

- **End state** — what must become true.
- **Proof** — the observable command, search, test, or metric that proves it.
- **Boundaries** — what may and may not be touched.
- **Loop** — how to iterate when the work is queue-shaped.
- **Stop rule** — when to stop and report instead of forcing a pass.

## Optional skill/tool declaration

If the user wants to name skills or system capabilities for the loop, add a section like this to the goal plan:

```
Skills / tools to use inside the loop:
- <skill-name> — <why it is useful for this loop>
- <skill-name> — <why it is useful for this loop>
```

Replace `<skill-name>` with skills the user actually has installed and explicitly named. Do not auto-populate the list.

## Examples

**Weak request → strong goal**

- Weak: "Fix the auth bugs."
- Strong: "Fix every test under `test/auth` that currently fails; run `npm test -- test/auth` after each change until it exits 0; change no file outside `src/auth` or `test/auth`; if a failure requires changing shared infrastructure, stop and ask before proceeding."

**Honest pushback**

- User: "Help me understand this codebase."
- Response: "This sounds like open-ended exploration. Goal mode works best when there is a clear finish line and a way to prove it. If you want, we can turn it into a bounded audit (e.g., 'List all unused exports in src/ and remove them'), or I can answer questions turn by turn."

## Error handling & edge cases

- **User declines goal mode after suggestion:** Respect the decision. Do not bring it up again for the same task.
- **User asks for a goal with no proof:** Refuse to draft until a verification method is identified or added.
- **User names a skill that may not exist:** Include the name as declared, and add a reminder to verify the skill is available before the loop runs.
- **Goal wording is too vague:** Ask the user to pick one concrete finish line. Do not proceed with multiple competing interpretations.
