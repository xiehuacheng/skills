const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.resolve(__dirname, '..', '.cache');
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (err) {
      throw new Error(`Failed to create cache directory ${CACHE_DIR}: ${err.message}`);
    }
  }
}

function getCachePath(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

function isExpired(mtime, ttlMs) {
  return Date.now() - mtime > ttlMs;
}

function get(key, options = {}) {
  const { ttlMs = DEFAULT_TTL_MS, refresh = false } = options;

  if (refresh) return null;

  const cachePath = getCachePath(key);
  if (!fs.existsSync(cachePath)) return null;

  const stats = fs.statSync(cachePath);
  if (isExpired(stats.mtimeMs, ttlMs)) return null;

  try {
    const data = fs.readFileSync(cachePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Cache read failed for ${cachePath}: ${err.message}. Try running with --refresh to rebuild the cache.`);
    return null;
  }
}

function set(key, data) {
  ensureCacheDir();
  const cachePath = getCachePath(key);
  try {
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error(`Failed to write cache ${cachePath}: ${err.message}`);
  }
}

function clear(key) {
  const cachePath = getCachePath(key);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
}

module.exports = {
  get,
  set,
  clear,
  getCachePath,
};
