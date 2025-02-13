import AV from 'leancloud-storage'
import { generateHTML } from '../utils/htmlGenerator'
import { getPageTitle, getPageDescription } from '../utils/meta'
import { supportedLocales } from '../i18n'
import router from '../router'

class PrerenderService {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.maxConcurrent = 5
    this.retryAttempts = 3
    this.retryDelay = 5000 // 5秒
  }

  // 初始化预渲染服务
  async initialize() {
    try {
      // 获取所有需要预渲染的路由
      const routes = this.getPrerenderedRoutes()
      
      // 获取所有支持的语言
      const locales = supportedLocales
      
      // 生成预渲染队列
      for (const route of routes) {
        if (route.meta?.getPrerenderPaths) {
          const paths = await route.meta.getPrerenderPaths()
          for (const path of paths) {
            for (const locale of locales) {
              this.queue.push({ path, locale })
            }
          }
        }
      }
      
      // 开始处理队列
      this.processQueue()
    } catch (error) {
      console.error('Failed to initialize prerender service:', error)
    }
  }

  // 获取需要预渲染的路由
  getPrerenderedRoutes() {
    return router.getRoutes().filter(route => route.meta?.prerender)
  }

  // 处理预渲染队列
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    const batch = this.queue.splice(0, this.maxConcurrent)
    
    try {
      await Promise.all(batch.map(item => this.prerenderPage(item)))
    } catch (error) {
      console.error('Error processing prerender batch:', error)
    }

    this.isProcessing = false
    
    // 如果队列还有内容，继续处理
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }

  // 预渲染单个页面
  async prerenderPage({ path, locale }, attempt = 1) {
    try {
      // 获取页面数据
      const pageData = await this.fetchPageData(path)
      
      if (!pageData) {
        console.warn(`No data found for path: ${path}`)
        return
      }

      // 生成预渲染内容
      const html = await generateHTML({
        title: getPageTitle(pageData, locale),
        description: getPageDescription(pageData, locale),
        locale,
        content: await this.generateDynamicContent(pageData, locale),
        path,
        url: `https://photosong.com/${locale}${path}`
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
      page.set('type', this.getPageType(path))
      page.set('lastUpdated', new Date())
      
      await page.save()
      
      console.log(`Successfully prerendered: ${locale}${path}`)
    } catch (error) {
      console.error(`Failed to prerender ${locale}${path}:`, error)
      
      // 重试逻辑
      if (attempt < this.retryAttempts) {
        setTimeout(() => {
          this.prerenderPage({ path, locale }, attempt + 1)
        }, this.retryDelay * attempt)
      }
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
    
    switch (type) {
      case 'work':
        return this.fetchWorkData(id)
      case 'article':
        return this.fetchArticleData(id)
      case 'user':
        return this.fetchUserData(id)
      default:
        return this.fetchStaticPageData(path)
    }
  }

  // 获取作品数据
  async fetchWorkData(id) {
    const query = new AV.Query('Work')
    const work = await query.get(id)
    return work ? work.toJSON() : null
  }

  // 获取文章数据
  async fetchArticleData(id) {
    const query = new AV.Query('Article')
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
    // 实现静态页面数据获取逻辑
    return {
      type: 'page',
      path
    }
  }

  // 生成动态内容
  async generateDynamicContent(data, locale) {
    // 根据页面类型生成相应的动态内容
    const type = this.getPageType(data.path)
    
    switch (type) {
      case 'work':
        return this.generateWorkContent(data, locale)
      case 'article':
        return this.generateArticleContent(data, locale)
      case 'user':
        return this.generateUserContent(data, locale)
      default:
        return this.generateStaticContent(data, locale)
    }
  }
}

// 导出预渲染服务实例
export const prerenderService = new PrerenderService()

// 初始化预渲染服务
prerenderService.initialize().catch(error => {
  console.error('Failed to initialize prerender service:', error)
}) 