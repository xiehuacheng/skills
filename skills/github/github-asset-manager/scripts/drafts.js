const { getSingle } = require('./api');
const report = require('./report');

const LANGUAGE_TOPICS = {
  javascript: ['javascript'],
  typescript: ['typescript'],
  python: ['python'],
  swift: ['swift'],
  go: ['go'],
  rust: ['rust'],
  java: ['java'],
  'c++': ['cpp'],
  shell: ['shell'],
};

// Domain-aware keyword → topic mappings. Order matters: longer phrases first.
const TOPIC_KEYWORDS = [
  ['macos', 'macos'],
  ['mac os', 'macos'],
  ['menubar', 'menubar'],
  ['status bar', 'menubar'],
  ['swiftui', 'swiftui'],
  ['token', 'token'],
  ['openai', 'openai'],
  ['chatgpt', 'chatgpt'],
  ['gpt', 'gpt'],
  ['llm', 'llm'],
  ['large language model', 'llm'],
  ['agent', 'agent'],
  ['ai agent', 'ai-agent'],
  ['rag', 'rag'],
  ['retrieval augmented generation', 'rag'],
  ['langchain', 'langchain'],
  ['pytorch', 'pytorch'],
  ['transformer', 'transformer'],
  ['kv cache', 'kv-cache'],
  ['kv-cache', 'kv-cache'],
  ['inference', 'inference'],
  ['knowledge base', 'knowledge-base'],
  ['knowledge-base', 'knowledge-base'],
  ['second brain', 'second-brain'],
  ['obsidian', 'obsidian'],
  ['wechat', 'wechat'],
  ['wechat reading', 'wechat-reading'],
  ['bilibili', 'bilibili'],
  ['xiaohongshu', 'xiaohongshu'],
  ['rednote', 'xiaohongshu'],
  ['cubox', 'cubox'],
  ['podcast', 'podcast'],
  ['mcp', 'mcp'],
  ['model context protocol', 'mcp'],
  ['claude', 'claude'],
  ['claude code', 'claude-code'],
  ['skill', 'skills'],
  ['skills', 'skills'],
  ['cli', 'cli'],
  ['api', 'api'],
  ['workflow', 'workflow'],
  ['automation', 'automation'],
  ['scraper', 'scraper'],
  ['crawler', 'scraper'],
  ['docker', 'docker'],
  ['kubernetes', 'kubernetes'],
  ['machine learning', 'machine-learning'],
  ['deep learning', 'deep-learning'],
  ['ai', 'ai'],
];

function inferTopics(repo, readmeText = '') {
  const topics = new Set();
  const lang = (repo.language || '').toLowerCase();

  if (LANGUAGE_TOPICS[lang]) {
    LANGUAGE_TOPICS[lang].forEach(t => topics.add(t));
  }

  const text = `${repo.name} ${repo.description || ''} ${readmeText}`.toLowerCase();

  for (const [keyword, topic] of TOPIC_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      topics.add(topic);
    }
  }

  // Keep existing topics from GitHub
  (repo.topics || []).forEach(t => topics.add(t));

  return Array.from(topics).slice(0, 20);
}

function generateDescription(repo, readmeText = '') {
  // If a clear description already exists, keep it.
  if (repo.description && repo.description.length > 10) {
    return repo.description;
  }

  const text = `${repo.name} ${readmeText}`.toLowerCase();
  const lang = repo.language || '';

  // Try to extract the first meaningful sentence from README
  const firstLine = readmeText.split('\n').find(line => {
    const trimmed = line.trim();
    return trimmed.length > 10 && trimmed.length < 200 && !trimmed.startsWith('#') && !trimmed.startsWith('![');
  });
  if (firstLine) {
    return firstLine.trim();
  }

  // Fallback templates based on detected keywords
  if (/\bmacos\b/i.test(text) && /\b(token|menu|bar)\b/i.test(text)) {
    return `A macOS menu-bar app for tracking API token usage.`;
  }
  if (/\brag\b/i.test(text) && /\bagent\b/i.test(text)) {
    return `A learning-oriented Agent/RAG system built with Python.`;
  }
  if (/\bknowledge\b/i.test(text) && /\bagent\b/i.test(text)) {
    return `An agent-driven knowledge ingestion workflow for personal note-taking tools.`;
  }
  if (/\bskill\b/i.test(text) && /\bai\b/i.test(text)) {
    return `A collection of reusable AI agent skills for coding and productivity.`;
  }

  return `A ${lang} project by ${repo.owner.login}.`;
}

function analyzeReadme(repo, readmeText = '') {
  const issues = [];

  if (!readmeText || readmeText.trim().length === 0) {
    issues.push('README is missing or empty. Add a README with project description, installation, and usage.');
    return issues;
  }

  const lower = readmeText.toLowerCase();

  const hasInstall =
    lower.includes('install') ||
    lower.includes('安装') ||
    lower.includes('インストール');
  const hasUsage =
    lower.includes('usage') ||
    lower.includes('example') ||
    lower.includes('使用') ||
    lower.includes('示例') ||
    lower.includes('例子') ||
    lower.includes('使い方') ||
    lower.includes('サンプル');
  const hasLicense =
    lower.includes('license') ||
    lower.includes('许可') ||
    lower.includes('许可证') ||
    lower.includes('ライセンス');

  if (!hasInstall) {
    issues.push('Consider adding an installation section.');
  }
  if (!hasUsage) {
    issues.push('Consider adding a usage or examples section.');
  }
  if (!hasLicense) {
    issues.push('Consider adding a license section or LICENSE file.');
  }
  if (readmeText.length < 500) {
    issues.push('README is quite short. Consider expanding with more details.');
  }
  if (!readmeText.includes('```')) {
    issues.push('Consider adding code examples in fenced code blocks.');
  }

  return issues;
}

async function fetchReadme(owner, repo) {
  try {
    const data = await getSingle(`/repos/${owner}/${repo}/readme`);
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
  } catch (err) {
    if (err.message && err.message.includes('404')) {
      return '';
    }
    throw err;
  }
  return '';
}

async function checkLicenseFile(owner, repo) {
  try {
    const contents = await getSingle(`/repos/${owner}/${repo}/contents`);
    if (!Array.isArray(contents)) return false;
    return contents.some(item => /^LICENSE/i.test(item.name));
  } catch (err) {
    return false;
  }
}

async function generateDraft(repoFullName) {
  const [owner, repoName] = repoFullName.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repo format. Use owner/repo.');
  }

  const repo = await getSingle(`/repos/${owner}/${repoName}`);
  const readmeText = await fetchReadme(owner, repoName);
  const hasLicenseFile = await checkLicenseFile(owner, repoName);

  const description = generateDescription(repo, readmeText);
  const topics = inferTopics(repo, readmeText);
  const readmeIssues = analyzeReadme(repo, readmeText);

  const licenseDisplay = repo.license
    ? repo.license.spdx_id
    : (hasLicenseFile ? 'LICENSE file exists (unrecognized)' : '(none)');

  const parts = [];

  parts.push(report.h1(`Repository Draft: ${repoFullName}`));
  parts.push(report.paragraph(`Generated at ${new Date().toISOString()}`));

  parts.push(report.h2('Current Metadata'));
  parts.push(report.table(
    ['Field', 'Current Value'],
    [
      ['Name', repo.name],
      ['Description', repo.description || '(none)'],
      ['Topics', (repo.topics || []).join(', ') || '(none)'],
      ['Homepage', repo.homepage || '(none)'],
      ['License', licenseDisplay],
      ['Language', repo.language || '(none)'],
      ['Visibility', repo.private ? 'private' : 'public'],
    ]
  ));

  parts.push(report.h2('Recommended Description'));
  parts.push(report.paragraph(description));

  parts.push(report.h2('Recommended Topics'));
  parts.push(report.list(topics.map(t => report.code(t))));

  parts.push(report.h2('README Analysis'));
  if (readmeText) {
    parts.push(report.paragraph(`README length: ${readmeText.length} characters`));
  } else {
    parts.push(report.paragraph('No README found.'));
  }

  if (readmeIssues.length > 0) {
    parts.push(report.h3('Suggestions'));
    parts.push(report.list(readmeIssues));
  } else {
    parts.push(report.paragraph('README looks good. No major issues detected.'));
  }

  parts.push(report.h2('Recommended README Structure'));
  parts.push(report.numberedList([
    `# ${repo.name} — one-line description`,
    '## Overview — what problem this project solves',
    '## Installation — how to install',
    '## Usage — how to use with code examples',
    '## Features — key features list',
    '## Contributing — how to contribute',
    '## License — license information',
  ]));

  parts.push(report.h2('How to Apply'));
  parts.push(report.paragraph('Review the recommendations above, then update the repository on GitHub. You can edit description and topics in the repository "About" section on GitHub.'));

  return parts.join('\n');
}

module.exports = {
  generateDraft,
  fetchReadme,
  inferTopics,
  generateDescription,
  analyzeReadme,
};
