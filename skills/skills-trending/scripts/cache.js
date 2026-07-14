const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.cache', 'skills-trending');
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getCacheFile(cacheKey = 'default') {
  return path.join(CACHE_DIR, `cache-${cacheKey}.json`);
}

function readCache(cacheKey = 'default') {
  const cacheFile = getCacheFile(cacheKey);
  ensureDir(CACHE_DIR);
  if (!fs.existsSync(cacheFile)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch (err) {
    console.error('Failed to read cache:', err.message);
    return null;
  }
}

function writeCache(data, cacheKey = 'default') {
  const cacheFile = getCacheFile(cacheKey);
  ensureDir(CACHE_DIR);
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
}

function isExpired(cache, ttlMs = DEFAULT_TTL_MS) {
  if (!cache || !cache.timestamp) return true;
  return Date.now() - cache.timestamp > ttlMs;
}

function getCachedData(forceRefresh = false, ttlMs = DEFAULT_TTL_MS, cacheKey = 'default') {
  const cache = readCache(cacheKey);
  if (forceRefresh || !cache || isExpired(cache, ttlMs)) {
    return null;
  }
  return cache.data;
}

function saveCachedData(data, cacheKey = 'default') {
  writeCache({
    timestamp: Date.now(),
    data
  }, cacheKey);
}

function getPreviousData(cacheKey = 'default') {
  const cache = readCache(cacheKey);
  return cache && cache.data ? cache.data : null;
}

module.exports = {
  getCachedData,
  saveCachedData,
  getPreviousData,
  DEFAULT_TTL_MS
};
