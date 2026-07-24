---
name: go-goal-go
description: "Help users craft /goal objectives sized to risk level (low / standard / high). Default tier is standard: end state, proof, boundaries, budget, and a Reviewer sub-agent with safe defaults. Triggers on user requests in any language asking to write a goal or check fit-for-goal. Suggests goal mode when appropriate; pushes back when a task is ill-suited."
metadata:
  author: xiehuacheng
  version: "2.1.0"
---

# go-goal-go

Help users turn rough intentions into concrete `/goal` objectives **sized to the risk of the task**. The default tier is **standard**: end state, proof, boundaries, budget, and a Reviewer sub-agent with safe defaults — five items, no extra blocks. Higher risk classes layer in more controls; lower-risk classes trim further.

Be more proactive than the built-in `write-goal` skill: suggest goal mode when the task is iterative and bounded. Push back honestly when goal mode is the wrong tool.

## Risk classes (pick one per goal)

| Class | Use when | Required | Recommended |
|---|---|---|---|
| **low** | Short, reversible, fully local, no external side effects. E.g. "rename these 5 typos". | End state, Proof | Boundaries, Budget, Reviewer |
| **standard** | Typical unattended run: long-ish work, might touch shared infra, costs tokens/time. **Default.** | End state, Proof, Boundaries, Budget, Reviewer | Loop cadence, Lifecycle anchors, explicit Stop categories |
| **high** | Production autonomy: irreversible side effects, billing, security-critical code, external API mutations. | standard + Loop, Lifecycle, Stop rule categories, hardened `<dispatch-primitive>` for Reviewer, capability boundary | redundant reviewers, machine-readable handoff |

Default the user to **standard** unless the task is obviously tiny (→ low) or obviously consequential (→ high).

## Can do

- Classify the task by risk level.
- Draft goal wording with the user across the items required for that risk level.
- Embed a Reviewer sub-agent block — at low/standard use safe defaults (Role / Inputs / Acceptance / Verdict); at high emit a full `<dispatch-primitive>` block.
- Offer an optional section for explicitly naming skills/tools to use inside the loop.
- Push back honestly when a task is ill-suited for goal mode or any required item is unspecifiable.

## Cannot do without explicit approval

- Start a goal before the user has approved the exact wording.
- Modify or cancel an already-running goal.
- Force a goal onto a task the user has already declined to run in goal mode.
- Auto-select skills or tools for the user; only include those the user explicitly names.
- Draft a goal at risk class X with required items for class X missing or vague.
- At high risk, ship a Reviewer whose `<dispatch-primitive>` block lacks `budget`, `sandbox`, or `verdict_parser`.
- Treat a missing or unparseable Reviewer verdict as a pass.

## Default behavior

- Goal drafting is conversational and read-only until `CreateGoal` is called.
- **Goal plan prose uses the user's language.** Detect the language from the user's first message and write the goal-plan body (End state descriptions, Acceptance Criteria text, Stop rule descriptions) in that language. Keep canonical protocol identifiers in English: YAML keys in `<dispatch-primitive>`, verdict strings (`PASS` / `FAIL:`), role names, transport modes, failure-class names, and block tags. Keep quoted file paths, commands, regex, and code identifiers exactly as the user wrote them.
- Default risk class is **standard**.
- All discrete choices for the chosen class go through `AskUserQuestion`; skill-side defaults are recommended values.
- Standard boundaries default to in-scope paths only + write allowlisted to those paths + deny-all network.
- Standard budget defaults: `max_iterations = 50`, `max_wall_clock = 30m`, `max_cost = $2`, `max_no_progress = 5`, `completion_reserve = 20% of max_cost`.
- Standard Reviewer defaults (host fills these in when the user provides only the `<reviewer>` prompt body): role `verifier`, sandbox `read-only + deny-network + deny-git-push + secret_scrub required`, budget `max_tokens=4000, max_wall_clock_seconds=180, max_tool_calls=30, max_retries_on_malformed=1`, verdict parser deterministic-trim-blank-regex, on-fail route-back.
- All goal runs produce an artifact bundle under `goal-logs/<run-id>/` (host-managed).

## When to use

Trigger this skill when the user:

- Says in any language that they want to write a goal, define a target, or check whether a task fits goal mode.
- Describes a multi-step task that could run unattended: fixing all failing tests, migrating a module, auditing issues, refactoring a directory.
- Asks whether a task should be wrapped in `/goal`.

## When NOT to use

Do not trigger this skill for:

- Single-turn questions or one-off explanations.
- Tasks with no observable proof of completion ("make the codebase better").
- Pure exploration or research where the path is unknown and human judgment is needed at every step.
- Tasks where the user cannot specify a proof or a budget.

## Goal-fit check

Score the task against these signals. **At least three** indicates goal mode is appropriate:

| Signal | Example |
|---|---|
| Queue-shaped | "Fix all failing tests in `test/auth`" |
| Verifiable | "Done when `npm test` exits 0 AND no file outside src/ was modified" |
| Bounded | "Only touch files under `src/payment` AND no external API calls" |
| Repeatable loop | "Rerun the check after each fix" |
| Has budget | "Max 30 minutes or 50 iterations" |

If **fewer than three**, push back and explain which signals are missing.

## Workflow

1. **Assess fit + class.** Run the goal-fit check. Pick the risk class (default standard) with one `AskUserQuestion` ("low / standard / high — and why").
2. **Confirm intent.** Ask the discrete choices for the chosen class only. Use skill defaults unless the user overrides.
3. **Draft the goal.** Produce the items required for the class. Use the user's language.
4. **Offer skill/tool declaration.** Optional. Default OFF.
5. **Draft the Reviewer block.** Low: optional plain `<reviewer>`. Standard: default-on plain `<reviewer>` (host fills safe defaults). High: mandatory + full `<dispatch-primitive>` block, see `references/dispatch-primitive.md`.
6. **Show the full goal.** Walk through the choices.
7. **Revise together** until the user approves.
8. **Start the goal** with `CreateGoal` only after explicit approval.

## Goal contract by class

Each item's grammar is in `references/contract-glossary.md`. Standard-tier items in **bold**.

### low (2 required + 3 optional)

- **End state**
- **Proof**
- Boundaries (optional)
- Budget (optional)
- Reviewer (optional)

### standard (4 required + 1 recommended) — default

- **End state** — runtime-detectable anchor with an observable predicate.
- **Proof** — command + expected predicate + timeout + flake policy.
- **Boundaries** — in-scope paths + side-effect allow-list (default `read`, `write` if in-scope).
- **Budget** — `max_iterations` + `max_wall_clock` + `max_cost` + `max_no_progress`; `completion_reserve` defaults to 20% of max_cost.
- **Reviewer** — `<reviewer>` block with Role / Inputs / Acceptance Criteria / Verdict. Host fills safe defaults.

Recommended (host fills sensible defaults if absent): Loop cadence (sequential, every-iteration checkpoint), Lifecycle (plan hash + base commit captured at start), Stop categories (HardStop + SoftStop with default triggers).

### high (all standard + 4 additional)

Standard items, plus:

- **Loop** — explicit checkpoint cadence + resume rule.
- **Lifecycle** — explicit `plan_hash`, `base_commit`, `tool_versions`, full state machine in the goal plan.
- **Stop rule** — categorized HardStop / SoftStop with explicit triggers; BudgetStop / ReviewerStop also enumerated.
- **Reviewer hardening** — full `<dispatch-primitive>` block with `budget`, `sandbox`, `verdict_parser`, idempotency key, inputs each with `(transport, max_bytes, secret_scan)`. See `references/dispatch-primitive.md` and `references/capability-boundary.md`.

## Reviewer (5-block minimum at standard)

A plain `<reviewer>` block at standard tier only needs the user-filled 4 sections; the host fills the dispatch defaults so no extra block is required:

```
<reviewer>
Role: verifier

Inputs:
- <list of inputs the host auto-collects: final_diff, last proof output, iterations log>

Acceptance Criteria:
1. (a) input: <name>; (b) check: <method>; (c) pass: <condition>; (d) on fail reason: <one line>.
2. ...

Verdict: the last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

Host-applied defaults (transparent to the user, can be lifted to high tier):

- role: verifier
- sandbox: read-only + deny-network + deny-git-push + secret_scrub required
- budget: max_tokens=4000 / max_wall_clock_seconds=180 / max_tool_calls=30 / max_retries_on_malformed=1 / max_retries_on_dispatch_error=0
- verdict_parser: deterministic-trim-blank-regex
- on_fail: route_back_to_loop_with_iteration_decrement
- artifacts: goal-logs/<run-id>/reviewer.txt + verdict.txt
- retention: 90 days

At **high** tier these defaults are replaced by an explicit `<dispatch-primitive>` block — see `references/dispatch-primitive.md` for the schema.

## Examples

**low**

- "Goal: rename 5 typo strings. End state: `rg 'fo\b|recieve|seperate' -c` returns 0. Proof: `rg -c 'fo\b|recieve|seperate'` exits 0. Boundaries: `src/**`. Loop: single pass. Budget: not needed."

**standard (default)**

- "Goal: every failing test under `test/auth` passes. End state: `npm test -- test/auth` exits 0 with no `Tests: 0 skipped` after it. Proof: `npm test -- test/auth`, exit code 0, timeout 180s, flake policy consecutive_passes_needed=3. Boundaries: `src/auth/**` and `test/auth/**`; write allowed; no network. Budget: 50 iterations / 30 min / $2 / 5-no-progress, 20% reserve. Reviewer (verifier): input final_diff + last proof; 3 acceptance criteria. Loop cadence and Lifecycle auto-applied by host."

**high**

- "Goal: rotate production API key in vault and update 12 service configs. End state: `vault kv get secret/api-key` shows new value; all 12 service configs reference new fingerprint. Proof: command + regex match for the fingerprint. Boundaries: paths listed + side-effect allowlist with `send` (for vault API), network allowlist of `vault.example.com`, reversibility classification `recoverable` with rollback procedure. Budget: explicit. Loop: every-iteration checkpoint, last-checkpoint resume. Lifecycle: plan_hash + base_commit pinned. Stop rule: HardStop on out-of-scope write, SoftStop on rate-limit hit, BudgetStop on exhaustion. Reviewer hardening: full `<dispatch-primitive>` with sandbox, idempotency key, inputs declared with secret_scan."

## Error handling & edge cases

- **User declines goal mode after suggestion:** Respect the decision. Do not bring it up again for the same task.
- **User asks for a goal with no proof:** Refuse to draft until an observable predicate is identified.
- **Goal wording is too vague:** Ask the user to pick one concrete finish line. Do not proceed with multiple competing interpretations.
- **Reviewer verdict FAIL:** Route back into Loop iteration, decrement remaining budget, do not declare complete.
- **Reviewer `REVIEW_INFRA_ERROR`:** Pause as SoftStop, surface to user with captured partial output, no code change.
- **BudgetStop fires:** Terminate with cost summary, no PASS claimed.
- **HardStop fires:** Terminate immediately, surface to user.
- **SoftStop fires:** Pause, persist checkpoint, await re-approval.
- **At high tier, Reviewer block provided but no `<dispatch-primitive>` block:** Malformed. Refuse to ship.

## References

- `references/contract-glossary.md` — precise semantic of each contract item (low + standard + high).
- `references/reviewer-template.md` — 4-section prompt body template (low / standard); high tier writes the `<dispatch-primitive>` block inline.
- `references/dispatch-primitive.md` — **high tier only**. Canonical dispatch schema + verdict parser + failure classes.
- `references/capability-boundary.md` — **high tier only**. Default-deny workspace + side-effect allowlist + secret scrubbing.
