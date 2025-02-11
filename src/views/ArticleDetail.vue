<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import Article from '@/models/Article'
import { marked } from 'marked'
import { useHead } from '@vueuse/head'
import TheNavbar from '@/components/TheNavbar.vue'
import {
  View,
  Star,
  ArrowLeft,
  Share,
  Promotion,
  Position,
  Link,
  Message,
  ChatDotRound,
  ChatLineRound,
  ChatRound,
  Share as ShareIcon,
  Platform,
  Calendar,
  Connection,
  ArrowRight
} from '@element-plus/icons-vue'
import AV from 'leancloud-storage'
import { useClipboard } from '@vueuse/core'
import { useMessage } from '../composables/useMessage'
import { generateArticleSchema, generateBreadcrumbSchema } from '../utils/structuredData'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { copy } = useClipboard()
const { success, error } = useMessage()

// 状态变量
const article = ref(null)
const loading = ref(true)
const relatedArticles = ref([])
const isLiked = ref(false)
const prevArticle = ref(null)
const nextArticle = ref(null)

// 格式化文章内容
const formattedContent = computed(() => {
  try {
    const content = article.value?.get('content')
    return content ? marked(content) : ''
  } catch (err) {
    console.error('Error formatting article content:', err)
    return ''
  }
})

// 计算属性用于 head 信息
const head = computed(() => {
  if (!article.value) return {}

  // 生成面包屑数据
  const breadcrumbItems = [
    { name: t('nav.home'), url: 'https://photosong.com' },
    { name: t('nav.articles'), url: 'https://photosong.com/articles' },
    { name: article.value.get('title'), url: window.location.href }
  ]

  return {
    title: article.value?.get('title') || article.value?.get('metaTitle') || 'Article',
    meta: [
      {
        name: 'description',
        content: article.value?.get('metaDescription') || article.value?.get('summary') || ''
      },
      {
        name: 'keywords',
        content: article.value?.get('keywords')?.join(',') || ''
      },
      // Open Graph
      {
        property: 'og:title',
        content: article.value?.get('title') || ''
      },
      {
        property: 'og:description',
        content: article.value?.get('summary') || ''
      },
      {
        property: 'og:image',
        content: article.value?.get('coverImage') || ''
      },
      {
        property: 'og:type',
        content: 'article'
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: article.value?.get('title') || ''
      },
      {
        name: 'twitter:description',
        content: article.value?.get('summary') || ''
      },
      {
        name: 'twitter:image',
        content: article.value?.get('coverImage') || ''
      }
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(generateArticleSchema(article.value))
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems))
      }
    ],
    link: [
      {
        rel: 'canonical',
        href: article.value?.get('canonicalUrl') || window.location.href
      }
    ]
  }
})

// 使用 head
useHead(head)

// 修改加载相邻文章的函数
const loadAdjacentArticles = async () => {
  try {
    const currentDate = article.value.get('publishedAt')
    const currentId = article.value.id
    
    // 查询上一篇文章
    const prevQuery = new AV.Query('Article')
    prevQuery.lessThan('publishedAt', currentDate)
    prevQuery.equalTo('status', 'published')
    prevQuery.descending('publishedAt')
    prevQuery.limit(1)
    
    // 查询下一篇文章
    const nextQuery = new AV.Query('Article')
    nextQuery.greaterThan('publishedAt', currentDate)
    nextQuery.equalTo('status', 'published')
    nextQuery.ascending('publishedAt')
    nextQuery.limit(1)
    
    // 同时查询上一篇和下一篇
    const [prevResult, nextResult] = await Promise.all([
      prevQuery.find(),
      nextQuery.find()
    ])
    
    prevArticle.value = prevResult[0] || null
    nextArticle.value = nextResult[0] || null
    
    console.log('Adjacent articles loaded:', { prev: prevArticle.value, next: nextArticle.value })
  } catch (err) {
    console.error('Failed to load adjacent articles:', err)
  }
}

// 处理上一篇文章导航
const handlePrevArticle = async () => {
  if (prevArticle.value) {
    try {
      const slug = prevArticle.value.get('slug') || prevArticle.value.id
      await router.push(`/articles/${slug}`)
    } catch (err) {
      console.error('Navigation error:', err)
      ElMessage.error(t('articles.errors.navigationFailed'))
    }
  }
}

// 处理下一篇文章导航
const handleNextArticle = async () => {
  if (nextArticle.value) {
    try {
      const slug = nextArticle.value.get('slug') || nextArticle.value.id
      await router.push(`/articles/${slug}`)
    } catch (err) {
      console.error('Navigation error:', err)
      ElMessage.error(t('articles.errors.navigationFailed'))
    }
  }
}

// 修改 loadArticle 函数
const loadArticle = async () => {
  loading.value = true
  try {
    const Article = AV.Object.extend('Article')
    const query = new AV.Query(Article)
    const slug = route.params.slug
    
    // 先尝试通过 slug 查询
    query.equalTo('slug', slug)
    query.equalTo('status', 'published')
    let result = await query.first()
    
    // 如果找不到，尝试通过 id 查询
    if (!result) {
      const idQuery = new AV.Query(Article)
      idQuery.equalTo('objectId', slug)
      idQuery.equalTo('status', 'published')
      result = await idQuery.first()
    }
    
    if (!result) {
      throw new Error(t('articles.errors.articleNotFound'))
    }
    
    article.value = result
    
    // 增加浏览量
    article.value.increment('views', 1)
    await article.value.save()
    
    // 加载相关文章和相邻文章
    await Promise.all([
      loadRelatedArticles(),
      loadAdjacentArticles()
    ])
  } catch (error) {
    console.error('Failed to load article:', error)
    ElMessage.error(t('articles.errors.articleNotFound'))
    router.push('/articles')
  } finally {
    loading.value = false
  }
}

// 加载相关文章
const loadRelatedArticles = async () => {
  try {
    const relatedQuery = new AV.Query('Article')
    relatedQuery.equalTo('status', 'published')
    relatedQuery.equalTo('category', article.value.get('category'))
    relatedQuery.notEqualTo('objectId', article.value.id)
    relatedQuery.limit(3)
    relatedArticles.value = await relatedQuery.find()
  } catch (err) {
    console.error('Failed to load related articles:', err)
    relatedArticles.value = []
  }
}

// 修改点赞函数
const likeArticle = async () => {
  try {
    if (!article.value) {
      throw new Error('Article not found')
    }
    
    // 直接使用 increment 方法增加点赞数
    article.value.increment('likes', 1)
    await article.value.save()
    
    ElMessage.success(t('articles.likeSuccess'))
  } catch (error) {
    console.error('Failed to like article:', error)
    ElMessage.error(t('errors.likeFailed'))
  }
}

// 分享文章
const handleSocialShare = async (platform) => {
  const title = article.value?.get('title')
  const summary = article.value?.get('summary')
  const url = window.location.href
  const hashtags = 'PhotoSong,Photography'
  
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`,
    wechat: url,
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&source=PhotoSong`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    tumblr: `https://www.tumblr.com/share/link?url=${encodeURIComponent(url)}&name=${encodeURIComponent(title)}&description=${encodeURIComponent(summary)}`
  }
  
  if (platform === 'wechat') {
    try {
      await copy(url)
      success(t('share.copySuccess'))
    } catch (err) {
      error(t('share.copyFailed'))
    }
    return
  }
  
  window.open(shareUrls[platform], '_blank')
}

// 分享文章（通用分享）
const shareArticle = async () => {
  const title = article.value?.get('title')
  const url = window.location.href
  
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url,
        text: article.value?.get('summary')
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        error(t('share.shareFailed'))
      }
    }
  } else {
    try {
      await copy(url)
      success(t('share.copySuccess'))
    } catch (err) {
      error(t('share.copyFailed'))
    }
  }
}

// 查看相关文章
const viewRelatedArticle = async (relatedArticle) => {
  try {
    const slug = relatedArticle.get('slug') || relatedArticle.id
    await router.push(`/articles/${slug}`)
  } catch (err) {
    console.error('Navigation error:', err)
    ElMessage.error(t('articles.errors.navigationFailed'))
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 监听路由变化
watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) {
      loadArticle()
      window.scrollTo(0, 0)
    }
  }
)

onMounted(() => {
  loadArticle()
})
</script>

<template>
  <div class="article-detail">
    <TheNavbar />
    
    <main class="main-content">
      <!-- 顶部导航区域 -->
      <div class="top-actions">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <el-button 
            class="back-button" 
            @click="goBack"
            :icon="ArrowLeft"
            text
          >
            {{ t('nav.back') }}
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">{{ t('nav.home') }}</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/articles' }">{{ t('nav.articles') }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ article?.get('title') || t('articles.loading') }}</el-breadcrumb-item>
          </el-breadcrumb>
        </nav>

        <div class="action-buttons">
          <el-button
            class="community-btn"
            type="primary"
            :icon="Platform"
            @click="router.push('/community')"
          >
            {{ t('nav.community') }}
          </el-button>
        </div>
      </div>

      <template v-if="loading">
        <div class="article-skeleton">
          <div class="skeleton-header">
            <div class="skeleton-title shimmer" />
            <div class="skeleton-meta shimmer" />
          </div>
          <div class="skeleton-cover shimmer" />
          <div class="skeleton-content">
            <div 
              v-for="i in 5" 
              :key="i" 
              class="skeleton-paragraph shimmer"
              :style="{ width: `${Math.random() * 20 + 80}%` }"
            />
          </div>
        </div>
      </template>
      
      <template v-else-if="article">
        <article class="article">
          <!-- 文章头部信息卡片 -->
          <div class="article-info-card">
            <header class="article-header">
              <h1 class="article-title">{{ article.get('title') }}</h1>
              
              <div class="article-meta">
                <div class="meta-left">
                  <el-tag 
                    :type="article.get('category') === 'professional' ? 'success' : 'info'"
                    class="category-tag"
                    effect="light"
                  >
                    {{ t(`articles.categories.${article.get('category')?.toLowerCase()}`) }}
                  </el-tag>
                  <span class="article-date">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(article.get('publishedAt')) }}
                  </span>
                  <span class="article-views">
                    <el-icon><View /></el-icon>
                    {{ article.get('views') || 0 }} {{ t('articles.views') }}
                  </span>
                </div>
                
                <div class="meta-right">
                  <el-button 
                    class="like-btn" 
                    :type="isLiked ? 'primary' : 'default'" 
                    @click="likeArticle"
                    :class="{ 'is-liked': isLiked }"
                  >
                    <el-icon><Star /></el-icon>
                    <span class="like-count">{{ article.get('likes') || 0 }}</span>
                  </el-button>
                  
                  <el-dropdown trigger="click" @command="handleSocialShare" class="share-btn">
                    <el-button type="primary" plain>
                      <el-icon><Share /></el-icon>
                      {{ t('actions.share') }}
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="share-dropdown">
                        <el-dropdown-item command="twitter">
                          <el-icon><Platform /></el-icon>
                          Twitter
                        </el-dropdown-item>
                        <el-dropdown-item command="facebook">
                          <el-icon><Platform /></el-icon>
                          Facebook
                        </el-dropdown-item>
                        <el-dropdown-item command="linkedin">
                          <el-icon><Platform /></el-icon>
                          LinkedIn
                        </el-dropdown-item>
                        <el-dropdown-item command="wechat">
                          <el-icon><ChatRound /></el-icon>
                          WeChat
                        </el-dropdown-item>
                        <el-dropdown-item command="qq">
                          <el-icon><ChatDotRound /></el-icon>
                          QQ
                        </el-dropdown-item>
                        <el-dropdown-item command="telegram">
                          <el-icon><ChatLineRound /></el-icon>
                          Telegram
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </header>
          </div>
          
          <!-- 文章封面图 -->
          <div 
            v-if="article.get('coverImage')" 
            class="article-cover"
            :style="{ backgroundImage: `url(${article.get('coverImage')})` }"
          >
            <div class="cover-overlay"></div>
            <img :src="article.get('coverImage')" :alt="article.get('title')">
          </div>
          
          <!-- 文章内容 -->
          <div class="article-container">
            <div 
              class="article-content markdown-body" 
              v-html="formattedContent"
            />
            
            <footer class="article-footer">
              <div class="article-tags">
                <el-tag
                  v-for="tag in article.get('tags') || []"
                  :key="tag"
                  size="small"
                  class="article-tag"
                  effect="light"
                >
                  <el-icon><Position /></el-icon>
                  {{ tag }}
                </el-tag>
              </div>
              
              <!-- 文章底部操作栏 -->
              <div class="article-actions">
                <el-button-group>
                  <el-button 
                    type="primary" 
                    plain 
                    @click="handlePrevArticle"
                    :disabled="!prevArticle"
                  >
                    <el-icon><ArrowLeft /></el-icon>
                    {{ t('articles.prevArticle') }}
                  </el-button>
                  <el-button 
                    type="primary" 
                    plain 
                    @click="handleNextArticle"
                    :disabled="!nextArticle"
                  >
                    {{ t('articles.nextArticle') }}
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </footer>
          </div>
        </article>

        <!-- 相关文章推荐 -->
        <section v-if="relatedArticles.length > 0" class="related-articles">
          <h2 class="section-title">
            <el-icon><Connection /></el-icon>
            {{ t('articles.related') }}
          </h2>
          <div class="articles-grid">
            <div
              v-for="relatedArticle in relatedArticles"
              :key="relatedArticle.id"
              class="related-article-card"
              @click="viewRelatedArticle(relatedArticle)"
            >
              <div class="card-cover">
                <img
                  :src="relatedArticle.get('coverImage')"
                  :alt="relatedArticle.get('title')"
                />
                <div class="card-category">
                  {{ t(`articles.categories.${relatedArticle.get('category')?.toLowerCase()}`) }}
                </div>
              </div>
              <div class="card-content">
                <h3>{{ relatedArticle.get('title') }}</h3>
                <p>{{ relatedArticle.get('summary') }}</p>
                <div class="card-meta">
                  <span class="card-date">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(relatedArticle.get('publishedAt')) }}
                  </span>
                  <span class="card-views">
                    <el-icon><View /></el-icon>
                    {{ relatedArticle.get('views') || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
      
      <template v-else>
        <div class="error-state">
          <el-empty :description="t('articles.errors.articleNotFound')" />
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.article-detail {
  min-height: 100vh;
  background: var(--bg-gradient);
  color: var(--text-color);
  padding-top: calc(var(--navbar-height) + 120px); /* 大幅增加顶部内边距 */
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
  margin-top: 100px; /* 大幅增加主内容区域的顶部间距 */
}

/* 顶部导航 */
.top-actions {
  position: fixed; /* 改为固定定位 */
  top: calc(var(--navbar-height) + 40px); /* 调整固定位置 */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 800px;
  z-index: 100; /* 提高层级 */
  background: var(--glass-background);
  padding: 24px; /* 增加内边距 */
  border-radius: 16px; /* 增加圆角 */
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(10px);
  margin-bottom: 80px; /* 增加底部间距 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px; /* 增加内部元素间距 */
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-button {
  padding: 8px 15px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.3s ease;

  &:hover {
    color: var(--primary-color);
  }
}

.community-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
  }
}

/* 文章主体 */
.article {
  margin-top: 180px; /* 大幅增加顶部间距 */
  background: var(--glass-background);
  border: var(--glass-border);
  border-radius: 16px; /* 增加圆角 */
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(10px);
  overflow: hidden;
  padding-top: 40px; /* 增加内部顶部间距 */
}

.article-info-card {
  padding: 32px; /* 增加内边距 */
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 40px; /* 增加底部间距 */
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  line-height: 1.4;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.meta-left {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.category-tag {
  padding: 4px 12px;
  background: var(--surface-secondary);
  color: var(--primary-color);
  border-radius: 15px;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--primary-color);
    color: white;
  }
}

.article-date,
.article-views {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meta-right {
  display: flex;
  gap: 10px;
}

.like-btn,
.share-btn .el-button {
  padding: 8px 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--surface-primary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.like-btn.is-liked {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 文章封面 */
.article-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 50%;
  overflow: hidden;
}

.article-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 文章内容 */
.article-container {
  padding: 20px;
  background: var(--glass-background);
  backdrop-filter: blur(10px);
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color);

  :deep(h1, h2, h3, h4) {
    color: var(--text-primary);
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  :deep(p) {
    color: var(--text-secondary);
    margin-bottom: 1em;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1em 0;
    box-shadow: var(--glass-shadow);
  }

  :deep(blockquote) {
    margin: 1em 0;
    padding: 1em;
    background: var(--surface-secondary);
    border-left: 4px solid var(--primary-color);
    color: var(--text-secondary);
    border-radius: 4px;
  }

  :deep(code) {
    background: var(--surface-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
    color: var(--primary-color);
  }
}

/* 文章底部 */
.article-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.article-tag {
  padding: 4px 12px;
  background: var(--surface-secondary);
  border-radius: 15px;
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--primary-color);
    color: white;
  }
}

.article-actions {
  display: flex;
  justify-content: center;
  gap: 10px;

  .el-button {
    padding: 10px 20px;
    border: 1px solid var(--primary-color);
    background: var(--surface-primary);
    color: var(--primary-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--primary-color);
      color: white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* 相关文章 */
.related-articles {
  margin-top: 30px;
  background: var(--glass-background);
  border: var(--glass-border);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .el-icon {
    color: var(--primary-color);
  }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.related-article-card {
  background: var(--glass-background);
  border: var(--glass-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--glass-shadow);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--glass-shadow-hover);
    border-color: var(--primary-color);
  }
}

.card-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 60%;
  overflow: hidden;
}

.card-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-category {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  background: rgba(var(--primary-color-rgb), 0.9);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

.card-content {
  padding: 15px;

  h3 {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  p {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 10px;
  }
}

.card-meta {
  color: var(--text-tertiary);
}

/* 加载状态 */
.article-skeleton {
  background: var(--glass-background);
  border: var(--glass-border);
  padding: 20px;
  border-radius: 8px;
  box-shadow: var(--glass-shadow);
}

.skeleton-header {
  margin-bottom: 20px;
}

.skeleton-title,
.skeleton-meta,
.skeleton-cover,
.skeleton-paragraph {
  background: var(--surface-secondary);
  border-radius: 4px;
}

.skeleton-title {
  height: 32px;
  margin-bottom: 15px;
}

.skeleton-meta {
  height: 20px;
  width: 60%;
}

.skeleton-cover {
  height: 300px;
  margin: 20px 0;
}

.skeleton-paragraph {
  height: 16px;
  margin-bottom: 12px;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 40px 20px;
  background: var(--glass-background);
  border: var(--glass-border);
  border-radius: 8px;
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(10px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .article-detail {
    padding-top: var(--navbar-height-mobile, 60px);
  }

  .main-content {
    padding: 0;
    margin-top: 0;
    width: 100%;
  }
  
  .top-actions {
    position: fixed;
    top: var(--navbar-height-mobile, 60px);
    left: 0;
    transform: none;
    width: 100%;
    padding: 45px 15px;
    margin: 0;
    border-radius: 0;
    background: var(--glass-background);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 100;
  }

  .breadcrumb {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px; /* 固定高度 */
    
    .back-button {
      padding: 4px 8px;
      font-size: 14px;
      min-width: auto;
      flex-shrink: 0;
    }
    
    .el-breadcrumb {
      flex: 1;
      overflow-x: auto;
      white-space: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 8px 0;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  .action-buttons {
    width: 100%;
    height: 40px; /* 固定高度 */
    
    .community-btn {
      width: 100%;
      justify-content: center;
      padding: 8px;
      font-size: 14px;
      height: 36px;
    }
  }
  
  .article {
    margin-top: 160px; /* 导航栏(60px) + 面包屑(40px) + 按钮(40px) + 间距(20px) */
    border-radius: 0;
    padding-top: 0;
    background: var(--glass-background);
    border: none;
    border-top: 1px solid var(--border-color);
  }

  .article-info-card {
    padding: 16px;
    margin-bottom: 0;
    background: var(--glass-background);
  }
  
  .article-title {
    font-size: 20px;
    margin-bottom: 16px;
    line-height: 1.3;
    padding-top: 16px;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 12px;
  }
  
  .meta-left {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start;
    
    .category-tag,
    .article-date,
    .article-views {
      font-size: 12px;
      height: 24px;
      line-height: 24px;
    }
  }
  
  .meta-right {
    display: flex;
    gap: 8px;
    
    .like-btn,
    .share-btn .el-button {
      flex: 1;
      justify-content: center;
      padding: 6px 12px;
      font-size: 13px;
      height: 32px;
    }
  }
  
  .article-content {
    padding: 16px;
    font-size: 15px;
    line-height: 1.6;
  }
  
  .article-footer {
    padding: 16px;
    margin-top: 16px;
    border-top: 1px solid var(--border-color);
  }
  
  .article-tags {
    gap: 8px;
    margin-bottom: 16px;
    
    .article-tag {
      font-size: 12px;
      padding: 3px 8px;
      height: 24px;
    }
  }
  
  .article-actions {
    flex-direction: row;
    gap: 8px;
    
    .el-button {
      flex: 1;
      padding: 8px;
      font-size: 13px;
      height: 36px;
      justify-content: center;
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
  
  .related-articles {
    margin-top: 16px;
    border-radius: 0;
    padding: 16px;
    border: none;
    border-top: 1px solid var(--border-color);
  }
  
  .section-title {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style> 