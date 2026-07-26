# Contract Glossary (prose form)

> **Host-internal.** This file is for tooling that automatically generates or parses goal plans. The user does not read this when writing a goal by hand — `SKILL.md` shows the natural-language shape.

Each section below maps the canonical contract items to the prose paragraphs the user writes. Validation can be done by reading the natural-language paragraphs and asking, for each item, "does this paragraph name a checkable thing?".

## 目标 / Goal

The one or two sentences at the top of the goal plan. State what must become true. Named in plain words. If it cannot be stated in one sentence, the goal is too vague.

Validator check: at most 2 sentences, ideally 1.

## 完成标准 / End state

A single observable predicate the host can verify without running any agent:

- a file path exists or does not,
- a string appears in some output N times,
- a branch is in a specific state,
- an external endpoint returns a specific value,
- a set of test IDs is / is not in the passing list.

Validator check: at least one concrete predicate. Reject pure prose ("the code is healthier").

## 证明 / Proof

How the loop verifies the end state each iteration. Typically one command plus one or two "supporting signals" — extra observations that catch failure modes the command alone misses (a flaky test passing, an assertion being weakened to get there).

Examples of supporting signals:

- "no skipped tests were added",
- "the same N test IDs are in the passing list across the last 3 runs",
- "run timing spread (max − min) is under N seconds",
- "the final diff contains no `.skip(`, `describe.skip`, `xit`, `xdescribe`, etc.",
- "the final diff does not weaken any assertion".

Validator check: there is a runnable command AND at least one supporting signal that catches the common failure modes (silent degradation, retry-until-green).

## 边界 / Boundaries

Plain language for what the loop is allowed to touch and what it must not do. Defaults:

- paths: project-only (`src/**`, `test/**`, plus any specific subdirs the user names),
- write allowed inside the in-scope paths only,
- network: deny by default,
- no destructive operations (no `git push --force`, no `git reset --hard`, no `rm -rf` outside the in-scope paths).

Validator check: in-scope paths are enumerated; if the loop proposes to touch anything else, that is a violation. Network and side effects declared in plain prose ("no network", "no installs", "no API calls") are accepted.

## 预算 / Budget

Plain-language caps. Typical:

- max iterations (e.g. "50 轮以内"),
- max wall-clock (e.g. "20 分钟以内"),
- max cost (e.g. "$1 以内"),
- stall counter (e.g. "5 轮没有新通过就停"),
- reserve (e.g. "20% 留给退出时的 handoff" — optional; the host's default is 20% of max cost).

Validator check: at least iteration cap and one of (wall-clock, cost). Stall counter recommended; reserve optional.

## 停的条件 / Stop conditions

Plain language describing when to stop. Distinguish:

- **Hard stops** — terminate immediately, no resume. Examples: "写到 in-scope 之外", "动了 secrets/credentials", "违反 boundaries".
- **Soft stops** — pause, surface to the user, await re-approval. Examples: "用户主动 Ctrl-C", "需要改测试运行器配置", "cost 投影超剩余 budget".

Validator check: at least one trigger named. Hard stops vs. soft stops distinguished in prose ("立即停" / "停并问" / "暂停").

## 谁来检查 / Reviewer

The `<reviewer>` block. The user writes 4 sections in plain language:

- **Role** — `verifier` (default), `critic`, or `adversarial_reviewer`.
- **Inputs** — which inputs the host auto-collects (`final_diff`, last `proof_output`, `iterations_log`).
- **Acceptance** — concrete pass/fail criteria, each worded as a checkable condition.
- **Verdict schema** — last line of output must be `PASS` or `FAIL: <one-line reason>` (max 280 chars).

The user does not write sandbox / budget / dispatch / idempotency keys. The host applies safe defaults (see `references/reviewer-template.md`).

Validator check: the `<reviewer>` block has all four sections; the Acceptance section has at least one checkable item; the Role is one of the three named roles.

## Routing summary

- Goal `COMPLETED` ⇔ end-state predicate holds AND reviewer verdict == `PASS` AND no budget cap was hit AND no hard stop fired.
- Reviewer verdict `FAIL: <reason>` ⇔ route back to the main loop iteration, decrement remaining budget. Not a stop.
- Budget cap (any of iteration / wall-clock / cost) ⇔ terminate, emit cost summary, no `COMPLETED` claim.
- Hard stop fires ⇔ terminate immediately.
- Soft stop fires ⇔ pause, persist checkpoint, await re-approval.
