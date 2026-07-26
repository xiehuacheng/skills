---
name: skill-translator
description: Translate a skill's SKILL.md between Chinese (zh-CN) and English (en). Auto-detect the source language and overwrite SKILL.md with the target language. Trigger when the user asks to translate a skill in natural language, such as "translate ask-for-tools to English" or "把 go-goal-go 翻译成中文".
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# skill-translator

Translate a skill's `SKILL.md` from its source language into a target language, overwriting the original file. Supports Chinese (`zh-CN`) and English (`en`).

## Can do

- Parse a user's natural-language request to identify the target skill and target language.
- Read the source `SKILL.md` from a skill directory.
- Detect the source language (Chinese or English).
- Translate the `description` frontmatter and the body into the target language.
- Preserve untranslatable elements: code blocks, file paths, command names, technical identifiers, URLs, and the `name` frontmatter.
- Validate the resulting `SKILL.md` with `scripts/quick_validate.py`.

## Cannot do without explicit approval

- Batch-translate every skill in a directory.
- Translate files other than `SKILL.md`.
- Automatically infer the target language; the user must confirm it.

## Default behavior

- Activation is conversational: the user says something like "translate ask-for-tools to English".
- If the request is ambiguous, ask for the skill name and target language with `AskUserQuestion`.
- If the source language equals the target language, stop and report the mismatch.
- The final write happens only after the user confirms the translated content.

## When to use

Trigger this skill when the user:

- Says "translate `<skill>` to English/Chinese".
- Says "把 `<skill>` 翻译成英文/中文".
- Asks to localize or internationalize an existing skill.
- Wants to migrate a legacy Chinese skill to English while keeping the original.

## When NOT to use

Do not trigger this skill for:

- Creating a new skill from scratch (use `creating-skills`).
- Translating project READMEs or other documentation (only `SKILL.md` is supported).
- Tasks that do not involve a skill's `SKILL.md`.

## Workflow

1. **Parse the request.** Extract the target skill name and target language from natural language. If unclear, ask.
2. **Locate the skill.** Find `<skill-dir>/SKILL.md`.
3. **Detect source language.** Run `scripts/translate_skill.py --detect <skill-dir>`.
4. **Validate direction.** If source language equals target language, stop and explain.
5. **Translate.** Use the LLM to translate the `description` frontmatter and body, preserving untranslatable elements.
6. **Show the result.** Present the translated `SKILL.md` to the user and walk through key changes.
7. **Write on approval.** Write the translated content to `<skill-dir>/SKILL.md`.
8. **Validate.** Run `scripts/quick_validate.py <skill-dir>` and fix any issues.

## Script usage

### Detect source language

```bash
python scripts/translate_skill.py --detect <skill-dir>
```

Output: `zh-CN` or `en`.

## Translation rules

- **Translate:** body text, section headings, list items, `description` frontmatter.
- **Do not translate:**
  - `name` frontmatter
  - Code blocks and inline code
  - File paths and directory names
  - Command names and CLI flags
  - Technical identifiers (variable names, JSON keys, function names)
  - URLs and links

## Error handling & edge cases

- **Skill not found:** Report the missing directory and stop.
- **Source language unclear:** Ask the user to confirm before proceeding.
- **Source equals target:** Stop and explain that no translation is needed.
- **Validation fails after write:** Report the issue and offer to fix it.

## Remaining assumptions

1. The source `SKILL.md` is written primarily in one language (Chinese or English), not heavily mixed.
2. The user accepts that the translated `SKILL.md` overwrites the original file without keeping a language-suffixed backup.
3. The LLM translation is accurate enough for agent instructions; critical skills may still need human review.
