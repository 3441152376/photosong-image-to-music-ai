/**
 * 预渲染性能监控
 */
export class PrerenderMonitor {
  constructor() {
    this.metrics = {
      totalPages: 0,
      successCount: 0,
      failureCount: 0,
      averageTime: 0,
      errors: new Map(), // 错误统计
      lastUpdate: null
    }
  }

  startPage() {
    return {
      startTime: Date.now(),
      memory: process.memoryUsage()
    }
  }

  endPage(pageMetrics, success, error = null) {
    const duration = Date.now() - pageMetrics.startTime
    this.metrics.totalPages++
    
    if (success) {
      this.metrics.successCount++
    } else {
      this.metrics.failureCount++
      if (error) {
        const errorKey = error.message || 'Unknown error'
        const count = (this.metrics.errors.get(errorKey) || 0) + 1
        this.metrics.errors.set(errorKey, count)
      }
    }

    // 更新平均时间
    this.metrics.averageTime = 
      (this.metrics.averageTime * (this.metrics.totalPages - 1) + duration) / 
      this.metrics.totalPages

    this.metrics.lastUpdate = new Date()

    return {
      duration,
      success,
      error: error?.message
    }
  }

  // 获取性能报告
  getReport() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalPages > 0 
        ? (this.metrics.successCount / this.metrics.totalPages * 100).toFixed(2) + '%'
        : '0%',
      errors: Object.fromEntries(this.metrics.errors),
      lastUpdate: this.metrics.lastUpdate?.toISOString()
    }
  }

  // 重置统计数据
  reset() {
    this.metrics = {
      totalPages: 0,
      successCount: 0,
      failureCount: 0,
      averageTime: 0,
      errors: new Map(),
      lastUpdate: null
    }
  }
}

// 导出监控实例
export const prerenderMonitor = new PrerenderMonitor() 