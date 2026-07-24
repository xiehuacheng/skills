# Contract Glossary by Risk Class

Grammar for each of the contract items. Items marked with `[standard]` are required at standard tier (default); items marked with `[high]` are required only at high tier; everything else is recommended or host-applied.

## 1. End state `[standard]`

A runtime-detectable target the loop can verify independent of any proof command.

Required: at least one anchor:

```yaml
- kind: file_exists       # or file_contains, file_absent
  path: <repo-relative>
  predicate: <string or regex>

- kind: branch_state
  name: <branch>
  condition: ahead | behind | at | sha_present
  value: <int or sha>

- kind: count
  source: <rg pattern or command>
  min: <int>
  max: <int>

- kind: external_state
  endpoint: <url>
  response_predicate: <jq or regex>
```

A pure prose anchor is rejected.

## 2. Proof `[standard]`

The trigger the loop uses during iteration.

```yaml
- name: <short id>
  command: <shell command>
  exit_code: <int>          # default 0
  regex:                    # optional alternative to exit code
    output: <pattern>
    flags: <re flags>
  timeout_seconds: <int>    # mandatory
  flake_policy:             # mandatory
    consecutive_passes_needed: <int>     # e.g. 2 or 3
    flakiness_classification: never_promote
  expected_attempts:
    max: <int>              # bounded
```

A Proof without `timeout_seconds` or `flake_policy` is rejected.

## 3. Boundaries `[standard]`

Default tier — paths + side-effect allow-list:

```yaml
in_scope_paths:
  - <repo-relative glob>
side_effect_allowlist:    # default-deny
  - read                   # always implicit
  - write                  # only if in in_scope_paths
  # - send                  # opt-in only
  # - pay                   # opt-in only
```

A goal with no `side_effect_allowlist` runs in read-only mode.

`[high]` adds:

```yaml
network:
  policy: deny | allowlist
  allowlist:
    - <hostname or CIDR>
reversibility:
  classification: reversible | recoverable | irreversible
  rollback_procedure: <text or command>      # mandatory for non-reversible
```

## 4. Budget `[standard]`

```yaml
max_iterations: <int>             # default 50
max_wall_clock: <duration string> # default "30m"
max_cost: <USD or token count>    # default $2
max_no_progress: <int>            # default 5
completion_reserve: <percentage of max_cost>  # default 20% of max_cost; reserved for handoff + Reviewer
```

On any cap: BudgetStop fires; loop terminates with cost summary in `goal-logs/<run-id>/handoff.json`. BudgetStop never counts as PASS.

## 5. Reviewer `[standard default-on]`

At standard tier the user provides a plain `<reviewer>` block (4 sections in `references/reviewer-template.md`). Host fills safe defaults:

- role: `verifier` (user can pick `critic` or `adversarial_reviewer`)
- sandbox: read-only / deny-network / deny-git-push / secret_scrub required
- budget: max_tokens=4000 / max_wall_clock_seconds=180 / max_tool_calls=30 / max_retries_on_malformed=1 / max_retries_on_dispatch_error=0
- verdict_parser: deterministic-trim-blank-regex (see `references/dispatch-primitive.md`)
- on_fail: route_back_to_loop_with_iteration_decrement

`[high]` tier replaces these defaults with an explicit `<dispatch-primitive>` block (see `references/dispatch-primitive.md`).

Opt-out at any tier (use with explicit user confirmation):

```
<!-- no Reviewer gate: completion by agent self-judgment -->
```

## 6. Loop `[standard: host default | high: explicit]`

Standard tier: host applies these defaults if the goal plan does not override.

```yaml
strategy: sequential               # default
worker_pool_size: 1                # default
checkpoint_cadence:
  every_n_iterations: 1
  on_every_successful_fix: true
resume_rule:
  source_of_truth: last_checkpoint
  revalidate_before_continue: true
```

`[high]` tier:

```yaml
strategy: sequential | parallel_with_fixed_pool | orchestrator_workers
worker_pool_size: <int>            # mandatory if parallel
checkpoint_cadence:
  every_n_iterations: <int>
  every_n_minutes: <int>
resume_rule:
  source_of_truth: last_checkpoint | first_failure | iteration_zero
  revalidate_before_continue: true
```

## 7. Stop rule `[standard: host default | high: explicit]`

At standard tier the host applies sensible defaults (HardStop on out-of-scope writes / unauthorized side effects; SoftStop on shared-infra edit, user interrupt, cost projection overrun).

`[high]` tier:

```yaml
HardStop:
  - <trigger event 1>
  - <trigger event 2>
SoftStop:
  - <trigger event 1>
  - <trigger event 2>
```

BudgetStop lives in `Budget`. Reviewer FAIL is not a stop — it routes back into Loop iteration.

## 8. Lifecycle `[standard: host default | high: explicit]`

Standard tier: host computes `plan_hash` + `base_commit` + `tool_versions` at start and writes them to `goal-logs/<run-id>/manifest.json`.

`[high]` tier goal plan must explicitly declare:

```yaml
plan_hash: <sha256 of the canonicalized approved plan>
base_commit: <sha>
tool_versions:
  - name: <tool>
    version: <pinned>
states:
  - DRAFT
  - APPROVED
  - RUNNING
  - PAUSED
  - CANCEL_REQUESTED
  - CANCELLED
  - COMPLETED
  - FAILED
```

On resume, runtime compares against current state. Drift → pause for re-approval.

## Routing summary by tier

| Tier | Items | Required items | At completion goal becomes `COMPLETED` when |
|---|---|---|---|
| low | 2 | End state, Proof | proof passes (no Reviewer unless opted in) |
| standard | 5 | End state, Proof, Boundaries, Budget, Reviewer (default-on) | proof passes AND Reviewer verdict == `PASS` |
| high | 8 | All standard + Loop, Lifecycle, Stop rule, hardened Reviewer | proof passes AND Reviewer verdict == `PASS` AND no BudgetStop AND no HardStop |
