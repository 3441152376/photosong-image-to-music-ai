import AV from 'leancloud-storage'
import { nanoid } from 'nanoid'
import { marked } from 'marked'
import i18n from '../i18n'
import { supportedLocales } from '../i18n'

// 文章类型定义
export const ARTICLE_TYPES = {
  TUTORIAL: 'tutorial',
  MUSIC_THEORY: 'music_theory',
  NEWS: 'news',
  CASE_STUDY: 'case_study',
  SEO: 'seo'
}

// 文章模板
const ARTICLE_TEMPLATES = {
  [ARTICLE_TYPES.TUTORIAL]: {
    title: '如何使用 Photo Song 创作你的第一首 AI 音乐',
    sections: [
      '简介',
      '准备工作',
      '上传图片',
      '选择音乐风格',
      '生成音乐',
      '编辑和优化',
      '保存和分享',
      '进阶技巧'
    ]
  },
  [ARTICLE_TYPES.MUSIC_THEORY]: {
    title: '了解不同音乐风格：从古典到现代',
    sections: [
      '音乐风格概述',
      '古典音乐特点',
      '爵士乐的魅力',
      '流行音乐的演变',
      '电子音乐的革新',
      '如何选择合适的音乐风格'
    ]
  },
  [ARTICLE_TYPES.NEWS]: {
    title: 'AI 音乐创作的最新突破',
    sections: [
      '行业动态',
      '技术创新',
      '成功案例',
      '未来展望'
    ]
  }
}

// 生成文章内容
async function generateArticleContent(type, language = 'zh') {
  const { t } = i18n.global

  try {
    const template = ARTICLE_TEMPLATES[type]
    if (!template) {
      throw new Error('Invalid article type')
    }

    // 这里应该调用 OpenAI API 生成内容
    // 为了演示，我们使用模板内容
    const content = template.sections.map(section => `
## ${section}

${t(`article.templates.${type}.${section.toLowerCase()}`)}
    `).join('\n\n')

    // 从内容中提取关键词
    const keywords = await generateKeywordsFromContent(content, type, language)

    return {
      title: t(`article.templates.${type}.title`),
      content: content,
      summary: t(`article.templates.${type}.summary`),
      keywords: keywords
    }
  } catch (error) {
    console.error('Generate article content failed:', error)
    throw error
  }
}

// 从内容中生成关键词
async function generateKeywordsFromContent(content, type, language) {
  const baseKeywords = getLanguageSpecificKeywords(language)
  const typeKeywords = getTypeSpecificKeywords(type, language)
  
  // 提取内容中的重要短语作为长尾关键词
  const contentKeywords = extractKeywordsFromContent(content, language)
  
  return [...new Set([
    ...baseKeywords,
    ...typeKeywords,
    ...contentKeywords
  ])]
}

// 根据文章类型获取特定关键词
function getTypeSpecificKeywords(type, language) {
  const typeKeywords = {
    [ARTICLE_TYPES.TUTORIAL]: {
      zh: ['AI音乐教程', '图片转音乐教程', '音乐生成指南', '新手入门教程'],
      en: ['AI music tutorial', 'photo to music guide', 'music generation guide', 'beginner tutorial'],
      ru: ['руководство по ИИ музыке', 'учебник по фото музыке', 'генерация музыки руководство']
    },
    [ARTICLE_TYPES.MUSIC_THEORY]: {
      zh: ['音乐理论', '音乐风格分析', '音乐创作技巧', '音乐风格指南'],
      en: ['music theory', 'music style analysis', 'music creation tips', 'style guide'],
      ru: ['теория музыки', 'анализ музыкальных стилей', 'советы по созданию музыки']
    },
    [ARTICLE_TYPES.NEWS]: {
      zh: ['AI音乐新闻', '音乐科技动态', '行业新闻', '最新进展'],
      en: ['AI music news', 'music tech updates', 'industry news', 'latest developments'],
      ru: ['новости ИИ музыки', 'музыкальные технологии', 'новости индустрии']
    }
  }
  
  return typeKeywords[type]?.[language] || []
}

// 从内容中提取关键词
function extractKeywordsFromContent(content, language) {
  // 移除 Markdown 标记
  const plainText = content.replace(/[#*`]/g, '').toLowerCase()
  
  // 根据语言选择分词策略
  let words = []
  switch (language) {
    case 'zh':
      // 中文分词（这里可以使用更专业的分词库）
      words = plainText.match(/[\u4e00-\u9fa5]{2,}/g) || []
      break
    case 'ru':
      // 俄语分词
      words = plainText.match(/[а-яА-ЯёЁ]+/g) || []
      break
    default:
      // 英语分词
      words = plainText.match(/\b\w{3,}\b/g) || []
  }
  
  // 统计词频
  const wordFreq = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  
  // 选择出现频率较高的词作为关键词
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

// 保存文章到数据库
async function saveArticle(article) {
  try {
    const Article = AV.Object.extend('Article')
    const newArticle = new Article()

    const slug = nanoid(10)
    
    newArticle.set('title', article.title)
    newArticle.set('content', article.content)
    newArticle.set('summary', article.summary)
    newArticle.set('type', article.type)
    newArticle.set('slug', slug)
    newArticle.set('status', 'published')
    newArticle.set('language', article.language || 'zh')
    newArticle.set('publishedAt', new Date())
    
    // 生成 HTML 内容
    const htmlContent = marked(article.content)
    newArticle.set('htmlContent', htmlContent)

    // SEO 相关字段
    newArticle.set('metaTitle', article.title)
    newArticle.set('metaDescription', article.summary)
    newArticle.set('keywords', article.keywords || [])

    await newArticle.save()
    return newArticle
  } catch (error) {
    console.error('Save article failed:', error)
    throw error
  }
}

// 添加获取默认语言的函数
export function getDefaultLanguage() {
  try {
    // 1. 首先检查用户是否已经设置了语言偏好
    const savedLang = localStorage.getItem('language')
    if (savedLang && supportedLocales.includes(savedLang)) {
      return savedLang
    }

    // 2. 检查浏览器语言
    const browserLang = navigator.language.split('-')[0]
    if (supportedLocales.includes(browserLang)) {
      return browserLang
    }

    // 3. 如果都没有匹配的，默认使用英语
    return 'en'
  } catch (error) {
    console.error('Get default language failed:', error)
    return 'en'
  }
}

// 修改自动生成函数
export async function autoGenerateAndPublishArticle(type, language = getDefaultLanguage()) {
  try {
    // 生成文章内容
    const articleData = await generateArticleContent(type, language)
    
    // 保存文章
    const article = await saveArticle({
      ...articleData,
      type,
      language,
      keywords: [
        `photo song`,
        `AI music`,
        `music generation`,
        // 添加语言特定的关键词
        ...getLanguageSpecificKeywords(language)
      ]
    })

    return article
  } catch (error) {
    console.error('Auto generate and publish article failed:', error)
    throw error
  }
}

// 添加语言特定的关键词
function getLanguageSpecificKeywords(language) {
  switch (language) {
    case 'zh':
      return ['图片音乐', 'AI音乐创作', '照片转音乐', '智能音乐生成']
    case 'ru':
      return ['фото музыка', 'ИИ музыка', 'фото в музыку', 'генератор музыки']
    case 'en':
    default:
      return ['photo to music', 'AI music creation', 'image to song', 'music generator']
  }
}

// 修改批量生成函数
export async function batchGenerateArticles(types, languages = [getDefaultLanguage()]) {
  const results = []
  
  // 确保至少有一种语言
  if (languages.length === 0) {
    languages = [getDefaultLanguage()]
  }
  
  for (const type of types) {
    for (const language of languages) {
      try {
        const article = await autoGenerateAndPublishArticle(type, language)
        results.push({
          success: true,
          article,
          type,
          language
        })
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          type,
          language
        })
      }
    }
  }

  return results
} 