const { getAll, getSingle } = require('./api');
const cache = require('./cache');
const report = require('./report');

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function fetchRepos(user, currentUser, refresh = false) {
  const cacheKey = `repos-${user}`;
  const cached = cache.get(cacheKey, { refresh });
  if (cached) return cached;

  // If querying the authenticated user, use /user/repos to include private repos
  const endpoint = user === currentUser ? '/user/repos' : `/users/${user}/repos`;
  const data = await getAll(endpoint);
  cache.set(cacheKey, data);
  return data;
}

async function checkLicenseFile(owner, name) {
  try {
    const contents = await getSingle(`repos/${owner}/${name}/contents`);
    if (!Array.isArray(contents)) return false;
    return contents.some(item => /^LICENSE/i.test(item.name));
  } catch (err) {
    return false;
  }
}

async function fetchLicenseFiles(repos) {
  const result = {};
  const needsCheck = repos.filter(r => !r.license);

  for (const r of needsCheck) {
    const [owner, name] = r.full_name.split('/');
    if (owner && name) {
      result[r.full_name] = await checkLicenseFile(owner, name);
    }
  }

  return result;
}

function analyzeRepos(repos, licenseFiles = {}) {
  const total = repos.length;
  const publicRepos = repos.filter(r => !r.private);
  const privateRepos = repos.filter(r => r.private);
  const forks = repos.filter(r => r.fork);
  const archived = repos.filter(r => r.archived);

  const now = Date.now();
  const stale = repos.filter(r => {
    const pushed = new Date(r.pushed_at).getTime();
    return now - pushed > ONE_YEAR_MS;
  });

  const missingDescription = repos.filter(r => !r.description);
  const missingTopics = repos.filter(r => !(r.topics && r.topics.length > 0));
  const missingHomepage = repos.filter(r => !r.homepage);
  const missingLicense = repos.filter(r => !(r.license || licenseFiles[r.full_name]));

  const byLanguage = {};
  for (const r of repos) {
    const lang = r.language || 'Unknown';
    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
  }
  const sortedLanguages = Object.entries(byLanguage).sort((a, b) => b[1] - a[1]);

  return {
    total,
    public: publicRepos.length,
    private: privateRepos.length,
    forks: forks.length,
    archived: archived.length,
    stale: stale.length,
    languages: sortedLanguages,
    missingDescription: missingDescription.length,
    missingTopics: missingTopics.length,
    missingHomepage: missingHomepage.length,
    missingLicense: missingLicense.length,
    missingDescriptionRepos: missingDescription.slice(0, 20),
    missingTopicsRepos: missingTopics.slice(0, 20),
    missingHomepageRepos: missingHomepage.slice(0, 20),
    missingLicenseRepos: missingLicense.slice(0, 20),
    staleRepos: stale.slice(0, 20),
    archiveCandidates: stale.filter(r => !r.archived).slice(0, 20),
  };
}

function formatRepoRow(r) {
  return [
    report.link(r.full_name, r.html_url),
    r.private ? 'private' : 'public',
    r.language || '-',
    r.description || '-',
    `⭐ ${r.stargazers_count}`,
  ];
}

function generateReposReport(data, user) {
  const parts = [];

  parts.push(report.h1(`GitHub Repository Audit for ${user}`));
  parts.push(report.paragraph(`Generated at ${new Date().toISOString()}`));

  parts.push(report.h2('Overview'));
  parts.push(report.table(
    ['Metric', 'Count'],
    [
      ['Total Repositories', data.total],
      ['Public', data.public],
      ['Private', data.private],
      ['Forks', data.forks],
      ['Archived', data.archived],
      ['Stale (>1 year)', data.stale],
    ]
  ));

  parts.push(report.h2('Missing Information Summary'));
  parts.push(report.table(
    ['Metric', 'Count'],
    [
      ['No Description', data.missingDescription],
      ['No Topics', data.missingTopics],
      ['No Homepage', data.missingHomepage],
      ['No License', data.missingLicense],
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

  parts.push(report.h2('Repositories Without Description'));
  if (data.missingDescriptionRepos.length > 0) {
    parts.push(report.paragraph(`Showing top ${data.missingDescriptionRepos.length} of ${data.missingDescription} repositories without description:`));
    parts.push(report.table(
      ['Repository', 'Visibility', 'Language', 'Description', 'Stars'],
      data.missingDescriptionRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('All repositories have descriptions.'));
  }

  parts.push(report.h2('Repositories Without Topics'));
  if (data.missingTopicsRepos.length > 0) {
    parts.push(report.paragraph(`Showing top ${data.missingTopicsRepos.length} of ${data.missingTopics} repositories without topics:`));
    parts.push(report.table(
      ['Repository', 'Visibility', 'Language', 'Description', 'Stars'],
      data.missingTopicsRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('All repositories have topics.'));
  }

  parts.push(report.h2('Repositories Without License'));
  if (data.missingLicenseRepos.length > 0) {
    parts.push(report.paragraph(`Showing top ${data.missingLicenseRepos.length} of ${data.missingLicense} repositories without license:`));
    parts.push(report.table(
      ['Repository', 'Visibility', 'Language', 'Description', 'Stars'],
      data.missingLicenseRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('All repositories have licenses.'));
  }

  parts.push(report.h2('Stale Repositories (>1 year without push)'));
  if (data.staleRepos.length > 0) {
    parts.push(report.paragraph(`Showing top ${data.staleRepos.length} of ${data.stale} stale repositories:`));
    parts.push(report.table(
      ['Repository', 'Visibility', 'Language', 'Description', 'Stars'],
      data.staleRepos.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('No stale repositories found.'));
  }

  parts.push(report.h2('Archive Candidates'));
  if (data.archiveCandidates.length > 0) {
    parts.push(report.paragraph(`These repositories have not been pushed in over a year and are not yet archived. Consider archiving them:`));
    parts.push(report.table(
      ['Repository', 'Visibility', 'Language', 'Description', 'Stars'],
      data.archiveCandidates.map(formatRepoRow)
    ));
  } else {
    parts.push(report.paragraph('No archive candidates found.'));
  }

  return parts.join('\n');
}

async function runRepos(user, currentUser, options = {}) {
  const { refresh = false } = options;
  const repos = await fetchRepos(user, currentUser, refresh);
  const licenseFiles = await fetchLicenseFiles(repos);
  const data = analyzeRepos(repos, licenseFiles);
  return generateReposReport(data, user);
}

module.exports = {
  fetchRepos,
  analyzeRepos,
  generateReposReport,
  runRepos,
};
