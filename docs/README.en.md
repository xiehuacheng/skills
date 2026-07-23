[中文](../README.md) | **English** | [日本語](./README.ja.md)

# skills

> Agent Skills collection — a set of reusable AI capabilities that turn agents into domain experts.

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## Table of Contents

- [Installation](#installation)
- [Skill Introduction](#skill-introduction)
  - [Quick Index](#quick-index)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install with a single sentence to your agent:

```text
Please help me install all skills under this repository: xiehuacheng/skills@hot-skills
```

Or:

```text
Please help me install skills from this repository: xiehuacheng/skills@hot-skills
Only install: (the skill names you want)
```

Or use the [skills.sh](https://skills.sh/) CLI directly:

```bash
npx skills add xiehuacheng/skills@hot-skills
```

For local testing, you can also specify a path directly:

```bash
npx skills add /path/to/skills@hot-skills
```

## Skill Introduction

### Quick Index

| Skill | One-sentence intro | Typical scenario |
|-------|--------------------|------------------|
| [`creating-skills`](../skills/creating-skills/) | Create, improve, and validate Agent Skills. | You want to write a new skill. |
| [`hot-skills`](../skills/hot-skills/) | Discover currently popular Agent Skills. | You want to see what skills are trending. |
| [`skill-translator`](../skills/skill-translator/) | Translate a skill's `SKILL.md` between Chinese and English. | You need to maintain multilingual skills. |
| [`effort-audit`](../skills/effort-audit/) | Check whether the current task drifts from your long-term direction. | You want to confirm whether something is worth doing. |
| [`go-goal-go`](../skills/go-goal-go/) | Help you write verifiable `/goal` objectives. | You want to hand a multi-turn task to an agent to run autonomously. |
| [`ask-for-tools`](../skills/ask-for-tools/) | Proactively ask for tools when the agent hits a tool boundary. | The agent is missing a tool or permission. |
| [`github-asset-manager`](../skills/github-asset-manager/) | Organize GitHub Stars, repositories, and READMEs. | Manage your GitHub digital assets. |
| [`cv-builder`](../skills/cv-builder/) | Generate tech resumes/CVs from projects, GitHub, and old resumes. | You need to write or update your resume. |
| [`cv-clone`](../skills/cv-clone/) | Clone the visual layout of a target resume sample into an editable LaTeX template. | You found a sample you like and want the same layout. |
| [`init-llm-wiki`](../skills/init-llm-wiki/) | Bootstrap and maintain a Karpathy-style LLM Wiki. | You want to build a wiki for a new domain. |

Detailed descriptions for each skill are given below in alphabetical order.

### ask-for-tools

[`ask-for-tools`](../skills/ask-for-tools/) is used to proactively ask the user for tools when the agent hits a tool boundary, instead of pushing through blindly.

It triggers at the start of a new task or when execution gets stuck, first checking whether the required tool already exists. If it does not, it clearly explains the reason, the alternatives, and the three options: "provide the tool," "try a degraded approach," or "stop the task." It applies to MCP servers, CLI tools, Python/Node packages, API keys, system permissions, and local files.

### creating-skills

[`creating-skills`](../skills/creating-skills/) is used to create, improve, and validate Agent Skills.

It helps users clarify a skill's scenario, trigger timing, and scope through collaborative brainstorming, pauses at every key decision point for user confirmation, and actively challenges the weakest assumptions before approval. Beyond generating the `SKILL.md` and directory structure, it emphasizes: confirming the install location first, clearly stating capability boundaries and default behavior, providing an execution checklist and conversation pattern for the agent using the skill, documenting user approval points and expected output examples in `SKILL.md`, and validating skill quality via `quick_validate.py` and sub-agent end-to-end tests.

**v1.7.0** — added principle #10 "Measure the outcome, not the activity" plus three Step 5 anti-patterns: splitting to fake-shrink (moving content to references without reducing total volume), documenting unimplemented routes (describing features not in code), and embedding integration with other skills (explaining how this skill composes with siblings). These rules came from real session observations where content relocation was mistaken for compression.

### cv-builder

[`cv-builder`](../skills/cv-builder/) is used to build tech resumes or CVs.

It collects materials from local projects, GitHub repositories, existing resume files, or plain-text notes; uses sub agents to read and extract project highlights in parallel; guides the user through confirming personal info, career goals, experience, and skills; and finally generates a Markdown draft that can be rendered into HTML/PDF. Supports built-in templates such as modern, classic, and minimal, as well as custom templates or agent-generated styles based on user descriptions.

### cv-clone

[`cv-clone`](../skills/cv-clone/) clones the visual layout of a target resume or CV sample and emits an editable LaTeX template.

Given a sample resume (PDF or screenshot), it produces a compilable LaTeX template (built on `tectonic` / `xelatex`) with `\newcommand` placeholders. By default it does NOT pre-fill real content — it generates the template, asks the user to confirm, and only then unlocks the fill workflow. macOS is the primary target; the `SKILL.md` documents `apt`/`scoop` paths for Linux and Windows. The skill is standalone — it does not depend on or compose with any other skill in this repo.

**v0.3.0** — removed unimplemented Routes A/C and cv-builder integration content (skills stay independent). Total `SKILL.md` + `references/` shrank from 3509 → 1765 words (−50%).

**v0.4.0** — added standard Can do / Cannot do / Default declarations (content boundaries, write gates, default dry-preview behavior).
It collects materials from local projects, GitHub repositories, existing resume files, or plain-text notes; uses sub agents to read and extract project highlights in parallel; guides the user through confirming personal info, career goals, experience, and skills; and finally generates a Markdown draft that can be rendered into HTML/PDF. Supports built-in templates such as modern, classic, and minimal, as well as custom templates or agent-generated styles based on user descriptions.

### effort-audit

[`effort-audit`](../skills/effort-audit/) is used to automatically check whether the current project or task aligns with the user's long-term direction.

At the start of a project conversation, it automatically reads the personal direction configuration from `~/.config/effort-audit/profile.md` and judges whether the current task drifts. If the drift reaches moderate or above, it pauses, lists the specific reasons, and offers options such as "continue," "adjust direction," or "park for later," helping the user pull focus back to the main area. On first use, it generates the personal direction configuration through a one-time interview.

### github-asset-manager

[`github-asset-manager`](../skills/github-asset-manager/) is used to organize and improve GitHub digital assets.

It reads data via the GitHub CLI or `GITHUB_TOKEN`, and provides several local analysis commands: analyze and categorize GitHub Stars, audit personal repository health, generate a GitHub Profile README, polish repository READMEs, generate multilingual READMEs, fill in descriptions and topics for a given repository, and organize Stars into GitHub Lists. It checks authentication and permission scopes before use, shows generated content to the user, and requires explicit user confirmation for all write operations (updating About, pushing READMEs, applying Star Lists); by default it only outputs structured Markdown reports.

### go-goal-go

[`go-goal-go`](../skills/go-goal-go/) helps users turn rough intentions into concrete `/goal` objectives that can run autonomously across many turns.

It evaluates whether a task is a good fit for goal mode, proactively suggests `/goal` when the task is multi-turn, repeatable, and verifiable, and drafts goal wording together with the user: end state, proof, boundaries, loop strategy, and stop rule. It can also add an optional section that explicitly names the skills and system tools to use inside the loop. If a task is ill-suited for goal mode, it pushes back honestly and explains why.

### hot-skills

[`hot-skills`](../skills/hot-skills/) is used to discover currently popular Agent Skills. It aggregates signals from multiple data sources:

- **[agentskills.media](https://agentskills.media)** — GitHub stars and categories
- **skills-rank.com** — per-skill ranking score
- **skills.sh** — real install counts (scraped from the public leaderboard via a headless browser)

Supports filtering by category and alias, keyword search, viewing the 24-hour trending list, and JSON output; it deduplicates precisely by `owner/repo@skill-name` and merges multi-source metrics. Great for answering questions like "What hot skills are there right now?" and "What are the popular front-end skills?"

### init-llm-wiki

[`init-llm-wiki`](../skills/init-llm-wiki/) helps users quickly bootstrap and maintain a Karpathy-style LLM Wiki for a new domain.

It follows the Google Cloud Open Knowledge Format (OKF) v0.1 with an Obsidian-first approach: it auto-generates the `00-Raw/`, `01-Wiki/`, `02-Areas/` (or `02-Module/`) directories, creates the root `index.md`, `log.md`, and agent schema docs, and unifies frontmatter and `[[wikilink]]` linking conventions. The ingest workflow emphasizes discussing key takeaways with the user first, then planning the page structure, so curation doesn't become a batch process.

### skill-translator

[`skill-translator`](../skills/skill-translator/) translates a skill's `SKILL.md` from its source language into a target language, overwriting the original file. It supports Chinese (`zh-CN`) and English (`en`).

It parses natural-language requests to identify the target skill and target language, detects the source language, translates the `description` frontmatter and body while preserving untranslatable elements such as code blocks, file paths, command names, technical identifiers, and URLs, and validates the result with `scripts/quick_validate.py`. The final write happens only after the user confirms the translated content.

## Contributing

New skills and improvements to existing skills are welcome. Each skill should be placed in its own `skills/<skill-name>/` directory and include a `SKILL.md` documentation file.

## License

[MIT](../LICENSE)
