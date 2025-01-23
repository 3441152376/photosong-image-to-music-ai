<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: 'Photo Song - AI 驱动的照片音乐创作平台，让每张照片都能唱出专属的歌。'
  },
  keywords: {
    type: String,
    default: 'AI音乐,图片音乐,音乐生成,AI创作,Suno,GPT-4'
  },
  image: {
    type: String,
    default: '/og-image.jpg'
  }
})

const route = useRoute()

const updateMeta = () => {
  // 基础 Meta
  document.title = props.title
  document.querySelector('meta[name="description"]').setAttribute('content', props.description)
  document.querySelector('meta[name="keywords"]').setAttribute('content', props.keywords)

  // Open Graph
  document.querySelector('meta[property="og:title"]').setAttribute('content', props.title)
  document.querySelector('meta[property="og:description"]').setAttribute('content', props.description)
  document.querySelector('meta[property="og:image"]').setAttribute('content', props.image)
  document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href)

  // Twitter Card
  document.querySelector('meta[name="twitter:title"]').setAttribute('content', props.title)
  document.querySelector('meta[name="twitter:description"]').setAttribute('content', props.description)
  document.querySelector('meta[name="twitter:image"]').setAttribute('content', props.image)
}

onMounted(() => {
  updateMeta()
})

watch(() => route.path, () => {
  updateMeta()
})
</script>

<template>
  <!-- 组件不需要渲染任何内容 -->
</template> 