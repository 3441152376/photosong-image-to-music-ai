import { getTranslation } from '../i18n'
import { supportedLocales } from '../i18n'

/**
 * SEO优化工具类
 */
export class SEOOptimizer {
  constructor() {
    this.keywordDensityTarget = 0.02 // 关键词密度目标 2%
    this.minContentLength = 300 // 最小内容长度
  }

  /**
   * 生成页面元数据
   */
  generateMetadata({ type, data, locale }) {
    const metadata = {
      title: '',
      description: '',
      keywords: [],
      structuredData: null,
      alternateLinks: {},
      canonical: ''
    }

    switch (type) {
      case 'work':
        metadata.title = this.generateWorkTitle(data, locale)
        metadata.description = this.generateWorkDescription(data, locale)
        metadata.keywords = this.generateWorkKeywords(data, locale)
        metadata.structuredData = this.generateWorkStructuredData(data, locale)
        break
      
      case 'article':
        metadata.title = this.generateArticleTitle(data, locale)
        metadata.description = this.generateArticleDescription(data, locale)
        metadata.keywords = this.generateArticleKeywords(data, locale)
        metadata.structuredData = this.generateArticleStructuredData(data, locale)
        break
      
      case 'user':
        metadata.title = this.generateUserTitle(data, locale)
        metadata.description = this.generateUserDescription(data, locale)
        metadata.keywords = this.generateUserKeywords(data, locale)
        metadata.structuredData = this.generateUserStructuredData(data, locale)
        break
    }

    // 生成多语言链接
    supportedLocales.forEach(lang => {
      metadata.alternateLinks[lang] = this.generateAlternateLink(type, data.id || data.slug, lang)
    })

    // 生成规范链接
    metadata.canonical = this.generateCanonicalLink(type, data.id || data.slug, locale)

    return metadata
  }

  /**
   * 优化内容关键词密度
   */
  optimizeContent(content, keywords) {
    let optimizedContent = content

    // 确保内容长度足够
    if (optimizedContent.length < this.minContentLength) {
      optimizedContent = this.expandContent(optimizedContent, keywords)
    }

    // 优化关键词密度
    keywords.forEach(keyword => {
      const density = this.calculateKeywordDensity(optimizedContent, keyword)
      if (density < this.keywordDensityTarget) {
        optimizedContent = this.increaseKeywordDensity(optimizedContent, keyword)
      }
    })

    return optimizedContent
  }

  /**
   * 生成作品页面标题
   */
  generateWorkTitle(work, locale) {
    const title = work.title || getTranslation(locale, 'work.untitled')
    const style = work.style || getTranslation(locale, 'work.defaultStyle')
    return `${title} - ${style} | PhotoSong`
  }

  /**
   * 生成作品页面描述
   */
  generateWorkDescription(work, locale) {
    const baseDesc = work.description || getTranslation(locale, 'work.defaultDescription')
    const author = work.user?.username || getTranslation(locale, 'work.anonymousUser')
    const style = work.style || getTranslation(locale, 'work.defaultStyle')
    
    return `${baseDesc} ${getTranslation(locale, 'work.createdBy')} ${author}. ${getTranslation(locale, 'work.style')}: ${style}. ${getTranslation(locale, 'work.aiGenerated')}`
  }

  /**
   * 生成作品关键词
   */
  generateWorkKeywords(work, locale) {
    const keywords = [
      'AI Music',
      'Photo to Music',
      work.style,
      'PhotoSong',
      getTranslation(locale, 'keywords.aiMusic'),
      getTranslation(locale, 'keywords.photoMusic')
    ]

    if (work.tags) {
      keywords.push(...work.tags)
    }

    return [...new Set(keywords)].filter(Boolean)
  }

  /**
   * 生成作品结构化数据
   */
  generateWorkStructuredData(work, locale) {
    return {
      '@context': 'https://schema.org',
      '@type': 'MusicComposition',
      'name': work.title,
      'author': {
        '@type': 'Person',
        'name': work.user?.username || getTranslation(locale, 'work.anonymousUser')
      },
      'dateCreated': work.createdAt,
      'genre': work.style,
      'description': work.description
    }
  }

  /**
   * 生成文章页面标题
   */
  generateArticleTitle(article, locale) {
    return `${article.title} | PhotoSong ${getTranslation(locale, 'blog')}`
  }

  /**
   * 生成文章页面描述
   */
  generateArticleDescription(article, locale) {
    return article.excerpt || 
           article.description || 
           `${article.title} - ${getTranslation(locale, 'article.readMore')}`
  }

  /**
   * 生成文章关键词
   */
  generateArticleKeywords(article, locale) {
    const keywords = [
      'PhotoSong',
      'AI Music',
      getTranslation(locale, 'keywords.aiMusic'),
      getTranslation(locale, 'keywords.blog')
    ]

    if (article.tags) {
      keywords.push(...article.tags)
    }

    if (article.categories) {
      keywords.push(...article.categories)
    }

    return [...new Set(keywords)].filter(Boolean)
  }

  /**
   * 生成文章结构化数据
   */
  generateArticleStructuredData(article, locale) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': article.title,
      'author': {
        '@type': 'Person',
        'name': article.author?.username || getTranslation(locale, 'article.anonymousAuthor')
      },
      'datePublished': article.publishedAt || article.createdAt,
      'dateModified': article.updatedAt,
      'description': article.excerpt || article.description,
      'image': article.coverImage,
      'keywords': this.generateArticleKeywords(article, locale).join(',')
    }
  }

  /**
   * 生成用户页面标题
   */
  generateUserTitle(user, locale) {
    return `${user.username} - ${getTranslation(locale, 'profile.title')} | PhotoSong`
  }

  /**
   * 生成用户页面描述
   */
  generateUserDescription(user, locale) {
    return user.bio || 
           `${user.username} ${getTranslation(locale, 'profile.defaultBio')} PhotoSong`
  }

  /**
   * 生成用户关键词
   */
  generateUserKeywords(user, locale) {
    return [
      user.username,
      'PhotoSong',
      'AI Music Creator',
      getTranslation(locale, 'keywords.aiMusic'),
      getTranslation(locale, 'keywords.profile')
    ]
  }

  /**
   * 生成用户结构化数据
   */
  generateUserStructuredData(user, locale) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': user.username,
      'description': user.bio,
      'image': user.avatar,
      'url': this.generateCanonicalLink('user', user.id, locale)
    }
  }

  /**
   * 生成多语言链接
   */
  generateAlternateLink(type, id, locale) {
    return `https://photosong.com/${locale}/${type}/${id}`
  }

  /**
   * 生成规范链接
   */
  generateCanonicalLink(type, id, locale) {
    return `https://photosong.com/${locale}/${type}/${id}`
  }

  /**
   * 计算关键词密度
   */
  calculateKeywordDensity(content, keyword) {
    const wordCount = content.split(/\s+/).length
    const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length
    return keywordCount / wordCount
  }

  /**
   * 增加关键词密度
   */
  increaseKeywordDensity(content, keyword) {
    // 在适当的位置添加关键词
    const sentences = content.split('. ')
    const targetCount = Math.ceil(sentences.length * this.keywordDensityTarget)
    const currentCount = (content.match(new RegExp(keyword, 'gi')) || []).length
    
    if (currentCount < targetCount) {
      const additionalCount = targetCount - currentCount
      for (let i = 0; i < additionalCount; i++) {
        const position = Math.floor(sentences.length / additionalCount * i)
        sentences[position] = `${keyword} ${sentences[position]}`
      }
    }
    
    return sentences.join('. ')
  }

  /**
   * 扩展内容长度
   */
  expandContent(content, keywords) {
    let expanded = content

    // 添加关键词相关的补充内容
    keywords.forEach(keyword => {
      expanded += ` ${getTranslation('zh', 'seo.contentExpansion', { keyword })}`
    })

    return expanded
  }
}

/**
 * Hreflang 标签生成器
 */
export class HreflangGenerator {
  constructor(domain = 'https://photosong.com') {
    this.domain = domain
  }

  // 生成 hreflang 标签
  generateHreflangTags(path, options = {}) {
    const tags = []
    
    // 添加 x-default
    tags.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${this.domain}${path}`
    })
    
    // 为每种支持的语言生成标签
    supportedLocales.forEach(locale => {
      tags.push({
        rel: 'alternate',
        hreflang: this.normalizeLocale(locale),
        href: `${this.domain}/${locale}${path}`
      })
    })
    
    return tags
  }

  // 规范化语言代码
  normalizeLocale(locale) {
    const mapping = {
      zh: 'zh-Hans',
      en: 'en-US',
      ru: 'ru-RU'
    }
    return mapping[locale] || locale
  }

  // 生成 HTML 标签
  generateHreflangHtml(path) {
    return this.generateHreflangTags(path)
      .map(tag => `<link rel="${tag.rel}" hreflang="${tag.hreflang}" href="${tag.href}" />`)
      .join('\n')
  }

  // 生成 HTTP 头部
  generateHreflangHeaders(path) {
    return this.generateHreflangTags(path)
      .map(tag => `Link: <${tag.href}>; rel="${tag.rel}"; hreflang="${tag.hreflang}"`)
      .join('\n')
  }
}

/**
 * 页面加载优化器
 */
export class PageLoadOptimizer {
  constructor() {
    this.optimizations = {
      minLoadTime: 2000, // 目标加载时间（毫秒）
      maxImageSize: 100 * 1024, // 最大图片大小（字节）
      maxCssSize: 50 * 1024, // 最大 CSS 大小
      maxJsSize: 150 * 1024 // 最大 JS 大小
    }
  }

  // 检查页面加载性能
  async checkPagePerformance(url) {
    try {
      const start = performance.now()
      const response = await fetch(url)
      const loadTime = performance.now() - start
      
      return {
        url,
        loadTime,
        isOptimal: loadTime < this.optimizations.minLoadTime,
        recommendations: this.generateRecommendations(loadTime)
      }
    } catch (error) {
      console.error('Performance check failed:', error)
      return null
    }
  }

  // 生成优化建议
  generateRecommendations(loadTime) {
    const recommendations = []
    
    if (loadTime > this.optimizations.minLoadTime) {
      recommendations.push({
        type: 'performance',
        message: '页面加载时间过长，建议优化',
        priority: 'high'
      })
    }
    
    return recommendations
  }

  // 检查资源大小
  checkResourceSize(resources) {
    const issues = []
    
    resources.forEach(resource => {
      switch (resource.type) {
        case 'image':
          if (resource.size > this.optimizations.maxImageSize) {
            issues.push({
              type: 'image',
              url: resource.url,
              message: '图片大小超过限制，建议压缩'
            })
          }
          break
        case 'css':
          if (resource.size > this.optimizations.maxCssSize) {
            issues.push({
              type: 'css',
              url: resource.url,
              message: 'CSS 文件过大，建议拆分或压缩'
            })
          }
          break
        case 'javascript':
          if (resource.size > this.optimizations.maxJsSize) {
            issues.push({
              type: 'javascript',
              url: resource.url,
              message: 'JavaScript 文件过大，建议代码分割'
            })
          }
          break
      }
    })
    
    return issues
  }
}

/**
 * 内部链接优化器
 */
export class InternalLinkOptimizer {
  constructor() {
    this.linkGraph = new Map()
    this.pageRanks = new Map()
  }

  // 添加页面到链接图
  addPage(url, links = []) {
    this.linkGraph.set(url, links)
  }

  // 计算页面权重
  calculatePageRanks(iterations = 20, dampingFactor = 0.85) {
    const pages = Array.from(this.linkGraph.keys())
    let ranks = new Map(pages.map(page => [page, 1.0]))
    
    for (let i = 0; i < iterations; i++) {
      const newRanks = new Map()
      
      for (const page of pages) {
        let rank = (1 - dampingFactor)
        
        // 计算来自其他页面的权重
        for (const [otherPage, links] of this.linkGraph.entries()) {
          if (links.includes(page)) {
            rank += dampingFactor * (ranks.get(otherPage) / links.length)
          }
        }
        
        newRanks.set(page, rank)
      }
      
      ranks = newRanks
    }
    
    this.pageRanks = ranks
  }

  // 获取推荐的内部链接
  getRecommendedLinks(currentUrl, content, maxLinks = 5) {
    const recommendations = []
    
    // 根据页面权重和内容相关性排序
    for (const [url, rank] of this.pageRanks.entries()) {
      if (url !== currentUrl) {
        const relevance = this.calculateRelevance(content, url)
        recommendations.push({
          url,
          score: rank * relevance
        })
      }
    }
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLinks)
      .map(rec => rec.url)
  }

  // 计算内容相关性
  calculateRelevance(content, url) {
    // 简单的相关性计算，可以根据需要扩展
    const urlKeywords = url.toLowerCase().split(/[/-]/).filter(Boolean)
    const contentWords = content.toLowerCase().split(/\W+/).filter(Boolean)
    
    let matches = 0
    for (const keyword of urlKeywords) {
      if (contentWords.includes(keyword)) {
        matches++
      }
    }
    
    return matches / urlKeywords.length
  }

  // 更新链接图
  updateLinkGraph(pages) {
    this.linkGraph.clear()
    pages.forEach(page => {
      this.addPage(page.url, page.links)
    })
    this.calculatePageRanks()
  }

  // 获取链接图统计
  getLinkGraphStats() {
    return {
      totalPages: this.linkGraph.size,
      totalLinks: Array.from(this.linkGraph.values()).reduce((sum, links) => sum + links.length, 0),
      averageLinksPerPage: this.linkGraph.size > 0 
        ? Array.from(this.linkGraph.values()).reduce((sum, links) => sum + links.length, 0) / this.linkGraph.size
        : 0
    }
  }
}

// 导出实例
export const seoOptimizer = new SEOOptimizer()
export const hreflangGenerator = new HreflangGenerator()
export const pageLoadOptimizer = new PageLoadOptimizer()
export const internalLinkOptimizer = new InternalLinkOptimizer() 