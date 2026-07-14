const SKILLS_SH_API = 'https://skills.sh';
const REQUEST_TIMEOUT_MS = 15_000;
const SEARCH_DELAY_MS = 2500;
const RATE_LIMIT_DELAY_MS = 2000;
const MAX_RETRIES = 3;

const DEFAULT_QUERIES = [
  'frontend',
  'backend',
  'testing',
  'security',
  'design',
  'devops',
  'react',
  'node',
  'python',
  'agent',
  'memory',
  'documentation',
  'prompt',
  'review',
  'debug',
  'refactor',
  'architecture',
  'planning',
  'tdd'
];

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

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_DELAY_MS;
      if (retries > 0) {
        console.error(`  Rate limited by skills.sh, retrying after ${delay}ms...`);
        await sleep(delay);
        return fetchJson(url, options, retries - 1);
      }
    }

    if (!response.ok) {
      throw new Error(`skills.sh API failed: ${url} (${response.status})`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (retries > 0) {
      await sleep(800 * (MAX_RETRIES - retries + 1));
      return fetchJson(url, options, retries - 1);
    }
    throw err;
  }
}

async function searchSkillsSh(query) {
  const params = new URLSearchParams({ q: query });
  const url = `${SKILLS_SH_API}/api/search?${params.toString()}`;
  const data = await fetchJson(url);

  if (!data || !Array.isArray(data.skills)) {
    return [];
  }

  return data.skills.map(item => {
    const source = item.source || '';
    const slug = item.skillId || item.slug || '';
    const [owner, repoName] = source.split('/');
    const fullName = source;

    return {
      id: `${source}/${slug}`,
      owner: owner || '',
      repo: repoName || '',
      name: slug,
      full_name: fullName,
      skill_id: `${fullName}@${slug}`,
      installs: typeof item.installs === 'number' ? item.installs : 0,
      source: 'skills.sh',
      source_url: item.url || `https://skills.sh/${source}/${slug}`
    };
  }).filter(item => item.owner && item.repo && item.name);
}

async function fetchV1Leaderboard(token, perPage = 100, maxPages = 10) {
  // Requires Vercel OIDC token. See https://www.skills.sh/docs/api
  if (!token) return [];

  const allItems = [];

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ view: 'all-time', page: String(page), per_page: String(perPage) });
    const url = `${SKILLS_SH_API}/api/v1/skills?${params.toString()}`;

    try {
      const data = await fetchJson(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data || !Array.isArray(data.data)) break;

      for (const item of data.data) {
        const source = item.source || '';
        const slug = item.slug || '';
        const [owner, repoName] = source.split('/');

        allItems.push({
          id: item.id || `${source}/${slug}`,
          owner: owner || '',
          repo: repoName || '',
          name: slug,
          full_name: source,
          skill_id: item.id || `${source}@${slug}`,
          installs: typeof item.installs === 'number' ? item.installs : 0,
          rank: data.pagination ? data.pagination.page * perPage + allItems.length + 1 : null,
          source: 'skills.sh',
          source_url: item.url || `https://skills.sh/${source}/${slug}`
        });
      }

      if (!data.pagination || !data.pagination.hasMore) break;
      await sleep(SEARCH_DELAY_MS);
    } catch (err) {
      console.error(`skills.sh v1 leaderboard page ${page} failed:`, err.message);
      break;
    }
  }

  return allItems.filter(item => item.owner && item.repo && item.name);
}

async function parseSkillsSh(queries = DEFAULT_QUERIES, options = {}) {
  const { delayMs = SEARCH_DELAY_MS, token = process.env.SKILLS_SH_API_TOKEN } = options;
  const seen = new Set();
  const allItems = [];

  // Prefer authenticated v1 leaderboard if token is available.
  if (token) {
    console.error('Fetching skills.sh v1 leaderboard...');
    const leaderboardItems = await fetchV1Leaderboard(token);
    for (const item of leaderboardItems) {
      if (seen.has(item.skill_id)) continue;
      seen.add(item.skill_id);
      allItems.push(item);
    }
    console.error(`Found ${allItems.length} skills from skills.sh v1 leaderboard.`);
  }

  // Fall back to unauthenticated search API for broader coverage.
  console.error(`Fetching skills.sh search results for ${queries.length} queries...`);
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      const items = await searchSkillsSh(query);
      for (const item of items) {
        if (seen.has(item.skill_id)) continue;
        seen.add(item.skill_id);
        allItems.push(item);
      }
    } catch (err) {
      console.error(`skills.sh search failed for "${query}":`, err.message);
    }

    if (delayMs > 0 && i < queries.length - 1) {
      await sleep(delayMs);
    }
  }

  console.error(`Found ${allItems.length} unique skills from skills.sh.`);
  return allItems.sort((a, b) => b.installs - a.installs);
}

module.exports = { parseSkillsSh };
