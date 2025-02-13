import { nanoid } from 'nanoid'

// 生成组织结构化数据
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'PhotoSongAi',
  'url': 'https://photosong.com',
  'logo': 'https://photosong.com/logo.png',
  'sameAs': [
    'https://twitter.com/PhotoSongAi',
    'https://facebook.com/PhotoSongAi',
    'https://instagram.com/PhotoSongAi'
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
export const generateRatingSchema = (work) => {
  // 确保评分和评论数为正数
  const ratingValue = parseFloat(work.averageRating) || 0
  const reviewCount = parseInt(work.reviewCount) || 0
  
  // 确保评分在 1-5 的范围内
  const normalizedRating = Math.min(Math.max(ratingValue, 1), 5)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    'name': work.title,
    'aggregateRating': reviewCount > 0 ? {
      '@type': 'AggregateRating',
      'ratingValue': normalizedRating.toFixed(1),
      'reviewCount': Math.max(reviewCount, 0),
      'bestRating': '5',
      'worstRating': '1'
    } : undefined,
    'review': (work.reviews || [])
      .filter(review => review && review.rating >= 1 && review.rating <= 5)
      .map(review => ({
        '@type': 'Review',
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': Math.min(Math.max(parseFloat(review.rating), 1), 5).toFixed(1),
          'bestRating': '5',
          'worstRating': '1'
        },
        'author': {
          '@type': 'Person',
          'name': review.author?.username || 'Anonymous'
        },
        'reviewBody': review.content || '',
        'datePublished': review.createdAt
      }))
  }
}

// 生成作品结构化数据(增强版)
export const generateWorkSchema = (work) => {
  // 确保评分在有效范围内
  const rating = work.rating ? Math.min(Math.max(parseFloat(work.rating), 1), 5) : undefined
  const ratingCount = work.ratingCount ? Math.max(parseInt(work.ratingCount), 0) : 0
  
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    'name': work.title || '',
    'creator': {
      '@type': 'Person',
      'name': work.user?.username || 'Anonymous'
    },
    'dateCreated': work.createdAt,
    'image': work.imageUrl || '',
    'audio': work.audioUrl || '',
    'genre': work.style || '',
    'provider': {
      '@type': 'Organization',
      'name': 'PhotoSongAi',
      'url': 'https://photosong.com'
    },
    'isPartOf': {
      '@type': 'CreativeWork',
      'name': 'PhotoSongAi AI Generated Music',
      'url': 'https://photosong.com'
    },
    'license': 'https://photosong.com/license',
    'copyrightYear': new Date(work.createdAt).getFullYear(),
    'inLanguage': work.language || 'en',
    ...(rating && ratingCount > 0 ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': rating.toFixed(1),
        'ratingCount': ratingCount,
        'bestRating': '5',
        'worstRating': '1'
      }
    } : {})
  }
}

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

// 生成价格页面结构化数据
export function generatePricingStructuredData({ language }) {
  const baseData = generateBaseStructuredData({
    type: 'WebPage',
    name: 'PhotoSong Pricing',
    description: 'PhotoSong pricing plans and subscription options',
    language
  })

  return {
    ...baseData,
    '@type': ['WebPage', 'PriceSpecification'],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      offers: [
        {
          '@type': 'Offer',
          name: 'Basic Plan',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '9.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      ]
    }
  }
}

// 生成联系页面结构化数据
export function generateContactPageStructuredData({ language }) {
  const baseData = generateBaseStructuredData({
    type: 'ContactPage',
    name: 'Contact PhotoSong',
    description: 'Get in touch with PhotoSong team',
    language
  })

  return {
    ...baseData,
    mainEntity: {
      '@type': 'Organization',
      name: 'PhotoSong',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-xxx-xxx-xxxx',
        contactType: 'customer service',
        availableLanguage: ['English', 'Chinese', 'Russian'],
        email: 'support@photosong.com'
      }
    }
  }
}

// 生成教程页面结构化数据
export function generateTutorialStructuredData(tutorial, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'HowTo',
    name: tutorial.title,
    description: tutorial.description,
    language
  })

  return {
    ...baseData,
    step: tutorial.steps?.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.content,
      image: step.image,
      url: `#step-${index + 1}`
    })) || []
  }
}

// 生成文章列表页结构化数据
export function generateArticleListStructuredData(articles, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'CollectionPage',
    name: 'PhotoSong Articles',
    description: 'Latest articles and news about AI music generation',
    language
  })

  return {
    ...baseData,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: article.title,
          description: article.description,
          image: article.coverImage,
          url: `https://photosong.com/articles/${article.id}`,
          datePublished: article.publishedAt,
          author: {
            '@type': 'Person',
            name: article.author?.username || 'Anonymous'
          }
        }
      }))
    }
  }
}

// 生成社区页面结构化数据
export function generateCommunityStructuredData(works, { language }) {
  const baseData = generateBaseStructuredData({
    type: 'CollectionPage',
    name: 'PhotoSong Community',
    description: 'Discover AI-generated music from our community',
    language
  })

  return {
    ...baseData,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: works.map((work, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'MusicComposition',
          name: work.title,
          creator: {
            '@type': 'Person',
            name: work.user?.username || 'Anonymous'
          },
          dateCreated: work.createdAt,
          image: work.imageUrl,
          audio: work.audioUrl,
          genre: work.style
        }
      }))
    }
  }
}

// 生成创作页面结构化数据
export function generateCreatePageStructuredData({ language }) {
  const baseData = generateBaseStructuredData({
    type: 'WebPage',
    name: 'Create AI Music with PhotoSong',
    description: 'Transform your photos into unique musical compositions using AI',
    language
  })

  return {
    ...baseData,
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'PhotoSong Creator',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        'AI-powered music generation',
        'Photo to music conversion',
        'Multiple music styles',
        'High-quality audio output',
        'Easy to use interface'
      ]
    }
  }
}

// 软件应用结构化数据生成器
export function generateSoftwareApplicationSchema({ language }) {
  const baseData = generateBaseStructuredData({
    type: 'SoftwareApplication',
    name: 'PhotoSongAi',
    description: 'Transform photos into unique musical pieces using AI technology',
    language
  })

  return {
    ...baseData,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: ['Web', 'iOS', 'Android'],
    offers: {
      '@type': 'AggregateOffer',
      'offers': [
        {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'name': 'Basic Plan',
          'description': '免费版本，包含基本功能',
          'availability': 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          'price': '9.99',
          'priceCurrency': 'USD',
          'name': 'Pro Plan',
          'description': '专业版本，包含所有高级功能',
          'availability': 'https://schema.org/InStock'
        }
      ]
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'ratingCount': '1250',
      'reviewCount': '850',
      'bestRating': '5',
      'worstRating': '1'
    }
  }
} 