[中文](../README.md) | **English** | [日本語](./README.ja.md)

# skills

> A JavaScript project by xiehuacheng.

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## Table of Contents

- [Installation](#installation)
- [Skill 介绍](#skill-介绍)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install with a single sentence to your agent:

```text
帮我安装这个仓库下的所有 skill： xiehuacheng/skills@hot-skills
```

Or:

```text
帮我从这个仓库安装 skill： xiehuacheng/skills@hot-skills
只安装：（你想要安装的 skill 名称）
```

Or use the [skills.sh](https://skills.sh/) CLI directly:

```bash
npx skills add xiehuacheng/skills@hot-skills
```

For local testing, you can also specify a path directly:

```bash
npx skills add /path/to/skills@hot-skills
```

## Skill 介绍

### hot-skills

[`hot-skills`](./skills/hot-skills) is used to discover currently popular Agent Skills. It aggregates signals from multiple data sources:

- **[agentskills.media](https://agentskills.media)** — GitHub stars and categories
- **skills-rank.com** — per-skill ranking score
- **skills.sh** — real install counts (scraped from the public leaderboard via a headless browser)

Supports filtering by category and alias, keyword search, viewing the 24-hour trending list, and JSON output; it deduplicates precisely by `owner/repo@skill-name` and merges multi-source metrics. Great for answering questions like “What hot skills are there right now?” and “What are the popular front-end skills?”

### init-llm-wiki

[`init-llm-wiki`](./skills/init-llm-wiki) helps users quickly bootstrap and maintain a Karpathy-style LLM Wiki for a new domain.

It follows the Google Cloud Open Knowledge Format (OKF) v0.1 with an Obsidian-first approach: it auto-generates the `00-Raw/`, `01-Wiki/`, `02-Areas/` (or `02-Module/`) directories, creates the root `index.md`, `log.md`, and agent schema docs, and unifies frontmatter and `[[wikilink]]` linking conventions. The ingest workflow emphasizes discussing key takeaways with the user first, then planning the page structure, so curation doesn't become a batch process.

### github-asset-manager

[`github-asset-manager`](./skills/github-asset-manager) is used to organize and improve GitHub digital assets.

It reads data via the GitHub CLI or `GITHUB_TOKEN`, and provides several local analysis commands: analyze and categorize GitHub Stars, audit personal repository health, generate a GitHub Profile README, fill in descriptions and topics for a given repository, and organize Stars into GitHub Lists. All write operations require explicit user confirmation; by default it only outputs structured Markdown reports.

### creating-skills

[`creating-skills`](./skills/creating-skills) is used to create new Agent Skills.

It helps users clarify a skill's scenario, trigger timing, and scope through collaborative brainstorming, provides naming and structure suggestions, and pauses at every key decision point for user confirmation. It emphasizes progressive disclosure, human-in-the-loop decisions, and skill workflows where scripts are composed via stdin/stdout rather than generating intermediate files.

## Contributing

New skills and improvements to existing skills are welcome. Each skill should be placed in its own `skills/<skill-name>/` directory and include a `SKILL.md` documentation file.

## License

[MIT](./LICENSE)

> This is a translated version. For the authoritative content, please refer to README.md.
