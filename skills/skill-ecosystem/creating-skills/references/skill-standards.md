# Kimi Code Skill Standards

Structural and writing standards that every generated skill should follow.

## Frontmatter

- **`name`** — hyphen-case, lowercase letters/digits/hyphens, max 64 chars, matches directory name
- **`description`** — what the skill is for + when to use + concrete trigger phrases. Avoid embedding workflow summaries; the description helps Kimi decide whether to load the skill, not serve as a shortcut for the body
- **`metadata`** (optional) — product-specific metadata if needed

## SKILL.md Body

- Imperative form: "Parse the file", "Validate input". Avoid second person.
- Keep focused; move heavy reference to `references/`.
- Use code examples for technical skills.
- Include "When NOT to use" if boundaries matter.
- Authoritative `SKILL.md` in English by default. Generate `SKILL.<lang>.md` copies only when needed.

## Boundaries & Defaults (declare near top of SKILL.md)

- **Can do** — concrete capabilities.
- **Cannot do (without explicit approval)** — operations the skill must never auto-perform.
- **Default behavior** — read-only by default, what needs confirmation, forbidden assumptions.

Also document: required tools/versions/auth scopes; default values and override rules; approval points; forbidden assumptions.

## Directory & Resource Rules

- Only create resource directories actually used.
- Do not create README.md, CHANGELOG.md, or other auxiliary docs.
- `scripts/` — executable helpers, tested, executable bit set.
- `references/` — on-demand docs referenced from SKILL.md.
- `assets/` — templates, images, boilerplate used in output.

## Cross-Referencing Other Skills

- Reference by skill name: `Use superpowers:test-driven-development`.
- Do not use `@` links (force-loads files).
- Mark clearly when a sub-skill is required.

## Naming Rules

- Lowercase letters, digits, hyphens only.
- No leading/trailing hyphens, no consecutive hyphens.
- Folder name matches skill `name`.
- Prefer verb-led names for process skills; noun/domain for reference skills.

## What NOT to Create

Do not create skills for: one-off solutions; project-specific conventions (use `CLAUDE.md` / `AGENTS.md` instead); things enforceable by simple validation (automate those instead).