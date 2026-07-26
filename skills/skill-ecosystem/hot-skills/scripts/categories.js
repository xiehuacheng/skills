const CATEGORY_ALIASES = {
  frontend: ['Web Dev', 'UI/UX'],
  web: ['Web Dev'],
  webdev: ['Web Dev'],
  'web-development': ['Web Dev'],
  ui: ['UI/UX', 'Web Dev'],
  ux: ['UI/UX'],
  design: ['UI/UX', 'Web Dev'],
  'design-system': ['UI/UX'],
  accessibility: ['UI/UX'],
  react: ['Web Dev', 'UI/UX'],
  nextjs: ['Web Dev'],
  typescript: ['Web Dev'],
  css: ['Web Dev'],
  tailwind: ['Web Dev'],
  testing: ['Testing'],
  test: ['Testing'],
  jest: ['Testing'],
  playwright: ['Testing'],
  e2e: ['Testing'],
  security: ['Security'],
  devops: ['DevOps'],
  docker: ['DevOps'],
  kubernetes: ['DevOps'],
  k8s: ['DevOps'],
  deploy: ['DevOps'],
  deployment: ['DevOps'],
  'ci-cd': ['DevOps'],
  agent: ['AI Agents'],
  agents: ['AI Agents'],
  memory: ['Knowledge', 'AI Agents'],
  knowledge: ['Knowledge'],
  prompt: ['Prompts'],
  prompts: ['Prompts'],
  doc: ['Docs'],
  docs: ['Docs'],
  documentation: ['Docs'],
  'api-docs': ['Docs'],
  changelog: ['Docs'],
  readme: ['Docs'],
  automation: ['Automation'],
  workflow: ['Automation'],
  git: ['Automation'],
  productivity: ['Automation', 'Planning', 'Knowledge'],
  search: ['Search'],
  integration: ['Integrations'],
  integrations: ['Integrations'],
  data: ['Data'],
  review: ['Review'],
  lint: ['Review'],
  refactor: ['Review'],
  'best-practices': ['Review', 'Code Gen'],
  bestpractices: ['Review', 'Code Gen'],
  'code-quality': ['Review', 'Code Gen'],
  codequality: ['Review', 'Code Gen'],
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
