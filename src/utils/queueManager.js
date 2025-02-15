/**
 * 预渲染队列管理器
 */
export class QueueManager {
  constructor(maxConcurrent = 5) {
    this.queue = []
    this.running = 0
    this.maxConcurrent = maxConcurrent
    this.paused = false
    this.onComplete = null
  }

  // 添加任务到队列
  async add(task) {
    this.queue.push(task)
    await this.process()
  }

  // 添加多个任务
  async addBatch(tasks) {
    this.queue.push(...tasks)
    await this.process()
  }

  // 处理队列
  async process() {
    if (this.paused || this.running >= this.maxConcurrent || this.queue.length === 0) {
      if (this.running === 0 && this.queue.length === 0 && typeof this.onComplete === 'function') {
        this.onComplete()
      }
      return
    }

    this.running++
    const task = this.queue.shift()
    
    try {
      await task()
    } catch (error) {
      console.error('Queue task error:', error)
    } finally {
      this.running--
      await this.process()
    }
  }

  // 暂停队列处理
  pause() {
    this.paused = true
  }

  // 恢复队列处理
  resume() {
    this.paused = false
    this.process()
  }

  // 清空队列
  clear() {
    this.queue = []
  }

  // 获取队列状态
  getStatus() {
    return {
      queueLength: this.queue.length,
      running: this.running,
      paused: this.paused
    }
  }

  // 设置队列完成回调
  setCompleteCallback(callback) {
    this.onComplete = callback
  }
}

// 导出队列管理器实例
export const queueManager = new QueueManager() 