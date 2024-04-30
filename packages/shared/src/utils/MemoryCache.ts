interface CacheContent<K, T> {
  id: K;
  value: T;
  addedAt: number;
}

class MemoryCache<K = string, T = unknown> {
  private caches: Map<K, CacheContent<K, T>>;

  constructor() {
    this.caches = new Map();
  }

  add(id: K, value: T) {
    this.caches.set(id, { id, value, addedAt: Date.now() });
  }

  get<R = T>(id: K) {
    return (this.caches.get(id) ?? null) as CacheContent<K, R> | null;
  }

  has(id: K) {
    return this.caches.has(id);
  }

  clear() {
    this.caches = new Map();
  }
}

export default MemoryCache;
