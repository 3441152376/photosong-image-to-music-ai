<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import SeoMeta from './components/SeoMeta.vue'
import CookieConsent from './components/CookieConsent.vue'
import { computed, watch, onMounted, nextTick } from 'vue'

const route = useRoute()

const seoMeta = computed(() => {
  const base = {
    title: route.meta.title || 'Photo Song - AI 驱动的照片音乐创作平台',
    description: route.meta.description,
    keywords: route.meta.keywords,
    image: route.meta.image
  }

  // 根据不同页面设置不同的 meta 信息
  switch (route.name) {
    case 'work':
      // 作品详情页
      if (route.meta.work) {
        return {
          title: `${route.meta.work.title} - Photo Song`,
          description: route.meta.work.description,
          image: route.meta.work.imageUrl
        }
      }
      break
    case 'profile':
      // 用户主页
      if (route.meta.user) {
        return {
          title: `${route.meta.user.username} 的主页 - Photo Song`,
          description: `查看 ${route.meta.user.username} 在 Photo Song 上的创作作品`
        }
      }
      break
  }

  return base
})

// 监听路由变化
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      // 强制组件重新渲染
      nextTick(() => {
        window.scrollTo(0, 0)
      })
    }
  }
)

// 组件挂载时的处理
onMounted(() => {
  // 初始化时滚动到顶部
  window.scrollTo(0, 0)
})
</script>

<template>
  <el-config-provider>
    <SeoMeta v-bind="seoMeta" />
    <RouterView :key="route.fullPath" v-slot="{ Component }">
      <component :is="Component" :key="route.fullPath" />
    </RouterView>
    <CookieConsent />
  </el-config-provider>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
