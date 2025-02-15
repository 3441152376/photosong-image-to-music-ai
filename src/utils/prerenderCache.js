/**
 * 预渲染缓存管理器
 */
export class PrerenderCache {
  constructor() {
    this.cache = new Map()
    this.ttl = 3600000 // 1小时缓存
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  // 生成缓存键
  static generateKey(path, locale) {
    return `${locale}:${path}`
  }

  // 清除过期缓存
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 导出缓存实例
export const prerenderCache = new PrerenderCache() 