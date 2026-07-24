# Reviewer Sub-agent Template

User-facing prompt-body template for the `<reviewer>` block. At **standard** tier only the 4 sections below are required; the host fills in safe defaults for everything else. At **high** tier the user replaces those defaults with an explicit `<dispatch-primitive>` block — see `references/dispatch-primitive.md`.

## Sections

### Role

Pick one:

- **verifier** — checks each acceptance criterion against the captured state and reports pass/fail.
- **critic** — actively looks for flaws, missed edges, and places where the proof is technically true but the intent is unmet.
- **adversarial_reviewer** — assumes the implementation is wrong and tries to break it. Use only when the goal touches security, auth, payments, or data mutation. Forces read-only + no-network + no-git-push sandbox.

Default: verifier.

### Inputs

List the names of inputs the host auto-collects. Typical options:

- `final_diff` — `git diff <base>..HEAD`
- `proof_output` — last proof invocation stdout + stderr (or last N for flake policy)
- `iterations_log` — `goal-logs/<run-id>/iterations.jsonl`
- `goal_plan` — the full approved plan text

### Acceptance Criteria

**Each criterion must reference an Inputs entry it reads from and a specific check method.** Vague wording ("clean", "good", "works", "looks correct") is rejected.

Example of a good criterion:

```
1. (a) input: final_diff; (b) check: enumerate changed file paths;
   (c) pass: every path is under src/auth/ or test/auth/;
   (d) on fail reason: 'out-of-scope: <path>'.
```

### Verdict schema

The Reviewer's **last line** of output must be exactly one of:

- `PASS`
- `FAIL: <one-line reason>` (max 280 chars)

Anything else is `REVIEW_INFRA_ERROR: verdict_unparseable` per the dispatch-primitive's parser.

## Skeleton (paste into goal plan at standard tier)

```
<reviewer>
Role: <verifier | critic | adversarial_reviewer>

Inputs:
- final_diff
- proof_output
- iterations_log

Acceptance Criteria:
1. (a) input: <name>; (b) check: <method>; (c) pass: <condition>; (d) on fail reason: <one line>.
2. (a) input: <name>; (b) check: <method>; (c) pass: <condition>; (d) on fail reason: <one line>.

Verdict: last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```

## Host-applied defaults at standard tier

The skill (or runtime) fills these in automatically when the goal plan only contains the 4-section block:

- role: `verifier` if unspecified
- sandbox: read-only + deny-network + deny-git-push + secret_scrub required
- budget: `max_tokens=4000`, `max_wall_clock_seconds=180`, `max_tool_calls=30`, `max_retries_on_malformed=1`, `max_retries_on_dispatch_error=0`
- verdict_parser: `deterministic-trim-blank-regex`
- on_fail: `route_back_to_loop_with_iteration_decrement`
- artifacts: `goal-logs/<run-id>/reviewer.txt` and `verdict.txt`; retention 90 days
- idempotency_key: `sha256(run_id + iteration + role)` (host-generated)

## At high tier — replace defaults with `<dispatch-primitive>` block

Replace the host defaults by writing a `<dispatch-primitive>` block in the goal plan with explicit `budget`, `sandbox`, `verdict_parser`, `idempotency_key`, `inputs` (with `transport`, `max_bytes`, `secret_scan`), and `on_fail`. See `references/dispatch-primitive.md`.

If the goal plan contains both a `<reviewer>` block AND a `<dispatch-primitive>` block, the `<dispatch-primitive>` values take precedence over the host defaults.

## Verdict parsing (standard across all tiers)

`deterministic-trim-blank-regex`:

1. Trim trailing whitespace.
2. Split on `\n`; drop trailing blank lines.
3. Take the last non-blank line.
4. Match case-sensitive regex `^(PASS|FAIL:.{1,280})$`.
5. Anything else → `REVIEW_INFRA_ERROR: verdict_unparseable`. Last 5 lines retained for diagnosis.

## Opt-out (any tier)

If the user explicitly declines the Reviewer at draft time, the goal plan must contain this literal comment on its own line:

```
<!-- no Reviewer gate: completion by agent self-judgment -->
```

The skill surfaces the warning at draft, start, and resume; the host does not enforce any acceptance gate. The user owns completion.
