<template>
  <!-- 空模板，所有元数据通过 useHead 注入 -->
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'

const { t, locale } = useI18n()

const title = computed(() => t('home.meta.title'))
const description = computed(() => t('home.meta.description'))
const keywords = computed(() => {
  const langKeywords = {
    en: [
      'AI music generator',
      'photo to music',
      'image to song',
      'AI music composition',
      'music from pictures',
      'AI melody maker',
      'picture music creator',
      'visual music generator',
      'AI music app',
      'image inspired music',
      'music from photos',
      'AI composer',
      'creative music generator',
      'photo music maker',
      'visual music AI'
    ],
    zh: [
      'AI音乐生成器',
      '图片生成音乐',
      '照片转音乐',
      'AI作曲',
      '智能音乐创作',
      '图像音乐转换',
      'AI音乐制作',
      '照片作曲',
      '智能作曲软件',
      '图片配乐',
      'AI配乐',
      '音乐生成器',
      '智能音乐生成',
      '图片音乐创作',
      'AI音乐应用'
    ],
    ru: [
      'ИИ генератор музыки',
      'фото в музыку',
      'изображение в песню',
      'ИИ композитор',
      'музыка из фотографий',
      'генератор мелодий',
      'создание музыки по фото',
      'визуальная музыка ИИ',
      'приложение для создания музыки',
      'музыка по картинке',
      'ИИ создание музыки',
      'музыкальный генератор',
      'умный композитор',
      'фото музыка онлайн',
      'ИИ музыкальное приложение'
    ]
  }

  return langKeywords[locale.value]?.join(', ') || langKeywords.en.join(', ')
})

const url = computed(() => {
  const baseUrl = 'https://photosong.com'
  const langPrefix = locale.value === 'en' ? '' : `/${locale.value}`
  return `${baseUrl}${langPrefix}`
})

const language = computed(() => locale.value)

// 构建 Schema.org JSON-LD 数据
const schemaOrgData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PhotoSong',
  description: description.value,
  url: url.value,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  creator: {
    '@type': 'Organization',
    name: 'PhotoSong',
    url: 'https://photosong.com'
  },
  inLanguage: language.value,
  featureList: [
    'AI Music Generation',
    'Image to Music Conversion',
    'Multiple Music Styles',
    'High Quality Audio Output',
    'Easy to Use Interface'
  ]
}))

// 使用 useHead 注入所有元数据
useHead({
  title: computed(() => title.value),
  meta: [
    // SEO Meta Tags
    { name: 'description', content: description.value },
    { name: 'keywords', content: keywords.value },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph Meta Tags
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: description.value },
    { property: 'og:image', content: 'https://photosong.com/og-image.jpg' },
    { property: 'og:url', content: url.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'PhotoSong' },
    
    // Twitter Card Meta Tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title.value },
    { name: 'twitter:description', content: description.value },
    { name: 'twitter:image', content: 'https://photosong.com/og-image.jpg' },
    { name: 'twitter:site', content: '@photosong' },
    
    // 语言和地区
    { name: 'language', content: language.value },
    { property: 'og:locale', content: language.value },
    { property: 'og:locale:alternate', content: ['en', 'zh', 'ru'].filter(l => l !== language.value) },
    
    // PWA Meta Tags
    { name: 'application-name', content: 'PhotoSong' },
    { name: 'apple-mobile-web-app-title', content: 'PhotoSong' },
    { name: 'theme-color', content: '#4a5568' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'msapplication-navbutton-color', content: '#4a5568' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(schemaOrgData.value)
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: url.value
    },
    // 添加备用语言链接
    ...['en', 'zh', 'ru'].map(lang => ({
      rel: 'alternate',
      hreflang: lang,
      href: `https://photosong.com/${lang === 'en' ? '' : lang + '/'}`
    }))
  ]
})
</script> 