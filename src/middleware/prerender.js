import AV from 'leancloud-storage'
import { generateHTML } from '../utils/htmlGenerator'
import { getPageTitle, getPageDescription } from '../utils/meta'

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

// 预渲染中间件配置
const PRERENDER_CONFIG = {
  cacheTime: 3600 * 24, // 24小时缓存
  botUserAgents: [
    'googlebot',
    'bingbot',
    'baiduspider',
    'yandexbot',
    'sosospider',
    'sogou spider',
    '360spider',
    'facebookexternalhit',
    'twitterbot'
  ],
  excludedPaths: [
    '/api/',
    '/static/',
    '/assets/',
    '/_nuxt/',
    '/sw.js'
  ]
}

// 修改为 Vue Router 中间件格式
export const prerenderMiddleware = async (to, from) => {
  try {
    // 1. 检查是否需要预渲染
    if (!shouldPrerender(to)) {
      return true
    }

    // 2. 获取预渲染内容
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    query.equalTo('path', to.path)
    query.equalTo('locale', to.params.locale || 'zh')

    let page = await query.first()
    const now = new Date()

    // 3. 检查缓存是否过期
    if (page && now - page.get('updatedAt') > PRERENDER_CONFIG.cacheTime * 1000) {
      await page.destroy()
      page = null
    }

    // 4. 如果没有缓存或缓存过期，生成新的预渲染内容
    if (!page) {
      const html = await generatePrerenderedHTML(to)
      
      page = new PreRenderedPage()
      page.set('path', to.path)
      page.set('locale', to.params.locale || 'zh')
      page.set('html', html)
      page.set('type', getPageType(to.path))
      await page.save()
    }

    // 5. 返回 true 继续路由导航
    return true
  } catch (error) {
    console.error('Prerender error:', error)
    return true
  }
}

// 判断是否需要预渲染
function shouldPrerender(to) {
  // 1. 检查路径是否被排除
  if (PRERENDER_CONFIG.excludedPaths.some(path => to.path.startsWith(path))) {
    return false
  }

  // 2. 检查是否是搜索引擎爬虫
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isBot = PRERENDER_CONFIG.botUserAgents.some(bot => userAgent.includes(bot))

  // 3. 检查是否显式请求预渲染版本
  const forcePrerender = to.query._escaped_fragment_ !== undefined || 
                        to.query.prerender === 'true'

  return isBot || forcePrerender
}

// 生成预渲染 HTML
async function generatePrerenderedHTML(to) {
  const type = getPageType(to.path)
  const id = getPageId(to.path)
  
  let data = {}
  
  // 根据页面类型获取数据
  switch (type) {
    case 'work':
      data = await fetchWorkData(id)
      break
    case 'article':
      data = await fetchArticleData(id)
      break
    case 'user':
      data = await fetchUserData(id)
      break
    default:
      data = await fetchPageData(to.path)
  }
  
  // 生成 HTML
  return generateHTML({
    title: getPageTitle({ type, ...data }, to.params.locale || 'zh'),
    description: getPageDescription({ type, ...data }, to.params.locale || 'zh'),
    locale: to.params.locale || 'zh',
    content: await generateDynamicContent(data, to.params.locale || 'zh'),
    path: to.path,
    url: `https://photosong.com${to.path}`
  })
}

// 获取页面类型
function getPageType(path) {
  if (path.startsWith('/work/')) return 'work'
  if (path.startsWith('/article/')) return 'article'
  if (path.startsWith('/user/')) return 'user'
  return 'page'
}

// 获取页面 ID
function getPageId(path) {
  return path.split('/').pop()
}

// 获取作品数据
async function fetchWorkData(id) {
  try {
    const query = new AV.Query('Work')
    const work = await query.get(id)
    return work ? work.toJSON() : null
  } catch (error) {
    console.error('Failed to fetch work data:', error)
    return null
  }
}

// 获取文章数据
async function fetchArticleData(id) {
  try {
    const query = new AV.Query('Article')
    const article = await query.get(id)
    return article ? article.toJSON() : null
  } catch (error) {
    console.error('Failed to fetch article data:', error)
    return null
  }
}

// 获取用户数据
async function fetchUserData(id) {
  try {
    const query = new AV.Query('_User')
    const user = await query.get(id)
    return user ? user.toJSON() : null
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    return null
  }
}

// 获取页面数据
async function fetchPageData(path) {
  return {
    type: 'page',
    path
  }
}

// 生成动态内容
async function generateDynamicContent(data, locale) {
  // 这里可以根据需要实现具体的动态内容生成逻辑
  return ''
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