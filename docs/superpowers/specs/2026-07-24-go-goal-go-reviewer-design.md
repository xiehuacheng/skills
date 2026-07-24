# go-goal-go Reviewer Design

**Date:** 2026-07-24
**Status:** Approved (brainstorming)
**Target skill:** `skills/go-goal-go/SKILL.md`

## Goal

Embed an explicit **Reviewer sub-agent** into the goal plan produced by `go-goal-go`. The Reviewer is dispatched by the goal loop at completion time. Its verdict (`PASS` / `FAIL: <reason>`) acts as a completion gate. If the Reviewer is missing, the goal's "done" claim collapses to agent self-judgment, which `go-goal-go` must push back on.

The change must:

- Extend the existing 5-item contract by exactly one item: `Reviewer`.
- Insert exactly one workflow step (4.5) between current step 4 (skill/tool declaration) and step 5 (show full goal). Existing steps 1-7 stay untouched.
- Default to requiring the Reviewer; allow an explicit user-chosen skip with a one-line warning.
- Not introduce new scripts, tools, or external references. Only one new file: `references/reviewer-template.md`.

## Non-goals

- Changing the 5 existing contract items.
- Rewriting examples beyond adding one example for the Reviewer section.
- Multi-round or interactive Reviewer dispatch. The Reviewer is a single-shot sub-agent invoked once at the end of the loop.
- Wiring the new skill into `waza` or `creating-skills`. Those two skills were session-local design aids, not design targets.

## Architecture

Two files:

| File | Status | Purpose |
|---|---|---|
| `skills/go-goal-go/SKILL.md` | modify | Augment contract + workflow + defaults |
| `skills/go-goal-go/references/reviewer-template.md` | new | Reviewer prompt template |

No scripts, no assets. Only `references/` is created (for the new template). The reviewer template is the only on-demand reference and is loaded by the new Step 4.5.

## Contract change

Add a 6th item to the **Goal contract checklist**:

```
- **End state**  — what must become true.
- **Proof**      — the observable command, search, test, or metric that proves it.
- **Boundaries** — what may and may not be touched.
- **Loop**       — how to iterate when the work is queue-shaped.
- **Stop rule**  — when to stop and report instead of forcing a pass.
- **Reviewer**   — a sub-agent the loop dispatches at completion; verdict PASS gates completion.
```

Rename the existing section heading from `## Optional skill/tool declaration` to `## Optional skill/tool declaration & mandatory Reviewer` so the asymmetry between optional and mandatory is visible at the heading level. The body of that section keeps the existing optional declaration behavior; a sibling paragraph below it states that the Reviewer is mandatory and points to Step 4.5.

## Workflow change

Insert step 4.5 between current step 4 and step 5. Updated workflow list:

```
1.  Assess fit.
2.  Confirm intent.
3.  Draft the goal.
4.  Offer skill/tool declaration.
4.5 Draft the Reviewer sub-agent. (NEW)
5.  Show the full goal.
6.  Revise together.
7.  Start the goal.
```

Step 4.5 specification:

1. AskUserQuestion: "Add the Reviewer completion gate? (default: Yes)". Options:
   - Yes — walk the user through `references/reviewer-template.md` and fill all 4 sections.
   - No (skip with warning) — append `<!-- no Reviewer gate: completion by agent self-judgment -->` to the goal plan and state the warning in chat.
2. If Yes, the 4 sections to walk through (load the template file in the same turn):
   - **Role** — verifier / critic / adversarial reviewer. Default: verifier.
   - **Inputs** — what the Reviewer can read. Default: full goal plan + diff + proof command output.
   - **Acceptance Criteria** — concrete pass/fail list, each independently checkable.
   - **Verdict schema** — last line must be either `PASS` or `FAIL: <one-line reason>`.
3. Embed the filled Reviewer as a literal `<reviewer>...</reviewer>` block in the goal plan.
4. Refuse to proceed if the verdict schema is missing or malformed. Do not start the goal until PASS/FAIL schema is present.

## Defaults (enforced)

- Reviewer is required by default.
- Verdict schema is required (`PASS` / `FAIL: <reason>` single line).
- Reviewer is invoked exactly once at the end of the loop.
- Reviewer verdict `PASS` is the completion gate; `FAIL` routes back into the loop iteration (or triggers the stop rule if the failure matches one).

## Cannot do without explicit approval

Move these into the "Cannot do without explicit approval" block:

- Starting a goal whose goal plan lacks a `<reviewer>` block without an explicit user-confirmed skip line.
- Treating a missing/unparseable Reviewer verdict as a pass.
- Letting the loop declare the goal complete before the Reviewer has returned `PASS`.

## Default behavior additions

Append to "Default behavior":

- Goal drafting is conversational and read-only until `CreateGoal` is called. The Reviewer block is part of the goal plan and follows the same read-only rule.
- A user who declines the Reviewer must explicitly type a confirmation. The skip is recorded as a literal comment line in the goal plan, not inferred from silence.

## Edge cases (additions)

Append to "Error handling & edge cases":

- **User opts out of Reviewer:** Record the skip in the goal plan with the literal comment, restate the warning once in chat, then continue. Do not bring up the Reviewer again for the same goal.
- **User provides a Reviewer prompt but no verdict schema:** Refuse to draft. Ask the user to choose between `PASS`/`FAIL: <reason>` and retry.
- **Proof passes but Reviewer FAILs:** The Reviewer verdict wins. Surface both to the user; do not silently treat the proof as completion.
- **User tries to make the Reviewer interactive (multi-turn):** State that the goal loop dispatches the Reviewer exactly once. Multi-turn belongs in the main loop, not in the Reviewer.

## References

- `references/reviewer-template.md` — filled by users during Step 4.5.

## Examples

Add one example to the existing "Examples" block:

```
**Goal with a Reviewer gate**
- End state: every failing test under test/auth passes.
- Proof: `npm test -- test/auth` exits 0.
- Boundaries: change only files under src/auth and test/auth.
- Loop: rerun npm test after each fix; fix and rerun until no failures remain.
- Stop rule: if a fix requires changing shared infra, stop and ask.
- Reviewer (verifier):
  - Inputs: final diff + npm test output + the end state above.
  - Acceptance: (a) every test that previously failed now passes; (b) no file outside src/auth and test/auth was modified; (c) no test was deleted or skipped to make it pass.
  - Verdict: PASS or FAIL: <one-line reason>.
```

Add one short example of an explicit skip:

```
**Honest opt-out**
- Same goal as above, with the Reviewer block replaced by:
  `<!-- no Reviewer gate: completion by agent self-judgment -->`
- Skill must surface a one-line warning at draft time and once at start time.
```

## Validation plan (post-implementation)

After modifying `SKILL.md` and creating `references/reviewer-template.md`:

1. Run `python3 skills/creating-skills/scripts/quick_validate.py skills/go-goal-go/`.
2. Read back `SKILL.md` and the new reference file, check:
   - Word-count of `SKILL.md + references/` has not increased by more than 15% over the original (`SKILL.md` was ~116 lines).
   - Boundaries & defaults block at the top still contains Can do / Cannot do / Default behavior.
   - Step 4.5 reads cleanly without contradicting step 4 or step 5.
   - Examples still balance end-state / proof / boundaries / loop / stop-rule coverage.
3. Bump `metadata.version` from `1.1.0` to `1.2.0`.
4. Commit with message `feat(go-goal-go): embed Reviewer sub-agent as completion gate`.

## Open assumptions

1. The host platform's `CreateGoal` mechanism preserves embedded `<reviewer>` blocks verbatim; we render them as a literal fenced code block in the goal plan, not as structured data.
2. The host's sub-agent dispatch channel can be triggered once per goal completion without an extra tool.
3. A single-shot Reviewer is acceptable for the user's domain; multi-round review belongs in the main loop, not the Reviewer.
