const { execSync, spawnSync } = require('child_process');
const { getAuthMethod } = require('./auth');

function execGhApi(endpoint, jq = null) {
  const args = ['gh', 'api', endpoint];
  if (jq) {
    args.push('--jq', jq);
  } else {
    args.push('--paginate');
  }

  const result = execSync(args.join(' '), { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

  if (jq) {
    return JSON.parse(result);
  }

  // gh api --paginate returns newline-separated JSON arrays
  return result
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .flatMap(line => JSON.parse(line));
}

async function fetchWithToken(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'github-asset-manager-skill',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} for ${url}`);
  }

  return response;
}

async function fetchAllWithToken(baseUrl, token) {
  const results = [];
  let url = baseUrl;

  while (url) {
    const response = await fetchWithToken(url, token);
    const data = await response.json();

    if (Array.isArray(data)) {
      results.push(...data);
    } else {
      return data;
    }

    const linkHeader = response.headers.get('Link');
    url = null;

    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        url = match[1];
      }
    }

    // Fallback: if no Link header but data length is per_page, increment page
    if (!url && Array.isArray(data) && data.length === 100) {
      const pageMatch = baseUrl.match(/[?&]page=(\d+)/);
      const currentPage = pageMatch ? parseInt(pageMatch[1], 10) : 1;
      const perPageMatch = baseUrl.match(/[?&]per_page=(\d+)/);
      const perPage = perPageMatch ? parseInt(perPageMatch[1], 10) : 100;

      if (data.length === perPage) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        url = baseUrl.replace(/([?&])page=\d+/, `$1page=${currentPage + 1}`);
        if (!baseUrl.includes('page=')) {
          url = `${baseUrl}${separator}page=${currentPage + 1}&per_page=${perPage}`;
        }
      }
    }
  }

  return results;
}

async function getAll(endpoint) {
  const auth = getAuthMethod();
  if (!auth) {
    throw new Error('GitHub authentication required. Run "gh auth login" or set GITHUB_TOKEN.');
  }

  if (auth.type === 'gh-cli') {
    return execGhApi(endpoint);
  }

  const baseUrl = endpoint.startsWith('http')
    ? endpoint
    : `https://api.github.com${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const url = baseUrl.includes('?') ? `${baseUrl}&per_page=100` : `${baseUrl}?per_page=100`;

  return fetchAllWithToken(url, auth.token);
}

async function getSingle(endpoint) {
  const auth = getAuthMethod();
  if (!auth) {
    throw new Error('GitHub authentication required. Run "gh auth login" or set GITHUB_TOKEN.');
  }

  if (auth.type === 'gh-cli') {
    return execGhApi(endpoint, '.');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `https://api.github.com${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetchWithToken(url, auth.token);
  return response.json();
}

function execGhGraphql(query, variables) {
  // Use spawnSync to avoid shell parsing issues with GraphQL special characters
  const args = ['api', 'graphql', '-f', `query=${query}`];

  for (const [key, value] of Object.entries(variables)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        args.push('-F', `${key}[]=${item}`);
      }
    } else {
      args.push('-f', `${key}=${value}`);
    }
  }

  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Failed to run gh graphql: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`gh graphql failed: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout);
}

async function fetchGraphqlWithToken(query, variables, token) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-asset-manager-skill',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function graphql(query, variables = {}) {
  const auth = getAuthMethod();
  if (!auth) {
    throw new Error('GitHub authentication required. Run "gh auth login" or set GITHUB_TOKEN.');
  }

  const data = auth.type === 'gh-cli'
    ? execGhGraphql(query, variables)
    : await fetchGraphqlWithToken(query, variables, auth.token);

  if (data.errors && data.errors.length > 0) {
    const messages = data.errors.map(e => e.message).join('; ');
    throw new Error(`GraphQL error: ${messages}`);
  }

  return data;
}

module.exports = {
  getAll,
  getSingle,
  graphql,
};
