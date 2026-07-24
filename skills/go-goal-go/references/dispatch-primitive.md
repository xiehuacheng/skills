# Canonical Dispatch Primitive

Authoritative contract between the main goal loop and the sub-agent runtime. This file defines exactly one primitive, used for the Reviewer sub-agent. Hosts MUST implement exactly this primitive; the goal plan's `<dispatch-primitive>` block is a YAML instance of this schema.

## Primitive: `dispatch_review_subagent`

```yaml
primitive: dispatch_review_subagent
version: 2
role: verifier | critic | adversarial_reviewer
when: <natural-language trigger condition>
budget:
  max_tokens: <int>
  max_wall_clock_seconds: <int>
  max_tool_calls: <int>
  max_retries_on_malformed: <int>     # default 1
  max_retries_on_dispatch_error: <int> # default 0; bump only with user present
sandbox:
  file_access: read-only | read-write
  network: deny | allowlist
  git_push: deny | allow
  secret_scrub: required | off
verdict_parser: deterministic-trim-blank-regex
inputs:
  - name: <id>
    source: <command or "literal">
    transport: inline | path:<repo-relative> | path:/abs | env:<VAR>
    max_bytes: <int>
    secret_scan: required | off
on_fail: route_back_to_loop_with_iteration_decrement | softstop_with_partial_output | hardstop_terminal
artifacts:
  reviewer_output: goal-logs/<run-id>/reviewer.txt
  reviewer_verdict: goal-logs/<run-id>/verdict.txt
  user_visible_summary_on_fail: one_paragraph | none
  retention_days: <int>                # default 90
idempotency_key: <derived from run_id + iteration + role>
```

## Verdict parser

`deterministic-trim-blank-regex` is the only supported parser. Algorithm:

1. Trim trailing whitespace (`\s`) from the sub-agent's full output buffer.
2. Split on `\n`.
3. Drop trailing blank lines (lines that match `^\s*$`).
4. Take the **last** non-blank line.
5. Apply case-sensitive regex: `^(PASS|FAIL:.{1,280})$`.
6. If the runtime supports a sentinel (recommended for hosts that wrap output), the parser MUST first check for `<verdict>PASS</verdict>` or `<verdict>FAIL: .*</verdict>` and parse only the inner text. Hosts MUST document whether they emit sentinels.
7. Anything else is `REVIEW_INFRA_ERROR: verdict_unparseable`. The full last-5-line tail is captured into `verdict.txt` for human diagnosis.
8. Reject if FAIL reason exceeds 280 chars; truncate with marker `(reason-truncated)`.

## Failure classes (enumerated)

The host MUST classify each sub-agent outcome into exactly one of:

| Class | Trigger | Verdict |
|---|---|---|
| `verdict_PASS` | parser matched `^PASS$` | `PASS` |
| `verdict_FAIL` | parser matched `^FAIL:.{1,280}$` | `FAIL: <reason>` |
| `malformed_verdict` | parser did not match, but output was non-empty | `REVIEW_INFRA_ERROR: verdict_unparseable` |
| `dispatch_refused` | host refused to start sub-agent (no slot, quota, policy block) | `REVIEW_INFRA_ERROR: dispatch_refused (<host reason>)` |
| `dispatch_timeout` | wall-clock budget exceeded | `REVIEW_INFRA_ERROR: dispatch_timeout after <N>s on step <last_visible_step>` |
| `dispatch_oom` | process killed (signal SIGKILL, OOM) | `REVIEW_INFRA_ERROR: dispatch_oom (<peak memory if known>)` |
| `dispatch_empty` | sub-agent completed with empty / non-text body | `REVIEW_INFRA_ERROR: dispatch_empty` |

Routing on each class (per the `on_fail` field in the goal plan):

- `verdict_PASS` → goal COMPLETED.
- `verdict_FAIL` → route back to Loop. Decrements remaining `max_iterations`. NOT a stop.
- All `REVIEW_INFRA_ERROR` classes → SoftStop-class pause. Surface to user with the captured partial output. No code change. No retry unless `max_retries_on_dispatch_error > 0` and the user is present.

## Sandbox policies

`read-only` is the default and only required for `verifier` / `critic`. `adversarial_reviewer` MUST default-deny all write + network + git_push. Any promotion to a less restrictive sandbox requires the user to explicitly enumerate the relaxed side effects in the goal plan.

`secret_scrub: required` means the host MUST apply value-aware and known-token-pattern redaction (e.g. `aws_secret_access_key=...`, `Authorization: Bearer <token>`, `ghp_*` GitHub PAT prefix) before injecting any input into the sub-agent. Hosts MUST document their scrubber coverage; if scrubber coverage is unknown, the host MUST clamp to `secret_scrub: required` and surface a warning to the user that secrets may leak.

## Idempotency

`idempotency_key` MUST be derived deterministically from `(run_id, iteration_number, role)`. Hosts MUST de-duplicate dispatch requests sharing a key. If the loop restarts mid-dispatch, hosts MUST reattach to the in-flight sub-agent by key; if the prior attempt's verdict is unavailable, treat as `REVIEW_INFRA_ERROR: dispatch_empty` rather than re-dispatching.

## Retry budgets

The two retry budgets are independent. Their exhaustion produces the same outcome (`REVIEW_INFRA_ERROR`) but different operator responses:

- `max_retries_on_malformed` — re-dispatch on parser failure. Each re-dispatch appends a one-line reminder of the verdict schema to the task prompt. Exhaustion → `REVIEW_INFRA_ERROR: malformed_verdict_after_<N>_retries`.
- `max_retries_on_dispatch_error` — re-dispatch on host-side failures (refused, timeout, OOM, empty). Default 0 in unattended goal mode; bump to 1 only when the user is present. Exhaustion → escalate to SoftStop with the last captured partial output.

`verdict_FAIL` is **never** retried at the dispatcher level. It always routes back into the Loop for the main loop to handle.

## Runtime portability

The primitive `dispatch_review_subagent` is portable across these runtimes via these adapters (informative, not normative):

| Runtime | Adapter |
|---|---|
| OpenCode subagent | `task` tool with prompt body, role tag, budget cap |
| Claude Code Task | `Task` tool with subagent_type=`general-purpose` or `statusline-setup`, prompt body |
| Raw shell harness | `claude --task "<prompt>" --role <role> --budget <json>` |
| MCP server | `dispatch_subagent` tool |

Hosts MUST select exactly one adapter per dispatch. Hosts MUST NOT chain multiple adapters within a single dispatch.
