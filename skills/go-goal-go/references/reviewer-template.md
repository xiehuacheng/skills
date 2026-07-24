# Reviewer Sub-agent Template

This template is loaded by `go-goal-go` during Step 4.5 to draft the Reviewer completion gate. The user fills each section in chat. The completed prompt is then embedded into the goal plan as a literal `<reviewer>...</reviewer>` block, and the goal loop dispatches it exactly once at completion. Verdict `PASS` gates completion; `FAIL: <reason>` routes back into the loop or trips the stop rule.

## Role

Pick one:

- **verifier** — checks each acceptance criterion against the current state and reports pass/fail.
- **critic** — actively looks for flaws, missed edges, and places where the proof is technically true but the intent is unmet.
- **adversarial reviewer** — assumes the implementation is wrong and tries to break it. Use only when the goal touches security, auth, payments, or data mutation.

Default: verifier.

## Inputs

What the Reviewer is allowed to read. Typical options, mix as needed:

- Full goal plan (End state / Proof / Boundaries / Loop / Stop rule)
- Final diff (e.g. `git diff <base>..HEAD`)
- Proof command output (e.g. `npm test`, `rg ...`, build logs)
- Specific file paths under the boundary
- Current state of long-running or external systems (databases, queues, branches)

Default: full goal plan + final diff + proof command output.

## Acceptance Criteria

Concrete pass/fail conditions. Each criterion must be independently checkable from the Inputs. Write them as a short numbered list. Avoid ambiguity.

Examples of good criteria:

- Every test that previously failed now passes.
- No file outside `src/auth` and `test/auth` was modified.
- No test was deleted or skipped to make it pass.
- `npm run lint` exits 0 on the final tree.

Examples of bad criteria (rewrite before use):

- "The code is clean." — subjective, not checkable.
- "Everything works." — no evidence requirement.
- "Looks good." — empty.

## Verdict schema

The Reviewer's **last line** of output must be exactly one of:

- `PASS`
- `FAIL: <one-line reason>`

Anything else is treated as `FAIL` and the goal loop demands a re-run with a corrected verdict. Do not allow additional verdict formats (e.g. `SUCCESS`, `APPROVED`, `YES`). Refusal to emit a verdict is itself a `FAIL`.

## Embedding template (paste this skeleton into the goal plan)

```xml
<reviewer>
Role: <verifier | critic | adversarial reviewer>

Inputs:
- <list of read sources>

Acceptance Criteria:
1. <criterion — checkable>
2. <criterion — checkable>
3. <criterion — checkable>

Verdict: the last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

## Opt-out

If the user explicitly declines the Reviewer at Step 4.5, the goal plan must instead contain this literal comment on its own line:

```
<!-- no Reviewer gate: completion by agent self-judgment -->
```

The skill states a one-line warning at draft time and once at start time. The user, not the agent, owns the completion decision in this mode.
