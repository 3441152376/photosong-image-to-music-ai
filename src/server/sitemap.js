import AV from 'leancloud-storage'

// 初始化 LeanCloud
AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_SERVER_URL
})

import { SitemapStream, streamToPromise } from 'sitemap'
import { Readable } from 'stream'

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['zh', 'en', 'ru']

// 固定页面列表
const STATIC_PAGES = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/help',
  '/features'
]

// 获取所有活跃用户
async function getAllUsers(updateProgress) {
  const query = new AV.Query('_User')
  query.equalTo('status', 'active')
  query.exists('username')
  query.select(['username', 'updatedAt'])
  query.limit(1000)
  
  let allUsers = []
  let skip = 0
  
  while (true) {
    query.skip(skip)
    const users = await query.find()
    if (users.length === 0) break
    
    allUsers = allUsers.concat(users)
    skip += users.length
    
    // 更新进度
    if (updateProgress) {
      updateProgress('fetching_users', { users: allUsers.length })
    }
  }
  
  return allUsers
}

// 获取所有公开作品
async function getAllWorks(updateProgress) {
  const query = new AV.Query('Work')
  query.equalTo('status', 'PUBLISHED')
  query.include('user')
  query.select(['objectId', 'updatedAt', 'user.username'])
  query.limit(1000)
  
  let allWorks = []
  let skip = 0
  
  while (true) {
    query.skip(skip)
    const works = await query.find()
    if (works.length === 0) break
    
    allWorks = allWorks.concat(works)
    skip += works.length
    
    // 更新进度
    if (updateProgress) {
      updateProgress('fetching_works', { works: allWorks.length })
    }
  }
  
  return allWorks
}

// 获取所有已发布的文章
async function getAllArticles(updateProgress) {
  const query = new AV.Query('Article')
  query.equalTo('status', 'PUBLISHED')
  query.select(['objectId', 'slug', 'updatedAt', 'category'])
  query.limit(1000)
  
  let allArticles = []
  let skip = 0
  
  while (true) {
    query.skip(skip)
    const articles = await query.find()
    if (articles.length === 0) break
    
    allArticles = allArticles.concat(articles)
    skip += articles.length
    
    // 更新进度
    if (updateProgress) {
      updateProgress('fetching_articles', { articles: allArticles.length })
    }
  }
  
  return allArticles
}

// 添加文件写入函数
const writeSitemapFiles = async (sitemaps) => {
  const fs = require('fs').promises
  const path = require('path')
  const publicDir = path.resolve(process.cwd(), 'public')

  try {
    // 确保目录存在
    await fs.mkdir(publicDir, { recursive: true })

    // 写入所有站点地图文件
    const writePromises = Object.entries(sitemaps).map(([filename, content]) => 
      fs.writeFile(path.join(publicDir, filename), content)
    )

    await Promise.all(writePromises)
    console.log('站点地图文件已写入到 public 目录')
  } catch (error) {
    console.error('写入站点地图文件失败:', error)
    throw error
  }
}

// 修改生成站点地图函数
export const generateSitemap = async (lang, updateProgress) => {
  try {
    // 验证 LeanCloud 初始化
    if (!AV.applicationId || !AV.applicationKey) {
      throw new Error('LeanCloud not properly initialized')
    }

    // 创建站点地图流，设置正确的XML格式
    const stream = new SitemapStream({ 
      hostname: process.env.SITE_URL || 'https://photosong.com',
      xmlns: {
        news: false,
        xhtml: true,
        image: false,
        video: false
      }
    })
    let urlCount = 0
    
    // 更新进度函数
    const updateUrlCount = (count) => {
      urlCount += count
      if (updateProgress) {
        updateProgress('generating_urls', { urls: urlCount })
      }
    }
    
    // 添加固定页面
    const STATIC_PAGES = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/create', priority: 0.9, changefreq: 'daily' },
      { path: '/community', priority: 0.9, changefreq: 'daily' },
      { path: '/pricing', priority: 0.8, changefreq: 'weekly' },
      { path: '/tutorial', priority: 0.7, changefreq: 'weekly' },
      { path: '/faq', priority: 0.7, changefreq: 'weekly' },
      { path: '/contact', priority: 0.6, changefreq: 'monthly' },
      { path: '/terms', priority: 0.5, changefreq: 'monthly' },
      { path: '/privacy', priority: 0.5, changefreq: 'monthly' },
      { path: '/blog', priority: 0.8, changefreq: 'daily' },
      { path: '/features', priority: 0.8, changefreq: 'weekly' },
      { path: '/about', priority: 0.7, changefreq: 'monthly' },
      { path: '/articles', priority: 0.8, changefreq: 'daily' }
    ]

    for (const { path, priority, changefreq } of STATIC_PAGES) {
      const url = lang ? `/${lang}${path}` : path
      stream.write({
        url,
        changefreq,
        priority,
        links: SUPPORTED_LANGUAGES.map(language => ({
          lang: language,
          url: `/${language}${path}`
        }))
      })
    }
    updateUrlCount(STATIC_PAGES.length)

    try {
      // 获取所有活跃用户
      updateProgress('fetching_users', { users: 0 })
      const users = await getAllUsers(updateProgress)
      if (!users || !Array.isArray(users)) {
        throw new Error('Invalid user data received')
      }
      
      console.log(`获取到 ${users.length} 个用户`)

      // 添加用户主页 - 所有语言版本
      updateProgress('generating_urls', { status: 'generating_user_urls' })
      for (const user of users) {
        const userId = user.id
        const updatedAt = user.get('updatedAt')

        // 默认语言版本
        stream.write({
          url: `/profile/${userId}`,
          changefreq: 'daily',
          priority: 0.9,
          lastmod: updatedAt.toISOString(),
          links: SUPPORTED_LANGUAGES.map(language => ({
            lang: language,
            url: `/${language}/profile/${userId}`
          }))
        })

        // 多语言版本
        for (const language of SUPPORTED_LANGUAGES) {
          stream.write({
            url: `/${language}/profile/${userId}`,
            changefreq: 'daily',
            priority: 0.9,
            lastmod: updatedAt.toISOString()
          })
        }
      }
      updateUrlCount(users.length * (SUPPORTED_LANGUAGES.length + 1))

      // 获取所有公开作品
      updateProgress('fetching_works', { works: 0 })
      const works = await getAllWorks(updateProgress)
      console.log(`获取到 ${works.length} 个作品`)

      // 添加作品页面 - 所有语言版本
      updateProgress('generating_urls', { status: 'generating_work_urls' })
      for (const work of works) {
        const workId = work.id
        const updatedAt = work.get('updatedAt')

        // 默认语言版本
        stream.write({
          url: `/work/${workId}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: updatedAt.toISOString(),
          links: SUPPORTED_LANGUAGES.map(language => ({
            lang: language,
            url: `/${language}/work/${workId}`
          }))
        })

        // 多语言版本
        for (const language of SUPPORTED_LANGUAGES) {
          stream.write({
            url: `/${language}/work/${workId}`,
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: updatedAt.toISOString()
          })
        }
      }
      updateUrlCount(works.length * (SUPPORTED_LANGUAGES.length + 1))

      // 获取所有文章
      updateProgress('fetching_articles', { articles: 0 })
      const articles = await getAllArticles(updateProgress)
      console.log(`获取到 ${articles.length} 篇文章`)

      // 添加文章页面 - 所有语言版本
      updateProgress('generating_urls', { status: 'generating_article_urls' })
      for (const article of articles) {
        const slug = article.get('slug')
        const updatedAt = article.get('updatedAt')
        const category = article.get('category')

        // 默认语言版本
        stream.write({
          url: `/articles/${slug}`,
          changefreq: 'weekly',
          priority: category === 'tutorial' ? 0.9 : 0.7,
          lastmod: updatedAt.toISOString(),
          links: SUPPORTED_LANGUAGES.map(language => ({
            lang: language,
            url: `/${language}/articles/${slug}`
          }))
        })

        // 多语言版本
        for (const language of SUPPORTED_LANGUAGES) {
          stream.write({
            url: `/${language}/articles/${slug}`,
            changefreq: 'weekly',
            priority: category === 'tutorial' ? 0.9 : 0.7,
            lastmod: updatedAt.toISOString()
          })
        }
      }
      updateUrlCount(articles.length * (SUPPORTED_LANGUAGES.length + 1))

      // 添加文章分类页面
      const ARTICLE_CATEGORIES = [
        'research', 'knowledge', 'ai_music', 'tutorial', 
        'professional', 'industry', 'news'
      ]

      for (const category of ARTICLE_CATEGORIES) {
        // 默认语言版本
        stream.write({
          url: `/articles/category/${category}`,
          changefreq: 'daily',
          priority: 0.7,
          links: SUPPORTED_LANGUAGES.map(language => ({
            lang: language,
            url: `/${language}/articles/category/${category}`
          }))
        })

        // 多语言版本
        for (const language of SUPPORTED_LANGUAGES) {
          stream.write({
            url: `/${language}/articles/category/${category}`,
            changefreq: 'daily',
            priority: 0.7
          })
        }
      }
      updateUrlCount(ARTICLE_CATEGORIES.length * (SUPPORTED_LANGUAGES.length + 1))

      // 结束写入并生成XML
      updateProgress('finalizing', { urls: urlCount })
      stream.end()
      const data = await streamToPromise(Readable.from(stream))
      const xmlString = data.toString()
      
      // 验证生成的XML
      if (!xmlString.includes('<?xml') || !xmlString.includes('<urlset')) {
        throw new Error('Generated sitemap is not valid XML')
      }
      
      // 生成完成后，写入文件
      const sitemaps = {
        'sitemap.xml': xmlString,
        'main-sitemap.xml': mainSitemap,
        'works-sitemap.xml': worksSitemap,
        'news-sitemap.xml': newsSitemap
      }

      await writeSitemapFiles(sitemaps)
      
      return xmlString

    } catch (dbError) {
      console.error('数据库查询失败:', dbError)
      if (dbError.code === 'ECONNREFUSED') {
        throw new Error('Database connection failed')
      } else if (dbError.code === 'ETIMEDOUT') {
        throw new Error('Database query timeout')
      } else {
        throw new Error(dbError.message || 'Database query failed')
      }
    }

  } catch (error) {
    console.error('生成站点地图失败:', error)
    // 转换错误消息为用户友好的消息
    const errorMessages = {
      'LeanCloud not properly initialized': '系统初始化失败，请联系管理员',
      'Failed to fetch user list': '获取用户列表失败，请稍后重试',
      'Invalid user data received': '用户数据无效，请稍后重试',
      'Database connection failed': '数据库连接失败，请稍后重试',
      'Database query timeout': '数据库查询超时，请稍后重试'
    }
    throw new Error(errorMessages[error.message] || '更新站点地图失败，请稍后重试')
  }
}

// 生成robots.txt
export const generateRobotsTxt = () => {
  const siteUrl = process.env.SITE_URL || 'https://photosong.com'
  return `
User-agent: *
Allow: /

# Language paths
Allow: /zh/
Allow: /en/
Allow: /ru/

# Content paths
Allow: /work/
Allow: /profile/
Allow: /about/
Allow: /features/
Allow: /help/

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`.trim()
} 