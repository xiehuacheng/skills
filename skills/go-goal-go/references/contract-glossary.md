# Contract Glossary

Each of the 8 contract items, with parsing rules and accepted predicates. This file is the authoritative grammar for `/goal` plans.

## 1. End state

A runtime-detectable target the loop can verify independent of any proof command.

Required: at least one **anchor**, each of the form:

```yaml
- kind: file_exists       # or file_contains, file_absent
  path: <repo-relative>
  predicate: <string or regex>

- kind: branch_state
  name: <branch>
  condition: ahead|behind|at|sha_present
  value: <int or sha>

- kind: count
  source: <rg pattern or command>
  min: <int>                # at least N
  max: <int>                # or no more than N

- kind: external_state
  endpoint: <url>
  response_predicate: <jq or regex>

- kind: set_diff
  base_set: <command returning list>
  target_set: <command returning list>
  relationship: superset | subset | equal
```

A pure prose anchor ("the code is healthier") is rejected.

## 2. Proof

The trigger that the loop uses during iteration. Each Proof entry must specify:

```yaml
- name: <short id, e.g. "npm-test-auth">
  command: <shell command>
  exit_code: <int>          # default 0
  regex:                    # optional alternative to exit code
    output: <pattern>
    flags: <re flags>
  timeout_seconds: <int>    # mandatory, no default of "infinity"
  flake_policy:             # mandatory
    consecutive_passes_needed: <int>     # e.g. 2 consecutive clean runs
    flakiness_classification: never_promote
  env_snapshot:             # mandatory
    working_tree: clean | any
    pinned_dependencies: true | false
    locked_seed: true | false             # tests with randomness require this
    timezone: <tz>                         # for time-sensitive tests
  expected_attempts:        # bounded
    max: <int>              # e.g. 3
```

A Proof without `timeout_seconds`, `flake_policy`, or `env_snapshot` is rejected.

## 3. Boundaries

The action envelope. Four required sub-fields:

```yaml
in_scope_paths:
  - <repo-relative glob>
side_effect_allowlist:    # default-deny; enumerate every allowed class
  - read | write | send | pay
network:
  policy: deny | allowlist
  allowlist:
    - <hostname or CIDR>
reversibility:
  classification: reversible | recoverable | irreversible
  rollback_procedure: <text or command>      # mandatory for non-reversible
```

A goal with no `side_effect_allowlist` runs in read-only mode. Add write, send, or pay only by enumeration.

## 4. Loop

Iteration strategy + checkpoint cadence + resume rule.

```yaml
strategy: sequential | parallel_with_fixed_pool | orchestrator_workers
worker_pool_size: <int>            # 1 if sequential
checkpoint_cadence:
  every_n_iterations: <int>        # e.g. every iteration
  every_n_minutes: <int>
  on_every_successful_fix: true | false
resume_rule:
  source_of_truth: last_checkpoint | first_failure | iteration_zero
  revalidate_before_continue: true
```

Sequential strategy defaults to worker_pool_size 1. Parallel strategy without a fixed pool size is rejected (fork-bomb prevention).

## 5. Budget

Hard numeric caps. Five required fields.

```yaml
max_iterations: <int>             # default 50
max_wall_clock: <duration string> # default "30m"
max_cost: <USD or token count>    # default $2
max_no_progress: <int>            # default 5; consecutive iterations with no new passing anchor
completion_reserve: <percentage>  # default 20%; reserved for handoff + Reviewer dispatch
```

On any cap: BudgetStop fires. The loop terminates with a cost summary and a compact machine-readable handoff in `goal-logs/<run-id>/handoff.json`. BudgetStop never counts as PASS.

## 6. Lifecycle

The run identity and resumability anchors.

```yaml
plan_hash: <sha256 of the canonicalized approved plan>
base_commit: <sha>
tool_versions:
  - name: <tool>
    version: <pinned or "snapshot">
run_id: <uuid>                     # assigned by host at start
artifacts:
  manifest: goal-logs/<run-id>/manifest.json
  iteration_log: goal-logs/<run-id>/iterations.jsonl
  proof_captures: goal-logs/<run-id>/proofs/
  reviewer_output: goal-logs/<run-id>/reviewer.txt
  tool_audit: goal-logs/<run-id>/tool-audit.log
states:
  - DRAFT
  - APPROVED                  # explicit user approval + plan hash computed
  - RUNNING
  - PAUSED                    # SoftStop or CANCEL_REQUESTED pending
  - CANCEL_REQUESTED          # graceful shutdown in progress
  - CANCELLED
  - COMPLETED                 # Reviewer verdict PASS + artifacts written
  - FAILED                    # HardStop or unrecoverable infra
```

On resume, the runtime compares `plan_hash` + `base_commit` + `tool_versions` against the current state. Drift → pause for re-approval, never merge silently.

## 7. Stop rule

Categorized stops. Two categories live in this item; others live elsewhere.

- **HardStop** — terminal safety violation. Loop terminates immediately; no resume. Examples: modifying outside Boundaries; running side-effect not in allow-list; capability boundary breach.
- **SoftStop** — pause + ask. Persist checkpoint, surface reason to user, await re-approval. Examples: shared infra changes needed; cost projection exceeds remaining Budget; user-injected interrupt.

`BudgetStop` lives in `Budget`. `ReviewerStop` (route-back into Loop on Reviewer FAIL) lives in `Reviewer`. Lifecycle `CANCEL_REQUESTED` lives in `Lifecycle`.

## 8. Reviewer

Two blocks in the goal plan. Either block missing is malformed.

### `<dispatch-primitive>` block

Authoritative contract between main loop and sub-agent runtime. Schema in `references/dispatch-primitive.md`. Required keys: `primitive`, `version`, `role`, `when`, `budget`, `sandbox`, `verdict_parser`, `inputs`, `on_fail`, `artifacts`.

### `<reviewer>` block

Prompt body the sub-agent receives. Schema in `references/reviewer-template.md`. Required sections: `Role`, `Inputs`, `Acceptance Criteria`, `Verdict`.

### Routing

- `verdict == PASS` → goal declared COMPLETED, artifacts finalized.
- `verdict == FAIL: <reason>` → route back into Loop, decrement Budget. NOT a stop.
- `REVIEW_INFRA_ERROR` (timeout, OOM, refused, empty) → SoftStop-class pause, surface to user with partial output, no code change.
- Any other output → treated as `REVIEW_INFRA_ERROR: verdict_unparseable: <tail>`.
