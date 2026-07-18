const fs = require('fs');
const path = require('path');
const { getSingle } = require('./api');
const { fetchReadme } = require('./drafts');
const report = require('./report');

const HEADING_TO_KEY = new Map([
  // English
  ['overview', 'overview'],
  ['introduction', 'overview'],
  ['about', 'overview'],
  ['features', 'features'],
  ['feature', 'features'],
  ['installation', 'installation'],
  ['install', 'installation'],
  ['getting started', 'installation'],
  ['setup', 'installation'],
  ['usage', 'usage'],
  ['use', 'usage'],
  ['using', 'usage'],
  ['examples', 'usage'],
  ['example', 'usage'],
  ['contributing', 'contributing'],
  ['contribution', 'contributing'],
  ['contributions', 'contributing'],
  ['license', 'license'],
  ['licence', 'license'],
  // Chinese
  ['概述', 'overview'],
  ['简介', 'overview'],
  ['关于', 'overview'],
  ['功能', 'features'],
  ['特性', 'features'],
  ['安装', 'installation'],
  ['安装方法', 'installation'],
  ['快速开始', 'installation'],
  ['使用', 'usage'],
  ['使用方法', 'usage'],
  ['示例', 'usage'],
  ['例子', 'usage'],
  ['贡献', 'contributing'],
  ['参与贡献', 'contributing'],
  ['许可证', 'license'],
  ['协议', 'license'],
  // Japanese
  ['概要', 'overview'],
  ['紹介', 'overview'],
  ['機能', 'features'],
  ['インストール', 'installation'],
  ['使い方', 'usage'],
  ['使用例', 'usage'],
  ['貢献', 'contributing'],
  ['ライセンス', 'license'],
]);

function looksLikePackageName(name) {
  return /^[a-z0-9][a-z0-9_.\-]*$/i.test(name) && name.length <= 214;
}

async function checkManifestFile(owner, repoName, filenames) {
  try {
    const contents = await getSingle(`/repos/${owner}/${repoName}/contents`);
    if (!Array.isArray(contents)) return false;
    return contents.some(item => filenames.includes(item.name));
  } catch (err) {
    return false;
  }
}

async function detectEcosystemBadges(owner, repoName, repo) {
  const badges = [];
  const lang = (repo.language || '').toLowerCase();
  const name = repo.name || '';

  if (!looksLikePackageName(name)) {
    return badges;
  }

  if ((lang === 'javascript' || lang === 'typescript') && await checkManifestFile(owner, repoName, ['package.json'])) {
    badges.push(`[![npm version](https://img.shields.io/npm/v/${name})](https://www.npmjs.com/package/${name})`);
  }

  if (lang === 'python' && await checkManifestFile(owner, repoName, ['setup.py', 'pyproject.toml', 'setup.cfg'])) {
    badges.push(`[![PyPI version](https://img.shields.io/pypi/v/${name})](https://pypi.org/project/${name}/)`);
  }

  if (lang === 'rust' && await checkManifestFile(owner, repoName, ['Cargo.toml'])) {
    badges.push(`[![crates.io version](https://img.shields.io/crates/v/${name})](https://crates.io/crates/${name})`);
  }

  return badges;
}

function classifyHeading(title) {
  const lower = title.toLowerCase().trim();
  for (const [key, sectionKey] of HEADING_TO_KEY) {
    if (lower === key || lower.startsWith(key + ' ') || lower.includes(' ' + key)) {
      return sectionKey;
    }
  }
  return null;
}

function parseReadmeSections(readmeText) {
  if (!readmeText || !readmeText.trim()) {
    return { title: null, description: null, sections: [] };
  }

  const lines = readmeText.split('\n');
  const sections = [];
  let title = null;
  let description = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
      }

      if (level === 1 && !title) {
        title = headingText;
        currentSection = null;
      } else {
        currentSection = {
          level,
          title: headingText,
          key: classifyHeading(headingText),
          content: '',
        };
      }
      continue;
    }

    if (currentSection) {
      currentSection.content += line + '\n';
    } else if (!description) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('![') && !trimmed.startsWith('[![')) {
        description = trimmed;
      }
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return { title, description, sections };
}

function toAnchor(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '')
    .replace(/\s+/g, '-');
}

function isTocSection(section) {
  const tocTitles = new Set([
    'table of contents', 'contents', 'toc', '目录', '目次', 'tabla de contenidos',
    'inhaltsverzeichnis', 'table des matières',
  ]);
  const lower = section.title.toLowerCase().trim();
  if (!tocTitles.has(lower)) return false;

  const lines = section.content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return true;

  const linkLines = lines.filter(l => /^\s*[-*]\s*\[.+\]\(.+\)/.test(l));
  return linkLines.length / lines.length > 0.5;
}

function buildToc(sections) {
  return sections
    .filter(s => s.level === 2)
    .map(s => `- [${s.title}](#${toAnchor(s.title)})`)
    .join('\n');
}

function makeBadgeRow(owner, repoName) {
  const base = `${owner}/${repoName}`;
  const badges = [
    `![GitHub top language](https://img.shields.io/github/languages/top/${base})`,
    `![GitHub Repo stars](https://img.shields.io/github/stars/${base}?style=social)`,
    `![GitHub forks](https://img.shields.io/github/forks/${base}?style=social)`,
    `![GitHub License](https://img.shields.io/github/license/${base})`,
    `![GitHub Issues](https://img.shields.io/github/issues/${base})`,
    `![GitHub last commit](https://img.shields.io/github/last-commit/${base})`,
  ];
  return badges.join(' ');
}

function renderSection(section) {
  const heading = '#'.repeat(section.level) + ' ' + section.title;
  return section.content ? `${heading}\n\n${section.content}` : heading;
}

async function generateBeautifiedReadme(repoFullName, options = {}) {
  const [owner, repoName] = repoFullName.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repo format. Use owner/repo.');
  }

  const repo = await getSingle(`/repos/${owner}/${repoName}`);
  const readmeText = options.fromFile
    ? fs.readFileSync(path.resolve(options.fromFile), 'utf8')
    : await fetchReadme(owner, repoName);

  const { title, description, sections } = parseReadmeSections(readmeText);
  const repoTitle = title || repo.name;
  const repoDescription = repo.description || description || '';

  const coreBadges = makeBadgeRow(owner, repoName);
  const ecosystemBadges = await detectEcosystemBadges(owner, repoName, repo);
  const badgeLines = [coreBadges, ...ecosystemBadges].filter(Boolean).join('\n');

  const hasExistingToc = sections.some(s => isTocSection(s));
  const contentSections = sections.filter(s => !isTocSection(s));
  const toc = buildToc(contentSections);

  const parts = [];
  parts.push(report.h1(repoTitle));
  if (repoDescription) {
    parts.push(report.paragraph(repoDescription));
  }
  parts.push(report.paragraph(badgeLines));

  if (toc && !hasExistingToc) {
    parts.push(report.h2('Table of Contents'));
    parts.push(report.paragraph(toc));
  }

  for (const section of sections) {
    parts.push('\n' + renderSection(section));
  }

  parts.push(report.hr());
  parts.push(report.blockquote('This README is a generated draft. Please review and edit it before applying to the repository.'));

  return parts.join('\n').trim() + '\n';
}

module.exports = {
  generateBeautifiedReadme,
  detectEcosystemBadges,
  parseReadmeSections,
  buildToc,
};
