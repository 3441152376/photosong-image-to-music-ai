// 创建一个简单的内存缓存
const memoryCache = new Map()

// 创建一个 LRU 缓存类
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key) {
    if (!this.cache.has(key)) return null
    
    // 获取值并移动到最新位置
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // 删除最老的项目
      this.cache.delete(this.cache.keys().next().value)
    }
    this.cache.set(key, value)
  }
}

// 创建图片缓存服务
class ImageCacheService {
  constructor() {
    // 内存缓存，用于存储已加载的图片 URL
    this.memoryCache = new LRUCache(100) // 限制缓存 100 张图片
    
    // 预加载队列
    this.preloadQueue = []
    this.isPreloading = false
  }

  // 获取图片
  async get(url) {
    // 检查内存缓存
    const cachedImage = this.memoryCache.get(url)
    if (cachedImage) {
      return cachedImage
    }

    try {
      // 加载图片
      const image = await this.loadImage(url)
      // 存入缓存
      this.memoryCache.put(url, image)
      return image
    } catch (error) {
      console.error('Failed to load image:', error)
      throw error
    }
  }

  // 加载图片
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = url
    })
  }

  // 预加载图片
  preload(urls) {
    urls.forEach(url => {
      if (!this.memoryCache.get(url)) {
        this.preloadQueue.push(url)
      }
    })
    
    this.processPreloadQueue()
  }

  // 处理预加载队列
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return
    
    this.isPreloading = true
    
    try {
      while (this.preloadQueue.length > 0) {
        const url = this.preloadQueue.shift()
        await this.get(url)
        // 添加小延迟避免阻塞主线程
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } finally {
      this.isPreloading = false
    }
  }

  // 清除缓存
  clear() {
    this.memoryCache = new LRUCache(100)
    this.preloadQueue = []
  }
}

// 导出单例实例
export default new ImageCacheService() 