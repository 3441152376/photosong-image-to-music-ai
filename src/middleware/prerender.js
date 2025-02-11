import AV from 'leancloud-storage'

// 检查是否是爬虫
const isBot = (userAgent = '') => {
  const crawlers = [
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'slurp',
    'baiduspider',
    'sogou',
    'applebot',
    'facebookexternalhit',
    'twitterbot'
  ]
  
  const lowerUA = userAgent.toLowerCase()
  return crawlers.some(crawler => lowerUA.includes(crawler))
}

// 预渲染中间件
export const prerenderMiddleware = async (context) => {
  try {
    // 检查是否是爬虫请求
    if (!isBot(context.headers?.['user-agent'])) {
      return null
    }
    
    // 解析请求路径
    const path = context.path
    const matches = path.match(/^\/(zh|en|ru)\/(work|article|user)\/([a-zA-Z0-9]+)$/)
    
    if (!matches) {
      return null
    }
    
    const [, locale, type, id] = matches
    
    // 查询预渲染页面
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    query.equalTo('objectId', id)
    query.equalTo('type', type)
    
    const page = await query.first()
    
    if (!page || !page.get('htmlVersions') || !page.get('htmlVersions')[locale]) {
      return null
    }
    
    // 返回预渲染内容
    return page.get('htmlVersions')[locale]
  } catch (error) {
    console.error('Prerender middleware error:', error)
    return null
  }
}

// 更新预渲染内容的中间件
export const updatePrerenderMiddleware = async (context) => {
  try {
    // 只处理 POST、PUT、DELETE 请求
    if (!['POST', 'PUT', 'DELETE'].includes(context.method)) {
      return null
    }
    
    // 检查请求路径
    const path = context.path
    const matches = path.match(/^\/api\/(works|articles|users)\/([a-zA-Z0-9]+)?$/)
    
    if (!matches) {
      return null
    }
    
    const [, type, id] = matches
    
    // 更新预渲染内容
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    
    if (id) {
      // 更新或删除单个页面
      query.equalTo('objectId', id)
      const page = await query.first()
      
      if (context.method === 'DELETE') {
        if (page) {
          await page.destroy()
        }
      } else {
        // 获取最新数据并更新预渲染内容
        const objectQuery = new AV.Query(type === 'works' ? 'Work' : type === 'articles' ? 'Article' : '_User')
        const object = await objectQuery.get(id)
        
        if (object) {
          const { generatePreRenderedPage } = await import('../utils/prerender')
          await generatePreRenderedPage(type.slice(0, -1), object)
        }
      }
    } else if (context.method === 'POST') {
      // 新建页面，等待对象创建完成后再生成预渲染内容
      setTimeout(async () => {
        try {
          const objectQuery = new AV.Query(type === 'works' ? 'Work' : type === 'articles' ? 'Article' : '_User')
          objectQuery.descending('createdAt')
          objectQuery.limit(1)
          const object = await objectQuery.first()
          
          if (object) {
            const { generatePreRenderedPage } = await import('../utils/prerender')
            await generatePreRenderedPage(type.slice(0, -1), object)
          }
        } catch (error) {
          console.error('Failed to generate prerender for new object:', error)
        }
      }, 5000)
    }
    
    return null
  } catch (error) {
    console.error('Update prerender middleware error:', error)
    return null
  }
} 