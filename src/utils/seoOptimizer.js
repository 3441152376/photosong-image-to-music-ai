import { supportedLocales } from '../i18n'

// 内部链接优化
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
}

// Hreflang 标签生成器
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

// 页面加载优化
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

// 导出优化器实例
export const internalLinkOptimizer = new InternalLinkOptimizer()
export const hreflangGenerator = new HreflangGenerator()
export const pageLoadOptimizer = new PageLoadOptimizer() 