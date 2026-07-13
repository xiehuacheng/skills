function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[-_]/g, '')
    .replace(/skill$/g, '')
    .replace(/skills$/g, '')
    .trim();
}

function getSkillKey(item) {
  // Deduplicate by full skill identity: owner/repo@skill-name
  // A single GitHub repo can host multiple skills, so repo-level merging is wrong.
  return (item.skill_id || `${item.full_name}@${item.name}` || item.full_name || item.id || '')
    .toLowerCase()
    .trim();
}

function mergeCategories(categoriesA, categoriesB) {
  const set = new Set([...(categoriesA || []), ...(categoriesB || [])]);
  return Array.from(set);
}

function getRepoKey(fullName) {
  return String(fullName || '').toLowerCase().trim();
}

function dedupeAndMerge(items) {
  const map = new Map();

  for (const item of items) {
    const key = getSkillKey(item);
    if (!key || key === '/' || key === '@' || key === '') continue;

    if (map.has(key)) {
      const existing = map.get(key);

      // Merge fields, preferring non-empty values from either source
      map.set(key, {
        ...existing,
        ...item,
        name: item.name || existing.name,
        description: item.description || existing.description,
        categories: mergeCategories(existing.categories, item.categories),
        stars: item.stars || existing.stars || 0,
        rank_score: item.rank_score || existing.rank_score || 0,
        installs: item.installs || existing.installs || 0,
        rank: item.rank || existing.rank || null,
        // Track all sources
        sources: Array.from(new Set([...(existing.sources || [existing.source]), item.source])),
        // Keep the best URLs
        url: existing.url || item.url || item.source_url || existing.source_url,
        source_url: item.source_url || existing.source_url
      });
    } else {
      map.set(key, {
        ...item,
        sources: [item.source]
      });
    }
  }

  const merged = Array.from(map.values());

  // Repo-level fallback: some sources list a GitHub repo as a single skill
  // (e.g. agentskills.media's `affaan-m/ECC@ECC`), while skills-rank.com lists
  // individual skills inside the same repo (e.g. `affaan-m/ecc@security-scan`).
  // When a repo-level skill has no installs, borrow the highest installs found
  // for any skill in that repo.
  const repoMaxInstalls = new Map();
  for (const item of merged) {
    const repoKey = getRepoKey(item.full_name);
    if (!repoKey) continue;
    const installs = item.installs || item.rank_score || 0;
    if (installs > 0 && installs > (repoMaxInstalls.get(repoKey) || 0)) {
      repoMaxInstalls.set(repoKey, installs);
    }
  }

  for (const item of merged) {
    const hasInstalls = (item.installs || item.rank_score || 0) > 0;
    if (hasInstalls) continue;

    const repoKey = getRepoKey(item.full_name);
    const fallbackInstalls = repoKey ? repoMaxInstalls.get(repoKey) : undefined;
    if (fallbackInstalls && fallbackInstalls > 0) {
      item.installs = fallbackInstalls;
      if (!item.sources.includes('skills-rank.com')) {
        item.sources.push('skills-rank.com');
      }
    }
  }

  return merged;
}

function logScore(value, max) {
  // Log-scale normalization: reduces the dominance of extreme outliers
  // while still rewarding higher values. Returns 0-100.
  if (!value || value <= 0 || !max || max <= 0) return 0;
  const score = (Math.log10(value + 1) / Math.log10(max + 1)) * 100;
  return Math.min(Math.max(score, 0), 100);
}

function calculateHotScore(item) {
  // Use installs directly; rank_score from skills-rank.com is already expressed
  // as install count, so we treat them as the same signal.
  const installs = item.installs || item.rank_score || 0;

  const starsScore = logScore(item.stars || 0, 300_000);
  const installsScore = logScore(installs, 3_000_000);

  const hasStars = item.stars > 0;
  const hasInstalls = installs > 0;

  // Weight GitHub popularity slightly higher than real-world usage.
  let weights = { stars: 0.6, installs: 0.4 };

  // Redistribute weights when a metric is missing
  if (!hasStars || !hasInstalls) {
    const total = (hasStars ? 0.6 : 0) + (hasInstalls ? 0.4 : 0);
    weights = {
      stars: hasStars ? 0.6 / total : 0,
      installs: hasInstalls ? 0.4 / total : 0
    };
  }

  return starsScore * weights.stars + installsScore * weights.installs;
}

function sortByHotScore(items) {
  return items
    .map(item => ({ ...item, hot_score: calculateHotScore(item) }))
    .sort((a, b) => b.hot_score - a.hot_score);
}

module.exports = {
  dedupeAndMerge,
  sortByHotScore,
  calculateHotScore,
  normalizeName
};
