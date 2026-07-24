---
name: go-goal-go
description: Help users write /goal objectives as concise natural-language prose in their own language, with a built-in Reviewer sub-agent check. Triggers on user requests in any language asking to write a goal.
metadata:
  author: xiehuacheng
  version: "2.3.1"
---

# go-goal-go

A `/goal` plan is **prose in the user's language**, plus one `<reviewer>` block for independent verification. One standard shape, no tier picking, no dense parameter forms.

## Rules

- Drafting is read-only until `CreateGoal` is called. All shipping actions need explicit approval.
- The Reviewer is a separate sub-agent (not the main loop). On `FAIL` route back to the main loop iteration, decrement remaining budget; do not declare complete. On Reviewer dispatch error (timeout / OOM / refused / empty) surface to the user as a soft pause with the captured partial output, never as a code change.
- Default Reviewer role: `verifier`. Default budget: 50 iterations / 30 min wall-clock / $2 / 5-no-progress / 20% reserve for handoff. Budget exhausted terminates with a cost summary; never claim `PASS`.
- Default boundaries: project-only paths, write allowed in-scope, deny-all network.
- A `<reviewer>` block must be preceded by a one-line **dispatch mandate** naming the sub-agent and forbidding in-place self-judging. See `references/reviewer-template.md` for canonical phrasings.
- Verdict parsing: `^(PASS|FAIL:.{1,280})$` on the last non-blank line. Anything else = `REVIEW_INFRA_ERROR`.

## When to use / not

Use when the user wants to write a goal or describes a multi-step task that could run unattended. Skip for single-turn questions, exploration with no finish line, or any task where neither proof nor budget can be named.

## Workflow

1. **Fit check.** Queue-shaped + verifiable + bounded + repeatable + has-budget. At least 3 of 5, or push back.
2. **Confirm intent.** For each of boundary / budget / Reviewer role: if the user has already named a value, echo back for confirmation; otherwise ask. Defaults above.
3. **Draft.** Write the prose goal plan in the user's language using the standard shape below, including the dispatch mandate + `<reviewer>` block.
4. **Revise.** Show, walk through, repeat until approved. `CreateGoal` only after explicit approval.

## The standard shape

A goal plan is prose covering these sections, in the user's language, plus one `<reviewer>` block:

- **Goal** — what must become true.
- **End state** — one observable predicate the host can check.
- **Proof** — the command plus 1-2 supporting signals (e.g. "no new skipped tests", "no assertion weakening").
- **Boundaries** — paths the loop may touch; network/side effects in prose ("no network", "no installs", "no API calls").
- **Budget** — caps on iterations / wall-clock / cost / stall / reserve (last optional, default 20%).
- **Stop conditions** — hard stops (terminate) vs. soft stops (pause + ask).
- **Reviewer** — `[dispatch mandate]` then `<reviewer>` block with 4 sections (Role, Inputs, Acceptance, Verdict).

## Worked example (English)

Goal: stabilize 5 intermittently failing tests under test/auth so every rerun is solid.

End state: `npm test --testPathPattern=test/auth --runInBand` exits 0 three times in a row; all 5 tests pass; no new `.skip` / `describe.skip` / `xit`.

Proof: run that command; exit 0 + no new skipped tests + all 5 test IDs in passing list across the 3 runs.

Boundaries: only files under `src/auth/` and `test/auth/`; no installs, no network, no test-runner config edits, no deleting or disabling tests.

Budget: 50 iterations / 20 min / $1 max; stop after 5 stalled iterations; 20% reserve.

Stop conditions:
- write outside in-scope paths: terminate and report.
- need to edit jest/vitest config, tsconfig, or CI workflow: stop and ask.
- user interrupt: graceful shutdown, persist checkpoint.

Reviewer: dispatch an independent sub-agent with the prompt below; the main loop must not self-judge this in place.

<reviewer>
Role: critic

Inputs:
- final diff vs base
- the 3 proof runs' full output
- iterations log

Acceptance:
- all 5 tests pass across 3 runs; skipped = 0.
- no new `.skip` / `describe.skip` / `xit` / `xdescribe` etc.
- all changed files under `src/auth/` or `test/auth/`.
- at least one iteration is a real root-cause change.
- no assertion weakening (`toEqual`→`toMatch`, `.resolves` fallback, nested `setTimeout` retries, fake timers).

Verdict: last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>

## References

- `references/reviewer-template.md` — dispatch mandate canonical phrasings, `<reviewer>` block schema, host-side defaults.
- `references/contract-glossary.md` — prose checklist behind each paragraph (for tooling that auto-generates plans).
- `references/example-zh.md` — same example in Chinese.
- `references/host-internals.md` — index of files only host implementers need (`dispatch-primitive.md`, `capability-boundary.md`).
