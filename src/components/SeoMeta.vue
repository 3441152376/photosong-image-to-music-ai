<template>
  <!-- 空模板，所有元数据通过 useHead 注入 -->
</template>

<script setup>
import { useHead } from '@vueuse/head'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  keywords: {
    type: Array,
    default: () => []
  },
  image: {
    type: String,
    default: '/og-image.jpg'
  },
  type: {
    type: String,
    default: 'website'
  },
  author: {
    type: String,
    default: 'PhotoSong'
  },
  publishedTime: {
    type: String,
    default: ''
  },
  modifiedTime: {
    type: String,
    default: ''
  },
  section: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  content: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const { t, locale } = useI18n()

// 基础关键词
const baseKeywords = [
  // 英文关键词
  'image to music',
  'suno ai',
  'free suno ai',
  'ai music generator',
  'commercial use free music',
  'royalty free ai music',
  'free commercial music generator',
  'license free music creation',
  'business music free',
  'commercial license free music',

  // 中文关键词
  'AI音乐创作',
  '在线音乐生成',
  '商用免费音乐',
  '免版权AI音乐',
  '商业授权免费音乐',
  '可商用音乐生成器',
  '商用无版权音乐',
  '商业用途免费配乐',

  // 俄语关键词
  'генератор музыки',
  'бесплатная музыка для бизнеса',
  'коммерческая музыка бесплатно',
  'музыка без лицензии',
  'бесплатная музыка для рекламы',
  'музыка для коммерческого использования',
  'искусственный интеллект музыка',
  'фото в музыку',
  'ии композитор',
  'создание музыки по фото',
  'музыкальный генератор',
  'автоматическая композиция',
  'музыка из изображений',
  'умный композитор',
  'нейронная музыка',
  'создание мелодии',
  'музыкальный синтез',
  'генерация музыки',
  'музыкальное приложение',
  'искусственный интеллект композиция',
  'преобразование фото в музыку',
  'онлайн генератор музыки',
  'бесплатный музыкальный генератор',
  'создать музыку из фотографии',
  'искусственный интеллект для музыки',
  'умная генерация музыки',
  'музыкальное сопровождение фото',
  'автоматический композитор',
  'цифровая музыка по фото',
  'профессиональный генератор музыки',
  'создание саундтрека по фото',
  'музыкальная обработка изображений',
  'инструмент создания музыки',
  'музыкальный редактор с ии',
  'программа для создания музыки',

  // 网站功能相关关键词
  'online music generator',
  'web music creator',
  'cloud music generation',
  'music generation platform',
  'online music creation',
  'web based music maker',
  'cloud music production',
  'online music composition',
  'web music synthesis',
  'digital music creation',
  
  // 网站特性关键词
  'real time music generation',
  'instant music creation',
  'high quality music output',
  'professional music generation',
  'customizable music creation',
  'easy music making',
  'fast music generation',
  'unique music creation',
  'personalized music',
  'creative music tool',
  
  // 商业和应用场景关键词
  'background music generator',
  'video background music',
  'social media music',
  'content creation music',
  'commercial music generation',
  'royalty free ai music',
  'custom music creation',
  'business music solution',
  'marketing music generator',
  'presentation music maker'
]

// 页面特定关键词映射
const pageKeywordsMap = {
  home: [
    // 主页长尾关键词
    'best ai photo to music converter 2025',
    'how to turn pictures into music online',
    'free image to music generator app',
    'convert photos to background music',
    'ai powered photo music creation',
    'turn memories into melodies online',
    'photo to music ai technology review',
    'best music generation platform comparison',
    'ai music creation platform features',
    '照片生成音乐在线工具2025',
    '如何把图片转换成音乐',
    '免费图片配乐生成器',
    '智能照片音乐制作软件',
    '图片转音乐最佳工具',
    '照片音乐创作平台推荐',
    '人工智能音乐生成平台对比',
    '智能配乐系统评测',
    '在线音乐制作工具排名'
  ],
  create: [
    // 创作页长尾关键词
    'how to create music from photos step by step',
    'professional photo to music conversion',
    'customize ai generated music from images',
    'advanced photo music composition tools',
    'create soundtrack from picture online',
    'photo to music style customization',
    'image to music generation tutorial',
    'ai music style selection guide',
    'photo music creation tips',
    '专业图片配乐制作教程',
    '个性化图片音乐创作',
    'AI智能作曲详细步骤',
    '照片音乐风格定制',
    '在线图片配乐制作工具',
    '高级音乐创作平台使用指南',
    '智能配乐风格选择',
    '图片音乐创作技巧',
    'AI音乐生成最佳实践'
  ],
  articles: [
    // 文章页长尾关键词
    'latest ai music generation techniques',
    'photo to music conversion tutorials',
    'ai music creation best practices',
    'image based music composition guide',
    'learn photo to music generation',
    'ai music production tips and tricks',
    'music generation technology news',
    'ai music creation industry updates',
    'photo music tutorials for beginners',
    'AI音乐生成技术教程',
    '图片音乐转换最新方法',
    '智能作曲技巧分享',
    '音乐创作学习指南',
    'AI配乐制作经验',
    '图片配乐实用教程',
    '人工智能音乐行业资讯',
    '智能作曲新闻动态',
    '音乐科技前沿报道'
  ],
  articleDetail: [
    // 文章详情页长尾关键词
    'detailed ai music creation guide',
    'in depth music generation tutorial',
    'professional ai music making tips',
    'advanced photo to music techniques',
    'expert music generation advice',
    'comprehensive ai music guide',
    '深度AI音乐教程',
    '专业音乐生成指南',
    '高级配乐技巧分享',
    '图片音乐详细教程',
    '资深音乐创作经验',
    'AI作曲专家建议'
  ],
  community: [
    // 社区页长尾关键词
    'share your photo generated music',
    'ai music creators community',
    'photo music showcase platform',
    'connect with ai music artists',
    'discover unique photo music creations',
    'photo music collaboration platform',
    'trending ai music creations',
    'popular photo music works',
    'featured ai music artists',
    'AI音乐创作者社区',
    '图片音乐作品展示',
    '音乐创作者交流平台',
    '创意音乐分享社区',
    '音乐作品互动平台',
    'AI音乐艺术家社区',
    '热门AI音乐作品',
    '优秀创作者推荐',
    '社区精选音乐'
  ],
  profile: [
    // 个人主页长尾关键词
    'ai music creator portfolio',
    'photo music artist profile',
    'showcase your music generations',
    'personal ai music collection',
    'music creation achievements',
    'photo music creator stats',
    'professional music creator profile',
    'ai artist portfolio showcase',
    'music generation history',
    'AI音乐创作者主页',
    '个人音乐作品集',
    '创作者成就展示',
    '音乐作品统计数据',
    '个人配乐作品展示',
    '创作者数据分析',
    '专业音乐人档案',
    'AI艺术家作品集',
    '创作历程展示'
  ],
  workDetail: [
    // 作品详情页长尾关键词
    'ai generated music showcase',
    'photo music creation details',
    'unique ai music composition',
    'custom photo generated song',
    'ai music work analysis',
    'photo music creation process',
    'AI音乐作品展示',
    '图片音乐作品详情',
    '个性化音乐创作',
    '智能配乐作品分析',
    '创作过程展示',
    '音乐风格解析'
  ],
  pricing: [
    // 定价页长尾关键词
    'ai music creation pricing plans',
    'photo to music conversion cost',
    'professional music generation subscription',
    'ai music maker pricing comparison',
    'affordable music creation tools',
    'best value music generation plan',
    'AI音乐创作价格方案',
    '图片配乐制作收费',
    '专业音乐生成订阅',
    '智能作曲价格对比',
    '经济实惠音乐工具',
    '最优音乐创作套餐'
  ],
  error: [
    // 404页长尾关键词
    'find ai music creation tools',
    'explore photo music features',
    'discover music generation options',
    'alternative music creation pages',
    'helpful music making resources',
    'photo music creation guide',
    '查找音乐制作工具',
    '发现图片配乐功能',
    '音乐创作相关页面',
    '配乐制作帮助指南',
    '创作资源导航',
    '音乐工具推荐'
  ]
}

// 计算当前页面的特定关键词
const pageSpecificKeywords = computed(() => {
  const path = route.path.split('/')[1] || 'home'
  return pageKeywordsMap[path] || []
})

// 多语言标题
const localizedTitles = {
  en: {
    default: 'PhotoSong - AI Music Generator | Turn Photos into Music',
    article: 'PhotoSong - AI Music Creation from Images',
    suffix: '| PhotoSong AI'
  },
  zh: {
    default: 'PhotoSong - AI智能音乐生成器 | 图片转音乐',
    article: 'PhotoSong - 人工智能图片作曲',
    suffix: '| PhotoSong智能音乐'
  },
  ru: {
    default: 'PhotoSong - Генератор Музыки с ИИ | Фото в Музыку',
    article: 'PhotoSong - Создание Музыки из Изображений',
    suffix: '| PhotoSong ИИ'
  }
}

// 多语言描述
const localizedDescriptions = {
  en: {
    default: 'Transform your photos into unique music with AI. Create original soundtracks from images using advanced artificial intelligence.',
    article: 'Discover AI-powered music generation from images. Professional quality, unique compositions.'
  },
  zh: {
    default: '使用人工智能将照片转换为独特的音乐。通过先进的AI技术从图像创作原创配乐。',
    article: '探索AI驱动的图片音乐生成。专业品质，独特作品。'
  },
  ru: {
    default: 'Преобразуйте ваши фотографии в уникальную музыку с помощью ИИ. Создавайте оригинальные саундтреки из изображений.',
    article: 'Откройте для себя создание музыки на основе изображений с помощью ИИ. Профессиональное качество, уникальные композиции.'
  }
}

// 合并关键词
const mergedKeywords = computed(() => {
  const pageType = route.name || 'home'
  const pageSpecificKeywords = pageKeywordsMap[pageType] || []
  const customKeywords = props.keywords || []
  
  // 限制基础关键词数量，确保长尾关键词有更高优先级
  const limitedBaseKeywords = baseKeywords.slice(0, 20)
  
  // 根据页面类型动态调整关键词组合
  let combinedKeywords = []
  
  if (pageType === 'workDetail' || pageType === 'articleDetail') {
    // 作品和文章详情页优先使用自定义关键词和长尾关键词
    combinedKeywords = [...customKeywords, ...pageSpecificKeywords, ...limitedBaseKeywords]
  } else {
    // 其他页面保持平衡的关键词分布
    combinedKeywords = [...limitedBaseKeywords, ...pageSpecificKeywords, ...customKeywords]
  }
  
  // 去重并限制总数
  return Array.from(new Set(combinedKeywords)).slice(0, 50)
})

// 完整标题
const fullTitle = computed(() => {
  const titles = localizedTitles[locale.value] || localizedTitles.en
  const baseTitle = props.type === 'article' ? titles.article : titles.default
  return props.title ? `${props.title} ${titles.suffix}` : baseTitle
})

// 本地化描述
const localizedDescription = computed(() => {
  const descriptions = localizedDescriptions[locale.value] || localizedDescriptions.en
  return props.description || (props.type === 'article' ? descriptions.article : descriptions.default)
})

// 规范的 URL
const canonicalUrl = computed(() => {
  const baseUrl = 'https://photosong.com' // 替换为实际的域名
  return `${baseUrl}${route.path}`
})

// 增强多语言支持
const languageAlternates = computed(() => {
  const languages = ['en', 'zh', 'ru']
  const currentPath = route.path
  const baseUrl = 'https://photosong.com'
  
  return languages.map(lang => {
    const path = lang === 'en' ? currentPath : `/${lang}${currentPath}`
    return {
      hreflang: lang === 'zh' ? 'zh-CN' : (lang === 'ru' ? 'ru-RU' : 'en-US'),
      href: `${baseUrl}${path}`
    }
  })
})

// JSON-LD 结构化数据
const jsonLd = computed(() => {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': props.type === 'article' ? 'Article' : 'WebPage',
    headline: props.title,
    description: props.description,
    image: imageUrl.value,
    author: {
      '@type': 'Organization',
      name: props.author,
      logo: {
        '@type': 'ImageObject',
        url: 'https://photosong.com/logo.png'
      }
    },
    publisher: {
      '@type': 'Organization',
      name: 'PhotoSong',
      logo: {
        '@type': 'ImageObject',
        url: 'https://photosong.com/logo.png'
      },
      sameAs: [
        'https://twitter.com/PhotoSong',
        'https://facebook.com/PhotoSong',
        'https://instagram.com/PhotoSong',
        'https://linkedin.com/company/PhotoSong'
      ]
    },
    datePublished: props.publishedTime || new Date().toISOString(),
    dateModified: props.modifiedTime || new Date().toISOString(),
    inLanguage: locale.value,
    isAccessibleForFree: true,
    potentialAction: {
      '@type': 'UseAction',
      target: canonicalUrl.value
    },
    // 添加更多结构化数据
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1'
    }
  }

  // 根据页面类型添加特定的结构化数据
  if (props.type === 'article') {
    Object.assign(baseData, {
      articleSection: props.section,
      keywords: mergedKeywords.value,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl.value
      },
      articleBody: props.content,
      wordCount: props.content ? props.content.split(/\s+/).length : 0,
      // 添加文章特定属性
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['article', 'h1', '.article-content']
      }
    })
  } else if (route.name === 'workDetail') {
    Object.assign(baseData, {
      '@type': 'MusicComposition',
      composer: {
        '@type': 'Organization',
        name: 'PhotoSong AI'
      },
      // 音乐作品特定属性
      isFamilyFriendly: true,
      license: 'https://photosong.com/license',
      copyrightYear: new Date().getFullYear()
    })
  }

  return baseData
})

const imageUrl = computed(() => {
  const baseUrl = 'https://photosong.com'
  return props.image.startsWith('http') ? props.image : `${baseUrl}${props.image}`
})

// 添加 Guest Post 和 HARO 相关的 meta 标签
const additionalMeta = computed(() => {
  const meta = []
  
  // Guest Post 相关
  if (props.type === 'article' && props.author !== 'PhotoSong') {
    meta.push({
      name: 'article:author',
      content: props.author
    })
    meta.push({
      name: 'article:publisher',
      content: 'PhotoSong'
    })
  }
  
  // HARO 相关
  meta.push({
    name: 'news_keywords',
    content: mergedKeywords.value.slice(0, 10).join(',')
  })
  
  // 信息图相关
  if (props.image && props.image.includes('infographic')) {
    meta.push({
      name: 'twitter:card',
      content: 'summary_large_image'
    })
    meta.push({
      property: 'og:image:type',
      content: 'image/png'
    })
    meta.push({
      property: 'og:image:width',
      content: '1200'
    })
    meta.push({
      property: 'og:image:height',
      content: '2400'
    })
  }
  
  return meta
})

useHead({
  htmlAttrs: {
    lang: locale.value
  },
  title: fullTitle,
  meta: [
    {
      name: 'description',
      content: localizedDescription.value
    },
    {
      name: 'keywords',
      content: mergedKeywords.value
    },
    // Open Graph
    {
      property: 'og:title',
      content: fullTitle.value
    },
    {
      property: 'og:description',
      content: localizedDescription.value
    },
    {
      property: 'og:image',
      content: imageUrl.value
    },
    {
      property: 'og:url',
      content: canonicalUrl.value
    },
    {
      property: 'og:type',
      content: props.type
    },
    {
      property: 'og:site_name',
      content: 'PhotoSong'
    },
    {
      property: 'og:locale',
      content: locale.value === 'zh' ? 'zh_CN' : (locale.value === 'ru' ? 'ru_RU' : 'en_US')
    },
    // 添加备用语言
    {
      property: 'og:locale:alternate',
      content: 'en_US'
    },
    {
      property: 'og:locale:alternate',
      content: 'zh_CN'
    },
    {
      property: 'og:locale:alternate',
      content: 'ru_RU'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: fullTitle.value
    },
    {
      name: 'twitter:description',
      content: localizedDescription.value
    },
    {
      name: 'twitter:image',
      content: imageUrl.value
    },
    // 其他 SEO 标签
    {
      name: 'robots',
      content: 'max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    },
    {
      name: 'googlebot',
      content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    },
    {
      name: 'bingbot',
      content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    },
    {
      name: 'author',
      content: props.author
    },
    {
      name: 'application-name',
      content: 'PhotoSong'
    },
    // 移动端优化
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover'
    },
    {
      name: 'format-detection',
      content: 'telephone=no'
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent'
    },
    {
      name: 'apple-mobile-web-app-title',
      content: props.title
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'theme-color',
      content: '#4F46E5'
    },
    // 文章特定标签
    ...(props.type === 'article' ? [
      {
        property: 'article:published_time',
        content: props.publishedTime
      },
      {
        property: 'article:modified_time',
        content: props.modifiedTime
      },
      {
        property: 'article:section',
        content: props.section
      },
      {
        property: 'article:tag',
        content: props.tags.join(', ')
      }
    ] : []),
    // 语言标记
    {
      name: 'language',
      content: locale.value
    },
    {
      property: 'og:image:secure_url',
      content: imageUrl.value
    },
    {
      property: 'og:image:width',
      content: '1200'
    },
    {
      property: 'og:image:height',
      content: '630'
    },
    {
      property: 'og:image:type',
      content: 'image/jpeg'
    },
    {
      property: 'og:image:alt',
      content: props.title
    },
    // 添加更多图片尺寸
    {
      property: 'og:image',
      content: `${imageUrl.value}?size=small`,
      width: '600',
      height: '315'
    },
    {
      property: 'og:image',
      content: `${imageUrl.value}?size=large`,
      width: '1800',
      height: '945'
    },
    // 安全相关
    {
      'http-equiv': 'Content-Security-Policy',
      content: "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:;"
    },
    {
      'http-equiv': 'X-Content-Type-Options',
      content: 'nosniff'
    },
    {
      'http-equiv': 'Referrer-Policy',
      content: 'strict-origin-when-cross-origin'
    },
    {
      'http-equiv': 'Permissions-Policy',
      content: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=()'
    },
    // 性能优化相关
    {
      name: 'dns-prefetch',
      content: 'https://api.photosong.com'
    },
    // PWA相关
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent'
    },
    {
      name: 'apple-mobile-web-app-title',
      content: 'PhotoSong'
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'theme-color',
      content: '#ffffff'
    },
    {
      name: 'msapplication-TileColor',
      content: '#ffffff'
    },
    {
      name: 'msapplication-config',
      content: '/browserconfig.xml'
    },
    // 添加更多SEO相关meta标签
    {
      name: 'revisit-after',
      content: '7 days'
    },
    {
      name: 'rating',
      content: 'General'
    },
    {
      name: 'copyright',
      content: `© ${new Date().getFullYear()} PhotoSong`
    },
    // 添加社交媒体验证
    {
      name: 'google-site-verification',
      content: 'YOUR_GOOGLE_VERIFICATION_CODE'
    },
    {
      name: 'facebook-domain-verification',
      content: 'YOUR_FACEBOOK_VERIFICATION_CODE'
    },
    // 添加额外的meta标签
    ...additionalMeta.value
  ],
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    },
    // 添加语言替代链接
    ...languageAlternates.value.map(({ hreflang, href }) => ({
      rel: 'alternate',
      hreflang,
      href
    })),
    // 添加 x-default
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: `https://photosong.com${route.path}`
    },
    {
      rel: 'preload',
      href: '/fonts/inter-regular.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png'
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png'
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png'
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest'
    },
    {
      rel: 'mask-icon',
      href: '/safari-pinned-tab.svg',
      color: '#5bbad5'
    },
    // 添加RSS订阅
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'PhotoSong RSS Feed',
      href: 'https://photosong.com/feed.xml'
    },
    // 添加站点地图
    {
      rel: 'sitemap',
      type: 'application/xml',
      title: 'Sitemap',
      href: 'https://photosong.com/sitemap.xml'
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(jsonLd.value)
    }
  ]
})
</script> 