<template>
  <!-- SEO Meta 组件不需要渲染任何内容 -->
</template>

<script setup>
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { updatePageMeta } from '../utils/seo'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  keywords: {
    type: Array,
    default: () => []
  },
  schema: {
    type: Object,
    default: () => ({})
  },
  image: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'website'
  },
  publishedTime: {
    type: String,
    default: ''
  },
  modifiedTime: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: ''
  },
  section: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  videoUrl: {
    type: String,
    default: ''
  },
  audioUrl: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const { t, locale } = useI18n()

// 计算当前页面的完整 URL
const pageUrl = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}${route.path}`
})

// 更新页面 Meta 信息
const updateMeta = () => {
  const currentLocale = locale.value
  const metaData = {
    title: props.title,
    description: props.description,
    keywords: props.keywords,
    schema: {
      ...props.schema,
      '@context': 'https://schema.org',
      '@type': props.type,
      url: pageUrl.value,
      inLanguage: currentLocale,
      datePublished: props.publishedTime,
      dateModified: props.modifiedTime,
      author: props.author ? {
        '@type': 'Person',
        name: props.author
      } : undefined,
      image: props.image ? {
        '@type': 'ImageObject',
        url: props.image
      } : undefined,
      video: props.videoUrl ? {
        '@type': 'VideoObject',
        url: props.videoUrl
      } : undefined,
      audio: props.audioUrl ? {
        '@type': 'AudioObject',
        url: props.audioUrl
      } : undefined,
      category: props.category,
      keywords: props.tags.join(',')
    },
    image: props.image,
    type: props.type,
    url: pageUrl.value,
    locale: currentLocale,
    publishedTime: props.publishedTime,
    modifiedTime: props.modifiedTime,
    author: props.author,
    section: props.section,
    category: props.category,
    tags: props.tags
  }

  // 添加语言替代链接
  const alternateLinks = document.querySelectorAll('link[rel="alternate"][hreflang]')
  alternateLinks.forEach(link => link.remove())

  const supportedLocales = ['en', 'zh', 'ru']
  supportedLocales.forEach(lang => {
    const link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = lang
    link.href = `${window.location.origin}/${lang}${route.path}`
    document.head.appendChild(link)
  })

  // 添加 x-default
  const xDefaultLink = document.createElement('link')
  xDefaultLink.rel = 'alternate'
  xDefaultLink.hreflang = 'x-default'
  xDefaultLink.href = `${window.location.origin}${route.path}`
  document.head.appendChild(xDefaultLink)

  // 添加规范链接
  const canonicalLink = document.querySelector('link[rel="canonical"]') || document.createElement('link')
  canonicalLink.rel = 'canonical'
  canonicalLink.href = pageUrl.value
  if (!document.querySelector('link[rel="canonical"]')) {
    document.head.appendChild(canonicalLink)
  }

  // 添加 JSON-LD 结构化数据
  const jsonLdScript = document.querySelector('#json-ld') || document.createElement('script')
  jsonLdScript.id = 'json-ld'
  jsonLdScript.type = 'application/ld+json'
  jsonLdScript.textContent = JSON.stringify(metaData.schema)
  if (!document.querySelector('#json-ld')) {
    document.head.appendChild(jsonLdScript)
  }

  // 添加 Breadcrumb 结构化数据
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: route.matched.map((route, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': `${window.location.origin}${route.path}`,
        name: route.meta.title || route.name
      }
    }))
  }

  const breadcrumbScript = document.querySelector('#breadcrumb-ld') || document.createElement('script')
  breadcrumbScript.id = 'breadcrumb-ld'
  breadcrumbScript.type = 'application/ld+json'
  breadcrumbScript.textContent = JSON.stringify(breadcrumbData)
  if (!document.querySelector('#breadcrumb-ld')) {
    document.head.appendChild(breadcrumbScript)
  }

  updatePageMeta(metaData)
}

// 监听属性变化
watch(
  () => ({
    ...props,
    path: route.path,
    locale: locale.value
  }),
  updateMeta,
  { immediate: true, deep: true }
)

// 组件挂载时更新 Meta
onMounted(updateMeta)
</script> 