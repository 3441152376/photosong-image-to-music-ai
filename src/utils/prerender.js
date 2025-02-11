import AV from 'leancloud-storage'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import App from '../App.vue'
import i18n from '../i18n'
import routes from '../router'

// 创建 SSR 应用实例
const createSSRInstance = async () => {
  const app = createSSRApp(App)
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  
  app.use(pinia)
  app.use(router)
  app.use(i18n)
  
  return {
    app,
    router,
    i18n
  }
}

// 生成预渲染页面
export const generatePreRenderedPage = async (type, object) => {
  try {
    // 创建或获取预渲染页面记录
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    query.equalTo('objectId', object.id)
    query.equalTo('type', type)
    
    let page = await query.first()
    if (!page) {
      page = new PreRenderedPage()
      page.set('objectId', object.id)
      page.set('type', type)
    }
    
    // 设置状态为处理中
    page.set('status', 'pending')
    await page.save()
    
    // 获取所有支持的语言版本
    const locales = ['zh', 'en', 'ru']
    const htmlVersions = {}
    
    // 为每个语言版本生成预渲染内容
    for (const locale of locales) {
      const { app, router } = await createSSRInstance()
      
      // 设置路由
      const path = `/${locale}/${type}/${object.id}`
      await router.push(path)
      await router.isReady()
      
      // 渲染页面
      const html = await renderToString(app)
      
      // 添加预渲染标记和元数据
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="${locale}">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta data-pre-rendered="true">
            ${generateMetaTags(type, object, locale)}
            <title>${generateTitle(type, object, locale)}</title>
            ${generateStructuredData(type, object, locale)}
          </head>
          <body>
            <div id="app">${html}</div>
            <script>window.__PRERENDERED__ = true;</script>
          </body>
        </html>
      `
      
      htmlVersions[locale] = fullHtml
    }
    
    // 保存预渲染内容到 LeanCloud
    page.set('htmlVersions', htmlVersions)
    page.set('url', `/${type}/${object.id}`)
    page.set('status', 'success')
    page.set('lastUpdated', new Date())
    await page.save()
    
    return page
  } catch (error) {
    console.error(`Failed to generate pre-rendered page for ${type}:${object.id}:`, error)
    
    // 更新失败状态
    const PreRenderedPage = AV.Object.extend('PreRenderedPage')
    const query = new AV.Query(PreRenderedPage)
    query.equalTo('objectId', object.id)
    query.equalTo('type', type)
    
    const page = await query.first()
    if (page) {
      page.set('status', 'failed')
      page.set('error', error.message)
      await page.save()
    }
    
    throw error
  }
}

// 获取预渲染统计信息
export const getPreRenderStats = async () => {
  const PreRenderedPage = AV.Object.extend('PreRenderedPage')
  const query = new AV.Query(PreRenderedPage)
  
  const [works, articles, users] = await Promise.all([
    query.equalTo('type', 'work').count(),
    query.equalTo('type', 'article').count(),
    query.equalTo('type', 'user').count()
  ])
  
  const lastUpdateQuery = new AV.Query(PreRenderedPage)
  lastUpdateQuery.descending('updatedAt')
  const lastUpdated = await lastUpdateQuery.first()
  
  return {
    works,
    articles,
    users,
    lastWorkUpdate: lastUpdated?.get('updatedAt'),
    lastArticleUpdate: lastUpdated?.get('updatedAt'),
    lastUserUpdate: lastUpdated?.get('updatedAt')
  }
}

// 清除预渲染缓存
export const clearPreRenderCache = async () => {
  const PreRenderedPage = AV.Object.extend('PreRenderedPage')
  const query = new AV.Query(PreRenderedPage)
  const pages = await query.find()
  
  await AV.Object.destroyAll(pages)
}

// 生成元标签
const generateMetaTags = (type, object, locale) => {
  const meta = []
  
  // 基础元标签
  meta.push(`<meta name="description" content="${getDescription(type, object, locale)}">`)
  meta.push(`<meta name="keywords" content="${getKeywords(type, object, locale)}">`)
  
  // Open Graph 标签
  meta.push(`<meta property="og:title" content="${generateTitle(type, object, locale)}">`)
  meta.push(`<meta property="og:description" content="${getDescription(type, object, locale)}">`)
  meta.push(`<meta property="og:type" content="${getOgType(type)}">`)
  meta.push(`<meta property="og:url" content="https://photosong.com/${locale}/${type}/${object.id}">`)
  
  if (type === 'work' && object.get('imageUrl')) {
    meta.push(`<meta property="og:image" content="${object.get('imageUrl')}">`)
  }
  
  // Twitter 卡片
  meta.push('<meta name="twitter:card" content="summary_large_image">')
  meta.push(`<meta name="twitter:title" content="${generateTitle(type, object, locale)}">`)
  meta.push(`<meta name="twitter:description" content="${getDescription(type, object, locale)}">`)
  
  return meta.join('\n')
}

// 生成结构化数据
const generateStructuredData = (type, object, locale) => {
  let structuredData = {}
  
  switch (type) {
    case 'work':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'MusicComposition',
        name: object.get('title'),
        composer: {
          '@type': 'Person',
          name: object.get('user')?.get('username') || 'Anonymous'
        },
        datePublished: object.get('createdAt').toISOString(),
        image: object.get('imageUrl'),
        audio: object.get('audioUrl')
      }
      break
      
    case 'article':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: object.get('title'),
        author: {
          '@type': 'Person',
          name: object.get('author')?.get('username') || 'Anonymous'
        },
        datePublished: object.get('createdAt').toISOString(),
        dateModified: object.get('updatedAt').toISOString(),
        image: object.get('coverImage'),
        articleBody: object.get('content')
      }
      break
      
    case 'user':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: object.get('username'),
        image: object.get('avatar'),
        description: object.get('bio')
      }
      break
  }
  
  return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
}

// 辅助函数
const generateTitle = (type, object, locale) => {
  switch (type) {
    case 'work':
      return `${object.get('title')} by ${object.get('user')?.get('username') || 'Anonymous'} | PhotoSong`
    case 'article':
      return `${object.get('title')} | PhotoSong Blog`
    case 'user':
      return `${object.get('username')}'s Profile | PhotoSong`
    default:
      return 'PhotoSong'
  }
}

const getDescription = (type, object, locale) => {
  switch (type) {
    case 'work':
      return `Listen to "${object.get('title')}", a unique AI-generated music piece created from an image by ${object.get('user')?.get('username') || 'Anonymous'} on PhotoSong.`
    case 'article':
      return object.get('summary') || `Read "${object.get('title')}" on PhotoSong Blog.`
    case 'user':
      return `Check out ${object.get('username')}'s profile and their musical creations on PhotoSong.`
    default:
      return 'Transform your photos into unique musical pieces with PhotoSong.'
  }
}

const getKeywords = (type, object, locale) => {
  const baseKeywords = ['photosong', 'ai music', 'photo to music']
  
  switch (type) {
    case 'work':
      return [...baseKeywords, 'music creation', object.get('style'), 'ai generated music'].join(', ')
    case 'article':
      return [...baseKeywords, 'blog', 'article', ...object.get('tags') || []].join(', ')
    case 'user':
      return [...baseKeywords, 'profile', 'music creator', 'artist'].join(', ')
    default:
      return baseKeywords.join(', ')
  }
}

const getOgType = (type) => {
  switch (type) {
    case 'work':
      return 'music.song'
    case 'article':
      return 'article'
    case 'user':
      return 'profile'
    default:
      return 'website'
  }
} 