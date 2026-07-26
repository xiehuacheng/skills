# Creating Skills — Waiting & Forward-Test Protocol

Complements `SKILL.md`. Read when you reach a human-in-the-loop checkpoint (Step 1-7) or are about to declare a skill done.

## While Waiting for the User

Skill creation has many human-in-the-loop checkpoints. Between them, you have **no work to do**. "Stay ready and answer briefly" is not obvious, so this file defines what waiting looks like.

### Do all of the following — no more, no less

1. Brief, evidence-anchored status line at the top: where you are, what is blocking, what action you want from the user.
2. List the asset(s) needed for the user to act (file path, link, screenshot).
3. Optionally explain why you cannot proceed, in one or two sentences. Do not re-litigate earlier decisions.
4. Do **not** run other tool calls. Do **not** start a subagent. Do **not** preempt the user's reply with "while we wait, let me also…".

### Do not do these while waiting

- Re-read the same file repeatedly.
- Re-ask the same question via `AskUserQuestion`.
- Issue a foreground `bash` to simulate progress (no progress to simulate).
- Mark a TodoList task as `in_progress` and leave it there. Use one of: `in_progress` if the wait is actively your turn (rare); `drop` if the user went silent; or omit the task entirely and add it back when the user returns.

### When the user returns

Do not re-summarize the whole conversation. Pick up where you left off in one sentence and resume the next step.

---

## Forward-Test Protocol (mandatory before declaring "done")

The forward-test verifies that a **clean** agent — one with no context from your creation session — can use the skill correctly. Running the skill yourself ("I copied template.tex to `/tmp` and ran `tectonic`") is **not** a forward-test; it tests LaTeX, not the skill.

### Procedure

1. Spawn a subagent with the `default` (task) worker. **Do not give it any history, recap, or summary of the creation conversation.**
2. First message gives only: the skill's path (`file://` or `skill://`), a **realistic single user request** that includes the trigger phrases from `description`, and a clean working directory (e.g., `/tmp/forward-test-<skill-name>/`).
3. Do **not** include: creation transcript, design rationale, hypotheses, test plan, expected outputs. The subagent sees only the skill and the user request.
4. Let the subagent run to completion. Read the artifacts it produced.
5. **Pass** (all): triggered the skill, followed workflow in order, stopped at every approval point, respected "Cannot do", matched "Default behavior".
6. **Fail** (any): skipped a step, did something forbidden, never read SKILL.md, asked the user for things the skill said it would default.
7. If the test fails, **fix the SKILL.md**. Do not patch the test, the subagent's behavior, or rewrite the skill to match what it *did*. Rewrite until the clean subagent does the right thing.

When the forward-test passes, only then is the skill done. Bump the skill `version` whenever behavior changes.

---

## Subagent Delegation Patterns

### Don't

- Embedding the full creation transcript as context. The subagent should see only what a real user would see: the skill and the trigger.
- Giving the subagent the skill's source code inline. Give a path; let it read.
- Forward-testing multiple skills in the same session. One skill per session or failure attribution becomes meaningless.

### Do

- Use the `task` (default worker) agent unless you have a specific reason for a specialist.
- Read the transcript before deciding pass/fail. Look for: did it read the skill, stop at approvals, respect boundaries, ask for things the default should handle.