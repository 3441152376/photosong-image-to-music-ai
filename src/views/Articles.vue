<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AV from 'leancloud-storage'
import { ElMessage } from 'element-plus'
import { useHead } from 'unhead'
import TheNavbar from '../components/TheNavbar.vue'
import { useIntersectionObserver } from '@vueuse/core'
import SEOMeta from '../components/SEOMeta.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const router = useRouter()
const { t, locale } = useI18n()
const loading = ref(false)
const articles = ref([])
const selectedCategory = ref('all')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const hasMore = ref(true)
const loadingMore = ref(false)
const observerTarget = ref(null)

// SEO meta data
const seoMeta = ref({
  title: computed(() => `${t('articles.title')} | PhotoSong`),
  description: computed(() => t('articles.description')),
  keywords: ['PhotoSong', 'AI Music', 'Articles'],
  type: 'article'
})

useHead({
  title: computed(() => `${t('articles.title')} | PhotoSong`),
  meta: [
    {
      name: 'description',
      content: computed(() => t('articles.description'))
    },
    {
      name: 'keywords',
      content: 'PhotoSong, AI Music, Articles'
    }
  ]
})

// 使用computed获取分类
const categories = computed(() => [
  { id: 'all', name: t('articles.allCategories') },
  { id: 'news', name: t('articles.categories.news') },
  { id: 'knowledge', name: t('articles.categories.knowledge') },
  { id: 'ai_music', name: t('articles.categories.ai_music') },
  { id: 'professional', name: t('articles.categories.professional') },
  { id: 'tutorial', name: t('articles.categories.tutorial') },
  { id: 'research', name: t('articles.categories.research') },
  { id: 'industry', name: t('articles.categories.industry') },
  { id: 'community', name: t('articles.categories.community') }
])

// 优化图片加载
const imageLoadStatus = ref(new Set())

const handleImageLoad = (articleId) => {
  imageLoadStatus.value.add(articleId)
}

// 计算骨架屏显示状态
const showSkeleton = computed(() => {
  return loading.value || (articles.value.length > 0 && imageLoadStatus.value.size < articles.value.length)
})

// 分页配置
const pagination = computed(() => ({
  currentPage: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  background: true,
  layout: 'prev, pager, next, jumper, total',
  pageSizes: [12, 24, 36, 48]
}))

// 预加载下一页图片
const preloadNextPageImages = () => {
  if (currentPage.value * pageSize.value >= total.value) return
  
  const query = new AV.Query('Article')
  query.equalTo('status', 'published')
  if (selectedCategory.value !== 'all') {
    query.equalTo('category', selectedCategory.value)
  }
  
  query.skip(currentPage.value * pageSize.value)
  query.limit(pageSize.value)
  query.select(['coverImage'])
  query.descending('createdAt')
  
  query.find().then(results => {
    results.forEach(article => {
      const coverImage = article.get('coverImage')
      if (coverImage) {
        const img = new Image()
        img.src = coverImage
      }
    })
  }).catch(error => {
    console.error('Error preloading next page images:', error)
  })
}

// 获取文章列表
const fetchArticles = async (loadMore = false) => {
  if (!loadMore) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  try {
    const query = new AV.Query('Article')
    query.equalTo('status', 'published')
    
    if (selectedCategory.value !== 'all') {
      query.equalTo('category', selectedCategory.value)
    }
    
    // 获取总数
    if (!loadMore) {
      total.value = await query.count()
    }
    
    // 分页
    query.skip((currentPage.value - 1) * pageSize.value)
    query.limit(pageSize.value)
    query.select(['title', 'summary', 'coverImage', 'category', 'views', 'createdAt', 'slug', 'keywords'])
    query.descending('createdAt')
    
    const results = await query.find()
    
    const newArticles = results.map(article => ({
      id: article.id,
      title: article.get('title') || t('articles.untitledArticle'),
      summary: article.get('summary') || '',
      coverImage: article.get('coverImage') || '/default-article-cover.png',
      category: article.get('category'),
      views: article.get('views') || 0,
      createdAt: article.createdAt,
      slug: article.get('slug') || article.id,
      keywords: article.get('keywords') || []
    }))

    if (loadMore) {
      articles.value = [...articles.value, ...newArticles]
    } else {
      articles.value = newArticles
      imageLoadStatus.value = new Set()
    }

    // 检查是否还有更多数据
    hasMore.value = articles.value.length < total.value
    
    // 预加载下一页图片
    if (hasMore.value) {
      preloadNextPageImages()
    }
  } catch (error) {
    console.error('Error fetching articles:', error)
    ElMessage.error(t('articles.errors.loadFailed'))
  } finally {
    if (!loadMore) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

// 加载更多文章
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  currentPage.value++
  await fetchArticles(true)
}

// 计算阅读时间
const calculateReadingTime = (content) => {
  if (!content) return 1
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// 跳转到文章详情
const goToArticle = (article) => {
  router.push({ 
    name: `${locale.value}-ArticleDetail`,
    params: { slug: article.slug }
  })
}

// 处理分类变更
const handleCategoryChange = async (category) => {
  if (category === selectedCategory.value) return
  
  loading.value = true
  try {
    selectedCategory.value = category
    currentPage.value = 1
    hasMore.value = true
    await fetchArticles()
    
    // 更新路由参数
    await router.push({
      query: {
        ...router.currentRoute.value.query,
        category: category
      }
    })
  } catch (error) {
    console.error('Category change failed:', error)
    ElMessage.error(t('articles.errors.categoryChangeFailed'))
  } finally {
    loading.value = false
  }
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

// 监听路由变化
watch(
  () => router.currentRoute.value.query,
  (newQuery) => {
    const category = newQuery.category || 'all'
    if (category !== selectedCategory.value) {
      selectedCategory.value = category
      currentPage.value = 1
      hasMore.value = true
      fetchArticles()
    }
  },
  { immediate: true }
)

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

// Update meta info when locale changes
watch(locale, () => {
  nextTick(() => {
    seoMeta.value = {
      title: t('articles.title'),
      description: t('articles.description'),
      keywords: ['PhotoSong', 'AI Music', 'Articles'],
      type: 'article'
    }
  })
})

// 在组件挂载时初始化
onMounted(async () => {
  // 从路由参数恢复状态
  const query = router.currentRoute.value.query
  selectedCategory.value = query.category || 'all'
  
  await nextTick(() => {
    seoMeta.value = {
      title: t('articles.title'),
      description: t('articles.description'),
      keywords: ['PhotoSong', 'AI Music', 'Articles'],
      type: 'article'
    }
  })
  
  await fetchArticles()
  setupInfiniteScroll()
})
</script>

<template>
  <div class="articles-page">
    <TheNavbar />
    
    <div class="articles-content">
      <div class="header">
        <h1 class="gradient-text">{{ t('articles.title') }}</h1>
        <p>{{ t('articles.description') }}</p>
        <div class="header-decoration">
          <div class="circle"></div>
          <div class="line"></div>
          <div class="circle"></div>
        </div>
      </div>
      
      <div class="categories-nav">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-btn"
          :class="{ active: selectedCategory === category.id }"
          @click="handleCategoryChange(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
      
      <template v-if="loading">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          <div v-for="i in 9" :key="i" class="article-card bg-white rounded-lg overflow-hidden shadow-lg">
            <SkeletonLoader type="image" height="200px" />
            <div class="p-4">
              <SkeletonLoader type="text" height="24px" width="80%" />
              <SkeletonLoader type="text" height="16px" width="60%" class="mt-2" />
              <div class="mt-4">
                <SkeletonLoader type="text" height="16px" width="100%" />
                <SkeletonLoader type="text" height="16px" width="90%" class="mt-2" />
              </div>
              <div class="flex items-center mt-4">
                <SkeletonLoader type="avatar" width="32px" height="32px" />
                <SkeletonLoader type="text" width="100px" height="16px" class="ml-2" />
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <div v-else-if="articles.length === 0" class="empty-state">
        <el-empty
          :description="t('articles.empty.description')"
        />
      </div>
      
      <div v-else class="articles-grid">
        <article
          v-for="article in articles"
          :key="article.id"
          class="article-card"
          @click="goToArticle(article)"
        >
          <div class="article-image">
            <img 
              v-lazy-load
              :data-src="article.coverImage"
              :alt="article.title"
              @load="handleImageLoad(article.id)"
              class="lazy-image"
              :class="{ 'loaded': imageLoadStatus.has(article.id) }"
            />
            <div class="article-category">
              {{ t(`articles.categories.${article.category}`) }}
            </div>
          </div>
          
          <div class="article-content">
            <h2 class="article-title">{{ article.title }}</h2>
            <p class="article-summary">{{ article.summary }}</p>
            
            <div class="article-meta">
              <div class="meta-item">
                <el-icon><View /></el-icon>
                {{ article.views }}
              </div>
              <time>{{ new Date(article.createdAt).toLocaleDateString() }}</time>
            </div>
          </div>
        </article>
      </div>

      <!-- 加载更多指示器 -->
      <div 
        v-if="articles.length > 0" 
        ref="observerTarget"
        class="load-more-indicator"
      >
        <div v-if="loadingMore" class="loading-spinner">
          <el-icon class="is-loading"><Loading /></el-icon>
          {{ t('loading....') }}
        </div>
        <div v-else-if="!hasMore" class="no-more">
          {{ t('end') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.articles-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-gradient);
}

.articles-content {
  flex: 1;
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 2rem 1rem;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto 1.5rem;
  }
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
}

.header-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  .circle {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
  }
  
  .line {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%);
  }
}

.categories-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  
  .category-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 9999px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    
    &.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.article-card {
  background: var(--surface-primary);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    
    .article-image img {
      transform: scale(1.05);
    }
  }
}

.article-image {
  position: relative;
  padding-top: 60%;
  overflow: hidden;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .article-category {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.75rem;
    background: rgba(var(--primary-color-rgb), 0.9);
    color: white;
    font-size: 0.75rem;
    border-radius: 9999px;
    backdrop-filter: blur(4px);
  }
}

.article-content {
  padding: 1.5rem;
}

.article-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  
  &:hover {
    color: var(--primary-color);
  }
}

.article-summary {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    .el-icon {
      font-size: 1rem;
    }
  }
  
  time {
    margin-left: auto;
  }
}

.loading-state {
  max-width: 800px;
  margin: 0 auto;
}

.empty-state {
  padding: 4rem 0;
  text-align: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  padding: 1rem;
  
  :deep(.el-pagination) {
    --el-pagination-bg-color: var(--surface-primary);
    --el-pagination-hover-color: var(--primary-color);
    --el-pagination-button-color: var(--text-primary);
    --el-pagination-button-bg-color: transparent;
    
    .el-pagination__total,
    .el-pagination__jump {
      color: var(--text-secondary);
    }
    
    .el-input__inner {
      background: var(--surface-secondary);
      border-color: var(--border-color);
      color: var(--text-primary);
    }
    
    .el-select .el-input {
      width: 110px;
    }
    
    button {
      background: var(--surface-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      
      &:disabled {
        background: var(--surface-disabled);
        color: var(--text-disabled);
      }
      
      &:hover:not(:disabled) {
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
      
      &.is-active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    }
  }
}

.article-card-skeleton {
  background: var(--surface-primary);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  
  .skeleton-image {
    padding-top: 60%;
    background: var(--skeleton-color);
  }
  
  .skeleton-content {
    padding: 1.5rem;
    
    .skeleton-title {
      height: 24px;
      margin-bottom: 1rem;
      background: var(--skeleton-color);
      border-radius: 4px;
    }
    
    .skeleton-summary {
      height: 48px;
      margin-bottom: 1rem;
      background: var(--skeleton-color);
      border-radius: 4px;
    }
    
    .skeleton-meta {
      height: 20px;
      width: 60%;
      background: var(--skeleton-color);
      border-radius: 4px;
    }
  }
}

.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.loaded {
    opacity: 1;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--skeleton-color) 0%,
    var(--skeleton-color-light) 50%,
    var(--skeleton-color) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .articles-content {
    margin-top: 60px;
    padding: 1rem;
  }
  
  .articles-header {
    .page-title {
      font-size: 2rem;
    }
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .categories-nav {
    gap: 0.5rem;
    
    .category-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
  }

  .pagination-container {
    margin-top: 2rem;
    padding: 0.5rem;
    
    :deep(.el-pagination) {
      .el-pagination__sizes {
        display: none;
      }
      
      .el-pagination__jump {
        display: none;
      }
      
      .el-pager li {
        min-width: 28px;
        height: 28px;
        line-height: 28px;
      }
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

// 优化文章卡片动画
.article-card {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
  
  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
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