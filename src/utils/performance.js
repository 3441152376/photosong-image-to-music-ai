import { ref, onMounted, shallowRef } from 'vue'

// 防抖函数
export function useDebounce(fn, delay = 300) {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
export function useThrottle(fn, delay = 300) {
  let timer = null
  return (...args) => {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 图片懒加载
export function useLazyLoad() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        const src = img.dataset.src
        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      }
    })
  })

  return {
    observe: (el) => observer.observe(el),
    unobserve: (el) => observer.unobserve(el)
  }
}

// 虚拟列表
export function useVirtualList(list, options = {}) {
  const { itemHeight = 50, visibleItems = 10 } = options
  const startIndex = ref(0)
  const visibleList = ref([])
  
  const updateVisibleList = (scrollTop = 0) => {
    const start = Math.floor(scrollTop / itemHeight)
    startIndex.value = Math.max(0, start - 5)
    const endIndex = Math.min(list.length, start + visibleItems + 5)
    visibleList.value = list.slice(startIndex.value, endIndex)
  }
  
  return {
    visibleList,
    startIndex,
    totalHeight: list.length * itemHeight,
    updateVisibleList
  }
}

// 资源预加载
export function usePreload() {
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = src
    })
  }
  
  const preloadImages = (srcs) => {
    return Promise.all(srcs.map(preloadImage))
  }
  
  return {
    preloadImage,
    preloadImages
  }
}

// 缓存管理
export function useCache() {
  const cache = new Map()
  
  const set = (key, value, ttl = 0) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    }
    cache.set(key, item)
  }
  
  const get = (key) => {
    const item = cache.get(key)
    if (!item) return null
    
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  const clear = () => cache.clear()
  
  return {
    set,
    get,
    clear
  }
}

// 性能监控
export function usePerformanceMonitor() {
  const metrics = ref({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0
  })
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      metrics.value[entry.name] = entry.value
    }
  })
  
  observer.observe({ entryTypes: ['paint', 'layout-shift', 'first-input'] })
  
  return metrics
}

// 资源预加载增强
export function useResourcePreload() {
  const preloadResources = {
    images: new Set(),
    scripts: new Set(),
    styles: new Set(),
    fonts: new Set()
  }
  
  const preload = (url, type) => {
    if (preloadResources[type].has(url)) return
    
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    switch (type) {
      case 'images':
        link.as = 'image'
        break
      case 'scripts':
        link.as = 'script'
        break
      case 'styles':
        link.as = 'style'
        break
      case 'fonts':
        link.as = 'font'
        link.crossOrigin = 'anonymous'
        break
    }
    
    document.head.appendChild(link)
    preloadResources[type].add(url)
  }
  
  return { preload }
}

// 性能指标监控增强
export function usePerformanceMonitoring() {
  const metrics = ref({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    domLoad: 0,
    windowLoad: 0,
    scrollPerformance: {
      lastScrollTime: 0,
      scrollCount: 0,
      scrollLatency: []
    }
  })
  
  const recordLoadTime = () => {
    const navigation = performance.getEntriesByType('navigation')[0]
    metrics.value.domLoad = navigation.domContentLoadedEventEnd
    metrics.value.windowLoad = navigation.loadEventEnd
  }
  
  const recordTTFB = () => {
    const navigation = performance.getEntriesByType('navigation')[0]
    metrics.value.ttfb = navigation.responseStart - navigation.requestStart
  }
  
  const monitorScrollPerformance = () => {
    let ticking = false
    let lastScrollTime = performance.now()
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const now = performance.now()
          const latency = now - lastScrollTime
          
          metrics.value.scrollPerformance.scrollLatency.push(latency)
          metrics.value.scrollPerformance.scrollCount++
          
          if (metrics.value.scrollPerformance.scrollLatency.length > 50) {
            metrics.value.scrollPerformance.scrollLatency.shift()
          }
          
          lastScrollTime = now
          ticking = false
        })
        ticking = true
      }
    }, { passive: true })
  }
  
  const optimizeResourceLoading = () => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      switch (entry.entryType) {
        case 'first-contentful-paint':
          metrics.value.fcp = entry.startTime
          break
        case 'largest-contentful-paint':
          metrics.value.lcp = entry.startTime
          break
        case 'first-input':
          metrics.value.fid = entry.processingStart - entry.startTime
          break
        case 'layout-shift':
          metrics.value.cls += entry.value
          break
      }
    }
  })
  
  observer.observe({
    entryTypes: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-input',
      'layout-shift'
    ]
  })
  
  onMounted(() => {
    recordLoadTime()
    recordTTFB()
    monitorScrollPerformance()
    optimizeResourceLoading()
  })
  
  return metrics
}

// 代码分割和懒加载
export function useLazyComponent(loader) {
  const component = shallowRef(null)
  const loading = ref(true)
  const error = ref(null)
  
  loader()
    .then((comp) => {
      component.value = comp.default || comp
      loading.value = false
    })
    .catch((err) => {
      console.error('Error loading component:', err)
      error.value = err
      loading.value = false
    })
  
  return { component, loading, error }
}

// 图片优化
export function useImageOptimization() {
  const optimizeImage = (url, options = {}) => {
    const {
      width,
      height,
      quality = 80,
      format = 'webp'
    } = options
    
    const params = new URLSearchParams()
    if (width) params.append('w', width)
    if (height) params.append('h', height)
    params.append('q', quality)
    params.append('fm', format)
    
    return `${url}?${params.toString()}`
  }
  
  const generateSrcSet = (url, widths = [320, 640, 768, 1024, 1366, 1600]) => {
    return widths
      .map(w => `${optimizeImage(url, { width: w })} ${w}w`)
      .join(', ')
  }
  
  return {
    optimizeImage,
    generateSrcSet
  }
}

// 缓存优化
export function useCacheOptimization() {
  const cache = new Map()
  
  const set = (key, value, ttl = 0) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    }
    cache.set(key, item)
    
    // 如果设置了 TTL，创建自动清理
    if (ttl > 0) {
      setTimeout(() => {
        cache.delete(key)
      }, ttl)
    }
  }
  
  const get = (key) => {
    const item = cache.get(key)
    if (!item) return null
    
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  const clear = () => cache.clear()
  
  // 定期清理过期缓存
  setInterval(() => {
    for (const [key, item] of cache.entries()) {
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        cache.delete(key)
      }
    }
  }, 60000) // 每分钟清理一次
  
  return {
    set,
    get,
    clear
  }
}

// Web Worker 管理
export function useWebWorker(workerScript) {
  const worker = new Worker(workerScript)
  const results = ref(null)
  const error = ref(null)
  const loading = ref(false)
  
  worker.onmessage = (event) => {
    results.value = event.data
    loading.value = false
  }
  
  worker.onerror = (err) => {
    console.error('Worker error:', err)
    error.value = err
    loading.value = false
  }
  
  const sendTask = (data) => {
    loading.value = true
    error.value = null
    worker.postMessage(data)
  }
  
  onUnmounted(() => {
    worker.terminate()
  })
  
  return {
    sendTask,
    results,
    error,
    loading
  }
}

// 添加虚拟滚动优化
export function useVirtualScroll(items, options = {}) {
  const {
    itemHeight = 200,
    overscan = 3,
    containerHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  } = options
  
  const visibleItems = ref([])
  const containerRef = ref(null)
  const scrollTop = ref(0)
  
  const updateVisibleItems = () => {
    if (!items.value?.length) return
    
    const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
    const end = Math.min(
      items.value.length,
      Math.ceil((scrollTop.value + containerHeight) / itemHeight) + overscan
    )
    
    visibleItems.value = items.value.slice(start, end).map((item, index) => ({
      ...item,
      style: {
        position: 'absolute',
        top: `${(start + index) * itemHeight}px`,
        height: `${itemHeight}px`
      }
    }))
  }
  
  const handleScroll = useThrottle(() => {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop
      updateVisibleItems()
    }
  }, 16) // 约60fps
  
  onMounted(() => {
    updateVisibleItems()
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
    }
  })
  
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })
  
  return {
    visibleItems,
    containerRef,
    containerStyle: {
      height: `${containerHeight}px`,
      overflow: 'auto',
      position: 'relative'
    },
    totalHeight: items.value?.length * itemHeight || 0
  }
} 