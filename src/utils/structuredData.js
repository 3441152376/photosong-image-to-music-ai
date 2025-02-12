import { nanoid } from 'nanoid'

// 生成组织结构化数据
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'PhotoSong',
  'url': 'https://photosong.com',
  'logo': 'https://photosong.com/logo.png',
  'sameAs': [
    'https://twitter.com/PhotoSong',
    'https://facebook.com/PhotoSong',
    'https://instagram.com/PhotoSong'
  ],
  'contactPoint': {
    '@type': 'ContactPoint',
    'telephone': '+1-xxx-xxx-xxxx',
    'contactType': 'customer service',
    'availableLanguage': ['English', 'Chinese', 'Russian']
  }
})

// 生成面包屑结构化数据
export const generateBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url
  }))
})

// 生成FAQ页面结构化数据
export const generateFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.map(faq => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.answer
    }
  }))
})

// 生成评分和评论结构化数据
export const generateRatingSchema = (work) => ({
  '@context': 'https://schema.org',
  '@type': 'MusicComposition',
  'name': work.title,
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': work.averageRating || '0',
    'reviewCount': work.reviewCount || '0',
    'bestRating': '5',
    'worstRating': '1'
  },
  'review': work.reviews?.map(review => ({
    '@type': 'Review',
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': review.rating
    },
    'author': {
      '@type': 'Person',
      'name': review.author.username
    },
    'reviewBody': review.content,
    'datePublished': review.createdAt
  })) || []
})

// 生成作品结构化数据(增强版)
export const generateWorkSchema = (work) => ({
  '@context': 'https://schema.org',
  '@type': 'MusicComposition',
  'name': work.title,
  'creator': {
    '@type': 'Person',
    'name': work.user?.username || 'Anonymous'
  },
  'dateCreated': work.createdAt,
  'image': work.imageUrl,
  'audio': work.audioUrl,
  'genre': work.style,
  'provider': {
    '@type': 'Organization',
    'name': 'PhotoSong',
    'url': 'https://photosong.com'
  },
  'isPartOf': {
    '@type': 'CreativeWork',
    'name': 'PhotoSong AI Generated Music',
    'url': 'https://photosong.com'
  },
  'license': 'https://photosong.com/license',
  'copyrightYear': new Date(work.createdAt).getFullYear(),
  'inLanguage': work.language || 'en',
  ...generateRatingSchema(work)
})

// 生成文章结构化数据(增强版)
export const generateArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': article.title,
  'author': {
    '@type': 'Person',
    'name': article.author?.username || 'Anonymous'
  },
  'datePublished': article.publishedAt,
  'dateModified': article.updatedAt,
  'image': article.coverImage,
  'articleBody': article.content,
  'publisher': {
    '@type': 'Organization',
    'name': 'PhotoSong',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://photosong.com/logo.png'
    }
  },
  'mainEntityOfPage': {
    '@type': 'WebPage',
    '@id': `https://photosong.com/articles/${article.slug || article.id}`
  },
  'keywords': article.keywords?.join(', '),
  'inLanguage': article.language || 'en',
  'articleSection': article.category,
  'wordCount': article.content ? article.content.split(/\s+/).length : 0
})

// 基础结构化数据生成器
export function generateBaseStructuredData({ type, name, description, language }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    inLanguage: language,
    url: window.location.href,
    publisher: {
      '@type': 'Organization',
      name: 'PhotoSong',
      url: 'https://photosong.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://photosong.com/logo.png'
      }
    }
  }
}

// 音乐作品结构化数据生成器
export function generateWorkStructuredData(work, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'MusicComposition',
    name: work.title,
    description: work.description,
    language
  })

  return {
    ...baseData,
    composer: {
      '@type': 'Person',
      name: work.author
    },
    datePublished: work.createdAt,
    genre: work.style,
    audio: {
      '@type': 'AudioObject',
      contentUrl: work.audioUrl,
      encodingFormat: 'audio/mpeg'
    },
    image: {
      '@type': 'ImageObject',
      contentUrl: work.imageUrl,
      caption: work.title
    },
    keywords: work.keywords?.join(','),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ListenAction',
      userInteractionCount: work.playCount || 0
    },
    ...generateRatingSchema(work)
  }
}

// 文章结构化数据生成器
export function generateArticleStructuredData(article, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'Article',
    name: article.title,
    description: article.description || article.excerpt,
    language
  })

  return {
    ...baseData,
    headline: article.title,
    author: {
      '@type': 'Person',
      name: article.author
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: {
      '@type': 'ImageObject',
      contentUrl: article.coverImage,
      caption: article.title
    },
    keywords: article.keywords?.join(','),
    articleBody: article.content,
    wordCount: article.content ? article.content.split(/\s+/).length : 0,
    articleSection: article.category || 'Music'
  }
}

// 用户资料结构化数据生成器
export function generateUserStructuredData(user, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'Person',
    name: user.username,
    description: user.bio,
    language
  })

  return {
    ...baseData,
    image: {
      '@type': 'ImageObject',
      contentUrl: user.avatar,
      caption: user.username
    },
    sameAs: [
      user.website,
      ...Object.values(user.socialLinks || {}).filter(Boolean)
    ].filter(Boolean)
  }
}

// 搜索结果结构化数据生成器
export function generateSearchStructuredData(query, results, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'SearchResultsPage',
    name: `Search results for "${query}"`,
    description: `Found ${results.length} results for "${query}"`,
    language
  })

  return {
    ...baseData,
    about: results.map(result => ({
      '@type': result.type,
      name: result.title,
      description: result.description,
      url: result.url
    }))
  }
}

// FAQ 结构化数据生成器
export function generateFAQStructuredData(faqs, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'FAQPage',
    name: 'Frequently Asked Questions',
    description: 'Common questions about PhotoSong',
    language
  })

  return {
    ...baseData,
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

// 生成 BreadcrumbList 结构化数据
export function generateBreadcrumbStructuredData(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
} 