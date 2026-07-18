const fs = require('fs');
const path = require('path');
const { getSingle } = require('./api');
const { fetchReadme } = require('./drafts');
const report = require('./report');

const DEFAULT_LANGS = ['en', 'zh'];
const SUPPORTED_LANGS = new Set(['en', 'zh', 'ja', 'es', 'de', 'fr']);

const LANG_DISPLAY = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};

const TRANSLATIONS = {
  en: {
    displayName: 'English',
    fallbackLanguageName: 'software',
    descriptionTemplate: (lang, owner) => `A ${lang} project by ${owner}.`,
    toc: 'Table of Contents',
    draftNote: 'This README is a generated multilingual draft. Original content is preserved; section headings are translated.',
    sectionTitles: {
      overview: 'Overview',
      features: 'Features',
      installation: 'Installation',
      usage: 'Usage',
      contributing: 'Contributing',
      license: 'License',
    },
  },
  zh: {
    displayName: '中文',
    fallbackLanguageName: '软件',
    descriptionTemplate: (lang, owner) => `由 ${owner} 维护的 ${lang} 项目。`,
    toc: '目录',
    draftNote: '本 README 为自动生成的多语言草稿，正文保留了原始内容，章节标题已翻译。',
    sectionTitles: {
      overview: '概述',
      features: '功能',
      installation: '安装',
      usage: '使用',
      contributing: '贡献',
      license: '许可证',
    },
  },
  ja: {
    displayName: '日本語',
    fallbackLanguageName: 'ソフトウェア',
    descriptionTemplate: (lang, owner) => `${owner} の ${lang} プロジェクト。`,
    toc: '目次',
    draftNote: 'この README は自動生成された多言語ドラフトです。本文は元の内容を保持し、セクション見出しを翻訳しています。',
    sectionTitles: {
      overview: '概要',
      features: '機能',
      installation: 'インストール',
      usage: '使い方',
      contributing: '貢献',
      license: 'ライセンス',
    },
  },
  es: {
    displayName: 'Español',
    fallbackLanguageName: 'software',
    descriptionTemplate: (lang, owner) => `Un proyecto de ${lang} por ${owner}.`,
    toc: 'Tabla de contenidos',
    draftNote: 'Este README es un borrador multilingüe generado automáticamente. Se conserva el contenido original; los títulos de sección están traducidos.',
    sectionTitles: {
      overview: 'Descripción general',
      features: 'Características',
      installation: 'Instalación',
      usage: 'Uso',
      contributing: 'Contribuciones',
      license: 'Licencia',
    },
  },
  de: {
    displayName: 'Deutsch',
    fallbackLanguageName: 'Software',
    descriptionTemplate: (lang, owner) => `Ein ${lang}-Projekt von ${owner}.`,
    toc: 'Inhaltsverzeichnis',
    draftNote: 'Dieses README ist ein automatisch erstellter mehrsprachiger Entwurf. Der ursprüngliche Inhalt bleibt erhalten; die Abschnittsüberschriften sind übersetzt.',
    sectionTitles: {
      overview: 'Überblick',
      features: 'Funktionen',
      installation: 'Installation',
      usage: 'Nutzung',
      contributing: 'Mitwirken',
      license: 'Lizenz',
    },
  },
  fr: {
    displayName: 'Français',
    fallbackLanguageName: 'logiciel',
    descriptionTemplate: (lang, owner) => `Un projet ${lang} par ${owner}.`,
    toc: 'Table des matières',
    draftNote: "Ce README est un brouillon multilingue généré automatiquement. Le contenu original est conservé ; les titres de section sont traduits.",
    sectionTitles: {
      overview: 'Aperçu',
      features: 'Fonctionnalités',
      installation: 'Installation',
      usage: 'Utilisation',
      contributing: 'Contribution',
      license: 'Licence',
    },
  },
};

// Mapping from common source-language headings to section keys.
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
  // Spanish
  ['descripción general', 'overview'],
  ['características', 'features'],
  ['instalación', 'installation'],
  ['uso', 'usage'],
  ['ejemplos', 'usage'],
  ['contribuciones', 'contributing'],
  ['licencia', 'license'],
  // German
  ['überblick', 'overview'],
  ['funktionen', 'features'],
  ['installation', 'installation'],
  ['nutzung', 'usage'],
  ['beispiele', 'usage'],
  ['mitwirken', 'contributing'],
  ['lizenz', 'license'],
  // French
  ['aperçu', 'overview'],
  ['fonctionnalités', 'features'],
  ['installation', 'installation'],
  ['utilisation', 'usage'],
  ['exemples', 'usage'],
  ['contribution', 'contributing'],
  ['licence', 'license'],
]);

function parseRepoFullName(repoFullName) {
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid repo format. Use owner/repo.');
  }
  return { owner, repo };
}

function normalizeLangs(inputLangs) {
  let langs = inputLangs || DEFAULT_LANGS;

  if (typeof langs === 'string') {
    langs = langs.split(',').map(s => s.trim()).filter(Boolean);
  }

  langs = langs.filter(lang => SUPPORTED_LANGS.has(lang));

  if (langs.length === 0) {
    return [...DEFAULT_LANGS];
  }

  return langs;
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
      if (trimmed && !trimmed.startsWith('![') && !trimmed.startsWith('[![') && trimmed.length < 300) {
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

function translateHeading(section, lang) {
  const t = TRANSLATIONS[lang];
  if (section.key && t.sectionTitles[section.key]) {
    return t.sectionTitles[section.key];
  }
  return section.title;
}

function toAnchor(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '')
    .replace(/\s+/g, '-');
}

function buildSwitcher(currentLang, langs) {
  const primaryLang = langs[0];
  const items = langs.map(lang => {
    const label = LANG_DISPLAY[lang];
    const filename = lang === primaryLang ? 'README.md' : `README.${lang}.md`;
    if (lang === currentLang) {
      return report.bold(label);
    }
    return report.link(label, `./${filename}`);
  });

  return items.join(' | ');
}

function buildToc(sections, lang) {
  const t = TRANSLATIONS[lang];
  const topLevelSections = sections.filter(s => s.level === 2);
  if (topLevelSections.length === 0) return '';

  const items = topLevelSections.map(s => {
    const title = translateHeading(s, lang);
    return `- [${title}](#${toAnchor(title)})`;
  });

  return `## ${t.toc}\n\n${items.join('\n')}\n`;
}

function makeOneLiner(repo, lang, isPrimary, originalDescription) {
  if (isPrimary && originalDescription) {
    return originalDescription;
  }

  const t = TRANSLATIONS[lang];
  const languageName = repo.language || t.fallbackLanguageName;
  return t.descriptionTemplate(languageName, repo.owner.login);
}

function buildReadme(repo, parsed, lang, langs) {
  const t = TRANSLATIONS[lang];
  const isPrimary = lang === langs[0];
  const title = parsed.title || repo.name;
  const description = makeOneLiner(repo, lang, isPrimary, repo.description || parsed.description);

  const parts = [];
  parts.push(buildSwitcher(lang, langs));
  parts.push('');
  parts.push(`# ${title}`);
  parts.push('');
  parts.push(`> ${description}`);
  parts.push('');

  const contentSections = parsed.sections.filter(s => !isTocSection(s));

  if (contentSections.length > 0) {
    parts.push(buildToc(contentSections, lang));
  }

  for (const section of contentSections) {
    const translatedTitle = translateHeading(section, lang);
    const heading = '#'.repeat(section.level) + ' ' + translatedTitle;
    parts.push(heading);
    parts.push('');
    if (section.content) {
      parts.push(section.content);
      parts.push('');
    }
  }

  parts.push(`> ${t.draftNote}`);
  parts.push('');

  return parts.join('\n').trim() + '\n';
}

function buildSummary(repoFullName, files, descriptions) {
  const primary = descriptions.find(d => d.primary);
  const alternatives = descriptions.filter(d => !d.primary);

  const parts = [];

  parts.push(report.h1(`i18n Assets: ${repoFullName}`));
  parts.push(report.paragraph(`Generated at ${new Date().toISOString()}`));

  parts.push(report.h2('Generated Files'));
  parts.push(report.table(
    ['Language', 'Filename'],
    files.map(f => [LANG_DISPLAY[f.lang], report.code(f.filename)])
  ));

  parts.push(report.h2('Recommended About Description'));
  parts.push(report.paragraph(`${report.bold(LANG_DISPLAY[primary.lang])}: ${primary.text}`));
  parts.push(report.paragraph('GitHub only supports one repository description. The primary language description above is the recommended About text.'));

  if (alternatives.length > 0) {
    parts.push(report.h2('Alternative Descriptions'));
    parts.push(report.list(alternatives.map(d => `${report.bold(LANG_DISPLAY[d.lang])}: ${d.text}`)));
  }

  return parts.join('\n');
}

async function generateI18n(repoFullName, options = {}) {
  const { owner, repo: repoName } = parseRepoFullName(repoFullName);
  const langs = normalizeLangs(options.langs);
  const primaryLang = langs[0];

  const repo = await getSingle(`/repos/${owner}/${repoName}`);
  const readmeText = options.fromFile
    ? fs.readFileSync(path.resolve(options.fromFile), 'utf8')
    : await fetchReadme(owner, repoName);
  const parsed = parseReadmeSections(readmeText);

  const files = [];
  const descriptions = [];

  for (const lang of langs) {
    const filename = lang === primaryLang ? 'README.md' : `README.${lang}.md`;
    const content = buildReadme(repo, parsed, lang, langs);
    const text = makeOneLiner(repo, lang, lang === primaryLang, repo.description || parsed.description);

    files.push({ lang, filename, content });
    descriptions.push({ lang, text, primary: lang === primaryLang });
  }

  const summaryMarkdown = buildSummary(repoFullName, files, descriptions);

  return {
    primaryLang,
    langs,
    files,
    descriptions,
    summaryMarkdown,
  };
}

module.exports = {
  generateI18n,
};
