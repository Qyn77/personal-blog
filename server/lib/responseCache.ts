type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export function createResponseCache(
  defaultTtlMs: number,
  maxEntries: number = 200
) {
  const store = new Map<string, CacheEntry<unknown>>();
  let writeCount = 0;

  const removeExpired = (now: number) => {
    store.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    });
  };

  const evictOldest = () => {
    while (store.size > maxEntries) {
      const oldestKey = store.keys().next().value as string | undefined;
      if (!oldestKey) break;
      store.delete(oldestKey);
    }
  };

  const get = <T>(key: string): T | null => {
    const cached = store.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      store.delete(key);
      return null;
    }
    return cached.value as T;
  };

  const set = <T>(key: string, value: T, ttlMs: number = defaultTtlMs) => {
    const now = Date.now();
    writeCount = (writeCount + 1) % 20;
    if (writeCount === 0) {
      removeExpired(now);
    }
    store.set(key, {
      value,
      expiresAt: now + ttlMs,
    });
    evictOldest();
  };

  return { get, set };
}
