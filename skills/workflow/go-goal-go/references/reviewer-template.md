# Reviewer Template

> **User-facing.** This is the template the user copies into their goal plan. The `<reviewer>` block is the only structured artifact in an otherwise natural-language goal plan; the rest is up to the host runtime.

## Dispatch mandate (mandatory one-liner above the block)

The `<reviewer>` block must be preceded by a one-line dispatch mandate in the goal plan prose. The mandate tells both the host and any future reader that the block is meant for an **independent sub-agent** dispatched by the main loop, never for in-place self-judging.

Canonical phrasings (accept equivalent wording in the user's language; both intents — dispatch-as-sub-agent AND forbid-in-place — must be present):

- English: `Dispatch an independent sub-agent with the prompt below; the main loop must not self-judge this in place.`
- Chinese: `派一个独立 sub-agent 按下面这段 prompt 审查；主 loop 必须派发，不得就地自判。`

Place this directly above the `<reviewer>` block. A goal plan that omits or weakens this mandate is non-conformant; the skill refuses to ship it.

## What the user writes

A `<reviewer>` block with four short sections in plain language:

```
<reviewer>
Role: verifier

Inputs:
- final diff vs base
- last proof invocation's output
- iterations log (if available)

Acceptance:
- End state's predicate holds (state the predicate).
- No file outside Boundaries was modified.
- (Optional stricter checks: no skipped tests, no assertion weakening, etc.)

Verdict: last line of your output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

## Field guidance

- **Role**: pick one.
  - `verifier` (default) — checks each Acceptance line against the captured state.
  - `critic` — actively looks for flaws, missed edges, "passes but intent unmet".
  - `adversarial_reviewer` — assumes the implementation is wrong and tries to break it. Use only for security / auth / payments / data mutation goals.
- **Inputs**: list the input names the host should hand to the sub-agent. Host knows how to fetch each of: `final diff`, last `proof output`, `iterations log`, full `goal plan`. Names are plain words; no transport / size / secret-scan declarations needed.
- **Acceptance**: short, concrete, checkable lines. Each must be something the sub-agent can read from the Inputs and decide pass/fail. Reject vague wording ("looks clean", "good").
- **Verdict schema**: leave the line above verbatim. The host enforces a 280-character cap on the `FAIL: <reason>` reason text; longer output is treated as `REVIEW_INFRA_ERROR: verdict_unparseable` (no PASS claim). The host parses deterministically; do not invent other formats.

## How the host interprets the rest

Anything beyond the four sections above (sandbox, sub-agent dispatch budget, secret scrubbing, idempotency, capability boundary) is the host's responsibility. The user does not write those.

Host-applied safe defaults when the user does not override:

- sandbox: read-only + deny network + deny git push + secret scrubbing on,
- sub-agent budget: 4000 tokens / 180 s wall-clock / 30 tool calls / 1 retry on malformed verdict,
- verdict parser: case-sensitive regex `^(PASS|FAIL:.{1,280})$` after trimming trailing blank lines,
- on-fail: route back to the main loop iteration, decrement remaining budget,
- artifacts: full sub-agent output persisted at `goal-logs/<run-id>/reviewer.txt`, last line saved as `verdict.txt`, 90-day retention,
- idempotency: derived from `(run_id, iteration, role)`; duplicate dispatches deduped.

If the user's Acceptance section demands stricter sandboxing (e.g. "must reach no network", "must read secret-store"), the host applies the strictest sandbox that satisfies the criteria.

## When you want to skip the Reviewer

Insert one literal line anywhere in the goal plan:

```
<!-- no Reviewer gate: completion by agent self-judgment -->
```

The skill surfaces a warning at draft, start, and resume. The host does not enforce any acceptance gate. The user owns completion.
