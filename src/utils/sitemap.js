import AV from 'leancloud-storage'

/**
 * 生成作品站点地图
 * @returns {Promise<string>} XML 格式的站点地图
 */
export const generateWorksSitemap = async () => {
  try {
    // 查询所有公开的作品
    const query = new AV.Query('Work')
    query.equalTo('isPublic', true)
    query.descending('updatedAt')
    query.limit(1000) // 限制最多 1000 个作品
    
    const works = await query.find()
    
    // 生成站点地图头部
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    sitemap += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n'
    sitemap += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n'
    sitemap += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n'
    
    // 为每个作品生成 URL 条目
    works.forEach(work => {
      const workData = work.toJSON()
      sitemap += '  <url>\n'
      sitemap += `    <loc>https://photosong.com/work/${workData.objectId}</loc>\n`
      sitemap += `    <lastmod>${workData.updatedAt.toISOString()}</lastmod>\n`
      sitemap += '    <changefreq>weekly</changefreq>\n'
      sitemap += '    <priority>0.8</priority>\n'
      
      // 添加多语言支持
      sitemap += '    <xhtml:link rel="alternate" hreflang="en" '
      sitemap += `href="https://photosong.com/en/work/${workData.objectId}"/>\n`
      sitemap += '    <xhtml:link rel="alternate" hreflang="zh" '
      sitemap += `href="https://photosong.com/zh/work/${workData.objectId}"/>\n`
      sitemap += '    <xhtml:link rel="alternate" hreflang="ru" '
      sitemap += `href="https://photosong.com/ru/work/${workData.objectId}"/>\n`
      
      // 添加图片信息
      if (workData.imageUrl) {
        sitemap += '    <image:image>\n'
        sitemap += `      <image:loc>${workData.imageUrl}</image:loc>\n`
        sitemap += `      <image:title>${workData.title || 'Photo Music Creation'}</image:title>\n`
        sitemap += '      <image:caption>AI generated music from photo</image:caption>\n'
        sitemap += `      <image:geo_location>${workData.location || 'Global'}</image:geo_location>\n`
        sitemap += '      <image:license>https://photosong.com/license</image:license>\n'
        sitemap += '    </image:image>\n'
      }
      
      // 添加预览视频信息（如果有）
      if (workData.previewVideoUrl) {
        sitemap += '    <video:video>\n'
        sitemap += `      <video:thumbnail_loc>${workData.imageUrl}</video:thumbnail_loc>\n`
        sitemap += `      <video:title>${workData.title || 'Photo Music Creation'}</video:title>\n`
        sitemap += '      <video:description>AI generated music visualization from photo</video:description>\n'
        sitemap += '      <video:content_loc>' + workData.previewVideoUrl + '</video:content_loc>\n'
        sitemap += '      <video:player_loc>' + 
                   `https://photosong.com/embed/work/${workData.objectId}` + 
                   '</video:player_loc>\n'
        sitemap += '      <video:duration>120</video:duration>\n'
        sitemap += '      <video:family_friendly>yes</video:family_friendly>\n'
        sitemap += `      <video:publication_date>${workData.createdAt}</video:publication_date>\n`
        sitemap += '      <video:uploader info="https://photosong.com/users/' + 
                   `${workData.creator.objectId}">${workData.creator.username}</video:uploader>\n`
        sitemap += '    </video:video>\n'
      }
      
      sitemap += '  </url>\n'
    })
    
    sitemap += '</urlset>'
    return sitemap
  } catch (error) {
    console.error('生成作品站点地图时出错:', error)
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
  const now = new Date().toISOString()
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
  sitemap += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  // 主站点地图
  sitemap += '  <sitemap>\n'
  sitemap += '    <loc>https://photosong.com/main-sitemap.xml</loc>\n'
  sitemap += `    <lastmod>${now}</lastmod>\n`
  sitemap += '  </sitemap>\n'
  
  // 作品站点地图
  sitemap += '  <sitemap>\n'
  sitemap += '    <loc>https://photosong.com/works-sitemap.xml</loc>\n'
  sitemap += `    <lastmod>${now}</lastmod>\n`
  sitemap += '  </sitemap>\n'
  
  // 新闻站点地图
  sitemap += '  <sitemap>\n'
  sitemap += '    <loc>https://photosong.com/news-sitemap.xml</loc>\n'
  sitemap += `    <lastmod>${now}</lastmod>\n`
  sitemap += '  </sitemap>\n'
  
  sitemap += '</sitemapindex>'
  return sitemap
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
  const languages = ['en', 'zh', 'ru']
  const pages = [
    { 
      url: '/',
      priority: '1.0',
      changefreq: 'daily',
      translations: {
        en: 'Photo Song - Turn Photos into Music | AI Photo Music Generator',
        zh: 'Photo Song - 照片转音乐 | AI 照片音乐生成器',
        ru: 'Photo Song - Превращайте фотографии в музыку | AI генератор музыки из фото'
      }
    },
    { 
      url: '/community',
      priority: '0.9',
      changefreq: 'hourly',
      translations: {
        en: 'Community - Share Your Photo Music Creations',
        zh: '社区 - 分享您的照片音乐作品',
        ru: 'Сообщество - Поделитесь своими музыкальными творениями'
      }
    },
    { 
      url: '/pricing',
      priority: '0.8',
      changefreq: 'weekly',
      translations: {
        en: 'Pricing - Photo Music Generator Plans',
        zh: '定价 - 照片音乐生成器套餐',
        ru: 'Цены - Планы генератора музыки из фото'
      }
    },
    {
      url: '/features',
      priority: '0.8',
      changefreq: 'weekly',
      translations: {
        en: 'Features - AI Photo to Music Conversion',
        zh: '功能 - AI 照片转音乐转换',
        ru: 'Функции - AI конвертация фото в музыку'
      }
    },
    {
      url: '/how-it-works',
      priority: '0.8',
      changefreq: 'monthly',
      translations: {
        en: 'How It Works - Convert Photos to Music',
        zh: '工作原理 - 将照片转换为音乐',
        ru: 'Как это работает - Конвертация фото в музыку'
      }
    }
  ]
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  sitemap += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  
  pages.forEach(page => {
    languages.forEach(lang => {
      sitemap += '  <url>\n'
      sitemap += `    <loc>https://photosong.com/${lang}${page.url}</loc>\n`
      sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`
      sitemap += `    <priority>${page.priority}</priority>\n`
      
      // Add hreflang tags for all language versions
      languages.forEach(altLang => {
        sitemap += '    <xhtml:link rel="alternate" hreflang="' + altLang + '" '
        sitemap += `href="https://photosong.com/${altLang}${page.url}"/>\n`
      })
      
      // Add x-default hreflang
      sitemap += '    <xhtml:link rel="alternate" hreflang="x-default" '
      sitemap += `href="https://photosong.com${page.url}"/>\n`
      
      sitemap += '  </url>\n'
    })
  })
  
  sitemap += '</urlset>'
  return sitemap
} 