const { fetchStars } = require('./stars');
const {
  getLists,
  createList,
  updateList,
  deleteList,
  setRepoLists,
} = require('./lists');
const report = require('./report');

function generateDraftReport(repos, existingLists) {
  const parts = [];
  parts.push(report.h1('GitHub Stars Classification Input'));
  parts.push(report.paragraph(`Generated at ${new Date().toISOString()}`));
  parts.push(report.paragraph(`Total starred repositories: ${repos.length}`));
  parts.push(report.paragraph(`Existing Lists: ${existingLists.length}`));

  if (existingLists.length > 0) {
    parts.push(report.h2('Existing Lists'));
    parts.push(report.table(
      ['List', 'Description', 'Repositories'],
      existingLists.map(l => [
        l.name,
        l.description || '-',
        l.repos.length,
      ])
    ));
  }

  parts.push(report.h2('Starred Repositories'));
  parts.push(report.paragraph('Design a classification by grouping these repositories into logical GitHub Lists. Consider language, topics, description, and current lists.'));
  parts.push(report.table(
    ['Repository', 'Language', 'Current Lists', 'Description', 'Topics'],
    repos.map(repo => {
      const currentLists = existingLists
        .filter(l => l.repos.includes(repo.full_name))
        .map(l => l.name)
        .join(', ') || '-';
      return [
        report.link(repo.full_name, repo.html_url),
        repo.language || '-',
        currentLists,
        repo.description || '-',
        (repo.topics || []).join(', ') || '-',
      ];
    })
  ));

  parts.push(report.h2('Classification Template'));
  parts.push(report.paragraph('Use this JSON shape to build the classification plan. Replace the example values with your own design.'));
  parts.push(codeBlock('json', JSON.stringify({
    listsToCreate: [
      { name: 'AI Agents', description: 'Agent frameworks and assistants' },
    ],
    listsToUpdate: [
      { listId: 'EXISTING_LIST_ID', name: 'RAG', description: 'RAG tools' },
    ],
    listsToDelete: ['UNUSED_LIST_ID'],
    repoAssignments: [
      { repoFullName: 'owner/repo', listIds: ['LIST_ID_1', 'LIST_ID_2'] },
    ],
  }, null, 2)));

  parts.push(report.h2('Next Steps'));
  parts.push(report.numberedList([
    'Review the starred repositories above.',
    'Design a set of GitHub Lists that groups them logically.',
    'Present the proposed lists and repository assignments to the user as a table.',
    'Incorporate user feedback and produce a final classification plan JSON.',
    'Apply the plan directly by piping it via stdin: node scripts/github-asset-manager.js classify --apply --plan -',
  ]));

  return parts.join('\n');
}

function codeBlock(language, content) {
  return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
}

async function generateDraft(user, options = {}) {
  const { refresh = false } = options;
  const [repos, existingLists] = await Promise.all([
    fetchStars(user, refresh),
    getLists(),
  ]);

  return generateDraftReport(repos, existingLists);
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('Invalid classification plan: expected object');
  }

  const listsToCreate = plan.listsToCreate || [];
  const listsToUpdate = plan.listsToUpdate || [];
  const listsToDelete = plan.listsToDelete || [];
  const repoAssignments = plan.repoAssignments || [];

  for (const item of listsToCreate) {
    if (!item.name) throw new Error('Invalid plan: listToCreate missing name');
  }

  for (const item of listsToUpdate) {
    if (!item.listId || !item.name) throw new Error('Invalid plan: listToUpdate missing listId or name');
  }

  for (const item of repoAssignments) {
    if (!item.repoFullName || !Array.isArray(item.listIds)) {
      throw new Error('Invalid plan: repoAssignment missing repoFullName or listIds');
    }
  }

  return { listsToCreate, listsToUpdate, listsToDelete, repoAssignments };
}

async function applyClassification(plan, options = {}) {
  const { delayMs = 200 } = options;
  const { listsToCreate, listsToUpdate, listsToDelete, repoAssignments } = validatePlan(plan);

  const created = [];
  const updated = [];
  const deleted = [];
  const assigned = [];
  const failed = [];

  // Create new lists
  for (const item of listsToCreate) {
    try {
      const list = await createList(item.name, item.description || '');
      created.push({ name: item.name, id: list.id });
      await sleep(delayMs);
    } catch (err) {
      failed.push({ action: 'create', name: item.name, error: err.message });
    }
  }

  // Update existing lists
  for (const item of listsToUpdate) {
    try {
      await updateList(item.listId, item.name, item.description || '');
      updated.push({ name: item.name, id: item.listId });
      await sleep(delayMs);
    } catch (err) {
      failed.push({ action: 'update', name: item.name, error: err.message });
    }
  }

  // Build name -> id map for newly created lists
  const listIdByName = {};
  for (const item of created) listIdByName[item.name] = item.id;

  // Assign repos to lists
  for (const item of repoAssignments) {
    try {
      const listIds = item.listIds.map(id => listIdByName[id] || id);
      await setRepoLists(item.repoFullName, listIds);
      assigned.push({ repo: item.repoFullName, listIds });
      await sleep(delayMs);
    } catch (err) {
      failed.push({ action: 'assign', repo: item.repoFullName, error: err.message });
    }
  }

  // Delete obsolete lists
  for (const listId of listsToDelete) {
    try {
      await deleteList(listId);
      deleted.push(listId);
      await sleep(delayMs);
    } catch (err) {
      failed.push({ action: 'delete', listId, error: err.message });
    }
  }

  return { created, updated, deleted, assigned, failed };
}

function generateApplySummary(result) {
  const parts = [];
  parts.push(report.h1('GitHub Lists Classification Summary'));

  parts.push(report.table(
    ['Action', 'Count'],
    [
      ['Created', result.created.length],
      ['Updated', result.updated.length],
      ['Deleted', result.deleted.length],
      ['Assigned', result.assigned.length],
      ['Failed', result.failed.length],
    ]
  ));

  if (result.created.length > 0) {
    parts.push(report.h2('Created Lists'));
    parts.push(report.list(result.created.map(c => `${c.name} (${c.id})`)));
  }

  if (result.updated.length > 0) {
    parts.push(report.h2('Updated Lists'));
    parts.push(report.list(result.updated.map(u => u.name)));
  }

  if (result.deleted.length > 0) {
    parts.push(report.h2('Deleted Lists'));
    parts.push(report.list(result.deleted));
  }

  if (result.failed.length > 0) {
    parts.push(report.h2('Failed Operations'));
    parts.push(report.table(
      ['Action', 'Target', 'Error'],
      result.failed.map(f => [f.action, f.name || f.repo || f.listId || '-', f.error])
    ));
  }

  return parts.join('\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateDraft,
  applyClassification,
  generateApplySummary,
};
