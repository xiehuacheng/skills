const fs = require('fs');
const path = require('path');
const { fetchRepos } = require('./repos');
const { getSingle } = require('./api');

const TEMPLATE_PATH = path.resolve(__dirname, '..', 'assets', 'profile-default.md');

const DEFAULT_TECH_STACK = ['Python', 'Swift', 'JavaScript', 'PyTorch', 'LangChain', 'OpenAI', 'Obsidian', 'GitHub_Actions'];

const TECH_STACK_COLORS = {
  Python: '3776AB',
  Swift: 'FA7343',
  JavaScript: 'F7DF1E',
  TypeScript: '3178C6',
  PyTorch: 'EE4C2C',
  LangChain: '1C3C3C',
  OpenAI: '412991',
  Obsidian: '483699',
  'GitHub Actions': '2088FF',
  GitHub_Actions: '2088FF',
  React: '61DAFB',
  Vue: '4FC08D',
  Go: '00ADD8',
  Rust: '000000',
  Java: '007396',
  'C++': '00599C',
  C: 'A8B9CC',
  HTML: 'E34F26',
  CSS: '1572B6',
  Shell: '89E051',
  Docker: '2496ED',
  Kubernetes: '326CE5',
};

function renderTechStack(items) {
  const badges = items.map(tech => {
    const color = TECH_STACK_COLORS[tech] || '6e7681';
    const logo = tech.replace(/_/g, '');
    const label = tech.replace(/_/g, ' ');
    const logoColor = tech === 'JavaScript' ? 'black' : 'white';
    return `  <img src="https://img.shields.io/badge/${encodeURIComponent(label)}-${color}?style=for-the-badge&logo=${encodeURIComponent(logo)}&logoColor=${logoColor}" alt="${label}" />`;
  });
  return `<p align="center">\n${badges.join('\n')}\n</p>`;
}

function renderFeaturedRepos(repos, options = {}) {
  const { limit = 6, sort = 'stars', style = 'static', only = null } = options;

  if (limit <= 0) return '';

  let featured = repos.filter(r => !r.fork && !r.private);

  if (Array.isArray(only) && only.length > 0) {
    const order = new Map(only.map((name, idx) => [name, idx]));
    featured = featured
      .filter(r => order.has(r.name))
      .sort((a, b) => order.get(a.name) - order.get(b.name));
  } else {
    featured = featured.sort((a, b) => {
      if (sort === 'recent') {
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      }
      return b.stargazers_count - a.stargazers_count;
    });
  }

  featured = featured.slice(0, limit);

  if (featured.length === 0) return 'No public repositories available.';

  if (style === 'shields') {
    const rows = featured.map(r => {
      const owner = encodeURIComponent(r.owner.login);
      const repo = encodeURIComponent(r.name);
      const starsBadge = `![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=flat-square&logo=github&color=8b949e)`;
      const langCell = r.language || '-';
      return `| **[${r.name}](${r.html_url})** | ${starsBadge} | ${langCell} |`;
    });

    return [
      '| Repository | Stars | Language |',
      '|------------|-------|----------|',
      ...rows,
      '',
      '_Star counts update automatically via shields.io._',
    ].join('\n');
  }

  if (style === 'compact') {
    return featured
      .map(r => {
        const owner = encodeURIComponent(r.owner.login);
        const repo = encodeURIComponent(r.name);
        const starsBadge = `![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=flat&logo=github&color=6e7681)`;
        const lang = r.language ? `· ${r.language}` : '';
        const desc = r.description || 'No description';
        return `- **[${r.name}](${r.html_url})** ${lang}\n  ${starsBadge} · ${desc}`;
      })
      .join('\n\n');
  }

  if (style === 'highlight') {
    if (featured.length === 1) {
      const r = featured[0];
      const desc = r.description || 'No description';
      return `I'm currently focused on **[${r.name}](${r.html_url})** — ${desc}`;
    }
    const items = featured.map(r => {
      const desc = r.description || 'No description';
      return `- **[${r.name}](${r.html_url})** — ${desc}`;
    }).join('\n');
    return `I'm currently focused on:\n\n${items}`;
  }

  return featured
    .map(r => {
      const stars = `⭐ ${r.stargazers_count}`;
      const lang = r.language ? `| ${r.language}` : '';
      const desc = r.description || 'No description';
      return `- **[${r.name}](${r.html_url})** ${stars} ${lang}\n  ${desc}`;
    })
    .join('\n\n');
}

function renderContacts(profile, options = {}) {
  const badges = [];
  const extraEmail = options.email;

  if (extraEmail || profile.email) {
    const email = extraEmail || profile.email;
    badges.push(`[![Email](https://img.shields.io/badge/Email-${encodeURIComponent(email)}-D14836?style=flat&logo=gmail&logoColor=white)](mailto:${email})`);
  }

  if (profile.blog) {
    const blogLabel = profile.blog.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    badges.push(`[![Blog](https://img.shields.io/badge/Blog-${encodeURIComponent(blogLabel)}-00A98F?style=flat&logo=blogger&logoColor=white)](${profile.blog})`);
  }

  if (profile.twitter_username) {
    badges.push(`[![Twitter](https://img.shields.io/badge/Twitter-${profile.twitter_username}-1DA1F2?style=flat&logo=twitter&logoColor=white)](https://twitter.com/${profile.twitter_username})`);
  }

  badges.push(`[![GitHub](https://img.shields.io/badge/GitHub-${profile.login}-181717?style=flat&logo=github&logoColor=white)](https://github.com/${profile.login})`);

  if (badges.length === 0) return '';
  return badges.join('\n');
}

async function generateProfile(user, currentUser, options = {}) {
  const {
    refresh = false,
    email = null,
    featuredSort = 'stars',
    featuredStyle = 'static',
    featuredLimit = 6,
    featuredRepos: featuredRepoNames = null,
    techStack = DEFAULT_TECH_STACK,
    theme = 'tokyonight',
  } = options;

  const [repos, profile] = await Promise.all([
    fetchRepos(user, currentUser, refresh),
    getSingle(`users/${user}`),
  ]);

  const profileRepoName = user;
  const publicRepos = repos.filter(
    r => !r.private && r.owner.login === user && r.name !== profileRepoName
  );

  const featuredRepos = renderFeaturedRepos(publicRepos, {
    sort: featuredSort,
    style: featuredStyle,
    limit: featuredLimit,
    only: featuredRepoNames,
  });

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  let result = template
    .replace(/\{\{username\}\}/g, user)
    .replace(/\{\{name\}\}/g, profile.name || user)
    .replace(/\{\{theme\}\}/g, theme)
    .replace('{{contacts}}', renderContacts(profile, { email }))
    .replace('{{techStack}}', renderTechStack(techStack || DEFAULT_TECH_STACK));

  if (featuredRepos) {
    if (featuredStyle === 'highlight') {
      result = result.replace('## ⭐ Featured Projects', '## 🔥 Highlight');
    }
    result = result.replace('{{featuredRepos}}', featuredRepos);
  } else {
    // Remove the entire Featured Projects section when no repositories are selected
    result = result.replace(/## ⭐ Featured Projects\n\n\{\{featuredRepos\}\}\n\n---\n/, '');
  }

  return result;
}

module.exports = {
  generateProfile,
  renderFeaturedRepos,
  renderContacts,
  renderTechStack,
};
