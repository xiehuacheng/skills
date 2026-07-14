const CATEGORY_ALIASES = {
  frontend: ['Web Dev', 'UI/UX'],
  ui: ['UI/UX', 'Web Dev'],
  design: ['UI/UX', 'Web Dev'],
  react: ['Web Dev', 'UI/UX'],
  testing: ['Testing'],
  test: ['Testing'],
  security: ['Security'],
  devops: ['DevOps'],
  docker: ['DevOps'],
  kubernetes: ['DevOps'],
  k8s: ['DevOps'],
  agent: ['AI Agents'],
  agents: ['AI Agents'],
  memory: ['Knowledge', 'AI Agents'],
  knowledge: ['Knowledge'],
  prompt: ['Prompts'],
  prompts: ['Prompts'],
  doc: ['Docs'],
  docs: ['Docs'],
  documentation: ['Docs'],
  automation: ['Automation'],
  search: ['Search'],
  integration: ['Integrations'],
  integrations: ['Integrations'],
  data: ['Data'],
  review: ['Review'],
  planning: ['Planning'],
  game: ['Game Dev'],
  gamedev: ['Game Dev'],
  writing: ['Writing'],
  code: ['Code Gen'],
  codegen: ['Code Gen'],
  general: ['General'],
  awesome: ['Awesome List']
};

function itemSearchText(item) {
  return [
    item.name,
    item.full_name,
    item.description,
    ...(item.topics || []),
    ...(item.categories || [])
  ].join(' ').toLowerCase();
}

function filterByCategory(items, category) {
  const query = category.toLowerCase().trim();
  const matchedCategories = new Set(CATEGORY_ALIASES[query] || [query]);

  return items.filter(item => {
    // Match normalized categories
    const categoryMatch = item.categories && item.categories.some(c =>
      Array.from(matchedCategories).some(mc => c.toLowerCase().includes(mc.toLowerCase()))
    );

    // Also match name/description/topics against the query directly
    const textMatch = itemSearchText(item).includes(query);

    return categoryMatch || textMatch;
  });
}

function filterBySearch(items, query) {
  const q = query.toLowerCase();
  return items.filter(item => itemSearchText(item).includes(q));
}

module.exports = {
  CATEGORY_ALIASES,
  filterByCategory,
  filterBySearch
};
