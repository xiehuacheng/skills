const { execSync } = require('child_process');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PROJECT_DIR = path.resolve(SCRIPT_DIR, '..');
const PYTHON_SCRIPT = path.join(SCRIPT_DIR, 'scrape_skills_sh_trending.py');

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function parseSkillsShTrending() {
  // Ensure Playwright browser is installed
  try {
    execSync('playwright install chromium', {
      cwd: PROJECT_DIR,
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (err) {
    // Browser may already be installed; ignore best-effort.
  }

  console.error('Fetching skills.sh trending via headless browser...');

  try {
    const output = execSync(`uv run python "${PYTHON_SCRIPT}"`, {
      cwd: PROJECT_DIR,
      encoding: 'utf8',
      timeout: 180_000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // The script prints progress to stderr and JSON array to stdout as the final line.
    const lines = output.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const parsed = parseJsonSafe(lines[i]);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          id: item.id,
          owner: item.source.split('/')[0] || '',
          repo: item.source.split('/')[1] || '',
          name: item.name,
          full_name: item.source,
          skill_id: item.skill_id,
          installs: item.installs,
          rank: item.rank,
          description: '',
          source: 'skills.sh',
          source_url: item.url
        }));
      }
    }

    throw new Error('Could not parse skills.sh trending output');
  } catch (err) {
    console.error('skills.sh trending scrape failed:', err.message);
    return [];
  }
}

module.exports = { parseSkillsShTrending };
