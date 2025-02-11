<script setup>
import { useHead } from '@vueuse/head'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
  }
})

const { t } = useI18n()

// 基础关键词
const baseKeywords = [
  'ai music generator',
  'ai music creator',
  'ai beat maker',
  'suno ai',
  'photo to music',
  'image to music',
  'ai music composition',
  'ai music maker',
  'music generation',
  'ai music app',
  'photo song',
  'picture to music',
  'ai music production',
  'ai music tool',
  'music ai'
]

// 合并关键词
const mergedKeywords = computed(() => {
  return [...new Set([...baseKeywords, ...props.keywords])].join(', ')
})

// 完整标题
const fullTitle = computed(() => {
  return `${props.title} | PhotoSong - AI Music Generator`
})

// 添加结构化数据
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': props.type,
  name: props.title,
  description: props.description,
  image: props.image,
  url: window.location.href
}))

useHead({
  title: computed(() => `${props.title} | Photo Song`),
  meta: [
    { name: 'description', content: computed(() => props.description) },
    { name: 'keywords', content: mergedKeywords },
    // Open Graph
    { property: 'og:title', content: computed(() => props.title) },
    { property: 'og:description', content: computed(() => props.description) },
    { property: 'og:image', content: computed(() => props.image) },
    { property: 'og:url', content: computed(() => window.location.href) },
    { property: 'og:type', content: computed(() => props.type) },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => props.title) },
    { name: 'twitter:description', content: computed(() => props.description) },
    { name: 'twitter:image', content: computed(() => props.image) },
    // 其他重要meta标签
    { name: 'robots', content: 'index, follow' },
    { name: 'canonical', content: computed(() => window.location.href) }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: computed(() => JSON.stringify(structuredData.value))
    }
  ]
})
</script>