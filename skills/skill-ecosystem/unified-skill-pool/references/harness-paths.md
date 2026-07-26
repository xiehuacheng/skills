# Known Harness Paths

The table below lists the user-level skills directory for every coding-agent harness this skill knows about. When adding a new harness to the pool, look it up here first; if it is not in the table, ask the user for the path and extend the table.

| Harness           | Path                                  | Notes                                                                |
|-------------------|---------------------------------------|----------------------------------------------------------------------|
| Claude Code       | `~/.claude/skills/`                   | Anthropic Claude Code                                                |
| Codex             | `~/.codex/skills/`                    | OpenAI Codex CLI                                                     |
| Kimi Code         | `~/.kimi-code/skills/`                | Also reads `~/.agents/skills/` natively (no symlink needed)          |
| OpenCode          | `~/.config/opencode/skills/`          | OpenCode CLI                                                         |
| oh-my-pi (omp)    | `~/.omp/skills/`                      | Pi fork; reads skills via `skill://` URI scheme                      |
| MiniMax mavis     | `~/.minimax/agents/mavis/skills/`     | MiniMax agent: mavis                                                 |
| MiniMax coder     | `~/.minimax/agents/coder/skills/`     | MiniMax agent: coder                                                 |
| MiniMax general   | `~/.minimax/agents/general/skills/`   | MiniMax agent: general                                               |
| MiniMax verifier  | `~/.minimax/agents/verifier/skills/`  | MiniMax agent: verifier                                              |

## How to extend this table

The table is currently scoped to the harnesses the author has installed. To add a new harness:

1. **Install the harness first.** Do not add aspirational future entries; the table reflects what is actually on the machine.
2. Add a new row to the table above.
3. Add the matching `KNOWN_HARNESSES` entry in `scripts/detect.sh` (same `name|path|notes` format).
4. Re-run `verify.sh` to confirm the path exists and the harness shows up as `pooled`.
5. Bump `metadata.version` in `SKILL.md` and reference the change in the commit message.

## When the user's path differs

If the user reports a path for a harness that is in this table but the path does not match the table entry (e.g. they have a custom install or a non-standard location):

1. **Trust the user.** Use the path they provided, not the table entry.
2. **Confirm in chat.** State: "I expected `<harness>` at `<table path>` but you said `<user path>`. I'll use the user path for this pool. Update the table?"
3. **Offer to update the table.** If the user expects this custom path to persist, update both this file and `scripts/detect.sh` so future runs use the right path.
4. **For one-off audits without updating the table**, pass the custom path directly: `scripts/verify.sh --harness <name>:<path>`. Ad-hoc entries are marked with a trailing `+` in the output, so you can tell at a glance which rows are not in the table.

## Notes on each harness

- **Kimi Code** is special: it reads `~/.agents/skills/` natively as a user-level location. After the first-time pool is set up, the `~/.kimi-code/skills/` symlink is technically redundant, but keeping it preserves the principle that every harness has the same user-skill dir layout.
- **MiniMax** does not have a single global user-skill directory. Instead, each agent (mavis, coder, general, verifier) has its own `skills/` subdirectory. Symlinking each agent's dir to canonical gives every agent the full pool.
- **oh-my-pi (omp)** stores skills under `~/.omp/skills/` (the directory was confirmed by reading binary strings; verify on first use).
- **Antigravity** also stores built-in skills at the same `~/.gemini/` root as Gemini CLI. Only the `antigravity/skills/` subdirectory is user-writable in practice.
- **Aider** historically did not have a dedicated skills directory; the `~/.aider/skills/` path is a conventional extension. If a user does not have that directory, the harness may use conventions files instead; do not assume.
- **Windsurf** paths have shifted between releases. If `~/.codeium/windsurf/skills/` does not exist, ask the user.

## Sources

- kimi-code official docs (skill scope paths: `KIMI_CODE_HOME/skills/` and `~/.agents/skills/`)
- oh-my-pi binary string extraction (path computed from `agentSubdir(A, "skills")`)
- MiniMax local runtime config (`/Users/orange/.minimax/config.yaml` + per-agent dirs)
- Cursor / Windsurf / Gemini CLI / Antigravity docs (user-level skill directory)
