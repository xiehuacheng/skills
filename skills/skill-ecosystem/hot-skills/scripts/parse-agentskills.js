const { execSync } = require('child_process');

const AGENTSKILLS_DATA_URL = 'https://raw.githubusercontent.com/jaychempan/Agent-Leaderboard/main/data/data.json';
const FETCH_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

function fetchWithCurl() {
  try {
    const output = execSync(`curl -sL --max-time 90 "${AGENTSKILLS_DATA_URL}"`, {
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(output);
  } catch (err) {
    throw new Error(`agentskills.media curl fetch failed: ${err.message}`);
  }
}

async function fetchAgentskills() {
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(AGENTSKILLS_DATA_URL, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`agentskills.media fetch failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) {
        const delay = 1000 * (attempt + 1);
        console.error(`agentskills.media fetch attempt ${attempt + 1}/${MAX_RETRIES} failed (${err.message}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`Native fetch failed after ${MAX_RETRIES} attempts (${lastErr.message}), falling back to curl...`);
  return fetchWithCurl();
}

function normalizeCategory(primaryCategory, categories = [], useCases = []) {
  const categoryMap = {
    'AI 代理': 'AI Agents',
    'UI/UX 设计': 'UI/UX',
    'Web 开发': 'Web Dev',
    '测试': 'Testing',
    '安全': 'Security',
    'DevOps': 'DevOps',
    '代码生成': 'Code Gen',
    '数据分析': 'Data',
    '文档生成': 'Docs',
    'Prompt 优化': 'Prompts',
    '工作流自动化': 'Automation',
    '知识管理': 'Knowledge',
    '代码审查': 'Review',
    '写作/内容': 'Writing',
    '通用工具': 'General',
    '任务规划': 'Planning',
    '模型路由': 'Routing',
    '游戏开发': 'Game Dev',
    '工具集成': 'Integrations',
    '搜索': 'Search',
    '资源列表': 'Awesome List',
    'deepseek': 'AI Agents'
  };

  const mapped = (value) => categoryMap[value];

  // Prefer the primary category when it maps to a known taxonomy.
  const primaryMapped = mapped(primaryCategory);
  if (primaryMapped) {
    return [primaryMapped];
  }

  // Otherwise prefer the categories array.
  const arrayCategories = Array.isArray(categories) ? categories : [];
  const mappedCategories = [...new Set(arrayCategories.map(mapped).filter(Boolean))];
  if (mappedCategories.length > 0) {
    return mappedCategories;
  }

  // Fall back to use-cases if no primary/category taxonomy is available.
  const cases = Array.isArray(useCases) ? useCases : [];
  const result = new Set();
  cases.forEach(uc => {
    const mappedCase = mapped(uc);
    if (mappedCase) result.add(mappedCase);
  });
  return Array.from(result);
}

async function parseAgentskills() {
  const data = await fetchAgentskills();
  
  if (!data || !Array.isArray(data.repos)) {
    throw new Error('Invalid agentskills.media data format');
  }

  return data.repos.map(repo => {
    const [owner, repoName] = repo.full_name.split('/');
    return {
      id: repo.full_name,
      owner,
      repo: repoName,
      name: repoName,
      full_name: repo.full_name,
      description: repo.description || '',
      stars: repo.stars || 0,
      forks: repo.forks || 0,
      language: repo.language || '',
      topics: repo.topics || [],
      url: repo.url,
      categories: normalizeCategory(repo.category, repo.categories, repo.use_cases || []),
      source: 'agentskills.media',
      source_url: `https://agentskills.media/`,
      updated_at: repo.updated_at
    };
  });
}

module.exports = { parseAgentskills };
