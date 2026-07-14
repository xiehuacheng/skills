const { parseAgentskills } = require('./parse-agentskills');
const { parseSkillsRank, parseSkillsRankDetails } = require('./parse-skillsrank');
const { parseSkillsShLeaderboard } = require('./parse-skillssh-leaderboard');
const { dedupeAndMerge, sortByHotScore } = require('./dedupe');
const { getCachedData, saveCachedData } = require('./cache');
const { filterByCategory, filterBySearch } = require('./categories');
const { fetchTrendingData, formatTrendingTable } = require('./trending');
const {
  formatTopTable,
  formatByCategory,
  formatSearchResults
} = require('./format');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    top: 20,
    category: null,
    search: null,
    trending: false,
    refresh: false,
    json: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--top':
      case '-n':
        options.top = parseInt(args[++i], 10) || 20;
        break;
      case '--category':
      case '-c':
        options.category = args[++i];
        break;
      case '--search':
      case '-s':
        options.search = args[++i];
        break;
      case '--trending':
      case '-t':
        options.trending = true;
        break;
      case '--refresh':
      case '-r':
        options.refresh = true;
        break;
      case '--json':
      case '-j':
        options.json = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function printHelp() {
  console.log(`
Usage: node scripts/fetch-trends.js [options]

Options:
  --top, -n <number>        Number of top skills to show (default: 20)
  --category, -c <category> Filter by category (e.g., frontend, testing, security)
  --search, -s <query>      Search skills by keyword
  --trending, -t            Show skills.sh 24h trending (headless browser)
  --refresh, -r             Force refresh data (ignore cache)
  --json, -j                Output raw JSON instead of markdown
  --help, -h                Show this help

Examples:
  node scripts/fetch-trends.js
  node scripts/fetch-trends.js --top 10
  node scripts/fetch-trends.js --category frontend
  node scripts/fetch-trends.js --search "react testing"
  node scripts/fetch-trends.js --trending --top 20
  node scripts/fetch-trends.js --refresh --json
`);
}

async function fetchAllData() {
  console.error('Fetching data from agentskills.media, skills-rank.com leaderboard, and skills.sh in parallel...');

  // These three sources are independent; start them concurrently.
  const agentskillsPromise = parseAgentskills().catch(err => {
    console.error('agentskills.media failed:', err.message);
    return [];
  });

  const skillsrankPromise = parseSkillsRank().catch(err => {
    console.error('skills-rank.com failed:', err.message);
    return [];
  });

  const skillsshPromise = parseSkillsShLeaderboard().catch(err => {
    console.error('skills.sh failed:', err.message);
    return [];
  });

  // skills-rank.com detail fetch needs the repo list from agentskills.media.
  const agentskills = await agentskillsPromise;

  console.error('Fetching data from skills-rank.com search API (top repos)...');
  const skillsrankDetailsPromise = parseSkillsRankDetails(agentskills, { maxRepos: 30 }).catch(err => {
    console.error('skills-rank.com detail fetch failed:', err.message);
    return [];
  });

  // Fallback: as soon as the first detail pass finishes, search high-starred
  // repos that still lack installs. This runs concurrently with skills.sh.
  const missingDetailsPromise = (async () => {
    const details = await skillsrankDetailsPromise;
    const repoStarsMap = buildRepoStarsMap(agentskills);
    const enrichedDetails = enrichWithRepoStars(details, repoStarsMap);
    const repoInstalls = aggregateRepoInstalls(enrichedDetails);

    const searchedRepoKeys = new Set(
      agentskills
        .filter(repo => repo.stars > 0)
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 30)
        .map(repo => (repo.full_name || repo.id || '').toLowerCase())
    );

    const missingRepos = findReposMissingInstalls(
      agentskills,
      repoInstalls.installs,
      searchedRepoKeys,
      { minStars: 10_000, maxRepos: 15 }
    );

    if (missingRepos.length > 0) {
      console.error(`Searching skills-rank.com for ${missingRepos.length} repos still missing installs...`);
      return parseSkillsRankDetails(missingRepos, { maxRepos: missingRepos.length }).catch(err => {
        console.error('skills-rank.com missing-installs search failed:', err.message);
        return [];
      });
    }
    return [];
  })();

  const [skillsrank, skillsrankDetails, skillssh, missingDetails] = await Promise.all([
    skillsrankPromise,
    skillsrankDetailsPromise,
    skillsshPromise,
    missingDetailsPromise
  ]);

  return { agentskills, skillsrank, skillsrankDetails: [...skillsrankDetails, ...missingDetails], skillssh };
}

function buildRepoStarsMap(agentskills) {
  // agentskills.media reports stars at the repo level. Build a lookup so that
  // individual skills from skills-rank.com / skills.sh can inherit the repo's stars.
  const map = new Map();
  for (const item of agentskills) {
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    if (repoKey && item.stars && item.stars > 0) {
      map.set(repoKey, item.stars);
    }
  }
  return map;
}

function enrichWithRepoStars(items, repoStarsMap) {
  return items.map(item => {
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    if (!item.stars && repoKey && repoStarsMap.has(repoKey)) {
      return { ...item, stars: repoStarsMap.get(repoKey) };
    }
    return item;
  });
}

function aggregateRepoInstalls(detailItems) {
  // Sum installs of all skills under the same repo.
  // This allows repo-level skills (e.g. obra/superpowers@superpowers) to show
  // the combined install count of the whole repository.
  const installs = new Map();
  const sources = new Map();
  for (const item of detailItems) {
    if (!item.installs) continue;
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    if (!repoKey) continue;
    installs.set(repoKey, (installs.get(repoKey) || 0) + item.installs);
    const repoSources = sources.get(repoKey) || new Set();
    if (item.source) repoSources.add(item.source);
    sources.set(repoKey, repoSources);
  }
  return { installs, sources };
}

function findReposMissingInstalls(agentskills, repoInstallsMap, searchedRepoKeys, options = {}) {
  const { minStars = 10_000, maxRepos = 20 } = options;

  return agentskills
    .filter(item => {
      if (!item.stars || item.stars < minStars) return false;
      const repoKey = (item.full_name || item.id || '').toLowerCase();
      if (!repoKey) return false;
      // Already found installs for this repo
      if (repoInstallsMap.has(repoKey)) return false;
      // Already searched this repo in the first pass
      if (searchedRepoKeys.has(repoKey)) return false;
      // Only repo-level skills (name matches repo)
      return item.name && item.repo && item.name === item.repo;
    })
    .sort((a, b) => b.stars - a.stars)
    .slice(0, maxRepos);
}

function applyAggregatedInstalls(agentskills, repoInstalls) {
  const { installs: repoInstallsMap, sources: repoSourcesMap } = repoInstalls;
  return agentskills.map(item => {
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    // Only apply to repo-level skills where the skill name equals the repo name
    const isRepoLevel = item.name && item.repo && item.name === item.repo;
    if (isRepoLevel && repoInstallsMap.has(repoKey)) {
      const contributingSources = Array.from(repoSourcesMap.get(repoKey) || new Set());
      return {
        ...item,
        skill_id: item.skill_id || `${item.full_name}@${item.name}`,
        installs: repoInstallsMap.get(repoKey),
        install_source: contributingSources.length
          ? `aggregated from ${contributingSources.join(' / ')}`
          : 'aggregated from individual skills',
        sources: Array.from(new Set([...(item.sources || [item.source]), ...contributingSources]))
      };
    }
    return item;
  });
}

async function main() {
  const options = parseArgs();

  if (options.trending) {
    let data = getCachedData(options.refresh, undefined, 'trending');
    let sourceInfo = { fromCache: true, trending: true };

    if (!data || !Array.isArray(data) || data.length === 0 || !data[0].rank) {
      data = await fetchTrendingData();
      saveCachedData(data, 'trending');
      sourceInfo = { fromCache: false, trending: true, total: data.length };
    }

    const filteredData = options.search ? filterBySearch(data, options.search) : data;

    if (options.json) {
      console.log(JSON.stringify({
        meta: { ...sourceInfo, timestamp: new Date().toISOString() },
        items: filteredData.slice(0, options.top)
      }, null, 2));
      return;
    }

    let output = `# Agent Skills Trending Report\n\n`;
    output += `*Generated at ${new Date().toLocaleString()}*\n\n`;
    if (sourceInfo.fromCache) {
      output += `> Data loaded from cache. Use \`--refresh\` to fetch latest.\n\n`;
    } else {
      output += `> Source: skills.sh 24h trending leaderboard (${sourceInfo.total} skills).\n\n`;
    }
    output += formatTrendingTable(filteredData, options.top);
    console.log(output);
    return;
  }

  let data = getCachedData(options.refresh);
  let sourceInfo = { fromCache: true };

  if (!data) {
    const fetched = await fetchAllData();

    // Inherit repo-level stars from agentskills.media for individual skills
    // that only have install counts from skills-rank.com or skills.sh.
    const repoStarsMap = buildRepoStarsMap(fetched.agentskills);
    const enrichedSkillsRank = enrichWithRepoStars(fetched.skillsrank, repoStarsMap);
    const enrichedSkillsRankDetails = enrichWithRepoStars(fetched.skillsrankDetails, repoStarsMap);
    const enrichedSkillsSh = enrichWithRepoStars(fetched.skillssh, repoStarsMap);

    // Aggregate installs from individual skill details back to repo-level skills.
    const repoInstalls = aggregateRepoInstalls([
      ...enrichedSkillsRankDetails,
      ...enrichedSkillsSh
    ]);
    const enrichedAgentskills = applyAggregatedInstalls(fetched.agentskills, repoInstalls);

    const allItems = [
      ...enrichedAgentskills,
      ...enrichedSkillsRank,
      ...enrichedSkillsRankDetails,
      ...enrichedSkillsSh
    ];
    data = sortByHotScore(dedupeAndMerge(allItems));
    saveCachedData(data);
    sourceInfo = {
      fromCache: false,
      agentskills: fetched.agentskills.length,
      skillsrank: fetched.skillsrank.length,
      skillsrankDetails: enrichedSkillsRankDetails.length,
      skillssh: fetched.skillssh.length,
      total: data.length
    };
  }
  
  let filteredData = data;
  
  if (options.category) {
    filteredData = filterByCategory(filteredData, options.category);
  }
  
  if (options.search) {
    filteredData = filterBySearch(filteredData, options.search);
  }
  
  if (options.json) {
    console.log(JSON.stringify({
      meta: {
        ...sourceInfo,
        timestamp: new Date().toISOString()
      },
      items: filteredData.slice(0, options.top)
    }, null, 2));
    return;
  }
  
  let output = `# Agent Skills Trending Report\n\n`;
  output += `*Generated at ${new Date().toLocaleString()}*\n\n`;
  
  if (sourceInfo.fromCache) {
    output += `> Data loaded from cache. Use \`--refresh\` to fetch latest.\n\n`;
  } else {
    output += `> Sources: agentskills.media (${sourceInfo.agentskills}), skills-rank.com leaderboard (${sourceInfo.skillsrank}), skills-rank.com details (${sourceInfo.skillsrankDetails}), skills.sh (${sourceInfo.skillssh}). Total unique: ${sourceInfo.total}\n\n`;
  }
  
  if (options.category) {
    const categories = options.category.split(',').map(c => c.trim());
    output += formatByCategory(filteredData, categories, options.top);
  } else if (options.search) {
    output += formatSearchResults(filteredData.slice(0, options.top), options.search);
  } else {
    output += formatTopTable(filteredData, options.top);
  }
  
  console.log(output);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
