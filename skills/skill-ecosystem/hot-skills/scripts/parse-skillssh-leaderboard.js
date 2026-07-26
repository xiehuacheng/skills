const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

const SCRIPT_DIR = __dirname;
const PROJECT_DIR = path.resolve(SCRIPT_DIR, '..');
const PYTHON_SCRIPT = path.join(SCRIPT_DIR, 'scrape_skills_sh_leaderboard.py');

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function parseSkillsShLeaderboard() {
  // Ensure Playwright browser is installed
  try {
    await execAsync('playwright install chromium', {
      cwd: PROJECT_DIR,
      timeout: 120_000
    });
  } catch (err) {
    // Browser may already be installed; ignore best-effort.
  }

  console.error('Fetching skills.sh all-time leaderboard via headless browser...');

  const { stdout } = await execAsync(`uv run python "${PYTHON_SCRIPT}"`, {
    cwd: PROJECT_DIR,
    timeout: 180_000
  });

  // The script prints progress to stderr and JSON array to stdout as the final line.
  const lines = stdout.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const parsed = parseJsonSafe(lines[i]);
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        id: item.skill_id,
        owner: item.source.split('/')[0] || '',
        repo: item.source.split('/')[1] || '',
        name: item.name,
        full_name: item.source,
        skill_id: item.skill_id,
        installs: item.installs || 0,
        rank: item.rank,
        description: '',
        source: 'skills.sh',
        source_url: item.url
      }));
    }
  }

  throw new Error('Could not parse skills.sh leaderboard output');
}

module.exports = { parseSkillsShLeaderboard };
