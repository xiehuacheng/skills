---
name: hot-skills
description: Discover hot and trending Agent Skills across multiple leaderboards (agentskills.media, skills-rank.com, skills.sh). Summarize, categorize, and search. Use when the user asks about popular skills, hot skills, trending skills, or wants to find skills by category.
metadata:
  author: xiehuacheng
  version: "1.1.0"
---

# Hot Skills

This skill helps you discover trending and hot Agent Skills by aggregating data from multiple sources:

- **agentskills.media** — GitHub stars and categories
- **skills-rank.com** — Individual skill ranking scores
- **skills.sh** — Real install counts (fetched via headless browser from the public leaderboard)

## Boundaries and Defaults

**Can do:** aggregate and de-duplicate data from three public leaderboards; summarize top skills overall or by category; search by keyword; output JSON or human-readable text; force-refresh local cache; filter by category or alias.

**Cannot do (without explicit user approval):** install or modify any Agent Skill on the user's system; write to files outside the user's chosen `--output` directory; assume default categories or aliases without confirmation.

**Default behavior:** read-only — never writes unless `--output <dir>` is explicitly passed; uses cached data when fresh (`<1h` old) to avoid rate-limit issues; shows the data source and freshness on each command.

## When to Use

Use this skill when the user:

- Asks "现在有什么热门 skill？"
- Wants to find popular skills in a domain: "前端热门 skill"
- Asks "帮我搜一下 xxx 相关的 skill"

## How to Use

Run the main script from the skill directory:

```bash
node scripts/fetch-trends.js [options]
```

When this skill is installed via `npx skills add`, the skill directory is available at `.claude/skills/skills-trending/` (or the equivalent for your agent). Adjust the path accordingly.

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--top, -n` | Number of top skills to show | `--top 10` |
| `--category, -c` | Filter by category | `--category frontend` |
| `--search, -s` | Search by keyword | `--search "react testing"` |
| `--trending, -t` | Show skills.sh 24h trending (Playwright) | `--trending --top 10` |
| `--refresh, -r` | Force refresh data | `--refresh` |
| `--json, -j` | Output JSON | `--json` |

### Examples

```bash
# Top 20 hot skills overall
node scripts/fetch-trends.js

# Top 10 frontend skills
node scripts/fetch-trends.js --category frontend --top 10

# Search for testing skills
node scripts/fetch-trends.js --search testing

# Force refresh and output JSON
node scripts/fetch-trends.js --refresh --json

# Show skills.sh 24h trending
node scripts/fetch-trends.js --trending --top 10
```

## Output Format

The script outputs markdown tables by default. Present them cleanly to the user.

For each skill, include:
- Name
- Stars (from agentskills.media)
- Installs (from skills-rank.com / skills.sh)
- Hot score (combined ranking)
- Category
- One-line description

Each report ends with a quick install hint. You can install any listed skill with:

```bash
npx skills add <Skill>
```

Replace `<Skill>` with the value shown in the `Skill` column (e.g. `obra/superpowers@superpowers`).

## Common Categories

| Category | Aliases | Typical Queries |
|----------|---------|-----------------|
| Web Dev | `frontend`, `web`, `webdev`, `react`, `nextjs`, `typescript`, `css`, `tailwind` | Frontend frameworks, full-stack web skills |
| UI/UX | `ui`, `ux`, `design`, `design-system`, `accessibility` | Design systems, visual design, accessibility |
| Testing | `testing`, `test`, `jest`, `playwright`, `e2e` | Unit tests, e2e tests, QA |
| DevOps | `devops`, `docker`, `kubernetes`, `k8s`, `deploy`, `ci-cd` | Deployment, containers, CI/CD |
| Docs | `doc`, `docs`, `documentation`, `api-docs`, `changelog`, `readme` | README, changelog, documentation generation |
| Code Quality | `review`, `lint`, `refactor`, `best-practices`, `code-quality` | PR review, linting, refactoring |
| Automation | `automation`, `workflow`, `git`, `productivity` | Git workflows, task automation |
| AI Agents | `agent`, `agents`, `memory` | Agent frameworks, memory, planning |
| Knowledge | `knowledge` | Knowledge management, RAG |
| Prompts | `prompt`, `prompts` | Prompt engineering, optimization |
| Security | `security` | Security review, hardening |
| Data | `data` | Data analysis, visualization |
| Integrations | `integration`, `integrations` | Third-party tool integrations |
| Search | `search` | Search capabilities |
| Planning | `planning` | Task planning, project management |
| Game Dev | `game`, `gamedev` | Game development |
| Writing | `writing` | Writing, content generation |
| Code Gen | `code`, `codegen` | Code generation |
| Awesome List | `awesome` | Curated awesome lists |
| General | `general` | General-purpose skills |

## Tips

- If data seems stale, add `--refresh`.
- Category filtering supports partial matches and aliases (e.g., `--category frontend` matches "Web Dev" and "UI/UX").
- Use specific keywords when searching: `--search "react testing"` works better than `--search testing`.
- The first `--refresh` may take 30–60 seconds because data is fetched from several upstream sources (including a headless browser pass for skills.sh).
- `--trending` and the default top-skills fetch both require the Python/Playwright environment for skills.sh data.
