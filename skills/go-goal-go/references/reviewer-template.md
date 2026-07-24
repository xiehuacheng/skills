# Reviewer Sub-agent Template

User-facing prompt-body template for the `<reviewer>` block. Companion to `references/dispatch-primitive.md` (the contract) and `references/contract-glossary.md` §8 (the routing). The user fills this section during Step 5 of `go-goal-go`'s workflow.

## Sections

### Role

Pick one:

- **verifier** — checks each acceptance criterion against the captured state and reports pass/fail.
- **critic** — actively looks for flaws, missed edges, and places where the proof is technically true but the intent is unmet.
- **adversarial_reviewer** — assumes the implementation is wrong and tries to break it. Use only when the goal touches security, auth, payments, or data mutation. Triggers `sandbox: { file_access: read-only, network: deny }` automatically.

Default: verifier.

### Inputs

What the Reviewer is allowed to read. Each input MUST be declared in `<dispatch-primitive>` `inputs:` with `(transport, max_bytes, secret_scan)`. Typical options:

- Full goal plan (End state / Proof / Boundaries / Loop / Stop rule)
- Final diff (e.g. `git diff <base>..HEAD`)
- Proof command output (last invocation, stdout + stderr)
- Specific file paths under the in-scope boundary
- Sanitized external state snapshots

Default: full goal plan + final diff + last proof output, each with `max_bytes: 262144` and `secret_scan: required`.

### Acceptance Criteria

Concrete, independently-checkable conditions. **Each criterion must reference an Inputs entry it reads from and a specific check method.** Vague wording ("clean", "good", "works", "looks correct") is rejected.

Example of a good criterion (binds to inputs + method):

```
1. (a) Reads the file tree under src/auth via the final_diff input; (b) returns PASS only if every file path is under src/auth OR test/auth; (c) FAIL otherwise with reason listing the first violation.
2. (a) Reads the proof_output input; (b) returns PASS only if it shows "Tests: X passed" with X equal to the previously-known-good count; (c) FAIL if any test was deleted, skipped, or had its assertion weakened.
```

Example of a bad criterion (rejected at draft time):

```
1. The code looks clean.
```

### Verdict schema

The Reviewer's **last line** of output MUST be exactly one of:

- `PASS`
- `FAIL: <one-line reason>` (max 280 chars)

Anything else is `REVIEW_INFRA_ERROR: verdict_unparseable` per the dispatch-primitive's parser. The runtime appends `<verdict>...</verdict>` sentinels in some runtimes; the parser handles both.

## Skeleton (paste into goal plan)

```
<reviewer>
Role: <verifier | critic | adversarial_reviewer>

Inputs:
- <list of input names declared in <dispatch-primitive> inputs:>

Acceptance Criteria:
1. (a) input: <name>; (b) check: <method>; (c) pass: <condition>; (d) on fail reason: <one-line>.
2. (a) input: <name>; (b) check: <method>; (c) pass: <condition>; (d) on fail reason: <one-line>.
3. (a) input: <name>; (b) check: <method>; (c) pass: <condition>; (d) on fail reason: <one-line>.

Verdict: last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

## Reviewer-side behaviors NOT covered here

- **Sandbox enforcement** lives in `<dispatch-primitive>` `sandbox:` and is host-enforced.
- **Budget enforcement** (max_tokens / max_wall_clock / max_tool_calls / max_retries) lives in `<dispatch-primitive>` `budget:` and is host-enforced.
- **Verdict parsing** lives in `references/dispatch-primitive.md` §Verdict parser.
- **Failure classification** (verdict_FAIL vs REVIEW_INFRA_ERROR) lives in `references/dispatch-primitive.md` §Failure classes.

If the Reviewer prompt body contradicts the `<dispatch-primitive>` block (e.g., prompt says "send a Slack message" but `network: deny` is declared), the host treats the prompt as a `<dispatch-primitive>` violation and refuses to dispatch.

## Opt-out

If the user explicitly declines the Reviewer at Step 5, the goal plan MUST contain this literal comment on its own line:

```
<!-- no Reviewer gate: completion by agent self-judgment -->
```

The skill states a one-line warning at draft time, surfaces it again on each lifecycle transition (start, resume, completion), and the host DOES NOT enforce any acceptance gate. The user owns the completion decision.
