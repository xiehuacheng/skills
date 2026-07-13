const { getCachedSitemapUrls, saveCachedSitemapUrls } = require('./cache');

const SKILLS_RANK_URL = 'https://skills-rank.com/';
const DEFAULT_MAX_PAGES = 3;
const PAGE_DELAY_MS = 300;
const DETAIL_DELAY_MS = 150;
const DETAIL_CONCURRENCY = 5;
const SITEMAP_DETAIL_MAX_REPOS = 30;

async function fetchSkillsRankPage(page = 1) {
  const url = page <= 1 ? SKILLS_RANK_URL : `${SKILLS_RANK_URL}?page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`skills-rank.com fetch failed for page ${page}: ${response.status}`);
  }
  return response.text();
}

async function fetchSkillsRank(maxPages = DEFAULT_MAX_PAGES) {
  const pages = [];
  for (let page = 1; page <= maxPages; page++) {
    pages.push(await fetchSkillsRankPage(page));
    if (page < maxPages) {
      await new Promise(resolve => setTimeout(resolve, PAGE_DELAY_MS));
    }
  }
  return pages;
}

async function fetchXml(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function extractUrlsFromSitemap(xml, filterSkillPages = false) {
  const urls = [];
  const locMatches = xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi);
  for (const match of locMatches) {
    const url = match[1].trim();
    if (!filterSkillPages || url.includes('/skill/')) {
      urls.push(url);
    }
  }
  return urls;
}

async function fetchSitemapSkillUrls(forceRefresh = false) {
  const cached = getCachedSitemapUrls(forceRefresh);
  if (cached) {
    console.error(`Using cached sitemap URLs (${cached.length} skills).`);
    return cached;
  }

  // Fetch the main sitemap index and keep only English sitemaps to avoid
  // downloading the same skills in 7 languages.
  const indexUrl = `${SKILLS_RANK_URL}sitemap.xml`;
  console.error(`Fetching sitemap index from ${indexUrl}...`);
  const indexXml = await fetchXml(indexUrl);
  const sitemapUrls = extractUrlsFromSitemap(indexXml, false).filter(url => url.includes('/sitemap-en-'));
  console.error(`Found ${sitemapUrls.length} English sitemap files to parse.`);

  const allSkillUrls = [];
  for (let i = 0; i < sitemapUrls.length; i++) {
    const sitemapUrl = sitemapUrls[i];
    try {
      const sitemapXml = await fetchXml(sitemapUrl);
      const skillUrls = extractUrlsFromSitemap(sitemapXml, true);
      console.error(`  [${i + 1}/${sitemapUrls.length}] ${sitemapUrl}: ${skillUrls.length} skill URLs`);
      allSkillUrls.push(...skillUrls);
    } catch (err) {
      console.error(`Sitemap fetch failed: ${sitemapUrl}`, err.message);
    }
  }

  // Deduplicate and keep only canonical skill pages
  const uniqueUrls = Array.from(new Set(allSkillUrls.filter(url => url.startsWith(`${SKILLS_RANK_URL}skill/`))));
  console.error(`Total unique skill URLs: ${uniqueUrls.length}`);
  saveCachedSitemapUrls(uniqueUrls);
  return uniqueUrls;
}

function parseSkillUrl(url) {
  // https://skills-rank.com/skill/owner/repo/skill-name
  const match = url.match(/\/skill\/([^/]+)\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    skillName: match[3],
    full_name: `${match[1]}/${match[2]}`,
    url
  };
}

function groupUrlsByRepo(urls) {
  const map = new Map();
  for (const url of urls) {
    const parsed = parseSkillUrl(url);
    if (!parsed) continue;
    const repoKey = parsed.full_name.toLowerCase();
    if (!map.has(repoKey)) {
      map.set(repoKey, []);
    }
    map.get(repoKey).push(parsed);
  }
  return map;
}

async function fetchSkillDetailPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Skill detail fetch failed: ${url} (${response.status})`);
    }
    return response.text();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function parseSkillDetailPage(html, url) {
  const parsed = parseSkillUrl(url);
  if (!parsed) return null;

  // Try meta description first: "... installed 274.1K times. ..."
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDesc = metaMatch ? metaMatch[1] : '';

  const installsMatch = metaDesc.match(/installed\s+([\d.]+)\s*(K|M)?\s*times/i);
  let installs = 0;
  if (installsMatch) {
    let value = parseFloat(installsMatch[1]);
    const unit = installsMatch[2] ? installsMatch[2].toUpperCase() : '';
    if (unit === 'K') value *= 1000;
    if (unit === 'M') value *= 1000000;
    installs = Math.round(value);
  }

  // Extract description after "installed X times. "
  let description = metaDesc.replace(/^.*?installed\s+[\d.]+\s*(?:K|M)?\s*times\.\s*/i, '').trim();
  if (!description) {
    // Fallback: try og:description
    const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    description = ogMatch ? ogMatch[1] : '';
  }

  return {
    id: parsed.full_name,
    owner: parsed.owner,
    repo: parsed.repo,
    name: parsed.skillName,
    full_name: parsed.full_name,
    description,
    rank_score: installs,
    installs,
    rank: null,
    categories: inferCategory(description, parsed.skillName),
    source: 'skills-rank.com',
    source_url: url,
    skill_id: `${parsed.full_name}@${parsed.skillName}`
  };
}

async function fetchWithConcurrency(items, fetchFn, concurrency = DETAIL_CONCURRENCY, delayMs = DETAIL_DELAY_MS) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async item => {
        try {
          return await fetchFn(item);
        } catch (err) {
          console.error(err.message);
          return null;
        }
      })
    );
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return results.filter(r => r !== null);
}

async function parseSkillsRankDetails(repos, options = {}) {
  const { maxRepos = SITEMAP_DETAIL_MAX_REPOS, concurrency = DETAIL_CONCURRENCY } = options;

  // Sort repos by stars descending and take top N
  const topRepos = repos
    .filter(repo => repo.stars > 0)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, maxRepos);

  if (topRepos.length === 0) return [];

  console.error(`Fetching sitemap to find skills for top ${topRepos.length} repos...`);
  let allSkillUrls;
  try {
    allSkillUrls = await fetchSitemapSkillUrls();
  } catch (err) {
    console.error('fetchSitemapSkillUrls failed:', err.message, err.stack);
    return [];
  }
  const repoUrlMap = groupUrlsByRepo(allSkillUrls);

  const urlsToFetch = [];
  for (const repo of topRepos) {
    const repoKey = repo.full_name.toLowerCase();
    const urls = repoUrlMap.get(repoKey) || [];
    urlsToFetch.push(...urls.map(u => u.url));
  }

  if (urlsToFetch.length === 0) return [];

  console.error(`Found ${urlsToFetch.length} skill detail pages to fetch...`);
  const pages = await fetchWithConcurrency(
    urlsToFetch,
    async url => {
      const html = await fetchSkillDetailPage(url);
      return parseSkillDetailPage(html, url);
    },
    concurrency,
    DETAIL_DELAY_MS
  );

  return pages;
}

function htmlDecode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseInstalls(text) {
  const clean = text.replace(/,/g, '').trim();
  const match = clean.match(/^([\d.]+)\s*(K|M)?$/i);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const unit = match[2] ? match[2].toUpperCase() : '';
  if (unit === 'K') value *= 1000;
  if (unit === 'M') value *= 1000000;
  return Math.round(value);
}

function parseTable(html) {
  // The page renders an HTML table with id="skillsTable"
  const rows = [];
  const tableMatch = html.match(/<tbody id="skillsTable">([\s\S]*?)<\/tbody>/i);
  if (!tableMatch) return rows;

  const tableHtml = tableMatch[1];
  const rowMatches = tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    const rowHtml = rowMatch[1];
    const cells = [];

    // Extract text content from each td cell
    const cellMatches = rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    for (const cellMatch of cellMatches) {
      const cellHtml = cellMatch[1];
      // Strip tags and decode entities
      const text = htmlDecode(cellHtml.replace(/<[^>]+>/g, ' '));
      cells.push(text);
    }

    if (cells.length < 5) continue;

    const rank = parseInt(cells[0], 10);
    if (isNaN(rank)) continue;

    // cells: [rank, skill-name-with-skill, repo, description, installs]
    const skillCell = cells[1];
    const repoCell = cells[2].trim();
    const description = cells[3];
    const installsText = cells[4];

    // Extract skill name from first anchor text in skill cell
    const skillNameMatch = skillCell.match(/\S+/);
    const skillName = skillNameMatch ? skillNameMatch[0].trim() : '';

    // repo cell looks like "owner/repo"
    const repo = repoCell.split(/\s+/)[0];

    rows.push({
      rank,
      skillName,
      repo,
      description,
      installs: parseInstalls(installsText)
    });
  }

  return rows;
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

async function parseSkillsRank(maxPages = DEFAULT_MAX_PAGES) {
  const pages = await fetchSkillsRank(maxPages);
  const allRows = [];

  for (const html of pages) {
    const rows = parseTable(html);
    if (rows.length === 0) break; // Stop if a page has no data
    allRows.push(...rows);
  }

  return allRows.map(row => {
    const [owner, repoName] = row.repo.includes('/') ? row.repo.split('/') : ['', row.repo];
    return {
      id: row.repo,
      owner,
      repo: repoName,
      name: row.skillName,
      full_name: row.repo,
      description: row.description,
      // Use installs as the rank_score so it can be merged with skills.sh
      rank_score: row.installs,
      installs: row.installs,
      rank: row.rank,
      categories: inferCategory(row.description, row.skillName),
      source: 'skills-rank.com',
      source_url: `https://skills-rank.com/skill/${owner}/${repoName}/${row.skillName}`,
      skill_id: `${row.repo}@${row.skillName}`
    };
  });
}

module.exports = { parseSkillsRank, parseSkillsRankDetails };
