const { parseAgentskills } = require('./parse-agentskills');
const { parseSkillsShTrending } = require('./parse-skillssh-trending');
const { formatNumber } = require('./format');

async function enrichTrendingWithStars(trendingItems) {
  console.error('Fetching agentskills.media stars for trending items...');
  const agentskills = await parseAgentskills().catch(err => {
    console.error('agentskills.media failed:', err.message);
    return [];
  });

  const repoStarsMap = new Map();
  for (const item of agentskills) {
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    if (repoKey && item.stars && item.stars > 0) {
      repoStarsMap.set(repoKey, item.stars);
    }
  }

  return trendingItems.map(item => {
    const repoKey = (item.full_name || '').toLowerCase();
    const stars = repoStarsMap.get(repoKey) || 0;
    return { ...item, stars };
  });
}

function formatTrendingTable(items, topN = 20) {
  const topItems = items.slice(0, topN);

  let output = `## Top ${topN} skills.sh Trending (24h)\n\n`;
  output += '| Trending Rank | Skill | Stars | 24h Installs | Global Rank |\n';
  output += '|--------------:|------|------:|-------------:|------------:|\n';

  topItems.forEach((item, index) => {
    const trendingRank = index + 1;
    const globalRank = item.rank || '-';
    const name = item.skill_id || `${item.full_name}@${item.name}` || item.full_name || item.name;
    const stars = formatNumber(item.stars);
    const installs = formatNumber(item.installs);
    output += `| ${trendingRank} | \`${name}\` | ${stars} | ${installs} | ${globalRank} |\n`;
  });

  return output;
}

async function fetchTrendingData() {
  const trendingItems = await parseSkillsShTrending();
  return enrichTrendingWithStars(trendingItems);
}

module.exports = {
  enrichTrendingWithStars,
  formatTrendingTable,
  fetchTrendingData
};
