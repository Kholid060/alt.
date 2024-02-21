interface CacheContent<K, T> {
  id: K;
  value: T;
}

class MemoryCache<K = string, T = unknown> {
  private caches: Map<K, CacheContent<K, T>>;

  constructor() {
    this.caches = new Map();
  }

  add(id: K, value: T) {
    this.caches.set(id, { id, value });
  }

  get(id: K) {
    return this.caches.get(id);
  }

  has(id: K) {
    return this.caches.has(id);
  }

  clear() {
    this.caches = new Map();
  }
}

export default MemoryCache;
