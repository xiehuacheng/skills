---
name: skills-trending
description: Discover trending and hot Agent Skills across multiple leaderboards (agentskills.media, skills-rank.com, skills.sh). Summarize, categorize, and compare rankings. Use when the user asks about popular skills, hot skills, or wants to find skills by category.
---

# Skills Trending

This skill helps you discover trending and hot Agent Skills by aggregating data from multiple sources:

- **agentskills.media** — GitHub stars and categories
- **skills-rank.com** — Individual skill ranking scores
- **skills.sh** — Real install counts

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

## Tips

- If data seems stale, add `--refresh`.
- Category filtering supports partial matches (e.g., `--category frontend` matches "Web Dev" and "UI/UX").
- The first `--refresh` may take 30–60 seconds because data is fetched from several upstream APIs.
- `--trending` requires the Python/Playwright environment; other commands do not.
