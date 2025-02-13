import AV from 'leancloud-storage'
import { prerenderService } from './prerenderService'

class UpdateService {
  constructor() {
    this.updateInterval = 3600 * 1000 // 1小时
    this.maxAge = 24 * 3600 * 1000 // 24小时
    this.isUpdating = false
  }

  // 启动更新服务
  start() {
    // 立即执行一次更新
    this.update()
    
    // 设置定时更新
    setInterval(() => this.update(), this.updateInterval)
  }

  // 执行更新
  async update() {
    if (this.isUpdating) {
      return
    }

    this.isUpdating = true

    try {
      // 获取需要更新的页面
      const outdatedPages = await this.getOutdatedPages()
      
      if (outdatedPages.length > 0) {
        console.log(`Found ${outdatedPages.length} pages that need updating`)
        
        // 将过期页面添加到预渲染队列
        for (const page of outdatedPages) {
          prerenderService.queue.push({
            path: page.get('path'),
            locale: page.get('locale')
          })
        }
        
        // 启动预渲染队列处理
        prerenderService.processQueue()
      }
    } catch (error) {
      console.error('Update service error:', error)
    } finally {
      this.isUpdating = false
    }
  }

  // 获取需要更新的页面
  async getOutdatedPages() {
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    
    // 查找超过最大年龄的页面
    const cutoffDate = new Date(Date.now() - this.maxAge)
    query.lessThan('updatedAt', cutoffDate)
    
    return await query.find()
  }

  // 强制更新特定页面
  async forceUpdate(path, locale) {
    try {
      prerenderService.queue.push({ path, locale })
      prerenderService.processQueue()
    } catch (error) {
      console.error(`Force update failed for ${locale}${path}:`, error)
    }
  }

  // 强制更新所有页面
  async forceUpdateAll() {
    try {
      const PreRenderedPage = AV.Object.extend('PreRenderedPage')
      const query = new AV.Query(PreRenderedPage)
      const pages = await query.find()
      
      for (const page of pages) {
        prerenderService.queue.push({
          path: page.get('path'),
          locale: page.get('locale')
        })
      }
      
      prerenderService.processQueue()
    } catch (error) {
      console.error('Force update all failed:', error)
    }
  }

  // 获取更新状态
  async getStatus() {
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    
    const [total, outdated] = await Promise.all([
      query.count(),
      this.getOutdatedPages().then(pages => pages.length)
    ])
    
    return {
      total,
      outdated,
      upToDate: total - outdated,
      isUpdating: this.isUpdating,
      queueLength: prerenderService.queue.length
    }
  }
}

// 导出更新服务实例
export const updateService = new UpdateService()

// 启动更新服务
updateService.start() 