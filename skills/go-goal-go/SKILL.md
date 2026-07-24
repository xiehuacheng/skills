---
name: go-goal-go
description: "Help users write /goal objectives as concise natural-language prose in their own language, with a built-in Reviewer sub-agent check. Triggers on user requests in any language asking to write a goal or check fit-for-goal, or on descriptions of multi-turn tasks that could run unattended. Suggests goal mode when appropriate; pushes back when a task is ill-suited."
metadata:
  author: xiehuacheng
  version: "2.2.0"
---

# go-goal-go

Help users turn rough intentions into `/goal` objectives written as **concise natural-language prose** in their own language. One standard shape, no tier picking, no dense parameter forms. The goal plan is paragraphs, not YAML.

Be more proactive than the built-in `write-goal` skill: suggest goal mode when a task is iterative and bounded. Push back honestly when goal mode is the wrong tool.

## Can do

- Draft a goal plan as natural-language prose covering end state, proof, boundaries, budget, stop conditions, and a Reviewer sub-agent check.
- Detect the user's language and write the goal plan in that language.
- Push back honestly when a task is ill-suited for goal mode or any core item is unspecifiable.

## Cannot do without explicit approval

- Start a goal before the user has approved the exact wording.
- Modify or cancel an already-running goal.
- Force a goal onto a task the user has already declined to run in goal mode.
- Draft a goal whose success criteria cannot be stated as observable behavior.
- Declare a goal complete before the Reviewer sub-agent has returned `PASS` (or the user explicitly opts out).

## Default behavior

- One standard goal-plan shape (below). No tier picking, no risk-class questions.
- Goal plan prose is in the user's language. Keep canonical protocol identifiers in English: `PASS` / `FAIL:` verdict strings, `<reviewer>` block tags, role names (`verifier` / `critic`).
- Boundaries default to: project-only paths + write allowed inside them + deny-all network.
- Budget defaults: max 50 iterations / 30 min wall-clock / $2 / 5-no-progress, with 20% reserve for handoff.
- Reviewer sub-agent: default ON at `verifier` role; safe defaults for sandbox and budget; user can override role and acceptance criteria in plain prose.
- Drafting is read-only until the user approves the wording.

## When to use

Trigger when the user:

- Says in any language that they want to write a goal, define a target, or check whether a task fits goal mode.
- Describes a multi-step task that could run unattended.

## When NOT to use

- Single-turn questions or one-off explanations.
- Tasks with no observable proof of completion ("make the codebase better").
- Pure exploration or research where the path is unknown.
- Tasks where no budget can be specified.

## Goal-fit check

At least three of: queue-shaped, verifiable, bounded, repeatable loop, has budget. Push back if fewer than three.

## Workflow

1. **Assess fit.** Run the goal-fit check. If unsuitable, explain why and stop.
2. **Confirm intent.** Ask the few discrete choices that matter: any non-default boundary, any non-default budget cap, the Reviewer role if the user has a preference (default `verifier`).
3. **Draft the goal.** Write it as natural-language paragraphs covering the items below, in the user's language.
4. **Show the goal.** Walk through each item, propose tweaks.
5. **Revise** until the user approves.
6. **Start** with `CreateGoal` only after explicit approval.

## The standard goal plan (natural language)

A goal plan is **prose**, in the user's language, with one `<reviewer>` block at the end. Use these paragraph headings as a writing checklist — they correspond to the goal contract. (The headings themselves are written in the user's language; the bracketed English labels below are the canonical names.)

- **Goal** — one or two sentences on what must become true.
- **End state** — the observable behavior that proves the goal is done. State a single testable condition; the host runtime needs a predicate it can check.
- **Proof** — how the loop verifies the end state each iteration. State the command or check, plus a couple of fallback signals (e.g. "no skipped tests", "no skipped assertion weakening").
- **Boundaries** — what the loop is allowed to touch (paths) and what it must not do (network, side effects, destructive ops).
- **Budget** — caps on iterations / wall-clock / cost, plus a stall counter. Plus an optional reserve for handoff.
- **Stop conditions** — when to stop and ask the user, vs. when to stop and report failure.
- **Reviewer** — a `<reviewer>` block (template below) where a separate sub-agent independently checks the work.

Everything above is plain prose. Host-runtime configuration (sandbox, sub-agent dispatch budget, secret scrubbing, capability boundary, idempotency) is the host's responsibility — see `references/host-internals.md` only if you need to harden the runtime itself; you do not write it.

## The `<reviewer>` block

A separate sub-agent reads the goal plan + the diff + the proof output and decides `PASS` or `FAIL: <one-line reason>`. The block itself is short natural-language prose:

```
<reviewer>
Role: verifier

Inputs:
- final diff vs base
- last proof invocation's output

Acceptance:
- End state's predicate holds.
- No file outside Boundaries was modified.
- No test was deleted, skipped, or had its assertion weakened.

Verdict: last line of your output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

The four sections are the only thing the user writes. Host fills the sub-agent sandbox and budget from safe defaults (`references/reviewer-template.md`). To express a stricter check, write stricter Acceptance items in the block; that's the only knob you normally need.

## Examples

**Goal plan, English user:**

```
Goal: stabilize 5 intermittently failing tests under test/auth so every rerun is solid.

End state: `npm test --testPathPattern=test/auth --runInBand` exits 0 three times in a row, the 5 tests all pass, and nothing has been added to skip / describe.skip / xit.

Proof: run that command; exit 0 + no new skipped tests + the 5 original test IDs appear in the passing list across all three runs.

Boundaries: only files under src/auth/ and test/auth/; no installs, no network requests, no test-runner config edits, no deleting or disabling tests.

Budget: at most 50 iterations or 20 minutes or $1; stop after 5 consecutive iterations with no new passing test. Reserve 20% for handoff.

Stop conditions:
- write outside in-scope paths: terminate and report.
- need to edit jest/vitest config, tsconfig, or CI workflow: stop and ask.
- user interrupt: graceful shutdown, persist checkpoint.

Reviewer:
<reviewer>
Role: critic

Inputs:
- final diff vs base
- the 3 proof runs' full output
- iterations log

Acceptance:
- all 5 tests pass across the 3 runs; skipped count is 0.
- final_diff has no new .skip / describe.skip / xit / xdescribe etc.
- every changed file is under src/auth/ or test/auth/.
- at least one iteration is a real root-cause change, not just retry/wait letting
  flake pass by chance.
- no assertion weakening to pass (toEqual→toMatch, .resolves fallback, nested
  setTimeout retries, etc.).

Verdict: last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

For a Chinese-language version of the same example, see `references/example-zh.md`.

**Honest pushback:**

- User: "Help me understand this codebase."
- Response: "This sounds like open-ended exploration. Goal mode needs an observable finish line and a way to prove it. If you want, we can turn it into a bounded audit (e.g. 'List unused exports in src/ and remove them'), or I can answer questions turn by turn."

## Error handling & edge cases

- **User declines goal mode after suggestion:** Respect the decision. Do not bring it up again.
- **User asks for a goal with no observable proof:** Refuse to draft until an observable predicate is identified.
- **Goal wording is too vague:** Ask the user to pick one concrete finish line.
- **Reviewer verdict FAIL:** Route back into the loop iteration, decrement remaining budget, do not declare complete.
- **Reviewer errors / times out:** Pause, surface to user with the captured partial output, no code change.
- **Budget exhausted:** Terminate with cost summary, no PASS claimed.
- **Stop condition fires:** Pause or terminate per the wording; do not silently continue.

## References (host-internal, normally not read by the user)

These describe the host runtime, not the user-facing goal plan. Read them only when hardening the host or the goal-mode runtime itself:

- `references/contract-glossary.md` — the prose checklist behind each paragraph above; useful when writing a skill that *generates* goal plans automatically.
- `references/reviewer-template.md` — host-side defaults for the `<reviewer>` block (role, sandbox, sub-agent budget, verdict parser).
- `references/dispatch-primitive.md` — canonical sub-agent dispatch schema (`dispatch_review_subagent`); for host implementers, not user-facing.
- `references/capability-boundary.md` — workspace containment + secret scrubbing + side-effect allowlist; for host implementers, not user-facing.
- `references/host-internals.md` — index of the above three.
