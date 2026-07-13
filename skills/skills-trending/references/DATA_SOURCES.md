# Data Sources

`skills-trending` aggregates data from the following sources:

## 1. agentskills.media

- **URL**: https://agentskills.media/
- **Data**: GitHub stars, categories, descriptions
- **API**: Raw JSON from https://raw.githubusercontent.com/jaychempan/Agent-Leaderboard/main/data/data.json
- **Update frequency**: Daily
- **Coverage**: 2,300+ skill repositories

## 2. skills-rank.com

- **URL**: https://skills-rank.com/
- **Data**: Individual skill install counts, descriptions
- **API**: HTML page parsing (no official API)
- **Update frequency**: Unknown
- **Coverage**: Top ~150 individual skills (first 3 pages)

## 3. skills.sh

- **URL**: https://skills.sh/
- **Data**: Real install counts (installs)
- **API**: `npx skills find <query>` CLI
- **Update frequency**: Real-time
- **Coverage**: Vercel skills registry

## Notes

- Data from all sources is cached locally for 1 hour by default to avoid rate limits.
- A skill's "hot score" is a log-scaled weighted combination of GitHub stars and install counts.
- Skills from `skills-rank.com` and `skills.sh` inherit repo-level stars from `agentskills.media` when available, so individual skills can have both metrics.
- Some skills may appear in multiple sources with slightly different names; we normalize by `owner/repo@skill-name`.
