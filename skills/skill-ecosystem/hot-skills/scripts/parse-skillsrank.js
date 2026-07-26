const SKILLS_RANK_API = 'https://skills-rank.com/api';
const DEFAULT_LEADERBOARD_ITEMS = 150;
const DEFAULT_DETAIL_REPOS = 30;
const DETAIL_CONCURRENCY = 5;
const DETAIL_DELAY_MS = 100;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`skills-rank.com API failed: ${url} (${response.status})`);
    }
    return response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (retries > 0) {
      const delay = 800 * (MAX_RETRIES - retries + 1);
      console.error(`  Retry ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} for ${url} (${err.message})`);
      await sleep(delay);
      return fetchJson(url, options, retries - 1);
    }
    throw err;
  }
}

function parseInstalls(text) {
  if (!text) return 0;
  const clean = String(text).replace(/,/g, '').trim();
  const match = clean.match(/^([\d.]+)\s*(K|M)?$/i);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const unit = match[2] ? match[2].toUpperCase() : '';
  if (unit === 'K') value *= 1000;
  if (unit === 'M') value *= 1000000;
  return Math.round(value);
}

function inferCategory(description = '', skillName = '') {
  const text = (description + ' ' + skillName).toLowerCase();

  if (text.includes('react') || text.includes('frontend') || text.includes('ui') || text.includes('css') || text.includes('design')) return ['Web Dev', 'UI/UX'];
  if (text.includes('test') || text.includes('jest') || text.includes('playwright') || text.includes('cypress')) return ['Testing'];
  if (text.includes('security') || text.includes('audit') || text.includes('scan')) return ['Security'];
  if (text.includes('deploy') || text.includes('docker') || text.includes('k8s') || text.includes('devops')) return ['DevOps'];
  if (text.includes('azure') || text.includes('aws') || text.includes('cloud') || text.includes('gcp')) return ['DevOps', 'Integrations'];
  if (text.includes('browser') || text.includes('automation')) return ['Automation', 'Tools'];
  if (text.includes('memory') || text.includes('knowledge') || text.includes('graph')) return ['Knowledge'];
  if (text.includes('prompt') || text.includes('caveman')) return ['Prompts'];
  if (text.includes('skill') && text.includes('find')) return ['Awesome List', 'AI Agents'];
  if (text.includes('agent')) return ['AI Agents'];

  return ['General'];
}

function normalizeApiItem(item, rank = null) {
  const owner = item.owner || '';
  const repo = item.repo || '';
  const skillName = item.skill_name || '';
  const fullName = owner && repo ? `${owner}/${repo}` : '';
  const installs = parseInstalls(item.installs);

  return {
    id: fullName,
    owner,
    repo,
    name: skillName,
    full_name: fullName,
    description: item.description || '',
    rank_score: installs,
    installs,
    rank: rank,
    categories: inferCategory(item.description, skillName),
    source: 'skills-rank.com',
    source_url: item.url || `https://skills-rank.com/skill/${owner}/${repo}/${skillName}`,
    skill_id: `${fullName}@${skillName}`
  };
}

async function parseSkillsRank(maxItems = DEFAULT_LEADERBOARD_ITEMS) {
  const allItems = [];
  const limit = 50;

  console.error(`Fetching skills-rank.com leaderboard (${maxItems} items)...`);
  for (let offset = 0; offset < maxItems; offset += limit) {
    const url = `${SKILLS_RANK_API}/skills?offset=${offset}&limit=${limit}`;
    const data = await fetchJson(url);

    if (!data || !Array.isArray(data.data)) {
      throw new Error('Invalid skills-rank.com API response');
    }

    for (const item of data.data) {
      if (allItems.length >= maxItems) break;
      allItems.push(normalizeApiItem(item, item.rank));
    }

    if (allItems.length >= maxItems || data.data.length < limit) break;
    if (offset + limit < maxItems) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return allItems;
}

async function searchSkillsForRepo(repoFullName) {
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) return [];

  const url = `${SKILLS_RANK_API}/search`;
  try {
    const data = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: repoFullName, mode: 'keyword', limit: 100 })
    });

    if (!data || !Array.isArray(data.data)) return [];

    // Filter to exact owner/repo matches (case-insensitive because repo names
    // may differ in capitalization between agentskills.media and skills-rank.com).
    return data.data
      .filter(item =>
        item.owner && item.repo &&
        item.owner.toLowerCase() === owner.toLowerCase() &&
        item.repo.toLowerCase() === repo.toLowerCase()
      )
      .map(item => normalizeApiItem(item));
  } catch (err) {
    console.error(`Search failed for ${repoFullName}:`, err.message);
    return [];
  }
}

async function parseSkillsRankDetails(repos, options = {}) {
  const { maxRepos = DEFAULT_DETAIL_REPOS, concurrency = DETAIL_CONCURRENCY } = options;

  const topRepos = repos
    .filter(repo => repo.stars > 0)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, maxRepos);

  if (topRepos.length === 0) return [];

  console.error(`Searching skills-rank.com for top ${topRepos.length} repos...`);
  const results = [];

  for (let i = 0; i < topRepos.length; i += concurrency) {
    const batch = topRepos.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(repo => searchSkillsForRepo(repo.full_name))
    );

    for (const items of batchResults) {
      results.push(...items);
    }

    console.error(`  [${Math.min(i + concurrency, topRepos.length)}/${topRepos.length}] repos searched`);

    if (i + concurrency < topRepos.length) {
      await new Promise(resolve => setTimeout(resolve, DETAIL_DELAY_MS));
    }
  }

  console.error(`Found ${results.length} individual skills from search.`);
  return results;
}

module.exports = { parseSkillsRank, parseSkillsRankDetails };
