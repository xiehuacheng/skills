# Reviewer Protocol

Companion to `SKILL.md` Step 4.5 and the **Reviewer (mandatory)** subsection. This file collects the Reviewer-specific mechanics so `SKILL.md` stays lean.

## Default

- The Reviewer is a mandatory completion gate.
- The Reviewer is dispatched exactly once at the end of the loop as a **sub-agent**.
- The Reviewer's last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
- Anything else (missing verdict, wrong format, refusal to emit) is treated as `FAIL`.
- The main loop is forbidden from reading the `<reviewer>` block in-place and self-judging the verdict.

## The dispatch paragraph (mandatory companion to the Reviewer block)

A `<reviewer>` block alone is not a complete gate. The goal plan must also include a `Reviewer dispatch:` paragraph that the main loop reads to know:

1. When to fire the sub-agent.
2. How to invoke it (which runtime, which arguments).
3. How to read the verdict (which line, what counts as malformed).
4. What to do on `FAIL`.

Without this paragraph the goal plan is malformed even if the `<reviewer>` prompt body is perfect. The full embedding skeleton (dispatch paragraph + `<reviewer>` block) lives in `references/reviewer-template.md`.

## Drafting the Reviewer prompt (Step 4.5 detail)

1. Load `references/reviewer-template.md` in this turn.
2. Walk the user through the 4 sections, in order, asking one question per section:
   - **Role** — verifier / critic / adversarial reviewer (default: verifier).
   - **Inputs** — what the Reviewer is allowed to read (default: full goal plan + final diff + proof command output).
   - **Acceptance criteria** — concrete, independently checkable, numbered. Reject vague wording ("clean", "good", "works").
   - **Verdict schema** — single-line `PASS` or `FAIL: <reason>`.
3. Embed the filled prompt into the goal plan as a literal `<reviewer>...</reviewer>` block.
4. Refuse to call `CreateGoal` if the verdict schema is missing or malformed. Do not invent a verdict format.
5. AskUserQuestion: "Add the Reviewer completion gate?" — defaults to **Yes**. Decline path requires the explicit opt-out comment below.

## Explicit opt-out

Append this literal line to the goal plan:

```
<!-- no Reviewer gate: completion by agent self-judgment -->
```

Then, in chat:
- Restate the warning once at draft time.
- Restate the warning once when the goal starts.
- Do not bring it up again for that goal.

The user, not the agent, owns the completion decision in this mode.

## Edge cases

- **`<reviewer>` block provided but no `Reviewer dispatch:` paragraph.** Malformed. The goal loop is not allowed to read the `<reviewer>` block in-place; it must dispatch it as a sub-agent. Without the dispatch paragraph the goal plan is incomplete even if the prompt body itself is well-formed. Refuse to draft and ask the user to write a 3-6 line dispatch paragraph.
- **Reviewer prompt provided but verdict schema missing or malformed.** Refuse to draft. Ask the user to confirm a single-line verdict schema (`PASS` or `FAIL: <reason>`) and retry.
- **Proof passes but Reviewer returns `FAIL`.** The Reviewer verdict wins. Surface both to the user; do not treat a passing proof as completion.
- **Reviewer returns an unknown verdict string** (e.g. `SUCCESS`, `YES`, `APPROVED`). Treat as `FAIL`. Do not normalize to `PASS`.
- **User tries to make the Reviewer interactive (multi-turn).** State that the goal loop dispatches the Reviewer exactly once. Multi-round review belongs in the main loop, not the Reviewer.
- **User wants a different verdict format.** Refuse. The single-line `PASS` / `FAIL: <reason>` schema is the contract; downstream parsing depends on it.
- **Main loop dispatches the Reviewer and the sub-agent errors or times out.** Treat as `FAIL` with reason `sub-agent dispatch failed`. Do not retry silently; surface the failure to the user.

## Embedding template (paste into goal plan)

```xml
<reviewer>
Role: <verifier | critic | adversarial reviewer>

Inputs:
- <list of read sources>

Acceptance Criteria:
1. <criterion — checkable>
2. <criterion — checkable>
3. <criterion — checkable>

Verdict: the last line of output must be exactly `PASS` or `FAIL: <one-line reason>`.
</reviewer>
```
