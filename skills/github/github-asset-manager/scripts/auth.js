const { execSync } = require('child_process');

function checkGhCli() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkGhAuth() {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getAuthMethod() {
  if (checkGhCli() && checkGhAuth()) {
    return { type: 'gh-cli' };
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    return { type: 'token', token };
  }

  return null;
}

function getCurrentUser() {
  const auth = getAuthMethod();
  if (!auth) {
    throw new Error(
      'No GitHub authentication found. Please either:\n' +
      '  1. Run "gh auth login" to authenticate the GitHub CLI, or\n' +
      '  2. Set the GITHUB_TOKEN environment variable.'
    );
  }

  try {
    if (auth.type === 'gh-cli') {
      const result = execSync('gh api user --jq ".login"', { encoding: 'utf8' });
      return result.trim();
    }

    const result = execSync(
      `curl -s -H "Authorization: token ${auth.token}" https://api.github.com/user`,
      { encoding: 'utf8' }
    );
    const data = JSON.parse(result);
    if (data.login) return data.login;
    throw new Error(data.message || 'Failed to fetch current user');
  } catch (err) {
    throw new Error(`Failed to determine current GitHub user: ${err.message}`);
  }
}

function getTokenScopes() {
  const auth = getAuthMethod();
  if (!auth) {
    throw new Error('GitHub authentication required.');
  }

  try {
    if (auth.type === 'gh-cli') {
      // gh api user -i includes response headers with X-OAuth-Scopes
      const result = execSync('gh api user -i', { encoding: 'utf8' });
      const match = result.match(/X-OAuth-Scopes:\s*(.+)/i);
      if (match) {
        return match[1].split(',').map(s => s.trim());
      }
      return [];
    }

    const result = execSync(
      `curl -sI -H "Authorization: token ${auth.token}" https://api.github.com/user`,
      { encoding: 'utf8' }
    );
    const match = result.match(/X-OAuth-Scopes:\s*(.+)/i);
    if (match) {
      return match[1].split(',').map(s => s.trim());
    }
    return [];
  } catch (err) {
    throw new Error(`Failed to check token scopes: ${err.message}`);
  }
}

function hasUserScope() {
  const scopes = getTokenScopes();
  return scopes.includes('user');
}

function requireUserScope() {
  if (!hasUserScope()) {
    throw new Error(
      'This operation requires the "user" scope on your GitHub token.\n' +
      'If you are using the GitHub CLI, run:\n' +
      '  gh auth refresh --scopes user\n' +
      'If you are using a Personal Access Token, create a new token with the "user" scope.'
    );
  }
}

module.exports = {
  getAuthMethod,
  getCurrentUser,
  getTokenScopes,
  hasUserScope,
  requireUserScope,
};
