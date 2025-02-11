<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useIntersectionObserver } from '@vueuse/core'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import { ElMessage } from 'element-plus'
import SeoMeta from '../components/SEOMeta.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import { optimizeImageUrl, generateSrcSet, generateSizes } from '../utils/imageOptimizer'
import { useHead } from 'unhead'

const router = useRouter()
const { t, locale } = useI18n()
const loading = ref(false)
const loadingMore = ref(false)
const works = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const hasMore = ref(true)
const observerTarget = ref(null)
const imageLoadStatus = ref(new Set())

// SEO 配置
const seoMeta = computed(() => ({
  title: t('community.meta.title'),
  description: t('community.meta.description'),
  keywords: [
    'photo music community',
    'music sharing platform',
    'AI music community',
    'photo song sharing',
    'user generated music',
    'AI music showcase',
    // 中文关键词
    '图片音乐社区',
    '音乐分享平台',
    'AI音乐社区',
    '照片音乐作品',
    // 俄语关键词
    'сообщество фото музыки',
    'платформа обмена музыкой',
    'музыкальное сообщество ИИ'
  ],
  type: 'website',
  image: '/community-og-image.jpg'
}))

// 结构化数据
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: seoMeta.value.title,
  description: seoMeta.value.description,
  url: currentUrl.value,
  inLanguage: locale.value,
  isPartOf: {
    '@type': 'WebSite',
    name: 'PhotoSong',
    url: 'https://photosong.com'
  },
  about: {
    '@type': 'CreativeWork',
    name: 'AI Generated Music from Photos',
    description: 'A collection of unique musical pieces generated from photos using AI technology'
  },
  numberOfItems: total.value,
  itemListElement: works.value.map((work, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'MusicComposition',
      name: work.title,
      creator: {
        '@type': 'Person',
        name: work.user.username,
        image: work.user.avatar
      },
      dateCreated: work.createdAt,
      image: work.imageUrl,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ListenAction',
        userInteractionCount: work.plays
      }
    }
  }))
}))

// 使用 useHead 设置页面元数据
useHead({
  title: computed(() => seoMeta.value.title),
  meta: [
    { name: 'description', content: computed(() => seoMeta.value.description) },
    { name: 'keywords', content: computed(() => seoMeta.value.keywords.join(', ')) },
    // Open Graph
    { property: 'og:title', content: computed(() => seoMeta.value.title) },
    { property: 'og:description', content: computed(() => seoMeta.value.description) },
    { property: 'og:type', content: computed(() => seoMeta.value.type) },
    { property: 'og:image', content: computed(() => seoMeta.value.image) },
    { property: 'og:url', content: computed(() => currentUrl.value) },
    // Twitter Cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => seoMeta.value.title) },
    { name: 'twitter:description', content: computed(() => seoMeta.value.description) },
    { name: 'twitter:image', content: computed(() => seoMeta.value.image) }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: computed(() => JSON.stringify(structuredData.value))
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: computed(() => currentUrl.value)
    }
  ]
})

// 预加载翻译
const preloadTranslations = async () => {
  await nextTick()
  t('community.meta.title')
  t('community.meta.description')
}

// 监听语言变化
watch(locale, async () => {
  await preloadTranslations()
}, { immediate: true })

// 在组件挂载时预加载翻译
onMounted(async () => {
  await preloadTranslations()
})

const currentUrl = computed(() => {
  const baseUrl = 'https://photosong.com'
  const langPrefix = locale.value === 'en' ? '' : `/${locale.value}`
  return `${baseUrl}${langPrefix}/community`
})

// 优化图片加载
const handleImageLoad = (workId) => {
  imageLoadStatus.value.add(workId)
}

// 计算骨架屏显示状态
const showSkeleton = computed(() => {
  return loading.value || (works.value.length > 0 && imageLoadStatus.value.size < works.value.length)
})

// 优化图片URL的计算属性
const getOptimizedImageUrl = (url, width = 800) => {
  return optimizeImageUrl(url, { width, quality: 80 })
}

// 生成响应式图片源集
const getImageSrcSet = (url) => {
  return generateSrcSet(url, [320, 640, 960, 1280])
}

// 生成响应式尺寸
const getImageSizes = () => {
  return generateSizes([
    { width: 640, size: '100vw' },
    { width: 1024, size: '50vw' },
    { width: 1280, size: '33vw' }
  ])
}

// 预加载下一页图片
const preloadNextPageImages = () => {
  if (currentPage.value * pageSize.value >= total.value) return
  
  const query = new AV.Query('Work')
  query.equalTo('status', 'completed')
  query.skip(currentPage.value * pageSize.value)
  query.limit(pageSize.value)
  query.select(['imageUrl'])
  query.descending('createdAt')
  
  query.find().then(results => {
    results.forEach(work => {
      const imageUrl = work.get('imageUrl')
      if (imageUrl) {
        // 预加载优化后的图片
        const img = new Image()
        img.src = getOptimizedImageUrl(imageUrl, 800)
      }
    })
  }).catch(error => {
    console.error('Error preloading next page images:', error)
  })
}

// 获取作品列表
const fetchWorks = async (loadMore = false) => {
  if (!loadMore) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  try {
    const query = new AV.Query('Work')
    query.include('user')
    query.equalTo('status', 'completed')
    query.descending('createdAt')
    
    // 获取总数
    if (!loadMore) {
      total.value = await query.count()
    }
    
    // 设置分页
    query.limit(pageSize.value)
    query.skip((currentPage.value - 1) * pageSize.value)
    
    try {
      const results = await query.find()
      const newWorks = results.map(work => ({
        id: work.id,
        title: work.get('title') || t('community.works.untitledWork'),
        description: work.get('description') || '',
        imageUrl: work.get('imageUrl') || '',
        audioUrl: work.get('audioUrl') || '',
        style: work.get('style') || '',
        plays: work.get('plays') || 0,
        createdAt: work.createdAt,
        user: {
          id: work.get('user')?.id,
          username: work.get('user')?.get('username') || t('community.works.anonymousUser'),
          avatar: (() => {
            const avatar = work.get('user')?.get('avatar')
            if (avatar instanceof AV.File) {
              return avatar.url()
            }
            return avatar || '/default-avatar.png'
          })()
        }
      }))

      if (loadMore) {
        works.value = [...works.value, ...newWorks]
      } else {
        works.value = newWorks
        imageLoadStatus.value = new Set()
      }

      // 检查是否还有更多数据
      hasMore.value = works.value.length < total.value
      
      // 预加载下一页图片
      if (hasMore.value) {
        preloadNextPageImages()
      }
    } catch (error) {
      if (error.code === 403) {
        console.error('Access denied:', error)
        ElMessage.error(t('errors.accessDenied'))
      } else {
        console.error('Fetch works failed:', error)
        ElMessage.error(t('community.works.loadingError'))
      }
      if (!loadMore) {
        works.value = []
        total.value = 0
      }
    }
  } catch (error) {
    console.error('Query setup failed:', error)
    ElMessage.error(t('errors.querySetupFailed'))
  } finally {
    if (!loadMore) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

// 加载更多作品
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  currentPage.value++
  await fetchWorks(true)
}

// 播放音乐
const handlePlay = async (work) => {
  try {
    // 创建播放记录
    const PlayRecord = AV.Object.extend('PlayRecord')
    const playRecord = new PlayRecord()
    playRecord.set('work', AV.Object.createWithoutData('Work', work.id))
    playRecord.set('user', AV.User.current())
    playRecord.set('ip', '')  // 可选：记录IP
    
    // 设置 ACL
    const acl = new AV.ACL()
    acl.setPublicReadAccess(true)
    playRecord.setACL(acl)
    
    await playRecord.save()
    
    // 更新本地状态
    work.plays += 1
    
    // 跳转到作品详情页
    router.push(`/work/${work.id}`)
  } catch (error) {
    console.error('Create play record failed:', error)
    // 即使记录失败也允许跳转
    router.push(`/work/${work.id}`)
  }
}

const handleWorkClick = (work) => {
  router.push({
    name: `${locale.value}-WorkDetail`,
    params: { id: work.id }
  })
}

// 设置无限滚动观察器
const setupInfiniteScroll = () => {
  const observer = new IntersectionObserver(
    async ([entry]) => {
      if (entry.isIntersecting && !loadingMore.value && hasMore.value) {
        await loadMore()
      }
    },
    {
      rootMargin: '100px'
    }
  )

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }

  return () => {
    if (observerTarget.value) {
      observer.unobserve(observerTarget.value)
    }
  }
}

// 图片懒加载指令
const vLazyLoad = {
  mounted: (el) => {
    const { stop } = useIntersectionObserver(el, ([{ isIntersecting }]) => {
      if (isIntersecting) {
        const img = el
        const src = img.dataset.src
        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          stop()
        }
      }
    })
  }
}

onMounted(async () => {
  await fetchWorks()
  await nextTick(() => {
    setupInfiniteScroll()
  })
})
</script>

<template>
  <div class="community-page">
    <SeoMeta
      :key="locale"
      :title="t('community.meta.title')"
      :description="t('community.meta.description')"
      :keywords="[
        'photo music community',
        'music sharing',
        'AI music community',
        'photo song sharing',
        'AI generated music',
        'image to music'
      ]"
      :url="currentUrl"
    />
    <TheNavbar />
    
    <main class="community-content">
      <header class="page-header">
        <h1 class="gradient-text">{{ t('community.title') }}</h1>
        <p class="page-description">{{ t('community.description') }}</p>
      </header>

      <!-- 作品列表 -->
      <section 
        v-if="!loading && works.length > 0" 
        class="works-section"
        aria-label="Community Works"
      >
        <div class="works-grid">
          <article 
            v-for="work in works" 
            :key="work.id"
            class="work-card glass-card"
            :aria-label="t('community.workCard.ariaLabel', { title: work.title })"
          >
            <div 
              class="work-image"
              role="img"
              :aria-label="t('community.workCard.imageAria', { title: work.title })"
            >
              <img 
                v-lazy-load
                :data-src="getOptimizedImageUrl(work.imageUrl)"
                :srcset="getImageSrcSet(work.imageUrl)"
                :sizes="getImageSizes()"
                :alt="work.title"
                @load="handleImageLoad(work.id)"
                class="lazy-image"
                :class="{ 'loaded': imageLoadStatus.has(work.id) }"
              >
              <button
                class="play-overlay"
                @click="handlePlay(work)"
                :aria-label="t('community.workCard.playAria', { title: work.title })"
              >
                <div class="play-button">
                  <el-icon class="play-icon"><VideoPlay /></el-icon>
                  <span class="sr-only">{{ t('community.workCard.play') }}</span>
                </div>
              </button>
            </div>
            
            <div class="work-info">
              <h2 class="work-title">
                {{ work.title }}
                <span class="with-photosong">With PhotoSong</span>
              </h2>
              <p v-if="work.description" class="work-description">{{ work.description }}</p>
              
              <div class="work-meta">
                <div class="meta-left">
                  <img 
                    :src="work.user?.avatar || '/default-avatar.png'" 
                    :alt="work.user?.username"
                    class="user-avatar"
                    loading="lazy"
                  />
                  <div class="user-info">
                    <span class="username">{{ work.user?.username }}</span>
                    <time :datetime="work.createdAt.toISOString()">
                      {{ new Date(work.createdAt).toLocaleDateString() }}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-state">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="work-card skeleton-card">
            <div class="card-media">
              <div class="skeleton-image"></div>
              <div class="skeleton-overlay"></div>
            </div>
            <div class="card-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-meta">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-info">
                  <div class="skeleton-name"></div>
                  <div class="skeleton-date"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div 
        v-else-if="!loading && works.length === 0" 
        class="empty-state"
        role="status"
        aria-label="No works found"
      >
        <el-empty :description="t('community.empty.description')" />
      </div>

      <!-- 加载更多指示器 -->
      <div 
        v-if="works.length > 0" 
        ref="observerTarget"
        class="load-more-indicator"
        role="status"
        :aria-label="loadingMore ? t('community.loadingMore') : hasMore ? '' : t('community.noMore')"
      >
        <div v-if="loadingMore" class="loading-spinner">
          <el-icon class="is-loading"><Loading /></el-icon>
          {{ t('community.loadingMore') }}
        </div>
        <div v-else-if="!hasMore" class="no-more">
          {{ t('community.noMore') }}
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.community-page {
  min-height: 100vh;
  padding-top: 64px;
  background: radial-gradient(
    circle at top right,
    rgba(var(--primary-color-rgb), 0.1),
    rgba(var(--accent-color-rgb), 0.05),
    transparent 70%
  );
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(45deg, rgba(var(--primary-color-rgb), 0.03) 25%, transparent 25%) -50px 0,
      linear-gradient(-45deg, rgba(var(--primary-color-rgb), 0.03) 25%, transparent 25%) -50px 0,
      linear-gradient(45deg, transparent 75%, rgba(var(--primary-color-rgb), 0.03) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(var(--primary-color-rgb), 0.03) 75%);
    background-size: 100px 100px;
    z-index: -1;
  }
}

.community-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20%;
    right: -20%;
    width: 500px;
    height: 500px;
    background: radial-gradient(
      circle,
      rgba(var(--accent-color-rgb), 0.1),
      transparent 70%
    );
    filter: blur(50px);
    z-index: -1;
  }
}

.page-header {
  text-align: center;
  margin-bottom: 6rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -150px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 800px;
    background: radial-gradient(
      circle,
      rgba(var(--primary-color-rgb), 0.1),
      transparent 70%
    );
    filter: blur(80px);
    z-index: -1;
  }
  
  h1 {
    font-size: 5rem;
    font-weight: 800;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, 
      var(--primary-color), 
      var(--accent-color)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.02em;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1rem;
      left: 25%;
      width: 50%;
      height: 6px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        var(--accent-color),
        transparent
      );
      border-radius: 3px;
      filter: blur(1px);
    }
  }
  
  p {
    font-size: 1.5rem;
    color: var(--text-color-light);
    max-width: 700px;
    margin: 0 auto 3rem;
    line-height: 1.6;
    opacity: 0.8;
  }
  
  .header-decoration {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
    
    .circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      opacity: 0.6;
    }
    
    .line {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        var(--primary-color),
        var(--accent-color),
        transparent
      );
      opacity: 0.3;
    }
  }
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 3rem;
  margin-bottom: 4rem;
}

.work-card {
  cursor: pointer;
  position: relative;
  isolation: isolate;
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
  
  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(var(--primary-color-rgb), 0.1),
      rgba(var(--accent-color-rgb), 0.05)
    );
    border-radius: 1.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  .work-image {
    position: relative;
    width: 100%;
    padding-top: 100%;
    overflow: hidden;
    border-radius: 12px;
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      opacity: 0;
      border: none;
      padding: 0;

      &:hover {
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        opacity: 1;

        .play-button {
          transform: scale(1.1);
        }
      }

      .play-button {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

        .play-icon {
          font-size: 24px;
          color: var(--primary-color);
          margin-left: 4px; // 稍微偏右一点，视觉上更居中
        }
      }
    }

    &:hover {
      img {
        transform: scale(1.05);
      }
    }
  }
  
  .work-info {
    padding: 2rem;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(10px);
    border-radius: 0 0 1.5rem 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    
    .work-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.3s ease;
      
      .with-photosong {
        display: inline-block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--primary-color);
        opacity: 0.8;
        margin-left: 0.5rem;
        vertical-align: middle;
      }
    }
    
    .work-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: var(--text-color-light);
      
      .meta-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .username {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-color);
        }
      }
      
      .date {
        font-size: 0.875rem;
        color: var(--text-color-light);
        opacity: 0.8;
      }
    }
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    
    &::before {
      opacity: 1;
    }
    
    .work-image {
      img {
        transform: scale(1.05);
      }
    }
  }
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  
  .skeleton-card {
    border-radius: 1.5rem;
    background: var(--surface-secondary);
    border: 1px solid var(--border-color);
    overflow: hidden;
    position: relative;
    
    .skeleton-image {
      position: relative;
      overflow: hidden;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        animation: shimmer 2s infinite;
      }
    }
  }
  
  .skeleton-content {
    padding: 2rem;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: shimmer 2s infinite;
    }
  }
  
  .skeleton-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    
    .meta-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

// 添加骨架屏卡片的交错动画
@for $i from 1 through 12 {
  .skeleton-card:nth-child(#{$i}) {
    .skeleton-image::after,
    .skeleton-content::after {
      animation-delay: #{$i * 0.1}s;
    }
  }
}

.load-more-indicator {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    
    .el-icon {
      font-size: 1.25rem;
      color: var(--primary-color);
      animation: spin 1s linear infinite;
    }
  }
  
  .no-more {
    font-size: 0.875rem;
    color: var(--text-tertiary);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-avatar.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.loaded {
    opacity: 1;
  }
}

// 优化移动端样式
@media (max-width: 768px) {
  .community-content {
    padding: 1rem;
  }
  
  .page-header {
    margin-bottom: 2rem;
    
    h1 {
      font-size: 2.5rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
  
  .work-card {
    .work-image {
      height: 200px;
    }
    
    .play-overlay {
      .play-button {
        width: 56px;
        height: 56px;
        
        .play-icon {
          font-size: 28px;
        }
      }
    }
  }
}

// 添加屏幕阅读器专用样式
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// 优化焦点样式
[role="button"]:focus,
button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

// 添加骨架屏样式
.skeleton-card {
  background: rgb(19 28 46);
  border-radius: 1.5rem;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
  
  @for $i from 1 through 6 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
  
  .skeleton-image {
    width: 100%;
    padding-top: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 25%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .skeleton-title {
    height: 24px;
    width: 80%;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .skeleton-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
    }
    
    .skeleton-info {
      flex: 1;
      
      .skeleton-name {
        height: 16px;
        width: 60%;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
      
      .skeleton-date {
        height: 14px;
        width: 40%;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 