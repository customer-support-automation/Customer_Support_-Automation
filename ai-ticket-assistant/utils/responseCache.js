import crypto from "crypto";

const cache = new Map();
const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

function getCacheKey(query) {
  return crypto.createHash("sha256").update(query.trim().toLowerCase()).digest("hex");
}

export function getCached(query) {
  const key = getCacheKey(query);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(query, value) {
  const key = getCacheKey(query);
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { value, timestamp: Date.now() });
}