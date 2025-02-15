import AV from 'leancloud-storage'
import { generateHTML } from '../utils/htmlGenerator'
import { getPageTitle, getPageDescription } from '../utils/meta'
import { supportedLocales } from '../i18n'
import { prerenderCache } from '../utils/prerenderCache'
import { prerenderMonitor } from '../utils/prerenderMonitor'
import { queueManager } from '../utils/queueManager'
import { seoOptimizer } from '../utils/seoOptimizer'

class PrerenderService {
  constructor() {
    this.retryAttempts = 3
    this.retryDelay = 5000 // 5秒
    this.initialized = false
    this.router = null
  }

  // 设置路由实例
  setRouter(router) {
    this.router = router
  }

  // 初始化预渲染服务
  async initialize() {
    if (this.initialized) return
    if (!this.router) {
      console.warn('Router not set, skipping prerender initialization')
      return
    }
    
    try {
      // 获取所有需要预渲染的路由
      const routes = this.getPrerenderedRoutes()
      
      // 获取所有支持的语言
      const locales = supportedLocales
      
      // 生成预渲染任务
      const tasks = []
      for (const route of routes) {
        if (route.meta?.getPrerenderPaths) {
          const paths = await route.meta.getPrerenderPaths()
          for (const path of paths) {
            for (const locale of locales) {
              tasks.push(() => this.prerenderPage({ path, locale }))
            }
          }
        }
      }
      
      // 设置队列完成回调
      queueManager.setCompleteCallback(() => {
        console.log('预渲染队列处理完成')
        console.log('性能报告:', prerenderMonitor.getReport())
      })
      
      // 添加任务到队列
      await queueManager.addBatch(tasks)
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize prerender service:', error)
      throw error
    }
  }

  // 获取需要预渲染的路由
  getPrerenderedRoutes() {
    if (!this.router) return []
    return this.router.getRoutes().filter(route => route.meta?.prerender)
  }

  // 预渲染单个页面
  async prerenderPage({ path, locale }, attempt = 1) {
    const pageMetrics = prerenderMonitor.startPage()
    const cacheKey = PrerenderCache.generateKey(path, locale)
    
    try {
      // 检查缓存
      const cached = prerenderCache.get(cacheKey)
      if (cached) {
        prerenderMonitor.endPage(pageMetrics, true)
        return cached
      }

      // 获取页面数据
      const pageData = await this.fetchPageData(path)
      
      if (!pageData) {
        console.warn(`No data found for path: ${path}`)
        prerenderMonitor.endPage(pageMetrics, false, new Error('No data found'))
        return null
      }

      // 生成SEO元数据
      const type = this.getPageType(path)
      const metadata = seoOptimizer.generateMetadata({
        type,
        data: pageData,
        locale
      })

      // 优化内容
      const content = await this.generateDynamicContent(pageData, locale)
      const optimizedContent = seoOptimizer.optimizeContent(content, metadata.keywords)

      // 生成预渲染内容
      const html = await generateHTML({
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords.join(', '),
        locale,
        content: optimizedContent,
        path,
        url: metadata.canonical,
        structuredData: metadata.structuredData,
        alternateLinks: metadata.alternateLinks
      })

      // 保存预渲染内容
      const PreRenderedPage = AV.Object.extend('PreRenderedPage')
      const query = new AV.Query(PreRenderedPage)
      query.equalTo('path', path)
      query.equalTo('locale', locale)
      
      let page = await query.first()
      
      if (!page) {
        page = new PreRenderedPage()
        page.set('path', path)
        page.set('locale', locale)
      }
      
      page.set('html', html)
      page.set('type', type)
      page.set('lastUpdated', new Date())
      page.set('metadata', metadata)
      
      await page.save()
      
      // 更新缓存
      prerenderCache.set(cacheKey, html)
      
      prerenderMonitor.endPage(pageMetrics, true)
      console.log(`Successfully prerendered: ${locale}${path}`)
      
      return html
    } catch (error) {
      console.error(`Failed to prerender ${locale}${path}:`, error)
      prerenderMonitor.endPage(pageMetrics, false, error)
      
      // 重试逻辑
      if (attempt < this.retryAttempts) {
        console.log(`Retrying ${locale}${path} (attempt ${attempt + 1}/${this.retryAttempts})`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        return this.prerenderPage({ path, locale }, attempt + 1)
      }
      
      throw error
    }
  }

  // 获取页面类型
  getPageType(path) {
    if (path.startsWith('/work/')) return 'work'
    if (path.startsWith('/article/')) return 'article'
    if (path.startsWith('/user/')) return 'user'
    return 'page'
  }

  // 获取页面数据
  async fetchPageData(path) {
    const type = this.getPageType(path)
    const id = path.split('/').pop()
    
    try {
      switch (type) {
        case 'work':
          return await this.fetchWorkData(id)
        case 'article':
          return await this.fetchArticleData(id)
        case 'user':
          return await this.fetchUserData(id)
        default:
          return await this.fetchStaticPageData(path)
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} data for ${path}:`, error)
      throw error
    }
  }

  // 获取作品数据
  async fetchWorkData(id) {
    const query = new AV.Query('Work')
    query.include('user')
    const work = await query.get(id)
    return work ? work.toJSON() : null
  }

  // 获取文章数据
  async fetchArticleData(id) {
    const query = new AV.Query('Article')
    query.include('author')
    const article = await query.get(id)
    return article ? article.toJSON() : null
  }

  // 获取用户数据
  async fetchUserData(id) {
    const query = new AV.Query('_User')
    const user = await query.get(id)
    return user ? user.toJSON() : null
  }

  // 获取静态页面数据
  async fetchStaticPageData(path) {
    return {
      type: 'page',
      path
    }
  }

  // 生成动态内容
  async generateDynamicContent(data, locale) {
    const type = this.getPageType(data.path)
    
    try {
      switch (type) {
        case 'work':
          return await this.generateWorkContent(data, locale)
        case 'article':
          return await this.generateArticleContent(data, locale)
        case 'user':
          return await this.generateUserContent(data, locale)
        default:
          return await this.generateStaticContent(data, locale)
      }
    } catch (error) {
      console.error(`Failed to generate content for ${type}:`, error)
      throw error
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      monitor: prerenderMonitor.getReport(),
      cache: prerenderCache.getStats(),
      queue: queueManager.getStatus()
    }
  }

  // 清理缓存
  cleanupCache() {
    prerenderCache.cleanup()
  }

  // 重置性能监控
  resetMonitor() {
    prerenderMonitor.reset()
  }
}

// 导出预渲染服务实例
export const prerenderService = new PrerenderService()

// 不要在这里初始化预渲染服务
// 而是在应用初始化时调用 