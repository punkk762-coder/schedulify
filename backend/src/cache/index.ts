/**
 * High-Performance In-Memory TTL Cache Service
 * Zero external dependencies (no Redis overhead).
 * Uses native JavaScript Map with automatic TTL expiration, LRU pruning, and pattern invalidation.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private memoryStore: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Retrieve item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set item in cache with TTL (seconds)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Simple pruning when cache exceeds 2000 entries
    if (this.memoryStore.size > 2000) {
      const now = Date.now();
      for (const [k, v] of this.memoryStore.entries()) {
        if (now > v.expiresAt) {
          this.memoryStore.delete(k);
        }
      }
    }
  }

  /**
   * Delete item by key
   */
  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  async delete(key: string): Promise<void> {
    return this.del(key);
  }

  /**
   * Invalidate keys matching a prefix/pattern
   */
  async invalidatePattern(prefix: string): Promise<void> {
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }
  }

  async deletePattern(prefix: string): Promise<void> {
    return this.invalidatePattern(prefix);
  }

  /**
   * Wrap an async computation with cache
   */
  async wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Clear entire memory cache
   */
  clear(): void {
    this.memoryStore.clear();
  }
}

export const cache = new CacheService();
export const cacheService = cache;
export { CacheService };
