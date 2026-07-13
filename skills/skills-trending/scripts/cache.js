const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.cache', 'skills-trending');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const SITEMAP_CACHE_FILE = path.join(CACHE_DIR, 'sitemap_urls.json');
const SITEMAP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readCache() {
  ensureDir(CACHE_DIR);
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to read cache:', err.message);
    return null;
  }
}

function writeCache(data) {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function isExpired(cache, ttlMs = DEFAULT_TTL_MS) {
  if (!cache || !cache.timestamp) return true;
  return Date.now() - cache.timestamp > ttlMs;
}

function getCachedData(forceRefresh = false, ttlMs = DEFAULT_TTL_MS) {
  const cache = readCache();
  if (forceRefresh || !cache || isExpired(cache, ttlMs)) {
    return null;
  }
  return cache.data;
}

function saveCachedData(data) {
  writeCache({
    timestamp: Date.now(),
    data
  });
}

function getPreviousData() {
  const cache = readCache();
  return cache && cache.data ? cache.data : null;
}

function getCachedSitemapUrls(forceRefresh = false) {
  if (forceRefresh || !fs.existsSync(SITEMAP_CACHE_FILE)) {
    return null;
  }
  try {
    const cache = JSON.parse(fs.readFileSync(SITEMAP_CACHE_FILE, 'utf8'));
    if (isExpired(cache, SITEMAP_TTL_MS)) return null;
    return cache.data;
  } catch (err) {
    console.error('Failed to read sitemap cache:', err.message);
    return null;
  }
}

function saveCachedSitemapUrls(urls) {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(SITEMAP_CACHE_FILE, JSON.stringify({
    timestamp: Date.now(),
    data: urls
  }, null, 2));
}

module.exports = {
  getCachedData,
  saveCachedData,
  getPreviousData,
  DEFAULT_TTL_MS,
  getCachedSitemapUrls,
  saveCachedSitemapUrls
};
