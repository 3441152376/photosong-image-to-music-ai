<template>
  <div class="sitemap-page">
    <div class="container">
      <!-- 页面标题 -->
      <div class="header">
        <div class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h1>{{ t('sitemap.title') }}</h1>
        <p>{{ t('sitemap.description') }}</p>
      </div>

      <!-- 状态显示 -->
      <div class="status-card">
        <div class="status-icon">
          <div v-if="loading" class="loading-spinner"></div>
          <div v-else class="status-emoji">{{ statusIcon }}</div>
        </div>
        <div class="status-content">
          <p class="status-message" :class="statusClass">{{ statusMessage }}</p>
          <!-- 进度显示 -->
          <div v-if="loading && progress" class="progress-info">
            <div class="progress-bar">
              <div 
                class="progress-bar-fill" 
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
            <div class="progress-details">
              <p v-if="progress.users">{{ t('sitemap.progress.users', { count: progress.users }) }}</p>
              <p v-if="progress.works">{{ t('sitemap.progress.works', { count: progress.works }) }}</p>
              <p v-if="progress.articles">{{ t('sitemap.progress.articles', { count: progress.articles }) }}</p>
              <p v-if="progress.urls">{{ t('sitemap.progress.urls', { count: progress.urls }) }}</p>
            </div>
          </div>
          <p v-if="error" class="error-message">
            {{ error }}
            <button @click="handleRetry" class="retry-button">
              {{ t('sitemap.retry') }}
            </button>
          </p>
          <p v-if="lastUpdate" class="update-time">
            {{ t('sitemap.lastUpdate') }}: {{ formatDate(lastUpdate) }}
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group">
          <button
            @click="handleUpdate"
            :disabled="loading"
            class="primary-button"
          >
            <span v-if="loading">{{ t('sitemap.updating') }}</span>
            <span v-else>{{ t('sitemap.update') }}</span>
          </button>
          <button
            @click="handleDownloadSitemap"
            class="secondary-button"
          >
            {{ t('sitemap.download') }}
          </button>
        </div>
      </div>

      <!-- 站点地图信息 -->
      <div class="info-card">
        <h2>
          <span class="info-icon">ℹ️</span>
          {{ t('sitemap.info.title') }}
        </h2>
        <div class="info-grid">
          <div class="info-item">
            <label>{{ t('sitemap.info.totalUrls') }}</label>
            <span class="info-value">{{ totalUrls }}</span>
          </div>
          <div class="info-item">
            <label>{{ t('sitemap.info.cacheTime') }}</label>
            <span class="info-value">1 {{ t('sitemap.info.hour') }}</span>
          </div>
          <div class="info-item languages">
            <label>{{ t('sitemap.info.languages') }}</label>
            <div class="language-tags">
              <span class="lang-tag">中文</span>
              <span class="lang-tag">English</span>
              <span class="lang-tag">Русский</span>
            </div>
          </div>
        </div>
      </div>
        </div>
            </div>
</template>

<script setup>
// 导入必要的依赖
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'

// 响应式状态
const { t } = useI18n()
const loading = ref(false)
const error = ref(null)
const progress = ref({
  users: 0,
  works: 0,
  articles: 0,
  urls: 0
})
const progressPercentage = ref(0)
const lastUpdate = ref(null)
const totalUrls = ref(0)

// 预计的总数量（用于计算进度）
const expectedTotals = {
  users: 100,
  works: 200,
  articles: 100
}

// 计算属性
const statusIcon = computed(() => {
  if (loading.value) return '⏳'
  if (error.value) return '❌'
  return '✅'
})

const statusMessage = computed(() => {
  if (loading.value) return t('sitemap.status.updating')
  if (error.value) return t('sitemap.status.failed')
  return t('sitemap.status.success')
})

const statusClass = computed(() => {
  if (loading.value) return 'status-updating'
  if (error.value) return 'status-error'
  return 'status-success'
})

// 更新进度函数
const updateProgress = (type, count) => {
  if (!progress.value[type]) {
    progress.value[type] = 0
  }
  progress.value[type] = count
  
  // 计算总进度
  const totalProgress = Object.entries(progress.value).reduce((sum, [key, value]) => {
    if (key in expectedTotals) {
      return sum + (value / expectedTotals[key]) * 100
    }
    return sum
  }, 0)
  
  // 计算平均进度（基于有预期总数的项目数量）
  const itemCount = Object.keys(expectedTotals).length
  progressPercentage.value = Math.min(Math.round(totalProgress / itemCount), 100)
}

// 获取作品和用户函数
const getAllWorksAndUserIds = async ({ skip = 0, limit = 100 } = {}) => {
  try {
    console.log('查询作品:', { skip, limit })
    const query = new AV.Query('Work')
    query.include('user')
    query.equalTo('status', 'completed')
    query.descending('createdAt')
    query.limit(limit)
    query.skip(skip)
    
    // 获取作品列表
    const works = await query.find()
  const userIds = new Set()
    
    // 提取用户ID
    works.forEach(work => {
      const user = work.get('user')
      if (user) {
        userIds.add(user.id)
      }
    })
    
    // 更新进度
    updateProgress('works', works.length)
    updateProgress('users', userIds.size)
  
  console.log('总共获取到', works.length, '个作品，', userIds.size, '个用户')
    return {
      works: works.map(work => ({
        id: work.id,
        title: work.get('title'),
        imageUrl: work.get('imageUrl'),
        audioUrl: work.get('audioUrl'),
        user: work.get('user')?.toJSON()
      })),
      users: Array.from(userIds)
    }
    } catch (error) {
    console.error('获取作品失败:', error)
      throw error
    }
  }
  
// 获取文章函数
const getAllArticles = async ({ skip = 0, limit = 100 } = {}) => {
  try {
    console.log('查询文章:', { skip, limit })
    const query = new AV.Query('Article')
    query.equalTo('status', 'published')
    query.include('author')
    query.descending('createdAt')
    query.limit(limit)
    query.skip(skip)
    
    // 获取文章列表
    const articles = await query.find()
    
    // 更新进度
    updateProgress('articles', articles.length)
    
    return {
      articles: articles.map(article => {
        // 将整个文章对象转换为普通的JavaScript对象
        const articleData = article.toJSON()
        return {
          id: articleData.objectId,
          title: articleData.title,
          slug: articleData.slug,
          coverImage: articleData.coverImage,
          author: articleData.author ? {
            id: articleData.author.objectId,
            username: articleData.author.username,
            avatar: articleData.author.avatar
          } : null
        }
      })
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    throw error
  }
}

// 添加静态页面路由配置
const staticPages = [
  'home',
  'create',
  'community',
  'pricing',
  'contact',
  'faq',
  'privacy',
  'terms',
  'disclaimer',
  'tutorial'
]

// 支持的语言列表
const supportedLanguages = ['zh', 'en', 'ru']

// 获取所有URL的函数
const getAllUrls = (worksData, articlesData) => {
  const urls = new Set()
  const baseUrl = 'https://photosong.com'

  // 添加静态页面URL
  staticPages.forEach(page => {
    supportedLanguages.forEach(lang => {
      urls.add(`${baseUrl}/${lang}/${page}`)
    })
  })

  // 添加作品页面URL
  if (worksData?.works) {
    worksData.works.forEach(work => {
      supportedLanguages.forEach(lang => {
        urls.add(`${baseUrl}/${lang}/work/${work.id}`)
      })
    })
  }

  // 添加用户主页URL
  if (worksData?.users) {
    worksData.users.forEach(userId => {
      supportedLanguages.forEach(lang => {
        urls.add(`${baseUrl}/${lang}/user/${userId}`)
      })
    })
  }

  // 添加文章页面URL
  if (articlesData?.articles) {
    articlesData.articles.forEach(article => {
      supportedLanguages.forEach(lang => {
        urls.add(`${baseUrl}/${lang}/article/${article.slug || article.id}`)
      })
    })
  }

  return Array.from(urls)
}

// 生成sitemap XML
const generateSitemapXml = (urls) => {
  const today = new Date().toISOString()
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  urls.forEach(url => {
    xml += '  <url>\n'
    xml += `    <loc>${url}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'
  })
  
  xml += '</urlset>'
  return xml
}

// 修改处理更新函数
const handleUpdate = async () => {
  if (loading.value) return
  
    loading.value = true
    error.value = null
  progress.value = {
    users: 0,
    works: 0,
    articles: 0,
    urls: 0
  }
  progressPercentage.value = 0
  
  try {
    // 获取所有数据
    const [worksData, articlesData] = await Promise.all([
      getAllWorksAndUserIds(),
      getAllArticles()
    ])
    
    // 生成所有URL
    const urls = getAllUrls(worksData, articlesData)
    
    // 更新URL计数
    progress.value.urls = urls.length
    totalUrls.value = urls.length
    
    // 生成sitemap XML
    const sitemapXml = generateSitemapXml(urls)
    
    // 保存sitemap到LeanCloud
    const SitemapStatus = AV.Object.extend('SitemapStatus')
    const status = new SitemapStatus()
    
    status.set('lastUpdate', new Date())
    status.set('totalUrls', urls.length)
    status.set('sitemapXml', sitemapXml)
    
    await status.save()
    lastUpdate.value = new Date()
    
    ElMessage.success(t('sitemap.status.success'))
  } catch (err) {
    console.error('站点地图更新失败:', err)
    error.value = err.message || t('sitemap.errors.updateFailed')
    ElMessage.error(t('sitemap.errors.updateFailed'))
  } finally {
    loading.value = false
  }
}

// 修改下载处理函数
const handleDownloadSitemap = async () => {
  try {
    const query = new AV.Query('SitemapStatus')
    const status = await query.first()
    
    if (!status) {
      ElMessage.warning(t('sitemap.errors.noSitemap'))
      return
    }
    
    const sitemapXml = status.get('sitemapXml')
    if (!sitemapXml) {
      ElMessage.warning(t('sitemap.errors.noSitemap'))
      return
    }
    
    // 创建Blob并下载
    const blob = new Blob([sitemapXml], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    ElMessage.success(t('sitemap.download.success'))
  } catch (err) {
    console.error('下载站点地图失败:', err)
    ElMessage.error(t('sitemap.download.failed'))
  }
}

// 处理重试
const handleRetry = () => {
  handleUpdate()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 组件挂载时获取初始数据
onMounted(async () => {
  try {
    // 获取上次更新时间
    const query = new AV.Query('SitemapStatus')
    const status = await query.first()
    if (status) {
      lastUpdate.value = status.get('lastUpdate')
      totalUrls.value = status.get('totalUrls') || 0
    }
  } catch (err) {
    console.error('获取站点地图状态失败:', err)
  }
})
</script>

<style scoped>
.sitemap-page {
  padding: 20px;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header .icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: var(--el-color-primary);
}

.header h1 {
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.header p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.status-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 32px;
  margin-bottom: 16px;
  text-align: center;
}

.status-content {
  text-align: center;
}

.status-message {
  font-size: 18px;
  margin-bottom: 16px;
}

.status-updating {
  color: var(--el-color-warning);
}

.status-error {
  color: var(--el-color-danger);
}

.status-success {
  color: var(--el-color-success);
}

.progress-info {
  margin: 20px 0;
}

.progress-bar {
  height: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.3s ease;
}

.progress-details {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.error-message {
  color: var(--el-color-danger);
  margin: 16px 0;
}

.retry-button {
  background: none;
  border: none;
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: underline;
  margin-left: 8px;
}

.update-time {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 16px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.primary-button,
.secondary-button {
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-button {
  background: var(--el-color-primary);
  color: white;
  border: none;
}

.primary-button:hover {
  background: var(--el-color-primary-light-3);
}

.primary-button:disabled {
  background: var(--el-color-primary-light-5);
  cursor: not-allowed;
}

.secondary-button {
  background: none;
  border: 1px solid var(--el-color-primary);
  color: var(--el-color-primary);
}

.secondary-button:hover {
  background: var(--el-color-primary-light-9);
}

.info-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-card h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  padding: 16px;
  background: var(--el-fill-color-blank);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.info-item label {
  display: block;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.info-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.language-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lang-tag {
  padding: 4px 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 4px;
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>