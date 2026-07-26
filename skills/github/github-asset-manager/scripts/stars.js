const { getAll } = require('./api');
const cache = require('./cache');
const report = require('./report');

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function fetchStars(user, refresh = false) {
  const cacheKey = `stars-${user}`;
  const cached = cache.get(cacheKey, { refresh });
  if (cached) return cached;

  const data = await getAll(`/users/${user}/starred`);
  cache.set(cacheKey, data);
  return data;
}

function analyzeStars(repos) {
  const total = repos.length;
  const archived = repos.filter(r => r.archived);
  const noDescription = repos.filter(r => !r.description);

  const now = Date.now();
  const stale = repos.filter(r => {
    const pushed = new Date(r.pushed_at).getTime();
    return now - pushed > ONE_YEAR_MS;
  });

  const byLanguage = {};
  for (const r of repos) {
    const lang = r.language || 'Unknown';
    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
  }

  const byTopics = {};
  for (const r of repos) {
    for (const topic of r.topics || []) {
      byTopics[topic] = (byTopics[topic] || 0) + 1;
    }
  }

  const sortedLanguages = Object.entries(byLanguage)
    .sort((a, b) => b[1] - a[1]);

  const sortedTopics = Object.entries(byTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return {
    total,
    archived: archived.length,
    noDescription: noDescription.length,
    stale: stale.length,
    languages: sortedLanguages,
    topics: sortedTopics,
    archivedRepos: archived,
    staleRepos: stale.slice(0, 20),
    noDescriptionRepos: noDescription.slice(0, 20),
  };
}

function formatRepoRow(r) {
  return [
    report.link(r.full_name, r.html_url),
    r.language || '-',
    r.description || '-',
    `⭐ ${r.stargazers_count}`,
  ];
}

function generateStarsReport(data, user) {
  const parts = [];

  parts.push(report.h1(`GitHub Stars Report for ${user}`));
  parts.push(report.paragraph(`Generated at ${new Date().toISOString()}`));

  parts.push(report.h2('Overview'));
  parts.push(report.table(
    ['Metric', 'Count'],
    [
      ['Total Stars', data.total],
      ['Archived Repositories', data.archived],
      ['No Description', data.noDescription],
      ['Stale (>1 year)', data.stale],
    ]
  ));

  parts.push(report.h2('Top Languages'));
  if (data.languages.length > 0) {
    parts.push(report.table(
      ['Language', 'Count'],
      data.languages.map(([lang, count]) => [lang, count])
    ));
  } else {
    parts.push(report.paragraph('No language data available.'));
  }

  parts.push(report.h2('Top Topics'));
  if (data.topics.length > 0) {
    parts.push(report.table(
      ['Topic', 'Count'],
      data.topics.map(([topic, count]) => [topic, count])
    ));
  } else {
    parts.push(report.paragraph('No topic data available.'));
  }

  parts.push(report.h2('Archived Repositories'));
  if (data.archivedRepos.length > 0) {
    parts.push(report.table(
      ['Repository', 'Language', 'Description', 'Stars'],
      data.archivedRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('No archived repositories found.'));
  }

  parts.push(report.h2('Stale Repositories (>1 year without push)'));
  if (data.staleRepos.length > 0) {
    parts.push(report.paragraph(`Showing top ${data.staleRepos.length} of ${data.stale} stale repositories:`));
    parts.push(report.table(
      ['Repository', 'Language', 'Description', 'Stars'],
      data.staleRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('No stale repositories found.'));
  }

  parts.push(report.h2('Repositories Without Description'));
  if (data.noDescriptionRepos.length > 0) {
    parts.push(report.paragraph(`Showing top ${data.noDescriptionRepos.length} of ${data.noDescription} repositories without description:`));
    parts.push(report.table(
      ['Repository', 'Language', 'Description', 'Stars'],
      data.noDescriptionRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('All starred repositories have descriptions.'));
  }

  return parts.join('\n');
}

async function runStars(user, options = {}) {
  const { refresh = false } = options;
  const repos = await fetchStars(user, refresh);
  const data = analyzeStars(repos);
  return generateStarsReport(data, user);
}

module.exports = {
  fetchStars,
  analyzeStars,
  generateStarsReport,
  runStars,
};
