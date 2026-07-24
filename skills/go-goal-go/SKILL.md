---
name: go-goal-go
description: "Help users craft well-specified /goal objectives: end states, proof, boundaries, stop rules, and a mandatory Reviewer sub-agent (with explicit dispatch paragraph) that gates completion. Triggers on user requests in any language asking to write a goal or check fit-for-goal, or on descriptions of multi-turn tasks that could run unattended. Suggests goal mode when appropriate; pushes back when a task is ill-suited."
metadata:
  author: xiehuacheng
  version: "1.3.0"
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
- Start a goal whose goal plan lacks a `<reviewer>` block without a user-confirmed skip line.
- Treat a missing or unparseable Reviewer verdict as a pass.
- Declare a goal complete before the Reviewer sub-agent has returned `PASS` (or the user has confirmed an explicit skip).

## Default behavior

- Goal drafting is conversational and read-only until `CreateGoal` is called.
- All discrete choices (scope, proof method, whether to add skill declarations, Reviewer inclusion, budget) go through `AskUserQuestion`.
- A task that fails the "goal-fit" check gets an honest pushback, not a silently weakened goal.
- Skill/tool declarations are optional; if the user declines, omit the section rather than invent one.
- The Reviewer block is required by default. If the user explicitly opts out, append the literal skip comment to the goal plan; do not infer opt-out from silence.
- The Reviewer is dispatched exactly once at the end of the loop. If `FAIL`, route back into loop iteration or trigger the stop rule — never silently approve.

## When to use

Trigger this skill when the user:

- Says in any language that they want to write a goal, define a target, or check whether a task fits goal mode.
- Describes a multi-step task that could run unattended: fixing all failing tests, migrating a module, auditing issues, refactoring a directory.
- Asks whether a task should be wrapped in `/goal`.
- Wants to explicitly name skills or tools to use during autonomous execution.

## When NOT to use

Do not trigger this skill for:

- Single-turn questions or one-off explanations.
- Tasks with no observable proof of completion ("make the codebase better").
- Pure exploration or research where the path is unknown and human judgment is needed at every step.
- Tasks that require irreversible destructive actions without real-time approval.

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
4.5. **Draft the Reviewer sub-agent.** Default to including a Reviewer completion gate. Load `references/reviewer-template.md`, walk the user through it, then embed **two** things in the goal plan: (a) a literal `<reviewer>...</reviewer>` block with the Reviewer's Role / Inputs / Acceptance / Verdict schema, and (b) a `Reviewer dispatch:` paragraph that explicitly tells the main loop HOW to dispatch this as a sub-agent and consume its verdict. The main loop must NOT read the `<reviewer>` block in-place; it must dispatch it as a sub-agent task. Refuse to proceed if the verdict schema is malformed OR if the dispatch paragraph is missing. If the user explicitly opts out, append `<!-- no Reviewer gate: completion by agent self-judgment -->` to the goal plan and restate the warning once. See `references/reviewer-protocol.md` for the protocol detail.
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
- **Reviewer** — a sub-agent the goal loop dispatches at completion; verdict `PASS` gates completion. Requires both a `<reviewer>` prompt block and a `Reviewer dispatch:` paragraph in the goal plan. See Step 4.5.

## Optional skill/tool declaration & mandatory Reviewer

### Skill/tool declaration (optional)

If the user wants to name skills or system capabilities for the loop, add a section like this to the goal plan:

```
Skills / tools to use inside the loop:
- <skill-name> — <why it is useful for this loop>
- <skill-name> — <why it is useful for this loop>
```

Replace `<skill-name>` with skills the user actually has installed and explicitly named. Do not auto-populate the list.

### Reviewer (mandatory)

The Reviewer is required by default — a self-contained sub-agent prompt the main loop dispatches once at completion. Its verdict (`PASS` or `FAIL: <one-line reason>`) gates goal completion. The goal plan must include both the `<reviewer>` block (the prompt body) and a `Reviewer dispatch:` paragraph (telling the main loop how to dispatch it as a sub-agent and how to consume its verdict). The main loop is forbidden from reading the `<reviewer>` block in-place. See Step 4.5, `references/reviewer-template.md`, and `references/reviewer-protocol.md`.

## Examples

**Weak request → strong goal**

- Weak: "Fix the auth bugs."
- Strong: "Fix every test under `test/auth` that currently fails; run `npm test -- test/auth` after each change until it exits 0; change no file outside `src/auth` or `test/auth`; if a failure requires changing shared infrastructure, stop and ask before proceeding."

**Honest pushback**

- User: "Help me understand this codebase."
- Response: "This sounds like open-ended exploration. Goal mode works best when there is a clear finish line and a way to prove it. If you want, we can turn it into a bounded audit (e.g., 'List all unused exports in src/ and remove them'), or I can answer questions turn by turn."

**Goal with a Reviewer gate**

- End state: every failing test under `test/auth` passes.
- Proof: `npm test -- test/auth` exits 0.
- Boundaries: only files under `src/auth` and `test/auth`.
- Loop: rerun `npm test -- test/auth` after each fix until no failures remain.
- Stop rule: stop and ask if a fix requires changing shared infra.
- Reviewer dispatch:
  - When the loop above reports zero failing tests, dispatch the `<reviewer>` block below as a sub-agent task (do not read it in-place; do not self-judge the verdict).
  - Take the sub-agent's **last line** as the verdict. Anything other than `PASS` or `FAIL: <one-line reason>` is treated as `FAIL`.
  - Goal is complete only when the verdict is `PASS`. If `FAIL`, route back into the loop; if matching a stop rule, stop and report.
- Reviewer (verifier):
  - Inputs: final diff + `npm test -- test/auth` output + the End state above.
  - Acceptance: (a) every previously failing test now passes; (b) no file outside `src/auth` or `test/auth` was modified; (c) no test was deleted or skipped to make it pass.
  - Verdict: `PASS` or `FAIL: <one-line reason>`.

**Honest Reviewer opt-out**

- Same goal as above, with the Reviewer block replaced by:
  `<!-- no Reviewer gate: completion by agent self-judgment -->`
- The skill surfaces a one-line warning at draft time, and the warning is restated once when the goal starts. The user, not the skill, owns the completion decision in this mode.

## Error handling & edge cases

- **User declines goal mode after suggestion:** Respect the decision. Do not bring it up again for the same task.
- **User asks for a goal with no proof:** Refuse to draft until a verification method is identified or added.
- **User names a skill that may not exist:** Include the name as declared, and add a reminder to verify the skill is available before the loop runs.
- **Goal wording is too vague:** Ask the user to pick one concrete finish line. Do not proceed with multiple competing interpretations.
- **Reviewer-related edge cases** (opt-out mechanics, malformed verdict, proof vs Reviewer conflict, multi-turn attempts): see `references/reviewer-protocol.md`.
