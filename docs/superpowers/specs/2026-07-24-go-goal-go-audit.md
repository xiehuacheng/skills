# go-goal-go Audit Findings (v2.0 rework)

**Date:** 2026-07-24
**Status:** Approved (option A — full)
**Source:** Three parallel sub-agent audits against the v1.3.0 skill at `skills/go-goal-go/`.

This document is the source of truth for the v2.0 rework. Cluster and severity guide ordering.

## Cluster Map

- **C1 · Budget & Cost control** — 4 findings
- **C2 · Proof & Verification** — 7 findings
- **C3 · Reviewer Sub-agent Hardening** — 10 findings
- **C4 · Run Lifecycle** — 4 findings
- **C5 · Side-effect & Secret Hygiene** — 5 findings
- **C6 · Audit Trail** — 4 findings (contract + dispatch)
- **C7 · Loop–Stop conflicts** — 2 findings

## C1 — Budget & Cost control

### Finding 1.1 — Missing Budget element in contract
- **Severity:** HIGH
- **Files:** SKILL.md:83-92 (Goal contract checklist)
- **Problem:** No cap on iterations / wall-clock / tokens / cost. A Loop that says "rerun until passing" can run indefinitely.
- **Fix:** Add 5th contract item `Budget`.

### Finding 1.2 — Budget stop is conflated with hard stop
- **Severity:** HIGH
- **Files:** SKILL.md:91 + reviewer-protocol.md:55
- **Problem:** "Budget exhausted" and "scope violation" are forced through the same Stop-rule language, hiding different runtime behaviors.
- **Fix:** BudgetStop is its own event with mandatory cost summary; classify under Budget item, not Stop rule.

### Finding 1.3 — Hidden-cost: token exhaustion mid-output
- **Severity:** HIGH
- **Files:** SKILL.md:83-92
- **Problem:** Model context/output limits terminate generation independently of phase; no completion reserve.
- **Fix:** Budget item requires explicit completion-reserve allowance (e.g. 20% reserved for handoff).

### Finding 1.4 — Loop bomb: no numeric iteration cap
- **Severity:** HIGH
- **Files:** SKILL.md:58-70, 83-92
- **Problem:** Stop rule is semantic; a flaky proof can drive thousands of iterations.
- **Fix:** Budget item refuses to draft without `max_iterations`.

## C2 — Proof & Verification

### Finding 2.1 — Proof under-specified
- **Severity:** HIGH
- **Files:** SKILL.md:88, 117
- **Problem:** "Pass" is not formally defined; missing timeout, flake policy, env expectation, parsing for non-exit-code proofs.
- **Fix:** Each Proof item must specify: command + expected predicate (exit code N / regex match / count / file predicate) + timeout + flake policy + env expectation. Runtime refuses plans that say "passes" without an observable predicate.

### Finding 2.2 — End state has no runtime-detectable anchor
- **Severity:** HIGH
- **Files:** SKILL.md:87
- **Problem:** Pure prose predicate; runtime cannot verify independently of the Proof command.
- **Fix:** End state must name at least one independently-verifiable anchor (path + predicate, branch state, set size, external state).

### Finding 2.3 — Stop rule is user-confused
- **Severity:** HIGH
- **Files:** SKILL.md:91, 117
- **Problem:** "Stop rule: when blocked, ask me" passes the contract; "Stop rule: when tests are failing" is meaningless (already a Loop condition).
- **Fix:** Contract requires each Stop trigger to be machine-distinguishable from Loop's normal progress; reject patterns like "any ambiguity."

### Finding 2.4 — Tool/network failure classification missing
- **Severity:** HIGH
- **Files:** SKILL.md:87-91, reviewer-protocol.md:51-59
- **Problem:** TEST_FAIL, DNS_OUTAGE, TIMEOUT, AUTH_ERROR all look like "non-zero exit"; treating as product failure causes bad code changes.
- **Fix:** Failure taxonomy at goal-plan level: PRODUCT_FAIL / TRANSIENT_INFRA / AUTH_OR_PERMISSION / TOOL_SETUP / CANCELLED / AMBIGUOUS_POSTCONDITION. Only TRANSIENT_INFRA retried with backoff.

### Finding 2.5 — Replay/nondeterminism
- **Severity:** HIGH
- **Files:** SKILL.md:64-68, 87-90
- **Problem:** Same tree PASS-then-FAIL across runs because of clock, locale, deps, mutable services.
- **Fix:** Proof item records env snapshot; for read-only proofs require consecutive-fresh-passes count; classify irreducible instability as `NONDETERMINISTIC` and require user review.

### Finding 2.6 — Stuck-on-edge / silent degradation
- **Severity:** HIGH
- **Files:** SKILL.md:117-138, reviewer-template.md:19-36
- **Problem:** Retry-until-green accepts a flaky PASS as success.
- **Fix:** Establish baseline + require consecutive passes + non-empty execution + no regression in skips/coverage. Flaky proof is FAIL.

### Finding 2.7 — Cross-element Loop vs Stop rule conflict
- **Severity:** MEDIUM
- **Files:** SKILL.md:90-91, 117, 134
- **Problem:** No checkpoint cadence or resume rule; Stop rule interrupts progress, no integration spec.
- **Fix:** Loop item declares checkpoint cadence (every iteration or every N minutes) and resume rule (last checkpoint + re-verify).

## C3 — Reviewer Sub-agent Hardening

### Finding 3.1 — Mechanism underspecification
- **Severity:** HIGH
- **Files:** reviewer-template.md:60, reviewer-protocol.md:19
- **Problem:** "Sub-agent task" + `--task` example is unportable; every runtime reinvents the contract.
- **Fix:** Mandate canonical dispatch primitive `dispatch_review_subagent` with fixed argument schema + portability table.

### Finding 3.2 — Resource/cost caps missing
- **Severity:** HIGH
- **Files:** reviewer-protocol.md:51-59, reviewer-template.md:46-51
- **Problem:** Reviewer is unbounded; runaway Reviewer makes goal cost non-deterministic.
- **Fix:** Each `<dispatch-primitive>` declares `budget:` (max_tokens, max_wall_clock, max_tool_calls, max_retries). Cap breach → FAIL with reason, not opaque.

### Finding 3.3 — Retry semantics underspecified
- **Severity:** HIGH
- **Files:** reviewer-template.md:51, reviewer-protocol.md:53,59
- **Problem:** "Re-run with corrected verdict" + "do not retry silently" are contradictory.
- **Fix:** Three outcomes + per-outcome retry budget: `malformed_verdict` (re-dispatch ≤ N), `dispatch_error` (re-dispatch ≤ M), `verdict_FAIL` (never re-dispatch Reviewer).

### Finding 3.4 — Verdict parsing fragile
- **Severity:** HIGH
- **Files:** reviewer-template.md:46-51, SKILL.md:133-134
- **Problem:** "Last line" breaks across 6 runtime failure modes (telemetry, code fences, mid-stream PASS, multi-line reasons).
- **Fix:** Deterministic verdict parser spec: trim trailing whitespace + skip blanks + case-sensitive regex `^(PASS|FAIL:.*)$` + length cap on FAIL reason + optional `<verdict>` sentinel.

### Finding 3.5 — Adversarial reviewer isolation missing
- **Severity:** HIGH
- **Files:** reviewer-template.md:9-13, reviewer-protocol.md:24-35
- **Problem:** Adversarial role inherits main loop's tool surface — same workspace, same credentials, same network egress.
- **Fix:** Dispatch paragraph declares `sandbox:` block (file_access, network, git_push, secret_scrub). Adversarial role denies write + network by default.

### Finding 3.6 — Failure class enumeration underspecified
- **Severity:** MEDIUM
- **Files:** reviewer-protocol.md:59
- **Problem:** "Errors or times out" lumps 4 distinct outcomes under one FAIL string.
- **Fix:** Enumerate `dispatch_refused`, `dispatch_timeout`, `dispatch_oom`, `dispatch_empty` with distinct verdict reasons.

### Finding 3.7 — Observability: full output retention
- **Severity:** MEDIUM
- **Files:** reviewer-protocol.md:51-59, reviewer-template.md:46-51
- **Problem:** Only verdict line captured; rationale lost.
- **Fix:** Dispatch declares `artifacts:` block — full Reviewer output captured to `goal-logs/<run-id>/reviewer.txt`; on FAIL echo summary to user.

### Finding 3.8 — State injection: input size & transport
- **Severity:** MEDIUM
- **Files:** reviewer-template.md:15-25, reviewer-protocol.md:29
- **Problem:** "Final diff" can be megabytes; no transport spec.
- **Fix:** Per-input `(max_size, transport: inline|path|env)` declaration; default 256 KB inline cap.

### Finding 3.9 — Concurrency: "exactly once" unenforceable
- **Severity:** MEDIUM
- **Files:** SKILL.md:38,78,110, reviewer-protocol.md:9
- **Problem:** "Exactly once" is logical, not enforced; crash + retry double-bills cost.
- **Fix:** Dispatch declares `(goal_id, iteration)` idempotency key; runtime dedupes; reconciliation rules on retry.

### Finding 3.10 — Reviewer crash → loop route ambiguity
- **Severity:** MEDIUM (covered in failure-modes 4.4 / dispatch-09 above)
- **Files:** SKILL.md:38,110, reviewer-protocol.md:7-10,55-59
- **Problem:** Reviewer infra error and verdict FAIL indistinguishable; main-loop crash can duplicate.
- **Fix:** Distinguish `REVIEW_FAIL` from `REVIEW_INFRA_ERROR`; pause on infra error; persist attempt ID.

## C4 — Run Lifecycle

### Finding 4.1 — Lifecycle hooks missing
- **Severity:** HIGH
- **Files:** SKILL.md:24, 83-92
- **Problem:** "Cannot modify or cancel an already-running goal" implies lifecycle, but contract has no field.
- **Fix:** Add 6th contract item `Lifecycle` — DRAFT / APPROVED / RUNNING / PAUSED / CANCEL_REQUESTED / CANCELLED / COMPLETED / FAILED + plan hash + base commit anchor.

### Finding 4.2 — User cancel mid-run undefined
- **Severity:** HIGH
- **Files:** SKILL.md:21-29, 81
- **Problem:** Ctrl-C leaves subprocesses, locks, partial writes, no resumable record.
- **Fix:** Lifecycle defines `CANCEL_REQUESTED` → bounded grace shutdown → atomically checkpoint → report resume options.

### Finding 4.3 — Concurrent modification / plan staleness
- **Severity:** HIGH
- **Files:** SKILL.md:23-24, 79-81
- **Problem:** Plan not frozen by hash; can be silently re-interpreted across runs.
- **Fix:** Lifecycle records approved-plan hash + base commit + tool versions; on resume re-verify, pause for reapproval on drift.

### Finding 4.4 — Crash and recovery
- **Severity:** HIGH
- **Files:** SKILL.md:72-92
- **Problem:** No run manifest, checkpoint format, or resume policy.
- **Fix:** Lifecycle spec requires atomic run manifest with idempotency keys; on restart reconcile + resume from verified safe checkpoint only.

## C5 — Side-effect & Secret Hygiene

### Finding 5.1 — Boundaries only cover paths
- **Severity:** HIGH
- **Files:** SKILL.md:89, 56
- **Problem:** Goals routinely mutate external systems (API calls, payments, branches); Boundaries only mentions paths.
- **Fix:** Boundaries item expands to (a) in-scope paths, (b) network endpoints / denied-net policy, (c) side-effect allow-list (read/write/send/pay), (d) reversibility class.

### Finding 5.2 — Side-effect leakage out of workspace
- **Severity:** HIGH
- **Files:** SKILL.md:49-56, 87-91, 117-130
- **Problem:** `npm install`, `git config`, hooks, keychain writes happen outside project path checks.
- **Fix:** Capability boundary adds default-deny writes outside isolated workspace + temp HOME/XDG/cache + audit before/after each tool call.

### Finding 5.3 — Credential / secret exposure
- **Severity:** HIGH
- **Files:** reviewer-template.md:15-25, SKILL.md:135-138
- **Problem:** Proof command output (e.g., `set -x`) leaks secrets into Reviewer context and persisted artifacts.
- **Fix:** Proof capture with shell tracing disabled + env allowlist; value-aware + token-pattern redaction; size caps; on detection stop + rotate.

### Finding 5.4 — Adversarial sandbox (cross-ref 3.5)
- covered in C3-3.5.

### Finding 5.5 — Tool/permission audit policy missing
- **Severity:** MEDIUM
- **Files:** SKILL.md:87-91
- **Problem:** No audit before/after each tool invocation.
- **Fix:** Bound to capability boundary item.

## C6 — Audit Trail

### Finding 6.1 — No artifact clause
- **Severity:** MEDIUM
- **Files:** SKILL.md:83-92, reviewer-template.md:21
- **Problem:** Loop may run many turns; nothing obliges retaining transcript, diff snapshots, command outputs, Reviewer full text.
- **Fix:** Lifecycle spec requires artifacts at termination: final diff, proof captures, Reviewer output, iteration log, cost, side-effect record.

### Finding 6.2 — Reviewer output retention
- **Severity:** MEDIUM (covered in C3-3.7)
- already mapped.

### Finding 6.3 — Compounding-error guard
- **Severity:** HIGH
- **Files:** SKILL.md:38, 90-92, reviewer-protocol.md:55
- **Problem:** Each speculative fix becomes next iteration's baseline; one wrong assumption propagates.
- **Fix:** Lifecycle requires isolated worktree + per-iteration checkpoint + monotonic-progress check + revert-on-stagnation.

### Finding 6.4 — Cost/usage accounting
- **Severity:** MEDIUM (covered in C1-1.3)
- **Files:** SKILL.md:31-35, 83-92
- **Problem:** No shared counter debited across workers/retries.
- **Fix:** Budget item requires single controller with shared counter; all workers debit it.

## C7 — Loop–Stop / Contract Conflicts

### Finding 7.1 — Stop rule overloaded
- **Severity:** HIGH
- **Files:** SKILL.md:91, 134
- **Problem:** Four distinct stop events share the same runtime path.
- **Fix:** Each event has its own home — HardStop (safety) and SoftStop (human-required) in Stop rule; BudgetStop in Budget; ReviewerStop (route-back) in Reviewer.

### Finding 7.2 — Loop semantics presume forward progress (already covered 2.7)
- already mapped.

---

## Cluster Severity Roll-up

| Cluster | HIGH | MEDIUM | Total |
|---|---|---|---|
| C1 Budget | 4 | 0 | 4 |
| C2 Proof & Verification | 6 | 1 | 7 |
| C3 Reviewer | 5 | 5 | 10 |
| C4 Lifecycle | 4 | 0 | 4 |
| C5 Side-effect / Secret | 3 | 1 (+1 cross-ref) | 5 |
| C6 Audit Trail | 1 | 2 | 4 (+1 cross-ref) |
| C7 Loop–Stop | (cross-ref) | 1 | 2 (1 cross-ref) |
| **Substantive findings** | **21** | **9** | **30** (+1 cross-ref counted twice) |

## Structural Decisions (frozen for v2.0)

### Contract goes from 6 to 8 items

1. **End state** — must name an independently verifiable anchor
2. **Proof** — predicate + timeout + flake policy + env snapshot
3. **Boundaries** — paths + side-effect allow-list + network policy + reversibility
4. **Loop** — checkpoint cadence + resume rule + iteration strategy
5. **Budget** — max_iterations + max_wall_clock + max_cost + max_no_progress + completion reserve
6. **Lifecycle** — DRAFT/APPROVED/RUNNING/PAUSED/CANCEL_REQUESTED/CANCELLED/COMPLETED/FAILED + plan hash + base commit anchor
7. **Stop rule** — HardStop (terminal) + SoftStop (pause+ask) only
8. **Reviewer** — `<dispatch-primitive>` + `<reviewer>` blocks; verdict parser is deterministic; sub-agent dispatch contract

### Reviewer events decoupled

- `REVIEW_FAIL` (verdict FAIL) → route back into Loop, count against Budget, NOT a stop
- `REVIEW_INFRA_ERROR` → pause (SoftStop-class), surface to user, no code change
- BudgetStop (Budget exhausted) → terminal, with cost summary
- HardStop (safety violation) → terminal, no resume
- SoftStop (human checkpoint) → pause, user re-approves
- `CANCEL_REQUESTED` → graceful shutdown, checkpoint, CANCELLED state

### Canonical dispatch primitive

Name: `dispatch_review_subagent`. Single primitive, fixed schema. Runtimes provide a portability table (OpenCode subagent, Claude Code Task, raw shell).

### Verdict parser (deterministic)

1. Trim trailing whitespace on sub-agent output.
2. Split on `\n`; skip trailing blank lines.
3. Apply case-sensitive regex `^(PASS|FAIL:.*)$` to last non-blank line.
4. If length of FAIL reason > 280 chars → FAIL with reason truncated marker.
5. If runtime appends telemetry after sub-agent finishes, hosts MUST emit `<verdict>...</verdict>` sentinel; parser respects sentinel if present.
6. Anything else: FAIL with reason `verdict_unparseable: <one-line output tail>`.

### Sandbox default-deny for adversarial

```
sandbox:
  file_access: read-only         # for verifier; read-write only on explicit override
  network: deny                  # unless reviewer needs API access, declared explicitly
  git_push: deny
  secret_scrub: required         # host MUST scrub before injection
```

### Capability boundary default-deny

All goals run in an isolated workspace with:
- temp HOME / XDG / cache dirs
- explicit network allowlist (deny by default)
- explicit side-effect allow-list (read/write/send/pay)
- per-tool audit log written to `goal-logs/<run-id>/tool-audit.log`

### Files restructure

| File | Status | Purpose |
|---|---|---|
| `SKILL.md` | rewrite | 8-item contract + workflow + lifecycle states |
| `references/contract-glossary.md` | new | precise semantic of each contract element |
| `references/reviewer-template.md` | rewrite | user-facing 4-section template (Role/Inputs/Acceptance/Verdict) — unchanged shape, expanded inputs |
| `references/dispatch-primitive.md` | new | canonical `dispatch_review_subagent` schema + verdict parser + failure classes |
| `references/capability-boundary.md` | new | default-deny workspace + side-effect allow-list + secret scrubbing |
| (old) `references/reviewer-protocol.md` | deleted (or replaced by `dispatch-primitive.md` + `capability-boundary.md`) | — |

Replace `reviewer-protocol.md` with the two new files to keep the topic split clean.

### Versioning

`1.3.0` → `2.0.0` (major; contract change is a backwards-incompatible contract bump).
