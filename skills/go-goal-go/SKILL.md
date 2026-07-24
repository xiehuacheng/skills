---
name: go-goal-go
description: "Help users craft /goal objectives that are safe to run unattended: end state, proof, boundaries, budget, lifecycle, stop rule, and a hardened Reviewer sub-agent dispatch primitive. Triggers on user requests in any language asking to write a goal or check fit-for-goal, or on descriptions of multi-turn tasks that could run unattended. Suggests goal mode when appropriate; pushes back when a task is ill-suited."
metadata:
  author: xiehuacheng
  version: "2.0.0"
---

# go-goal-go

Help users turn rough intentions into concrete `/goal` objectives that are **safe to run unattended**. The contract below makes every goal auditable, bounded, and verifiable by an independent Reviewer sub-agent. Be more proactive than the built-in `write-goal` skill: suggest goal mode when a task looks iterative and bounded, while being honest about when goal mode is the wrong tool.

## Can do

- Evaluate whether a described task is a good fit for goal mode.
- Proactively suggest using `/goal` when the task is multi-turn, repeatable, verifiable, and bounded.
- Draft goal wording with the user across 8 contract items (below).
- Offer an optional section for explicitly naming skills/tools to use inside the loop.
- Embed a hardened Reviewer sub-agent dispatch contract alongside the goal.
- Push back honestly when a task is ill-suited for goal mode or any contract item is unspecifiable.

## Cannot do without explicit approval

- Start a goal before the user has approved the exact wording.
- Modify or cancel an already-running goal.
- Force a goal onto a task the user has already declined to run in goal mode.
- Auto-select skills or tools for the user; only include those the user explicitly names.
- Draft a goal plan that lacks any of the 8 contract items, or has empty / vague values for any item.
- Start a goal whose `<dispatch-primitive>` block is missing `budget`, `sandbox`, or `verdict_parser`.
- Declare a goal complete before the Reviewer sub-agent has returned `PASS` (or the user has explicitly confirmed a manual skip).
- Treat a missing or unparseable Reviewer verdict as a pass.
- Allow the loop to continue past BudgetStop or HardStop.

## Default behavior

- Goal drafting is conversational and read-only until `CreateGoal` is called.
- All discrete choices go through `AskUserQuestion`. Default choices declared in this skill are the recommended values; user override requires explicit selection.
- The 8-item contract is mandatory; refusal to specify any item means refusal to draft.
- Boundaries default to project-only paths + deny-all side effects + deny-all network (capability boundary default-deny). User must enumerate every allowed side effect.
- Budget defaults: `max_iterations = 50`, `max_wall_clock = 30m`, `max_cost = $2`, `max_no_progress = 5`, `completion_reserve = 20% of max_cost` (reserved for handoff + Reviewer dispatch).
- Reviewer role defaults to `verifier`. Adversarial role requires explicit user choice and triggers default-deny sandbox.
- The Reviewer is dispatched **exactly once per goal iteration** at completion, by canonical primitive `dispatch_review_subagent`. Verdict parsed by the deterministic parser in `references/dispatch-primitive.md`.
- Per-iteration fail / Reviewer FAIL routes back into Loop iteration, not a new stop. Counts against Budget.
- All goal plans ship with a Lifecycle identification: plan hash + base commit + tool versions. Resume requires re-approval on drift.
- All goal runs produce an artifact bundle under `goal-logs/<run-id>/`. Without retention, the goal is not complete.

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
- Tasks that require irreversible destructive actions outside an explicit capability boundary.
- Tasks where the user cannot specify a budget (token, time, iterations, or cost).

## Goal-fit check

Before drafting, score the task against these signals. A task should hit **at least three** to be a good candidate:

| Signal | Example |
|---|---|
| Queue-shaped | "Fix all failing tests in `test/auth`" |
| Verifiable | "Done when `npm test` exits 0 AND no file outside src/ was modified" |
| Bounded | "Only touch files under `src/payment` AND no external API calls" |
| Repeatable loop | "Rerun the check after each fix" |
| Has stop rule | "Stop and ask before touching shared infra" |
| Has budget | "Max 30 minutes or 50 iterations" |
| Has lifecycle anchors | "Plan hash + base commit captured at start" |

If the task hits **fewer than three** signals, push back and explain which signals are missing.

## Workflow

1. **Assess fit.** Run the goal-fit check. If the task is unsuitable, state why and stop.
2. **Confirm intent.** Ask what outcome the user wants and what would prove it is done. Use `AskUserQuestion` for every discrete choice.
3. **Draft the goal.** Work through the 8 contract items in order. Use the user's language. Use the defaults in this skill unless the user overrides them.
4. **Offer skill/tool declaration.** Ask whether to add an explicit "Use these skills/tools" section to the goal plan.
5. **Draft the Reviewer dispatch.** Embed BOTH a literal `<dispatch-primitive>` block AND a literal `<reviewer>` block in the goal plan. See `references/dispatch-primitive.md` for the canonical schema and `references/reviewer-template.md` for the prompt body. Refuse to ship either block missing fields.
6. **Show the full goal.** Present the exact wording and walk through the choices.
7. **Revise together.** Repeat drafting until the user approves.
8. **Start the goal.** Call `CreateGoal` only after explicit approval. Capture the plan hash, base commit, and tool versions at start time and write them to `goal-logs/<run-id>/manifest.json`.

## Goal contract checklist

A strong goal plan **must include** all 8 items. The semantic and parsing rules for each item are pinned in `references/contract-glossary.md`.

1. **End state** — a runtime-detectable target. Must name an independently-verifiable anchor (file path + predicate, branch/tag state, count, or external-system state). Pure prose is rejected.
2. **Proof** — a command + expected predicate (exit code, regex match, count, file predicate) + timeout + flake policy + environment expectation. "Tests pass" without an observable predicate is rejected.
3. **Boundaries** — in-scope paths + side-effect allow-list (read / write / send / pay) + network policy (deny or allowlist) + reversibility class for any non-read action.
4. **Loop** — how to iterate when work is queue-shaped. Must declare checkpoint cadence (every iteration or every N minutes) and resume rule (last checkpoint + re-verify).
5. **Budget** — `max_iterations` + `max_wall_clock` + `max_cost` + `max_no_progress` + completion reserve. Without all five, the goal is rejected.
6. **Lifecycle** — captures the run identity: plan hash + base commit + tool versions. Required for any restart / resume / audit.
7. **Stop rule** — categorized into HardStop (terminal safety violation) and SoftStop (pause + user re-approval). BudgetStop lives in `Budget`. Reviewer FAIL lives in `Reviewer`.
8. **Reviewer** — a sub-agent the loop dispatches at completion. Requires BOTH a `<dispatch-primitive>` block (declarative contract) AND a `<reviewer>` block (prompt body). Verdict `PASS` gates completion.

## Optional skill/tool declaration

If the user wants to name skills or system capabilities for the loop, add a section like this to the goal plan:

```
Skills / tools to use inside the loop:
- <skill-name> — <why it is useful for this loop>
- <skill-name> — <why it is useful for this loop>
```

Replace `<skill-name>` with skills the user actually has installed and explicitly named. Do not auto-populate the list.

## Reviewer (mandatory) — two blocks

The goal plan must ship BOTH blocks. Either block missing is malformed.

### Block 1 — `<dispatch-primitive>` (declarative)

This block is the contract between the main loop and the sub-agent runtime. See `references/dispatch-primitive.md` for the full schema. Minimal example:

```
<dispatch-primitive>
primitive: dispatch_review_subagent
version: 2
role: verifier
when: when the loop above reports End state satisfied and no Budget cap is hit
budget:
  max_tokens: 8000
  max_wall_clock_seconds: 600
  max_tool_calls: 50
  max_retries_on_malformed: 1
  max_retries_on_dispatch_error: 0
sandbox:
  file_access: read-only
  network: deny
  git_push: deny
  secret_scrub: required
verdict_parser: deterministic-trim-blank-regex
inputs:
  - name: final_diff
    source: git diff <base>..HEAD
    transport: inline
    max_bytes: 262144
  - name: proof_output
    source: last proof invocation stdout+stderr
    transport: inline
    max_bytes: 524288
on_fail: route_back_to_loop_with_iteration_decrement
artifacts:
  reviewer_output: goal-logs/<run-id>/reviewer.txt
  user_visible_summary_on_fail: one_paragraph
idempotency_key: <derived from run_id + iteration + role>
</dispatch-primitive>
```

### Block 2 — `<reviewer>` (prompt body)

Prompt body for the dispatched sub-agent. See `references/reviewer-template.md`. Minimal example:

```
<reviewer>
Role: verifier

Inputs:
- final_diff (above)
- proof_output (above)

Acceptance Criteria:
1. Each independently-verifiable anchor from End state passes its check.
2. No file outside Boundaries' in-scope paths was modified.
3. No declared side-effect class was used outside its allow-list.

Verdict: the last line must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

## Examples

**Weak request → strong goal**

- Weak: "Fix the auth bugs."
- Strong: "End state every failing test under `test/auth` passes. Proof `npm test -- test/auth` exits 0 within 120s with no skipped tests added. Boundaries only files under `src/auth` and `test/auth`; no API calls. Loop rerun `npm test -- test/auth` after each fix; checkpoint every iteration; resume from last checkpoint. Budget 30 iterations / 20 min / $0.50 / 3-stall counter, 20% reserve. Lifecycle pin base commit at start. Stop rule SoftStop if a fix requires changes under `shared-infra/` (user re-approval required). Reviewer verifier, read-only sandbox, route back to Loop on FAIL."

**Honest pushback**

- User: "Help me understand this codebase."
- Response: "This sounds like open-ended exploration. Goal mode works best when there is a clear finish line, a way to prove it, and a budget you can specify. If you want, we can turn it into a bounded audit (e.g., 'List all unused exports in src/ and remove them', with Budget 5 min / 10 iterations), or I can answer questions turn by turn."

## Error handling & edge cases

- **User declines goal mode after suggestion:** Respect the decision. Do not bring it up again for the same task.
- **User asks for a goal with no proof:** Refuse to draft until an observable predicate is identified.
- **User names a skill that may not exist:** Include the name as declared, and add a reminder to verify it is available before the loop runs.
- **Goal wording is too vague:** Ask the user to pick one concrete finish line. Do not proceed with multiple competing interpretations.
- **`<reviewer>` block provided but no `<dispatch-primitive>` block:** Malformed. Refuse to ship. The main loop needs both the prompt body and the declarative dispatch contract.
- **`<dispatch-primitive>` block missing `budget`, `sandbox`, or `verdict_parser`:** Refuse to ship.
- **Reviewer verdict FAIL:** Route back into Loop iteration, decrement remaining budget, do not declare complete.
- **Reviewer `REVIEW_INFRA_ERROR` (timeout, OOM, refused, empty):** Pause as SoftStop, surface to user with the captured partial output, do not change code.
- **BudgetStop fires:** Terminate with cost summary, emit compact handoff, do not declare PASS.
- **HardStop fires:** Terminate immediately, do not retry, surface to user.
- **SoftStop fires:** Pause, persist checkpoint, ask user for re-approval to resume.
- **Plan hash drift detected on resume:** Pause for re-approval; do not silently merge old and new plans.
- **User wants a different verdict format:** Refuse. The `PASS` / `FAIL: <reason>` schema is the contract; deterministic parser in `references/dispatch-primitive.md` is the only parser.
- **Main loop crash during a goal:** Capability boundary MUST atomically commit run manifest at start, so reattachment uses the persisted state.

## References

- `references/contract-glossary.md` — precise semantic of each of the 8 contract items.
- `references/dispatch-primitive.md` — canonical `dispatch_review_subagent` schema + verdict parser + failure classes + sandbox spec.
- `references/reviewer-template.md` — user-facing prompt-body template for the `<reviewer>` block.
- `references/capability-boundary.md` — capability boundary default-deny model + side-effect allow-list + secret scrubbing.
