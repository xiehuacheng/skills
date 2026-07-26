[中文](../README.md) | **English** | [日本語](./README.ja.md)

# skills

> Agent Skills collection — packaging domain experience into reusable AI capabilities.

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## Installation

Use the [skills.sh](https://skills.sh/) CLI:

```bash
npx skills add xiehuacheng/skills              # install all
npx skills add xiehuacheng/skills -s hot-skills # install one specific skill
npx skills add xiehuacheng/skills -l           # list without installing
```

Or ask your agent:

```
Please help me install skills from this repository: xiehuacheng/skills
```

## Categories

Skills are grouped by topic; each category has its own README:

- **[wiki/](../skills/wiki/README.md)** — Knowledge bases & notes
- **[skill-ecosystem/](../skills/skill-ecosystem/README.md)** — Skill engineering tools
- **[career/](../skills/career/README.md)** — Job search & resumes
- **[github/](../skills/github/README.md)** — GitHub digital assets
- **[workflow/](../skills/workflow/README.md)** — Workflow & goal management

> Categories are a repo-structure choice and do not affect the `npx skills add` command — the CLI scans recursively for `SKILL.md`.

## What These Skills Solve

**Skill engineering**

- Want to write a new skill but don't know where to start → [creating-skills](../skills/skill-ecosystem/creating-skills)
- Don't know what skills are trending now → [hot-skills](../skills/skill-ecosystem/hot-skills)
- Need to maintain a multilingual SKILL.md → [skill-translator](../skills/skill-ecosystem/skill-translator)

**Workflow & direction**

- New task is drifting off, can't keep going → [effort-audit](../skills/workflow/effort-audit)
- Multi-turn task with no clear "done" signal → [go-goal-go](../skills/workflow/go-goal-go)
- Agent missing a tool, pushing through anyway → [ask-for-tools](../skills/workflow/ask-for-tools)

**Personal output**

- Need to write or update a tech resume → [cv-builder](../skills/career/cv-builder)
- Found a sample resume and want the same layout → [cv-clone](../skills/career/cv-clone)
- GitHub Stars in chaos / repo README unwritten → [github-asset-manager](../skills/github/github-asset-manager)
- Need to bootstrap a Karpathy-style wiki for a new domain → [init-llm-wiki](../skills/wiki/init-llm-wiki)

## Contributing

New skills and improvements are welcome. Place each skill under its topic subdirectory, e.g. `skills/wiki/<skill-name>/`, with a `SKILL.md`. For a new topic, create a new subdirectory.

## License

[MIT](../LICENSE)
