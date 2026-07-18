const fs = require('fs');
const path = require('path');
const { getSingle } = require('./api');
const { fetchReadme } = require('./drafts');
const report = require('./report');

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
    draftNote: 'This is a translated version. For the authoritative content, please refer to README.md.',
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
    draftNote: '本文为翻译版本，权威内容请以 README.md 为准。',
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
    draftNote: 'この文書は翻訳版です。正確な内容は README.md を参照してください。',
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
    draftNote: 'Esta es una versión traducida. Para el contenido autorizado, consulte README.md.',
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
    draftNote: 'Dies ist eine übersetzte Version. Der maßgebliche Inhalt befindet sich in README.md.',
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
    draftNote: "Ceci est une version traduite. Pour le contenu faisant autorité, veuillez consulter README.md.",
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
  if (!inputLangs) {
    return null;
  }

  let langs = inputLangs;
  if (typeof langs === 'string') {
    langs = langs.split(',').map(s => s.trim()).filter(Boolean);
  }

  return langs.filter(lang => SUPPORTED_LANGS.has(lang));
}

function buildSupportedLangsList() {
  return Array.from(SUPPORTED_LANGS)
    .map(code => `${code} (${LANG_DISPLAY[code]})`)
    .join(', ');
}

function detectSourceLanguage(readmeText) {
  if (!readmeText) return 'en';

  // Remove fenced code blocks, inline code, link URLs and standalone URLs so they
  // do not skew detection toward English. Also strip raw HTML tags and image URLs.
  const naturalText = readmeText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/<[^>]+>/g, ' ');

  const text = naturalText.replace(/\s/g, '');
  if (text.length === 0) return 'en';

  const counts = {
    zh: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
    ja: (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length,
    ko: (text.match(/[\uac00-\ud7af]/g) || []).length,
    en: (text.match(/[a-zA-Z]/g) || []).length,
  };

  // CJK characters carry more information per character than Latin letters.
  const weighted = {
    zh: counts.zh * 3,
    ja: counts.ja * 3,
    ko: counts.ko * 3,
    en: counts.en,
  };

  const max = Object.entries(weighted).sort((a, b) => b[1] - a[1])[0];
  if (max[1] === 0) return 'en';

  if (max[0] === 'ja') return 'ja';
  if (max[0] === 'ko') return 'en'; // Not supported as primary, fallback to en
  if (max[0] === 'zh') return 'zh';
  return 'en';
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

// Remove trailing "generated draft" notes that this script (or similar tools)
// may have appended to the README. Matches blocks surrounded by horizontal rules
// as well as plain trailing blockquotes that contain draft-related keywords.
function stripTrailingDraftNotes(readmeText) {
  if (!readmeText) return readmeText;

  const draftKeywords = [
    'draft', 'generated', 'automatically', 'automatic', 'auto-generated',
    '自动生成', '草稿', '自動生成', 'ドラフト',
    'borrador', 'generado', 'automáticamente',
    'entwurf', 'automatisch', 'erstellt',
    'brouillon', 'généré', 'automatiquement',
  ];
  const lowerKeywords = draftKeywords.map(k => k.toLowerCase());

  function containsDraftKeyword(text) {
    const lower = text.toLowerCase();
    return lowerKeywords.some(k => lower.includes(k));
  }

  let trimmed = readmeText.replace(/\s+$/, '');

  while (true) {
    // Pattern: optional hr, then one or more blockquote lines, then optional hr, at end.
    const hrBlockMatch = trimmed.match(/(\n-{3,}[ \t]*\n\n)(\n?>[ \t]*[^\n]*\n?)+(\n-{3,}[ \t]*\n?)?$/);
    if (hrBlockMatch) {
      const blockText = hrBlockMatch[0].replace(/\n/g, ' ');
      if (containsDraftKeyword(blockText)) {
        trimmed = trimmed.slice(0, -hrBlockMatch[0].length).replace(/\s+$/, '');
        continue;
      }
    }

    // Pattern: plain trailing blockquote(s).
    const bqMatch = trimmed.match(/(\n>[ \t]*[^\n]*)+$/);
    if (bqMatch) {
      const blockText = bqMatch[0].replace(/\n/g, ' ');
      if (containsDraftKeyword(blockText)) {
        trimmed = trimmed.slice(0, -bqMatch[0].length).replace(/\s+$/, '');
        continue;
      }
    }

    // Pattern: trailing hr after removing blockquotes.
    const trailingHrMatch = trimmed.match(/\n-{3,}[ \t]*\n?$/);
    if (trailingHrMatch) {
      trimmed = trimmed.slice(0, -trailingHrMatch[0].length).replace(/\s+$/, '');
      continue;
    }

    break;
  }

  return trimmed;
}

function isBadgeLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Markdown image/badge syntax or shields.io URLs
  return /^\[!\[/.test(trimmed) || /^!\[/.test(trimmed) || /shields\.io|badgen\.net|img\.shields/.test(trimmed);
}

function parseReadmeSections(readmeText) {
  if (!readmeText || !readmeText.trim()) {
    return { title: null, description: null, badges: [], sections: [] };
  }

  const lines = readmeText.split('\n');
  const sections = [];
  const badges = [];
  let title = null;
  let description = null;
  let currentSection = null;
  let foundH1 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      if (level === 1 && !title) {
        title = headingText;
        foundH1 = true;
        continue;
      }

      // h2+ heading: close current section and start a new one.
      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
      }
      currentSection = {
        level,
        title: headingText,
        key: classifyHeading(headingText),
        content: '',
      };
      continue;
    }

    if (currentSection) {
      currentSection.content += line + '\n';
    } else if (foundH1) {
      const trimmed = line.trim();
      if (isBadgeLine(trimmed)) {
        badges.push(trimmed);
      } else if (!description && trimmed && trimmed.length < 300) {
        description = trimmed;
      }
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return { title, description, badges, sections };
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

function buildSwitcher(currentLang, primaryLang, langs) {
  const isPrimary = currentLang === primaryLang;

  const items = langs.map(lang => {
    const label = LANG_DISPLAY[lang];
    if (lang === currentLang) {
      return report.bold(label);
    }

    let targetPath;
    if (lang === primaryLang) {
      targetPath = isPrimary ? './README.md' : '../README.md';
    } else {
      targetPath = isPrimary ? `./i18n/README.${lang}.md` : `./README.${lang}.md`;
    }

    return report.link(label, targetPath);
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

function buildReadme(repo, parsed, lang, primaryLang, langs) {
  const t = TRANSLATIONS[lang];
  const isPrimary = lang === primaryLang;
  const title = parsed.title || repo.name;
  const description = makeOneLiner(repo, lang, isPrimary, repo.description || parsed.description);

  const parts = [];
  parts.push(buildSwitcher(lang, primaryLang, langs));
  parts.push('');
  parts.push(`# ${title}`);
  parts.push('');
  parts.push(`> ${description}`);
  parts.push('');

  if (parsed.badges && parsed.badges.length > 0) {
    parts.push(parsed.badges.join(' '));
    parts.push('');
  }

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

  if (!isPrimary) {
    parts.push(`> ${t.draftNote}`);
    parts.push('');
  }

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

  const repo = await getSingle(`/repos/${owner}/${repoName}`);
  const readmeText = options.fromFile
    ? fs.readFileSync(path.resolve(options.fromFile), 'utf8')
    : await fetchReadme(owner, repoName);
  const sourceLang = detectSourceLanguage(readmeText);

  let langs = normalizeLangs(options.langs);
  if (!langs || langs.length === 0) {
    // No languages requested: default to the detected source language and
    // produce only the root README.
    langs = [sourceLang];
  }

  const primaryLang = langs[0];
  if (primaryLang !== sourceLang) {
    console.warn(
      `Warning: the original README appears to be in ${LANG_DISPLAY[sourceLang]}, ` +
      `but the primary output language is set to ${LANG_DISPLAY[primaryLang]}. ` +
      `Consider using --langs ${sourceLang},${langs.filter(l => l !== sourceLang).join(',')} so the source language stays as README.md.`
    );
  }

  const parsed = parseReadmeSections(stripTrailingDraftNotes(readmeText));

  const files = [];
  const descriptions = [];

  for (const lang of langs) {
    const filename = lang === primaryLang ? 'README.md' : `i18n/README.${lang}.md`;
    const content = buildReadme(repo, parsed, lang, primaryLang, langs);
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
