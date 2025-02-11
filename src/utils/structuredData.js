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