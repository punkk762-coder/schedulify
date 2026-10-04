/**
 * High-performance Cache Service
 * Supports in-memory TTL/LRU caching by default.
 * Automatically switches to Redis when REDIS_URL or REDIS_HOST is provided in env.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private memoryStore: Map<string, CacheEntry<unknown>> = new Map();
  private redisClient: any = null;
  private isRedisActive = false;

  constructor() {
    this.initRedisIfAvailable();
  }

  private async initRedisIfAvailable() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    if (redisUrl) {
      try {
        // Optional dynamic import for ioredis if installed
        // If not installed, falls back to in-memory gracefully
        const Redis = (await import("ioredis" as any)).default;
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
        await this.redisClient.connect();
        this.isRedisActive = true;
        console.log("⚡ [Cache] Connected to Redis instance");
      } catch (err) {
        console.warn("⚠️ [Cache] Redis configured but client not ready. Using high-speed in-memory cache.", err);
        this.isRedisActive = false;
      }
    }
  }

  /**
   * Retrieve item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisActive && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        // Fallback to memory if Redis error
      }
    }

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
    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
      } catch {
        // Fallback to memory if Redis error
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Simple LRU cleanup if store exceeds 2000 entries
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
    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {}
    }
    this.memoryStore.delete(key);
  }

  async delete(key: string): Promise<void> {
    return this.del(key);
  }

  /**
   * Invalidate keys matching a prefix/pattern
   */
  async invalidatePattern(prefix: string): Promise<void> {
    if (this.isRedisActive && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch {}
    }

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
}

export const cache = new CacheService();
export const cacheService = cache;
export { CacheService };
