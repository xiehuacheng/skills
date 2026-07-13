const { parseAgentskills } = require('./parse-agentskills');
const { parseSkillsRank, parseSkillsRankDetails } = require('./parse-skillsrank');
const { parseSkillsSh } = require('./parse-skillssh');
const { dedupeAndMerge, sortByHotScore } = require('./dedupe');
const { getCachedData, saveCachedData } = require('./cache');
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
  --refresh, -r             Force refresh data (ignore cache)
  --json, -j                Output raw JSON instead of markdown
  --help, -h                Show this help

Examples:
  node scripts/fetch-trends.js
  node scripts/fetch-trends.js --top 10
  node scripts/fetch-trends.js --category frontend
  node scripts/fetch-trends.js --search "react testing"
  node scripts/fetch-trends.js --refresh --json
`);
}

async function fetchAllData() {
  console.error('Fetching data from agentskills.media...');
  const agentskillsPromise = parseAgentskills().catch(err => {
    console.error('agentskills.media failed:', err.message);
    return [];
  });

  // Await agentskills first because skills-rank detail fetch needs the repo list.
  const agentskills = await agentskillsPromise;

  console.error('Fetching data from skills-rank.com leaderboard API...');
  const skillsrankPromise = parseSkillsRank().catch(err => {
    console.error('skills-rank.com failed:', err.message);
    return [];
  });

  console.error('Fetching data from skills-rank.com search API (top repos)...');
  const skillsrankDetailsPromise = parseSkillsRankDetails(agentskills, { maxRepos: 40 }).catch(err => {
    console.error('skills-rank.com detail fetch failed:', err.message);
    return [];
  });

  console.error('Fetching data from skills.sh (this may take a while)...');
  const skillsshPromise = parseSkillsSh().catch(err => {
    console.error('skills.sh failed:', err.message);
    return [];
  });

  const [skillsrank, skillsrankDetails, skillssh] = await Promise.all([
    skillsrankPromise,
    skillsrankDetailsPromise,
    skillsshPromise
  ]);

  return { agentskills, skillsrank, skillsrankDetails, skillssh };
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
  // Sum installs of all individual skills under the same repo.
  // This allows repo-level skills (e.g. obra/superpowers@superpowers) to show
  // the combined install count of the whole repository.
  const map = new Map();
  for (const item of detailItems) {
    if (!item.installs) continue;
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    if (!repoKey) continue;
    map.set(repoKey, (map.get(repoKey) || 0) + item.installs);
  }
  return map;
}

function applyAggregatedInstalls(agentskills, repoInstallsMap) {
  return agentskills.map(item => {
    const repoKey = (item.full_name || item.id || '').toLowerCase();
    // Only apply to repo-level skills where the skill name equals the repo name
    const isRepoLevel = item.name && item.repo && item.name === item.repo;
    if (isRepoLevel && repoInstallsMap.has(repoKey)) {
      return {
        ...item,
        skill_id: item.skill_id || `${item.full_name}@${item.name}`,
        installs: repoInstallsMap.get(repoKey),
        install_source: 'skills-rank.com (aggregated from individual skills)',
        sources: Array.from(new Set([...(item.sources || [item.source]), 'skills-rank.com']))
      };
    }
    return item;
  });
}

const CATEGORY_ALIASES = {
  frontend: ['Web Dev', 'UI/UX'],
  ui: ['UI/UX', 'Web Dev'],
  design: ['UI/UX', 'Web Dev'],
  react: ['Web Dev', 'UI/UX'],
  testing: ['Testing'],
  test: ['Testing'],
  security: ['Security'],
  devops: ['DevOps'],
  docker: ['DevOps'],
  kubernetes: ['DevOps'],
  k8s: ['DevOps'],
  agent: ['AI Agents'],
  agents: ['AI Agents'],
  memory: ['Knowledge', 'AI Agents'],
  knowledge: ['Knowledge'],
  prompt: ['Prompts'],
  prompts: ['Prompts'],
  doc: ['Docs'],
  docs: ['Docs'],
  documentation: ['Docs'],
  automation: ['Automation'],
  search: ['Search'],
  integration: ['Integrations'],
  integrations: ['Integrations'],
  data: ['Data'],
  review: ['Review'],
  planning: ['Planning'],
  game: ['Game Dev'],
  gamedev: ['Game Dev'],
  writing: ['Writing'],
  code: ['Code Gen'],
  codegen: ['Code Gen'],
  general: ['General'],
  awesome: ['Awesome List']
};

function filterByCategory(items, category) {
  const query = category.toLowerCase().trim();
  const matchedCategories = new Set(CATEGORY_ALIASES[query] || [query]);

  return items.filter(item => {
    // Match normalized categories
    const categoryMatch = item.categories && item.categories.some(c =>
      Array.from(matchedCategories).some(mc => c.toLowerCase().includes(mc.toLowerCase()))
    );

    // Also match name/description/topics against the query directly
    const text = [
      item.name,
      item.full_name,
      item.description,
      ...(item.topics || []),
      ...(item.categories || [])
    ].join(' ').toLowerCase();
    const textMatch = text.includes(query);

    return categoryMatch || textMatch;
  });
}

function filterBySearch(items, query) {
  const q = query.toLowerCase();
  return items.filter(item => {
    const text = [
      item.name,
      item.full_name,
      item.description,
      ...(item.topics || []),
      ...(item.categories || [])
    ].join(' ').toLowerCase();
    return text.includes(q);
  });
}

async function main() {
  const options = parseArgs();
  
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
    const repoInstallsMap = aggregateRepoInstalls(enrichedSkillsRankDetails);
    const enrichedAgentskills = applyAggregatedInstalls(fetched.agentskills, repoInstallsMap);

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
      skillsrankDetails: fetched.skillsrankDetails.length,
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
