<template>
  <div class="pre-render-manager">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-4">{{ t('preRender.title') }}</h1>
        <p class="text-gray-600">{{ t('preRender.description') }}</p>
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">{{ t('preRender.stats.works') }}</h3>
          <p class="text-2xl font-bold">{{ stats.works }}</p>
          <p class="text-sm text-gray-500">{{ t('preRender.stats.lastUpdate') }}: {{ formatDate(stats.lastWorkUpdate) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">{{ t('preRender.stats.articles') }}</h3>
          <p class="text-2xl font-bold">{{ stats.articles }}</p>
          <p class="text-sm text-gray-500">{{ t('preRender.stats.lastUpdate') }}: {{ formatDate(stats.lastArticleUpdate) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">{{ t('preRender.stats.users') }}</h3>
          <p class="text-2xl font-bold">{{ stats.users }}</p>
          <p class="text-sm text-gray-500">{{ t('preRender.stats.lastUpdate') }}: {{ formatDate(stats.lastUserUpdate) }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-wrap gap-4 mb-8">
        <button
          @click="handleGenerateAll"
          :disabled="isGenerating"
          class="btn-primary"
        >
          <span v-if="!isGenerating">{{ t('preRender.actions.generateAll') }}</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t('preRender.actions.generating') }}
          </span>
        </button>
        <button
          @click="handleTestCrawler"
          :disabled="isGenerating"
          class="btn-secondary"
        >
          {{ t('preRender.actions.testCrawler') }}
        </button>
        <button
          @click="handleClearCache"
          :disabled="isGenerating"
          class="btn-danger"
        >
          {{ t('preRender.actions.clearCache') }}
        </button>
      </div>

      <!-- 生成进度 -->
      <div v-if="isGenerating" class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-lg font-semibold mb-4">{{ t('preRender.progress.title') }}</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between mb-1">
              <span>{{ t('preRender.progress.overall') }}</span>
              <span>{{ Math.round(progress.overall) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${progress.overall}%` }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between mb-1">
              <span>{{ t('preRender.progress.works') }}</span>
              <span>{{ progress.works.current }}/{{ progress.works.total }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-green-600 h-2.5 rounded-full" :style="{ width: `${(progress.works.current / progress.works.total) * 100}%` }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between mb-1">
              <span>{{ t('preRender.progress.articles') }}</span>
              <span>{{ progress.articles.current }}/{{ progress.articles.total }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-yellow-600 h-2.5 rounded-full" :style="{ width: `${(progress.articles.current / progress.articles.total) * 100}%` }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between mb-1">
              <span>{{ t('preRender.progress.users') }}</span>
              <span>{{ progress.users.current }}/{{ progress.users.total }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-purple-600 h-2.5 rounded-full" :style="{ width: `${(progress.users.current / progress.users.total) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近生成的页面列表 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">{{ t('preRender.recentPages.title') }}</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('preRender.recentPages.type') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('preRender.recentPages.url') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('preRender.recentPages.generatedAt') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('preRender.recentPages.status') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ t('preRender.recentPages.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="page in recentPages" :key="page.url">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getTypeClass(page.type)">{{ page.type }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <a :href="page.url" target="_blank" class="text-blue-600 hover:text-blue-800">
                      {{ page.url }}
                    </a>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ formatDate(page.generatedAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getStatusClass(page.status)">
                      {{ page.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button
                      @click="handleRegeneratePage(page)"
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      {{ t('preRender.recentPages.regenerate') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AV from 'leancloud-storage'
import { generatePreRenderedPage, getPreRenderStats, clearPreRenderCache } from '../utils/prerender'
import dayjs from 'dayjs'

const { t } = useI18n()

// 状态
const isGenerating = ref(false)
const stats = ref({
  works: 0,
  articles: 0,
  users: 0,
  lastWorkUpdate: null,
  lastArticleUpdate: null,
  lastUserUpdate: null
})
const progress = ref({
  overall: 0,
  works: { current: 0, total: 0 },
  articles: { current: 0, total: 0 },
  users: { current: 0, total: 0 }
})
const recentPages = ref([])

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取类型样式
const getTypeClass = (type) => {
  const classes = {
    work: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    article: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    user: 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800'
  }
  return classes[type] || ''
}

// 获取状态样式
const getStatusClass = (status) => {
  const classes = {
    success: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    pending: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    failed: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  }
  return classes[status] || ''
}

// 生成所有页面
const handleGenerateAll = async () => {
  try {
    isGenerating.value = true
    progress.value = {
      overall: 0,
      works: { current: 0, total: 0 },
      articles: { current: 0, total: 0 },
      users: { current: 0, total: 0 }
    }

    // 获取所有需要生成的页面
    const [works, articles, users] = await Promise.all([
      new AV.Query('Work').find(),
      new AV.Query('Article').find(),
      new AV.Query('_User')
        .equalTo('isPublic', true)
        .find({ useMasterKey: true })
    ])

    // 设置总数
    progress.value.works.total = works.length
    progress.value.articles.total = articles.length
    progress.value.users.total = users.length

    // 生成作品页面
    for (const work of works) {
      await generatePreRenderedPage('work', work)
      progress.value.works.current++
      updateOverallProgress()
    }

    // 生成文章页面
    for (const article of articles) {
      await generatePreRenderedPage('article', article)
      progress.value.articles.current++
      updateOverallProgress()
    }

    // 生成用户页面
    for (const user of users) {
      await generatePreRenderedPage('user', user)
      progress.value.users.current++
      updateOverallProgress()
    }

    // 更新统计信息
    await loadStats()
    ElMessage.success(t('preRender.messages.generateSuccess'))
  } catch (error) {
    console.error('Generate all pages failed:', error)
    ElMessage.error(t('preRender.messages.generateError'))
  } finally {
    isGenerating.value = false
  }
}

// 更新总体进度
const updateOverallProgress = () => {
  const { works, articles, users } = progress.value
  const totalProgress = (
    (works.current / works.total) +
    (articles.current / articles.total) +
    (users.current / users.total)
  ) * 100 / 3
  progress.value.overall = Math.min(totalProgress, 100)
}

// 测试爬虫
const handleTestCrawler = async () => {
  try {
    // 随机选择一个页面进行测试
    const randomPage = recentPages.value[Math.floor(Math.random() * recentPages.value.length)]
    if (!randomPage) {
      ElMessage.warning(t('preRender.messages.noPages'))
      return
    }

    const response = await fetch(randomPage.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    })
    const html = await response.text()

    if (html.includes('data-pre-rendered="true"')) {
      ElMessage.success(t('preRender.messages.testSuccess'))
    } else {
      ElMessage.warning(t('preRender.messages.testWarning'))
    }
  } catch (error) {
    console.error('Test crawler failed:', error)
    ElMessage.error(t('preRender.messages.testError'))
  }
}

// 清除缓存
const handleClearCache = async () => {
  try {
    await clearPreRenderCache()
    await loadStats()
    ElMessage.success(t('preRender.messages.clearSuccess'))
  } catch (error) {
    console.error('Clear cache failed:', error)
    ElMessage.error(t('preRender.messages.clearError'))
  }
}

// 重新生成单个页面
const handleRegeneratePage = async (page) => {
  try {
    const query = new AV.Query(page.type === 'work' ? 'Work' : page.type === 'article' ? 'Article' : '_User')
    const object = await query.get(page.id)
    await generatePreRenderedPage(page.type, object)
    await loadRecentPages()
    ElMessage.success(t('preRender.messages.regenerateSuccess'))
  } catch (error) {
    console.error('Regenerate page failed:', error)
    ElMessage.error(t('preRender.messages.regenerateError'))
  }
}

// 加载统计信息
const loadStats = async () => {
  try {
    stats.value = await getPreRenderStats()
  } catch (error) {
    console.error('Load stats failed:', error)
  }
}

// 加载最近生成的页面
const loadRecentPages = async () => {
  try {
    const query = new AV.Query('PreRenderedPage')
    query.descending('createdAt')
    query.limit(10)
    const pages = await query.find()
    recentPages.value = pages.map(page => ({
      id: page.id,
      type: page.get('type'),
      url: page.get('url'),
      generatedAt: page.get('createdAt'),
      status: page.get('status')
    }))
  } catch (error) {
    console.error('Load recent pages failed:', error)
  }
}

// 初始化
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRecentPages()
  ])
})
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-danger {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style> 