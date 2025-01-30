<script setup>
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

// Meta 内容配置
const metaContent = {
  'zh-CN': {
    title: 'Photo Song - AI 驱动的照片音乐创作平台',
    description: 'Photo Song - AI 驱动的照片音乐创作平台，让每张照片都能唱出专属的歌。使用先进的 AI 技术，将图片转换为独特的音乐作品。',
    keywords: 'AI音乐,图片音乐,音乐生成,AI创作,照片音乐,音乐创作,人工智能音乐,AI作曲,智能音乐,图片转音乐',
    ogImage: '/og-image-zh.jpg'
  },
  'en-US': {
    title: 'Photo Song - AI-Powered Photo to Music Creation Platform',
    description: 'Photo Song - Transform your photos into unique musical pieces with advanced AI technology. Create personalized music from your images instantly.',
    keywords: 'AI music,photo music,music generation,AI creation,photo to music,music composition,artificial intelligence music,AI composer,smart music,image to music',
    ogImage: '/og-image-en.jpg'
  },
  'ru-RU': {
    title: 'Photo Song - Платформа для создания музыки из фотографий с помощью ИИ',
    description: 'Photo Song - Превратите ваши фотографии в уникальные музыкальные произведения с помощью передовых технологий ИИ. Создавайте персонализированную музыку из ваших изображений.',
    keywords: 'ИИ музыка,фото музыка,генерация музыки,ИИ создание,фото в музыку,музыкальная композиция,искусственный интеллект музыка',
    ogImage: '/og-image-ru.jpg'
  }
}

const props = defineProps({
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  keywords: {
    type: String,
    required: false
  },
  image: {
    type: String,
    required: false
  },
  type: {
    type: String,
    default: 'website'
  },
  author: {
    type: String,
    default: 'Photo Song'
  }
})

const route = useRoute()
const { locale, t } = useI18n()

// 计算当前语言的 meta 内容
const currentMeta = computed(() => {
  const defaultMeta = metaContent[locale.value] || metaContent['en-US']
  return {
    title: props.title || defaultMeta.title,
    description: props.description || defaultMeta.description,
    keywords: props.keywords || defaultMeta.keywords,
    image: props.image || defaultMeta.ogImage
  }
})

// 获取备用语言链接
const getAlternateLinks = () => {
  const currentPath = route.path
  return [
    { lang: 'zh-CN', url: `https://photosong.com${currentPath}` },
    { lang: 'en-US', url: `https://photosong.com/en${currentPath}` },
    { lang: 'ru-RU', url: `https://photosong.com/ru${currentPath}` }
  ]
}

// 获取页面特定的结构化数据
const getStructuredData = () => {
  switch (route.name) {
    case 'WorkDetail':
      // 保持现有的作品详情页结构化数据
      if (route.params.work) {
        const work = route.params.work
        return {
          '@context': 'https://schema.org',
          '@type': 'MusicComposition',
          'name': work.title,
          'description': work.description,
          'creator': {
            '@type': 'Person',
            'name': work.author.username
          },
          'dateCreated': work.createdAt,
          'image': work.imageUrl,
          'audio': work.audioUrl,
          'url': `https://photosong.com/work/${work.id}`,
          'inLanguage': locale.value,
          'interactionStatistic': {
            '@type': 'InteractionCounter',
            'interactionType': 'https://schema.org/ListenAction',
            'userInteractionCount': work.playCount
          }
        }
      }
      break
      
    case 'Community':
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': t('community.title'),
        'description': t('community.description'),
        'url': 'https://photosong.com/community',
        'inLanguage': locale.value,
        'isPartOf': {
          '@type': 'WebSite',
          'name': 'Photo Song',
          'url': 'https://photosong.com'
        },
        'about': {
          '@type': 'Thing',
          'name': 'AI Music Generation',
          'description': t('community.about')
        }
      }
      
    case 'Pricing':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': t('pricing.title'),
        'description': t('pricing.description'),
        'url': 'https://photosong.com/pricing',
        'offers': [
          {
            '@type': 'Offer',
            'name': t('pricing.basic.title'),
            'description': t('pricing.basic.description'),
            'price': '0',
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock'
          },
          {
            '@type': 'Offer',
            'name': t('pricing.pro.title'),
            'description': t('pricing.pro.description'),
            'price': '9.99',
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock'
          }
        ]
      }
      
    case 'Create':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': t('create.title'),
        'description': t('create.description'),
        'url': 'https://photosong.com/create',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'All',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        }
      }
      
    default:
      // 默认的结构化数据
      return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': currentMeta.value.title,
        'description': currentMeta.value.description,
        'url': `https://photosong.com${route.path}`,
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'All',
        'inLanguage': locale.value,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'author': {
          '@type': 'Organization',
          'name': 'Photo Song',
          'url': 'https://photosong.com'
        }
      }
  }
}

const updateMeta = () => {
  // 基础 Meta
  document.title = currentMeta.value.title
  document.querySelector('meta[name="description"]').setAttribute('content', currentMeta.value.description)
  document.querySelector('meta[name="keywords"]').setAttribute('content', currentMeta.value.keywords)
  document.querySelector('meta[name="author"]').setAttribute('content', props.author)

  // 语言相关
  document.documentElement.lang = locale.value
  
  // 多语言 SEO
  const alternateLinks = getAlternateLinks()
  document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove())
  alternateLinks.forEach(({ lang, url }) => {
    if (lang !== locale.value) {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = lang
      link.href = url
      document.head.appendChild(link)
    }
  })

  // Open Graph
  document.querySelector('meta[property="og:title"]').setAttribute('content', currentMeta.value.title)
  document.querySelector('meta[property="og:description"]').setAttribute('content', currentMeta.value.description)
  document.querySelector('meta[property="og:image"]').setAttribute('content', `https://photosong.com${currentMeta.value.image}`)
  document.querySelector('meta[property="og:url"]').setAttribute('content', `https://photosong.com${route.path}`)
  document.querySelector('meta[property="og:type"]').setAttribute('content', props.type)
  document.querySelector('meta[property="og:locale"]').setAttribute('content', locale.value)
  document.querySelector('meta[property="og:site_name"]').setAttribute('content', 'Photo Song')

  // Twitter Card
  document.querySelector('meta[name="twitter:card"]').setAttribute('content', 'summary_large_image')
  document.querySelector('meta[name="twitter:title"]').setAttribute('content', currentMeta.value.title)
  document.querySelector('meta[name="twitter:description"]').setAttribute('content', currentMeta.value.description)
  document.querySelector('meta[name="twitter:image"]').setAttribute('content', `https://photosong.com${currentMeta.value.image}`)
  document.querySelector('meta[name="twitter:creator"]').setAttribute('content', '@PhotoSong')

  // 其他 SEO 相关 meta
  const canonicalUrl = `https://photosong.com${route.path}`
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)
  document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow')

  // 作品详情页的特殊处理
  if (route.name === 'WorkDetail' && route.params.work) {
    const work = route.params.work
    
    // 添加作品特定的 meta 标签
    document.querySelector('meta[name="author"]').setAttribute('content', work.author.username)
    document.querySelector('meta[name="article:published_time"]').setAttribute('content', work.createdAt)
    document.querySelector('meta[name="article:modified_time"]').setAttribute('content', work.updatedAt)
    document.querySelector('meta[name="article:author"]').setAttribute('content', work.author.username)
    
    // 添加音频预览 meta 标签
    const audioPreviewMeta = document.createElement('meta')
    audioPreviewMeta.setAttribute('property', 'og:audio')
    audioPreviewMeta.setAttribute('content', work.audioUrl)
    document.head.appendChild(audioPreviewMeta)
    
    // 添加音频类型 meta 标签
    const audioTypeMeta = document.createElement('meta')
    audioTypeMeta.setAttribute('property', 'og:audio:type')
    audioTypeMeta.setAttribute('content', 'audio/mpeg')
    document.head.appendChild(audioTypeMeta)
  }

  // 页面特定的 meta 标签处理
  switch (route.name) {
    case 'Community':
      document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow, max-image-preview:large')
      document.querySelector('meta[property="og:type"]')?.setAttribute('content', 'website')
      break
      
    case 'Pricing':
      document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow, max-snippet:-1')
      document.querySelector('meta[property="og:type"]')?.setAttribute('content', 'product')
      // 添加价格相关 meta 标签
      const priceMeta = document.createElement('meta')
      priceMeta.setAttribute('property', 'product:price:amount')
      priceMeta.setAttribute('content', '9.99')
      document.head.appendChild(priceMeta)
      const currencyMeta = document.createElement('meta')
      currencyMeta.setAttribute('property', 'product:price:currency')
      currencyMeta.setAttribute('content', 'USD')
      document.head.appendChild(currencyMeta)
      break
      
    case 'Create':
      document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow')
      document.querySelector('meta[property="og:type"]')?.setAttribute('content', 'website')
      // 添加应用类型 meta 标签
      const appTypeMeta = document.createElement('meta')
      appTypeMeta.setAttribute('property', 'og:type')
      appTypeMeta.setAttribute('content', 'application')
      document.head.appendChild(appTypeMeta)
      break
  }

  // 更新结构化数据
  const scriptElement = document.querySelector('script[type="application/ld+json"]')
  if (scriptElement) {
    scriptElement.textContent = JSON.stringify(getStructuredData())
  }
}

onMounted(() => {
  updateMeta()
})

watch([() => route.path, locale], () => {
  updateMeta()
})
</script>

<template>
  <!-- 组件不需要渲染任何内容 -->
</template> 