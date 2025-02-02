import i18n from '../i18n'

// 基础 Meta 信息
const BASE_META = {
  zh: {
    siteName: 'Photo Song - AI 照片音乐生成器',
    description: '使用先进的 AI 技术将您的照片转换为独特的音乐作品。创建个性化的音乐，让每张照片都能讲述自己的故事。',
    keywords: '照片转音乐,AI音乐生成器,图片配乐,AI作曲,照片音乐制作'
  },
  en: {
    siteName: 'Photo Song - AI Photo Music Generator',
    description: 'Transform your photos into unique musical pieces with advanced AI technology. Create personalized music that tells the story of your images.',
    keywords: 'photo to music,AI music generator,image music converter,AI composer,photo song maker'
  },
  ru: {
    siteName: 'Photo Song - ИИ генератор музыки из фотографий',
    description: 'Преобразуйте ваши фотографии в уникальные музыкальные произведения с помощью передовых технологий ИИ. Создавайте персонализированную музыку, которая расскажет историю ваших изображений.',
    keywords: 'фото в музыку,ИИ генератор музыки,конвертер изображений в музыку,ИИ композитор,создание музыки из фото'
  }
}

// 生成页面标题
export const generateTitle = (pageTitle) => {
  const locale = i18n.global.locale.value
  const baseName = BASE_META[locale].siteName
  return pageTitle ? `${pageTitle} | ${baseName}` : baseName
}

// 生成 Meta 描述
export const generateDescription = (customDescription) => {
  const locale = i18n.global.locale.value
  return customDescription || BASE_META[locale].description
}

// 生成 Meta 关键词
export const generateKeywords = (customKeywords = []) => {
  const locale = i18n.global.locale.value
  const baseKeywords = BASE_META[locale].keywords.split(',')
  return [...new Set([...baseKeywords, ...customKeywords])].join(',')
}

// 生成结构化数据
export const generateSchema = (data) => {
  const locale = i18n.global.locale.value
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BASE_META[locale].siteName,
    description: BASE_META[locale].description,
    url: window.location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/${locale}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return data ? { ...baseSchema, ...data } : baseSchema
}

// 生成 Open Graph 标签
export const generateOpenGraph = (data = {}) => {
  const locale = i18n.global.locale.value
  const baseOG = {
    'og:site_name': BASE_META[locale].siteName,
    'og:title': data.title || BASE_META[locale].siteName,
    'og:description': data.description || BASE_META[locale].description,
    'og:type': data.type || 'website',
    'og:url': window.location.href,
    'og:locale': locale,
    'og:image': data.image || `${window.location.origin}/og-image-${locale}.jpg`
  }

  return baseOG
}

// 生成 Twitter 卡片标签
export const generateTwitterCard = (data = {}) => {
  const locale = i18n.global.locale.value
  return {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@PhotoSongAI',
    'twitter:title': data.title || BASE_META[locale].siteName,
    'twitter:description': data.description || BASE_META[locale].description,
    'twitter:image': data.image || `${window.location.origin}/twitter-card-${locale}.jpg`
  }
}

// 更新页面 Meta 信息
export const updatePageMeta = (meta = {}) => {
  // 更新标题
  document.title = generateTitle(meta.title)

  // 更新 Meta 描述
  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', generateDescription(meta.description))
  }

  // 更新 Meta 关键词
  const keywordsMeta = document.querySelector('meta[name="keywords"]')
  if (keywordsMeta) {
    keywordsMeta.setAttribute('content', generateKeywords(meta.keywords))
  }

  // 更新结构化数据
  const schemaScript = document.querySelector('#schema-script')
  if (schemaScript) {
    schemaScript.textContent = JSON.stringify(generateSchema(meta.schema))
  }

  // 更新 Open Graph 标签
  const ogTags = generateOpenGraph(meta)
  Object.entries(ogTags).forEach(([property, content]) => {
    const meta = document.querySelector(`meta[property="${property}"]`)
    if (meta) {
      meta.setAttribute('content', content)
    }
  })

  // 更新 Twitter 卡片标签
  const twitterTags = generateTwitterCard(meta)
  Object.entries(twitterTags).forEach(([name, content]) => {
    const meta = document.querySelector(`meta[name="${name}"]`)
    if (meta) {
      meta.setAttribute('content', content)
    }
  })
}

export default {
  generateTitle,
  generateDescription,
  generateKeywords,
  generateSchema,
  generateOpenGraph,
  generateTwitterCard,
  updatePageMeta
} 