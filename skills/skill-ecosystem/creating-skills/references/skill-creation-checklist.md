# Skill Creation Anti-Patterns

Where `skill-standards.md` and `core-principles.md` describe the *correct* shape, this file lists **Don't** anti-patterns — observed failures from real creation sessions. Read at each Step → Next-Step transition.

> The "Do" patterns live in `core-principles.md`. The forward-test / subagent delegation details live in `waiting-and-forward-test.md`.

---

## Step 1 · Explore & Brainstorm

- **Asking too many questions.** If you have asked 4+ multiple-choice questions and the user has answered "either way is fine" at least once, you are over-asking. Synthesize what you have, write an AS-IS / TO-BE diff, and ask one binary question: "Does this match your intent?"
- **Defaulting to your own language.** Just because the user is speaking Chinese with you, the skill must default to English (per `skill-standards.md`). Confirm at Step 2 if uncertain.
- **Skipping pre-flight reads.** The SKILL.md has a "Mandatory pre-flight" block at the top. If you write SKILL.md without first reading `skill-standards.md`, you will write it wrong.
- **Proceeding without asking about scope.** "Just do it for me" is not an answer to "What are the scope boundaries?"

## Step 2 · Define Scope & Triggers

- **Embedding scope text inside the AskUserQuestion prompt.** Users can't easily edit text that lives inside the question UI. Present scope first as plain text, then ask for approval.
- **Writing `description` fields that summarize the workflow.** Per `skill-standards.md`, the `description` triggers discovery — never outline the steps. If the description reads like a tutorial, agents will follow it instead of reading the body.
- **Promising "include everything".** Push back. Broad scopes need risk tiers — propose T1 / T2 / T3 narrowing and confirm.

## Step 3 · Choose Name & Structure

- **Producing more naming options after a rejection.** A rejected name usually signals a misunderstood tone. Go back to Step 1 and ask about tone before re-proposing names.
- **Creating `assets/`, `scripts/`, `references/` directories you don't need.** Each unused directory is a maintenance burden. Use only what you actually need.
- **Picking install location without asking.** User-level vs project scope is a 5-minute mistake to debug later. Always confirm.

## Step 4 · Design Data Flow

- Writing intermediate files when stdin/stdout compose. `cmd1 | cmd2` beats `cmd1 > tmp.json && cmd2 < tmp.json`.
- Forgetting to specify what happens on script failure (exit code, error JSON, log path).

## Step 5 · Draft SKILL.md

- **Writing to disk before approval.** Step 5's whole job is to land content in the chat. The user reads, edits, approves. Disk writes come in Step 6.
- **Drafting in a non-English language by default.** If the user explicitly requested another language, do that. Otherwise English.
- **Apologizing for length / repeating facts in different words.** Each unique fact should appear once; cross-reference rather than restate. Cut filler, not real guidance.
- **Splitting to fake-shrink.** Moving content from `SKILL.md` to `references/` to clear a word-count warning is cosmetic, not compression. Verify total `SKILL.md + references/` volume actually decreased.
- **Documenting unimplemented routes.** `references/` describing features that do not exist in code misleads the agent into attempting them. Either build the feature or do not reference it.
- **Embedding integration with other skills.** A skill should not describe how it composes with a sibling skill. Integration belongs at the orchestrator layer; each skill stays focused on its own scope.

## Step 6 · Implement

- Running multiple `init_skill.py` scaffolds in the same session and losing track of which path they created.
- Replacing the generated `SKILL.md` with the wrong draft (e.g., a version you already revised in chat). Re-read the latest draft into context before `cp`.
- Forgetting `chmod +x` on `scripts/` executables. The skill ships half-broken.

## Step 7 · Validate & Iterate

- **Treating "I ran it myself" as a forward-test.** Reading the skill is not testing the skill. Forward-testing means a *clean* subagent (no creation history) gets only the skill path + a user request. Full protocol: `references/waiting-and-forward-test.md`.
- **Patching the test or rewriting expectations to match what came out.** If a clean subagent misbehaves, the **skill** is wrong.
- **Skipping the forward-test when "the validation script passed".** The validation script checks structure, not behavior.

---

## Cross-cutting · TodoList

- Marking tasks `in_progress` and leaving them through a long wait. **The user's silence is not "in progress".** Use `drop`, or remove the task entirely until work resumes.
- Re-`init`-ing the TodoList every turn. `init` replaces the list, losing structure. Use `done` / `start` to advance.
- Passing nested arrays as `items`. Format is `{ phase: string, items: string[] }`. Each `items` entry must be a flat string.

## Cross-cutting · Asking vs Doing

- **Acting before approval.** "I'll get started by drafting a SKILL.md" is fine; running `init_skill.py` is not.
- Treating "the user is busy, let me draft something for them to review later" as a shortcut. The cost of an unwanted file is bigger than the cost of waiting.
- Default is read-only / observation / report status. The default is *not* "make something useful".