function escapeMarkdown(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\n/g, ' ');
}

function h1(text) {
  return `# ${text}\n`;
}

function h2(text) {
  return `\n## ${text}\n`;
}

function h3(text) {
  return `\n### ${text}\n`;
}

function paragraph(text) {
  return `\n${text}\n`;
}

function link(text, url) {
  return `[${escapeMarkdown(text)}](${url})`;
}

function bold(text) {
  return `**${escapeMarkdown(text)}**`;
}

function code(text) {
  return `\`${text}\``;
}

function table(headers, rows) {
  if (!rows || rows.length === 0) return '';

  const safeHeaders = headers.map(h => escapeMarkdown(h));
  const lines = [
    `| ${safeHeaders.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];

  for (const row of rows) {
    const safeRow = row.map(cell => {
      // Preserve existing markdown links; escape plain text only
      if (typeof cell === 'string' && /\]\(/.test(cell)) {
        return cell;
      }
      return escapeMarkdown(cell);
    });
    lines.push(`| ${safeRow.join(' | ')} |`);
  }

  return '\n' + lines.join('\n') + '\n';
}

function list(items) {
  if (!items || items.length === 0) return '';
  return '\n' + items.map(item => `- ${item}`).join('\n') + '\n';
}

function numberedList(items) {
  if (!items || items.length === 0) return '';
  return '\n' + items.map((item, i) => `${i + 1}. ${item}`).join('\n') + '\n';
}

function hr() {
  return '\n---\n';
}

function blockquote(text) {
  return `\n> ${text.split('\n').join('\n> ')}\n`;
}

function section(title, content) {
  return `\n## ${title}\n\n${content}\n`;
}

function join(...parts) {
  return parts.filter(Boolean).join('\n');
}

module.exports = {
  escapeMarkdown,
  h1,
  h2,
  h3,
  paragraph,
  link,
  bold,
  code,
  table,
  list,
  numberedList,
  hr,
  blockquote,
  section,
  join,
};
