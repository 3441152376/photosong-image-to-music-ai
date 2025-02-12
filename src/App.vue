<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import ru from 'element-plus/dist/locale/ru.mjs'
import SeoMeta from './components/SeoMeta.vue'
import CookieConsent from './components/CookieConsent.vue'
import { computed, watch, onMounted, nextTick } from 'vue'
import LoadingScreen from '@/components/LoadingScreen.vue'
import { useHead } from '@vueuse/head'
import { enrichMetadata } from './services/contentService'
import { useI18n } from 'vue-i18n'
import { internalLinkOptimizer, hreflangGenerator, pageLoadOptimizer } from './utils/seoOptimizer'
import { KeywordAnalyzer } from './utils/keywordAnalyzer'
import { 
  generateBaseStructuredData,
  generateWorkStructuredData,
  generateArticleStructuredData,
  generateUserStructuredData,
  generateSearchStructuredData,
  generateFAQStructuredData
} from './utils/structuredData'

const route = useRoute()
const { t, locale } = useI18n()

// 根据当前语言获取 Element Plus 的语言配置
const elementLocale = computed(() => {
  switch (locale.value) {
    case 'zh':
      return zhCn
    case 'en':
      return en
    case 'ru':
      return ru
    default:
      return zhCn
  }
})

// 基础 SEO 数据
const defaultSeoData = computed(() => ({
  title: t('meta.title'),
  description: t('meta.description'),
  keywords: [
    // 主要关键词
    'photo music', 'AI music', 'photo song', 'image to music', 
    'AI music generator', 'photo to song converter',
    // 中文关键词
    '图片音乐', 'AI音乐创作', '照片转音乐', '智能音乐生成',
    '图片配乐', 'AI作曲', '智能作曲',
    // 俄语关键词
    'фото музыка', 'ИИ музыка', 'фото в музыку', 
    'генератор музыки', 'создание музыки по фото',
    // 长尾关键词
    'convert photos to music online',
    'create music from pictures',
    'turn images into songs AI',
    'photo music generator app',
    'AI photo melody creator'
  ],
  image: '/og-image.jpg',
  type: 'website'
}))

// 初始化关键词分析器
const keywordAnalyzer = new KeywordAnalyzer()

// 监听路由变化，优化内部链接和性能
watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      // 更新内部链接图
      internalLinkOptimizer.addPage(newPath, route.matched.map(r => r.path))
      internalLinkOptimizer.calculatePageRanks()

      // 检查页面性能
      const performance = await pageLoadOptimizer.checkPagePerformance(window.location.href)
      if (performance && !performance.isOptimal) {
        console.warn('Performance issues detected:', performance.recommendations)
      }

      // 强制组件重新渲染
      nextTick(() => {
        window.scrollTo(0, 0)
      })
    }
  }
)

// 监听语言变化
watch(
  () => locale.value,
  (newLocale) => {
    // 更新 HTML lang 属性
    document.querySelector('html').setAttribute('lang', newLocale)
    // 保存语言设置
    localStorage.setItem('language', newLocale)
    // 强制更新 SEO 元数据
    nextTick(() => {
      window.dispatchEvent(new Event('languageChanged'))
    })
  },
  { immediate: true }
)

// 组件挂载时的处理
onMounted(() => {
  // 初始化时滚动到顶部
  window.scrollTo(0, 0)
  
  // 设置初始语言
  const savedLocale = localStorage.getItem('language')
  if (savedLocale && ['zh', 'en', 'ru'].includes(savedLocale)) {
    locale.value = savedLocale
  } else {
    const browserLocale = navigator.language.split('-')[0]
    locale.value = ['zh', 'en', 'ru'].includes(browserLocale) ? browserLocale : 'zh'
  }
})

const currentUrl = computed(() => `https://photosong.com${route.fullPath}`)

// 增强 SEO 元数据计算
const seoMeta = computed(() => {
  const meta = {
    title: '',
    description: '',
    keywords: [],
    image: defaultSeoData.value.image,
    type: defaultSeoData.value.type,
    locale: locale.value,
    hreflang: []
  }

  // 处理标题
  if (route.meta?.title) {
    meta.title = typeof route.meta.title === 'function' 
      ? route.meta.title(route) 
      : route.meta.title
  } else {
    meta.title = defaultSeoData.value.title
  }

  // 处理描述
  if (route.meta?.description) {
    meta.description = typeof route.meta.description === 'function'
      ? route.meta.description(route)
      : route.meta.description
  } else {
    meta.description = defaultSeoData.value.description
  }

  // 处理关键词
  if (route.meta?.keywords) {
    meta.keywords = Array.isArray(route.meta.keywords)
      ? route.meta.keywords
      : defaultSeoData.value.keywords
  } else {
    meta.keywords = defaultSeoData.value.keywords
  }

  // 处理图片
  if (route.meta?.image) {
    meta.image = route.meta.image
  }

  // 处理类型
  if (route.meta?.type) {
    meta.type = route.meta.type
  }

  // 生成 hreflang 标签
  meta.hreflang = hreflangGenerator.generateHreflangTags(route.path)

  // 根据不同页面类型处理特殊元数据
  switch (route.name) {
    case 'work':
      if (route.meta?.work) {
        meta.title = t('work.meta.title', {
          title: route.meta.work.title,
          author: route.meta.work.author?.username
        })
        meta.description = route.meta.work.description || meta.description
        meta.image = route.meta.work.imageUrl || meta.image
        meta.type = 'article'
        
        // 添加地理位置关键词
        const locationKeywords = keywordAnalyzer.addLocationKeywords(
          route.meta.work.description,
          locale.value,
          { country: route.meta.work.country, city: route.meta.work.city }
        )
        meta.keywords = [...meta.keywords, ...locationKeywords]
      }
      break
    case 'profile':
      if (route.meta?.user) {
        meta.title = t('profile.meta.title', {
          username: route.meta.user.username
        })
        meta.description = t('profile.meta.description', {
          username: route.meta.user.username
        })
        meta.image = route.meta.user.avatar || meta.image
        meta.type = 'profile'
      }
      break
  }

  return meta
})

// 添加 structuredData 计算属性
const structuredData = computed(() => {
  // 根据路由类型返回不同的结构化数据
  switch (route.name) {
    case 'work':
      if (route.meta?.work) {
        return generateWorkStructuredData(route.meta.work, {
          language: locale.value
        })
      }
      break
    case 'article':
      if (route.meta?.article) {
        return generateArticleStructuredData(route.meta.article, {
          language: locale.value
        })
      }
      break
    case 'profile':
      if (route.meta?.user) {
        return generateUserStructuredData(route.meta.user, {
          language: locale.value
        })
      }
      break
    case 'search':
      if (route.query.q) {
        return generateSearchStructuredData(route.query.q, route.meta?.results || [], {
          language: locale.value
        })
      }
      break
    case 'faq':
      if (route.meta?.faqs) {
        return generateFAQStructuredData(route.meta.faqs, {
          language: locale.value
        })
      }
      break
    default:
      // 默认返回基础结构化数据
      return generateBaseStructuredData({
        type: 'WebPage',
        name: seoMeta.value?.title,
        description: seoMeta.value?.description,
        language: locale.value
      })
  }
})

useHead({
  title: computed(() => seoMeta.value?.title),
  htmlAttrs: {
    lang: computed(() => locale.value)
  },
  meta: [
    { name: 'description', content: computed(() => seoMeta.value?.description) },
    { name: 'keywords', content: computed(() => seoMeta.value?.keywords?.join(', ')) },
    // 移动端优化
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'theme-color', content: '#4F46E5' },
    // PWA 相关
    { name: 'application-name', content: 'PhotoSong' },
    { name: 'apple-mobile-web-app-title', content: 'PhotoSong' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    // Open Graph 增强
    { property: 'og:title', content: computed(() => seoMeta.value?.title) },
    { property: 'og:description', content: computed(() => seoMeta.value?.description) },
    { property: 'og:image', content: computed(() => seoMeta.value?.image) },
    { property: 'og:type', content: computed(() => seoMeta.value?.type) },
    { property: 'og:url', content: computed(() => window.location.href) },
    { property: 'og:locale', content: computed(() => locale.value) },
    { property: 'og:site_name', content: 'PhotoSong' },
    { property: 'og:updated_time', content: computed(() => new Date().toISOString()) },
    // Twitter Cards
    { name: 'twitter:card', content: computed(() => seoMeta.value?.image ? 'summary_large_image' : 'summary') },
    { name: 'twitter:site', content: '@PhotoSong' },
    { name: 'twitter:creator', content: '@PhotoSong' },
    { name: 'twitter:title', content: computed(() => seoMeta.value?.title) },
    { name: 'twitter:description', content: computed(() => seoMeta.value?.description) },
    { name: 'twitter:image', content: computed(() => seoMeta.value?.image) },
    // 文章特定元数据
    { name: 'article:published_time', content: computed(() => seoMeta.value?.publishDate) },
    { name: 'article:modified_time', content: computed(() => seoMeta.value?.modifiedTime) },
    { name: 'article:author', content: computed(() => seoMeta.value?.author) },
    { name: 'article:section', content: computed(() => seoMeta.value?.section) },
    // 其他重要meta标签
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { name: 'canonical', content: computed(() => window.location.href) },
    { name: 'language', content: computed(() => locale.value) }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: computed(() => JSON.stringify(structuredData.value))
    }
  ],
  link: [
    // Hreflang 标签
    ...computed(() => seoMeta.value?.hreflang || []).value,
    // 预连接优化
    {
      rel: 'preconnect',
      href: 'https://lc-gluttony.s3.amazonaws.com'
    },
    {
      rel: 'preload',
      href: '/fonts/inter-regular.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    },
    {
      rel: 'preload',
      href: '/icons/play.svg',
      as: 'image',
      type: 'image/svg+xml'
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
    }
  ]
})
</script>

<template>
  <LoadingScreen />
  <el-config-provider :locale="elementLocale">
    <SeoMeta
      :title="seoMeta.title || defaultSeoData.title"
      :description="seoMeta.description || defaultSeoData.description"
      :keywords="seoMeta.keywords || defaultSeoData.keywords"
      :image="seoMeta.image || defaultSeoData.image"
      :type="seoMeta.type || defaultSeoData.type"
      :locale="locale"
    />
    <CookieConsent />
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </el-config-provider>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
