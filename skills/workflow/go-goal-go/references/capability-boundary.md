# Capability Boundary

> **Host-internal.** The user does not write this. The host enforces a default-deny capability envelope (read-only in-scope paths, deny-all network, isolated workspace, secret scrubbing, tool audit) at runtime. Read this file only when implementing or hardening the host runtime itself.

Default-deny capability envelope for `/goal` runs. Every goal MUST run inside this boundary. The boundary is the runtime's responsibility, not the goal plan's; the goal plan declares *policy* in plain language and the host *enforces*.

## Default posture

- **Workspace**: project checkout (read-only base) + scratch directory at `goal-logs/<run-id>/workspace/`. The loop writes into scratch only; commits are explicit operations out of scratch into the working tree.
- **HOME / XDG / caches**: redirected to `goal-logs/<run-id>/home/` (clean per-run). The real `$HOME` is read-only.
- **Network**: deny by default. Allow-listed hostnames (`*.github.com`, `registry.npmjs.org`, etc.) declared in the goal's `network.allowlist`. Egress not in the allow-list is dropped at the network namespace level.
- **Side-effect classes** (see `contract-glossary.md` §3): default `read` only. Anything beyond read must be enumerated in the goal's `side_effect_allowlist`.

## Tool audit log

Every tool invocation writes a row to `goal-logs/<run-id>/tool-audit.log`:

```json
{"ts": "<iso8601>", "tool": "<name>", "args_sha256": "<hash>", "result_summary": "<truncated>", "side_effect_class": "read|write|send|pay", "audit": "allowed|denied|escalated", "reason": "..."}
```

The host pauses the goal if any tool invocation's declared `side_effect_class` was not in the allow-list.

## Per-tool side-effect classification (informative)

| Tool class | Default class | Notes |
|---|---|---|
| `Read`, `grep`, `rg`, `find` | read | always allowed |
| `Edit`, `Write`, `MultiEdit` | write | allowed iff in `in_scope_paths` and `side_effect_allowlist` includes `write` |
| `Bash` (read-only commands: `ls`, `cat`, `git log`, etc.) | read | allowed |
| `Bash` (`git commit`, `git push`, `gh issue create`, etc.) | depends on subcommand | classified by argv parser |
| `npm install`, `pip install`, `cargo add` | write + send (registry fetch) | requires `send` allow-list entry for the registry hostname |
| `curl`, `wget`, `httpie` | send | requires hostname in network allow-list |
| Stripe / payment SDK calls | pay | requires `pay` in side-effect allow-list |
| `git push --force`, `git reset --hard`, `rm -rf` | irreversible | requires explicit user confirmation at dispatch time |

## Secret scrubbing

Before any input is injected into the Reviewer sub-agent (or written to `goal-logs/`) the host MUST run a scrubber:

1. **Value-aware redactors**: keys named `*_key`, `*_secret`, `*_token`, `*_password`, `authorization`, `cookie`, `set-cookie`.
2. **Pattern redactors**: `aws_secret_access_key=...`, `AKIA[0-9A-Z]{16}` (AWS access key), `ghp_[0-9a-zA-Z]{36}` (GitHub PAT), `xox[abp]-[0-9a-zA-Z-]+` (Slack), `-----BEGIN [A-Z ]+ PRIVATE KEY-----`, `Bearer\s+[A-Za-z0-9._-]+`, basic-auth headers.
3. **Environment scrub**: strip known-secret env vars (`AWS_*`, `GH_TOKEN`, `NPM_TOKEN`, `*_API_KEY`, `*_SECRET`) from the Reviewer's environment unless the goal plan explicitly enumerates them as inputs.

The scrubber's coverage MUST be reported in `goal-logs/<run-id>/scrub-coverage.json` as a structured list of redactor names + version. Scrubbers without documented coverage MUST NOT be used in unattended goal mode.

## Out-of-workspace detection

Before each `write` or `send` tool call, the host checks:

1. The target path is under `in_scope_paths` (resolved, no symlink escape).
2. The target URL host matches `network.allowlist` (no IP literals; DNS resolves to an allow-listed CIDR).
3. The side-effect class is in `side_effect_allowlist`.

Any miss pauses the goal and prompts the user to either deny the operation or update the allow-list (which then re-enters the Lifecycle's re-approval flow).

## Cancellation / pause semantics

- `CANCEL_REQUESTED` (user Ctrl-C) → host stops scheduling work, terminates the active child process group with a 5s grace period, persists the run manifest atomically, writes `goal-logs/<run-id>/cancel.jsonl`, transitions state to `CANCELLED`.
- `SoftStop` (pause) → host flushes the iteration log, marks the resume-to checkpoint in the manifest, transitions state to `PAUSED`, awaits user re-approval.
- `HardStop` (terminal) → host terminates immediately, persists the manifest, transitions to `FAILED`, emits `goal-logs/<run-id>/failure.md`.

## Shared counter for budget

All workers and re-dispatches debite a single budget counter. The host enforces that the sum of `tokens_used` across workers does not exceed the goal's `max_cost`. Workers exceeding their per-tool budget are terminated, not paused, to avoid zombie state.

## What this file does NOT cover

- **Within-tool arguments**: a `Write` may be in-scope but write malformed content; the loop's own logic catches this, not the boundary.
- **Time-based attacks**: the boundary does not throttle tool-call rate; the goal's `Budget` does.
- **Side-channel leaks via timing or memory**: out of scope for v2.0; track in a future version.
