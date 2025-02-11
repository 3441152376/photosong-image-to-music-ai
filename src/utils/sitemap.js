import AV from 'leancloud-storage'
import { supportedLocales } from '../i18n'

/**
 * 生成作品站点地图
 * @returns {Promise<string>} XML 格式的站点地图
 */
export const generateWorksSitemap = async () => {
  try {
    const query = new AV.Query('Work')
    query.equalTo('status', 'completed')
    query.descending('createdAt')

    const works = await query.find()
    const urls = []

    works.forEach(work => {
      const path = `/work/${work.id}`
      const lastmod = work.updatedAt.toISOString()
      
      // 为每个语言版本生成 URL
      supportedLocales.forEach(locale => {
        urls.push({
          loc: `https://photosong.com/${locale}${path}`,
          lastmod,
          changefreq: 'weekly',
          priority: 0.7,
          alternates: [
            // 添加 x-default
            {
              hreflang: 'x-default',
              href: `https://photosong.com${path}`
            },
            // 添加所有语言版本
            ...supportedLocales.map(altLocale => ({
              hreflang: altLocale,
              href: `https://photosong.com/${altLocale}${path}`
            }))
          ]
        })
      })
    })

    return generateSitemapXML(urls)
  } catch (error) {
    console.error('Failed to generate works sitemap:', error)
    throw error
  }
}

/**
 * 生成新闻站点地图
 * @returns {Promise<string>} XML 格式的站点地图
 */
export const generateNewsSitemap = async () => {
  try {
    const query = new AV.Query('News')
    query.equalTo('status', 'published')
    query.descending('publishedAt')
    
    try {
      const news = await query.find()
      // 如果News类不存在,返回空数组
      return []
    } catch (error) {
      if (error.code === 101) { // Class not found
        console.log('News class not found, skipping news sitemap generation')
        return []
      }
      throw error
    }
  } catch (error) {
    console.error('生成新闻站点地图时出错:', error)
    return [] // 出错时返回空数组而不是抛出错误
  }
}

/**
 * 生成主站点地图索引
 * @returns {string} XML 格式的站点地图索引
 */
export const generateSitemapIndex = () => {
  const sitemaps = [
    'https://photosong.com/sitemap-main.xml',
    'https://photosong.com/sitemap-works.xml'
  ]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  sitemaps.forEach(url => {
    xml += '  <sitemap>\n'
    xml += `    <loc>${url}</loc>\n`
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`
    xml += '  </sitemap>\n'
  })

  xml += '</sitemapindex>'
  return xml
}

/**
 * 提交站点地图到搜索引擎
 * @returns {Promise<Object>} 提交结果
 */
export const submitSitemapToSearchEngines = async () => {
  // 不再提交到任何搜索引擎
  if (import.meta.env.DEV) {
    console.log('Sitemap generation completed')
  }
  return true
}

/**
 * 获取所有需要提交的URL
 * @returns {Promise<string[]>} URL列表
 */
const getAllUrls = async () => {
  const urls = new Set()
  
  // 添加静态页面URL
  const staticPaths = [
    '/',
    '/create',
    '/community',
    '/articles',
    '/works',
    '/features',
    '/pricing',
    '/tutorial',
    '/ai-music-generator',
    '/photo-to-music',
    '/image-to-music',
    '/ai-music-creator',
    '/ai-beat-maker',
    '/faq',
    '/help',
    '/contact',
    '/about',
    '/terms',
    '/privacy'
  ]

  // 添加基础URL
  staticPaths.forEach(path => {
    urls.add(`https://photosong.com${path}`)
    // 添加多语言版本
    supportedLocales.forEach(locale => {
      urls.add(`https://photosong.com/${locale}${path}`)
    })
  })

  try {
    // 获取作品URL
    const workQuery = new AV.Query('Work')
    workQuery.equalTo('status', 'completed')
    const works = await workQuery.find()
    works.forEach(work => {
      urls.add(`https://photosong.com/work/${work.id}`)
      supportedLocales.forEach(locale => {
        urls.add(`https://photosong.com/${locale}/work/${work.id}`)
      })
    })

    // 获取文章URL
    const articleQuery = new AV.Query('Article')
    articleQuery.equalTo('status', 'published')
    const articles = await articleQuery.find()
    articles.forEach(article => {
      const slug = article.get('slug') || article.id
      urls.add(`https://photosong.com/articles/${slug}`)
      supportedLocales.forEach(locale => {
        urls.add(`https://photosong.com/${locale}/articles/${slug}`)
      })
    })

    // 获取新闻URL
    const newsQuery = new AV.Query('News')
    newsQuery.equalTo('status', 'published')
    const news = await newsQuery.find()
    news.forEach(item => {
      urls.add(`https://photosong.com/news/${item.id}`)
      supportedLocales.forEach(locale => {
        urls.add(`https://photosong.com/${locale}/news/${item.id}`)
      })
    })
  } catch (error) {
    console.error('Error gathering URLs:', error)
  }

  return Array.from(urls)
}

/**
 * 更新所有站点地图并提交到搜索引擎
 */
export const updateAllSitemaps = async () => {
  try {
    const [mainSitemap, worksSitemap, newsSitemap] = await Promise.allSettled([
      generateMainSitemap(),
      generateWorksSitemap(),
      generateNewsSitemap()
    ])

    // 处理每个站点地图的结果
    const sitemaps = {
      'sitemap.xml': mainSitemap.value || '',
      'works-sitemap.xml': worksSitemap.value || '',
      'news-sitemap.xml': newsSitemap.value || ''
    }

    await writeSitemapFiles(sitemaps)
    
    console.log('所有站点地图更新完成')
  } catch (error) {
    console.error('更新站点地图时出错:', error)
    // 不抛出错误,让应用继续运行
  }
}

/**
 * 生成主站点地图
 * @returns {string} XML 格式的站点地图
 */
export const generateMainSitemap = () => {
  const staticPaths = [
    // 核心功能页面
    { path: '/', priority: 1.0, changefreq: 'always' },
    { path: '/create', priority: 1.0, changefreq: 'always' },
    { path: '/community', priority: 0.9, changefreq: 'always' },
    { path: '/articles', priority: 0.9, changefreq: 'always' },
    { path: '/works', priority: 0.9, changefreq: 'always' },
    
    // 功能介绍页面
    { path: '/features', priority: 0.8, changefreq: 'daily' },
    { path: '/pricing', priority: 0.8, changefreq: 'daily' },
    { path: '/tutorial', priority: 0.8, changefreq: 'daily' },
    
    // AI音乐相关页面
    { path: '/ai-music-generator', priority: 0.9, changefreq: 'always' },
    { path: '/photo-to-music', priority: 0.9, changefreq: 'always' },
    { path: '/image-to-music', priority: 0.9, changefreq: 'always' },
    { path: '/ai-music-creator', priority: 0.9, changefreq: 'always' },
    { path: '/ai-beat-maker', priority: 0.9, changefreq: 'always' },
    
    // 帮助和支持页面
    { path: '/faq', priority: 0.7, changefreq: 'weekly' },
    { path: '/help', priority: 0.7, changefreq: 'weekly' },
    { path: '/contact', priority: 0.7, changefreq: 'weekly' },
    
    // 其他重要页面
    { path: '/about', priority: 0.6, changefreq: 'monthly' },
    { path: '/terms', priority: 0.5, changefreq: 'monthly' },
    { path: '/privacy', priority: 0.5, changefreq: 'monthly' },
    
    // 分类页面
    { path: '/articles/category/news', priority: 0.8, changefreq: 'always' },
    { path: '/articles/category/tutorials', priority: 0.8, changefreq: 'daily' },
    { path: '/articles/category/ai_music', priority: 0.8, changefreq: 'daily' },
    { path: '/articles/category/knowledge', priority: 0.8, changefreq: 'daily' },
    { path: '/articles/category/professional', priority: 0.8, changefreq: 'daily' }
  ]

  const urls = []
  staticPaths.forEach(({ path, priority, changefreq }) => {
    urls.push(...generateMultilingualUrls(path, priority, changefreq))
  })

  return generateSitemapXML(urls)
}

const generateMultilingualUrls = (path, priority = 0.8, changefreq = 'daily') => {
  const urls = []
  
  // 添加 x-default 版本
  urls.push({
    loc: `https://photosong.com${path}`,
    lastmod: new Date().toISOString(),
    changefreq,
    priority,
    alternates: [
      {
        hreflang: 'x-default',
        href: `https://photosong.com${path}`
      },
      ...supportedLocales.map(locale => ({
        hreflang: locale,
        href: `https://photosong.com/${locale}${path}`
      }))
    ]
  })

  // 添加各语言版本
  supportedLocales.forEach(locale => {
    urls.push({
      loc: `https://photosong.com/${locale}${path}`,
      lastmod: new Date().toISOString(),
      changefreq,
      priority,
      alternates: [
        {
          hreflang: 'x-default',
          href: `https://photosong.com${path}`
        },
        ...supportedLocales.map(altLocale => ({
          hreflang: altLocale,
          href: `https://photosong.com/${altLocale}${path}`
        }))
      ]
    })
  })

  return urls
}

// 生成 XML
const generateSitemapXML = (urls) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'

  urls.forEach(url => {
    xml += '  <url>\n'
    xml += `    <loc>${url.loc}</loc>\n`
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`
    xml += `    <priority>${url.priority}</priority>\n`
    
    // 添加多语言替代链接
    if (url.alternates) {
      url.alternates.forEach(alt => {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />\n`
      })
    }
    
    xml += '  </url>\n'
  })

  xml += '</urlset>'
  return xml
}

// 修改文件写入函数
export const writeSitemapFiles = async (sitemaps) => {
  try {
    // 直接生成 sitemap 文件内容
    const mainSitemap = await generateMainSitemap()
    const worksSitemap = await generateWorksSitemap()
    const sitemapIndex = generateSitemapIndex()

    // 只在开发环境输出调试信息
    if (import.meta.env.DEV) {
      console.log('Generated sitemaps')
    }

    // 提交到搜索引擎
    if (import.meta.env.PROD) {
      await submitSitemapToSearchEngines()
    }

    return true
  } catch (error) {
    // 静默处理错误，不输出到控制台
    return false
  }
}

// 添加定时更新功能
export const startSitemapUpdateScheduler = () => {
  // Only start scheduler in production
  if (import.meta.env.PROD) {
    const updateSitemaps = async () => {
      try {
        const mainSitemap = await generateMainSitemap()
        const worksSitemap = await generateWorksSitemap()
        const sitemapIndex = generateSitemapIndex()

        // 提交到搜索引擎
        await submitSitemapToSearchEngines()
      } catch (error) {
        console.warn('Sitemap update failed:', error)
      }
    }

    // Initial update
    updateSitemaps()

    // Schedule updates every 12 hours
    setInterval(updateSitemaps, 12 * 60 * 60 * 1000)
  }
}

export default {
  generateMainSitemap,
  generateWorksSitemap,
  generateSitemapIndex
} 