function formatNumber(num) {
  if (!num || num === 0) return '-';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatCategories(categories) {
  if (!categories || categories.length === 0) return 'General';
  return categories.join(', ');
}

function truncate(text, maxLength = 80) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function formatInstallHint() {
  return '\n**Install:** `npx skills add <Skill>`（将 `<Skill>` 替换为表格中 `Skill` 列的值）\n';
}

function formatTopTable(items, topN = 20) {
  const topItems = items.slice(0, topN);
  
  let output = `## Top ${topN} Hot Skills\n\n`;
  output += '| Rank | Skill | Stars | Installs | Hot Score | Category | Description |\n';
  output += '|-----:|------|------:|---------:|----------:|:---------|:------------|\n';
  
  topItems.forEach((item, index) => {
    const rank = index + 1;
    const name = item.skill_id || `${item.full_name}@${item.name}` || item.full_name || item.name;
    const stars = formatNumber(item.stars);
    const installs = formatNumber(item.installs);
    const score = item.hot_score ? item.hot_score.toFixed(1) : '-';
    const categories = formatCategories(item.categories);
    const description = truncate(item.description);
    
    output += `| ${rank} | \`${name}\` | ${stars} | ${installs} | ${score} | ${categories} | ${description} |\n`;
  });
  
  output += formatInstallHint();
  return output;
}

function formatByCategory(items, categories, topN = null) {
  const displayItems = topN ? items.slice(0, topN) : items;

  if (displayItems.length === 0) {
    return 'No skills found for the specified categories.\n';
  }

  const title = Array.isArray(categories) ? categories.join(', ') : String(categories);
  let output = `## Category: ${title}\n\n`;
  output += '| Rank | Skill | Stars | Installs | Category | Description |\n';
  output += '|-----:|------|------:|---------:|:---------|:------------|\n';

  displayItems.forEach((item, index) => {
    const name = item.skill_id || `${item.full_name}@${item.name}` || item.full_name || item.name;
    const stars = formatNumber(item.stars);
    const installs = formatNumber(item.installs);
    const categoriesStr = formatCategories(item.categories);
    const description = truncate(item.description, 60);
    output += `| ${index + 1} | \`${name}\` | ${stars} | ${installs} | ${categoriesStr} | ${description} |\n`;
  });

  output += formatInstallHint();
  return output;
}

function formatSearchResults(items, query) {
  if (items.length === 0) {
    return `No skills found matching "${query}".\n`;
  }
  
  let output = `## Search Results for "${query}"\n\n`;
  output += '| Skill | Stars | Installs | Category | Description |\n';
  output += '|------|------:|---------:|:---------|:------------|\n';
  
  items.forEach(item => {
    const name = item.skill_id || `${item.full_name}@${item.name}` || item.full_name || item.name;
    const stars = formatNumber(item.stars);
    const installs = formatNumber(item.installs);
    const categories = formatCategories(item.categories);
    const description = truncate(item.description, 60);
    output += `| \`${name}\` | ${stars} | ${installs} | ${categories} | ${description} |\n`;
  });
  
  output += formatInstallHint();
  return output;
}

module.exports = {
  formatTopTable,
  formatByCategory,
  formatSearchResults,
  formatNumber
};
