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
    query.limit(2000) // 增加收录数量限制

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
    query.limit(1000)
    
    const news = await query.find()
    const languages = ['en', 'zh', 'ru']
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    sitemap += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n'
    sitemap += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    
    news.forEach(item => {
      const newsData = item.toJSON()
      languages.forEach(lang => {
        sitemap += '  <url>\n'
        sitemap += `    <loc>https://photosong.com/${lang}/news/${newsData.objectId}</loc>\n`
        sitemap += '    <news:news>\n'
        sitemap += '      <news:publication>\n'
        sitemap += '        <news:name>Photo Song News</news:name>\n'
        sitemap += `        <news:language>${lang}</news:language>\n`
        sitemap += '      </news:publication>\n'
        sitemap += `      <news:publication_date>${newsData.publishedAt}</news:publication_date>\n`
        sitemap += `      <news:title>${newsData[`title_${lang}`] || newsData.title}</news:title>\n`
        sitemap += '    </news:news>\n'
        
        // Add hreflang tags
        languages.forEach(altLang => {
          sitemap += '    <xhtml:link rel="alternate" hreflang="' + altLang + '" '
          sitemap += `href="https://photosong.com/${altLang}/news/${newsData.objectId}"/>\n`
        })
        sitemap += '    <xhtml:link rel="alternate" hreflang="x-default" '
        sitemap += `href="https://photosong.com/news/${newsData.objectId}"/>\n`
        
        sitemap += '  </url>\n'
      })
    })
    
    sitemap += '</urlset>'
    return sitemap
  } catch (error) {
    console.error('生成新闻站点地图时出错:', error)
    throw error
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
 * 更新所有站点地图
 */
export const updateAllSitemaps = async () => {
  try {
    // 生成所有站点地图
    const mainSitemap = generateMainSitemap()
    const worksSitemap = await generateWorksSitemap()
    const newsSitemap = await generateNewsSitemap()
    const sitemapIndex = generateSitemapIndex()
    
    // 保存到 LeanCloud
    const files = [
      new AV.File('sitemap.xml', { base64: btoa(sitemapIndex) }),
      new AV.File('main-sitemap.xml', { base64: btoa(mainSitemap) }),
      new AV.File('works-sitemap.xml', { base64: btoa(worksSitemap) }),
      new AV.File('news-sitemap.xml', { base64: btoa(newsSitemap) })
    ]
    
    await Promise.all(files.map(file => file.save()))
    
    console.log('所有站点地图已更新')
    return true
  } catch (error) {
    console.error('更新站点地图时出错:', error)
    throw error
  }
}

/**
 * 生成主站点地图
 * @returns {string} XML 格式的站点地图
 */
export const generateMainSitemap = () => {
  const staticPaths = [
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
    { path: '/about', priority: 0.7, changefreq: 'monthly' }
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

export default {
  generateMainSitemap,
  generateWorksSitemap,
  generateSitemapIndex
} 