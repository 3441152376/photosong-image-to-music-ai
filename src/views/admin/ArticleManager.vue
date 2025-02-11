<script setup>
import { ref, onMounted, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import Article, { ArticleCategory, ArticleStatus } from '@/models/Article'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import OpenAI from '@/utils/openai'
import AV from 'leancloud-storage'
import Editor from '@/components/Editor.vue'
import { 
  Edit,
  Document,
  Promotion,
  Plus,
  Search,
  More,
  View,
  Files,
  Delete,
  Cpu,
  Picture,
  ArrowDown
} from '@element-plus/icons-vue'
import ArticleEnhance from '@/components/ArticleEnhance.vue'
import ArticleRewrite from '@/components/ArticleRewrite.vue'

const { t } = useI18n()
const userStore = useUserStore()
const router = useRouter()

// 获取分类标签类型
const getCategoryType = (category) => {
  const types = {
    [ArticleCategory.KNOWLEDGE]: 'success',
    [ArticleCategory.NEWS]: 'warning',
    [ArticleCategory.AI_MUSIC]: 'primary'
  }
  return types[category] || 'info'
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    [ArticleStatus.DRAFT]: 'info',
    [ArticleStatus.PUBLISHED]: 'success',
    [ArticleStatus.ARCHIVED]: 'warning'
  }
  return types[status] || 'info'
}

// 添加权限检查方法
const hasPermission = (permission) => {
  return userStore.currentUser?.permissions?.includes(permission) || userStore.currentUser?.isAdmin
}

// 状态变量
const currentArticle = ref(null)
const articles = ref([])
const loading = ref(false)
const showPreview = ref(false)
const showEnhanceDialog = ref(false)
const showRewriteDialog = ref(false)
const isEditing = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 筛选
const filterCategory = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

// 预设封面数据
const defaultCovers = [
  {
    id: 1,
    url: '/images/covers/tech-1.jpg',
    name: '科技封面 1',
    category: 'technology',
    description: '蓝色科技风格，适合技术文章'
  },
  {
    id: 2,
    url: '/images/covers/tech-2.jpg',
    name: '科技封面 2',
    category: 'technology',
    description: '紫色科技风格，适合AI相关文章'
  },
  {
    id: 3,
    url: '/images/covers/music-1.jpg',
    name: '音乐封面 1',
    category: 'music',
    description: '优雅的音乐主题，适合乐理文章'
  },
  {
    id: 4,
    url: '/images/covers/music-2.jpg',
    name: '音乐封面 2',
    category: 'music',
    description: '动感的音乐主题，适合演奏技巧文章'
  },
  {
    id: 5,
    url: '/images/covers/gradient-1.jpg',
    name: '渐变封面 1',
    category: 'gradient',
    description: '蓝紫渐变，适合专业文章'
  },
  {
    id: 6,
    url: '/images/covers/gradient-2.jpg',
    name: '渐变封面 2',
    category: 'gradient',
    description: '红橙渐变，适合热门话题'
  },
  {
    id: 7,
    url: '/images/covers/abstract-1.jpg',
    name: '抽象封面 1',
    category: 'abstract',
    description: '几何抽象，适合理论文章'
  },
  {
    id: 8,
    url: '/images/covers/abstract-2.jpg',
    name: '抽象封面 2',
    category: 'abstract',
    description: '艺术抽象，适合创意文章'
  }
]

// AI 生成配置
const aiGenerating = ref(false)
const showGenerateDialog = ref(false)
const generateConfig = ref({
  strategy: 'professional',
  customIndustry: '',
  keywords: '',
  tone: 'professional',
  length: 'medium',
  language: 'chinese',
  autoKeywords: true,
  keywordCount: 5,
  useTitle: true,
  useSummary: true,
  batchGenerate: false,
  batchCount: 1,
  seoOptimize: true,
  generateMeta: true,
  structuredData: true,
  targetKeywords: '',
  competitorAnalysis: false,
  autoInternalLinks: true,
  mediaGeneration: false,
  generateImage: false,
  imageStyle: 'photo',
  imagePrompt: '',
  draftSaving: false,
  draftInterval: 30,
  editAfterGeneration: true,
  coverImage: {
    enabled: true,
    selectedCover: defaultCovers[0],
    useAIGenerated: false
  }
})

// 文章语言选项
const languageOptions = {
  chinese: '中文',
  english: '英文',
  russian: '俄语',
  japanese: '日语',
  korean: '韩语',
  spanish: '西班牙语',
  french: '法语',
  german: '德语',
  italian: '意大利语',
  portuguese: '葡萄牙语',
  dutch: '荷兰语',
  arabic: '阿拉伯语',
  hindi: '印地语',
  turkish: '土耳其语'
}

// 更新文章语气选项
const toneOptions = {
  professional: '专业严谨',
  casual: '轻松随意',
  humorous: '幽默风趣',
  formal: '正式商务',
  storytelling: '故事叙述',
  persuasive: '说服力强'
}

// 更新文章长度选项
const lengthOptions = {
  short: '短文 (1000字左右)',
  medium: '中等 (2000字左右)',
  long: '长文 (3000字左右)',
  extensive: '详细 (4000字左右)',
  comprehensive: '全面 (5000字以上)'
}

// 更新生成策略选项
const generationStrategies = {
  professional: {
    label: '专业文章',
    prompt: '生成一篇深度专业的文章，重点关注行业趋势、技术分析和实践经验。使用专业术语和数据支持观点，提供实际案例分析。注重内容的可操作性和实用价值。'
  },
  tutorial: {
    label: '教程指南',
    prompt: '生成一篇实用的操作指南，重点关注步骤说明和实践技巧。使用清晰的示例和图示，提供常见问题解决方案。确保内容循序渐进，易于理解和操作。'
  },
  news: {
    label: '新闻资讯',
    prompt: '生成一篇新闻报道风格的文章，重点关注最新动态和行业趋势。使用客观的叙述方式，引用可靠数据和专家观点。注重时效性和信息价值。'
  },
  blog: {
    label: '博客文章',
    prompt: '生成一篇富有洞察力的博客文章，重点分享经验和见解。结合实际案例和数据分析，提供独特的观点和建议。保持专业性的同时增加内容的趣味性。'
  },
  review: {
    label: '评测文章',
    prompt: '生成一篇深入的评测分析，重点关注性能表现和用户体验。使用数据和实测结果支持评价，提供详细的对比分析。注重客观性和实用建议。'
  },
  analysis: {
    label: '分析报告',
    prompt: '生成一篇专业的分析报告，重点关注市场趋势和战略建议。使用数据分析和案例研究，提供actionable的洞察。注重报告的逻辑性和专业深度。'
  },
  music_tutorial: {
    label: '音乐教程',
    prompt: '生成一篇专业的音乐教学内容，重点关注技巧提升和练习方法。使用专业的音乐术语，配合图示和示例，提供循序渐进的学习建议。'
  },
  music_knowledge: {
    label: '音乐知识',
    prompt: '生成一篇音乐知识科普文章，重点关注乐理知识和音乐欣赏。使用通俗易懂的语言解释专业概念，配合实例说明。注重知识的系统性和趣味性。'
  },
  instrument: {
    label: '乐器知识',
    prompt: '生成一篇关于乐器的专业文章，重点关注乐器特点和演奏技巧。使用专业术语配合图示说明，提供实用的练习和保养建议。'
  },
  site_info: {
    label: '网站相关',
    prompt: '生成一篇关于在网站实现音乐乐器功能和使用开发指南的文章，重点关注实用性和操作说明。使用清晰的步骤说明和截图示例，提供具体的使用技巧和建议。'
  },
  custom: {
    label: '自定义行业',
    prompt: '根据指定的行业主题生成专业文章，确保内容的专业性和实用价值。使用该行业的专业术语和最新趋势，提供实践经验和案例分析。'
  }
}

// 更新 AudioContext 初始化
let audioContext = null

const initAudioContext = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error)
  }
}

// 在 script setup 部分添加新的响应式变量
const streamContent = ref('')
const showStreamDialog = ref(false)
const isStreaming = ref(false)
const streamProgress = ref(0)

// 在 generateArticle 函数之前添加新的辅助函数
const appendWithTypewriterEffect = async (text) => {
  const words = text.split('')
  for (const word of words) {
    streamContent.value += word
    await new Promise(resolve => setTimeout(resolve, 10)) // 控制打字速度
  }
}

// 初始化
onMounted(async () => {
  try {
    // 先刷新用户信息
    await userStore.fetchCurrentUser()
    
    if (!userStore.currentUser?.isAdmin) {
    ElMessage.error(t('errors.unauthorized'))
      router.push('/')
    return
  }
  await loadArticles()
    
    // 添加用户交互事件监听
    document.addEventListener('click', initAudioContext, { once: true })
  } catch (error) {
    console.error('Failed to initialize ArticleManager:', error)
    ElMessage.error(t('errors.unauthorized'))
    router.push('/')
  }
})

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const query = new AV.Query('Article')
    
    if (filterCategory.value) {
      query.equalTo('category', filterCategory.value)
    }
    if (filterStatus.value) {
      query.equalTo('status', filterStatus.value)
    }
    if (searchKeyword.value) {
      query.matches('title', new RegExp(searchKeyword.value, 'i'))
    }
    
    query.descending('updatedAt')
    query.limit(pageSize.value)
    query.skip((currentPage.value - 1) * pageSize.value)
    
    const [results, count] = await Promise.all([
      query.find(),
      query.count()
    ])
    
    articles.value = results
    total.value = count
  } catch (error) {
    console.error('Failed to load articles:', error)
    ElMessage.error(t('errors.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 创建新文章
const createArticle = () => {
  const article = new Article()
  article.set('title', '')
  article.set('content', '')
  article.set('category', ArticleCategory.KNOWLEDGE)
  article.set('status', ArticleStatus.DRAFT)
  article.set('author', userStore.currentUser)
  article.set('language', 'zh')
  article.set('tags', [])
  article.set('keywords', [])
  article.set('coverImage', defaultCovers[0].url) // 设置默认封面
  
  currentArticle.value = article
  selectedCover.value = defaultCovers[0] // 更新选中的封面
  isEditing.value = true
}

// 编辑文章
const editArticle = (article) => {
  currentArticle.value = article
  isEditing.value = true
}

// 预览文章
const previewArticle = (article) => {
  currentArticle.value = article
  showPreview.value = true
}

// 保存文章时获取编辑器内容
const saveArticle = async () => {
  try {
    if (!currentArticle.value) {
      throw new Error('No article to save');
    }
    
    // 生成 slug
    if (!currentArticle.value.slug) {
      // 先保存文章以获取 ID
      await currentArticle.value.save();
      
      // 使用文章 ID 作为 slug
      if (currentArticle.value.id) {
        currentArticle.value.slug = currentArticle.value.id;
        await currentArticle.value.save();
      } else {
        throw new Error('Failed to generate article ID');
      }
    }
    
    // 确保有封面图片
    if (!currentArticle.value.coverImage) {
      currentArticle.value.coverImage = defaultCovers[0].url;
    }
    
    // 确保标签是数组
    if (!Array.isArray(currentArticle.value.tags)) {
      currentArticle.value.tags = [];
    }
    
    // 生成关键词建议
    if (!currentArticle.value.keywords || currentArticle.value.keywords.length === 0) {
      try {
        const suggestedKeywords = await currentArticle.value.generateKeywords();
        if (suggestedKeywords && Array.isArray(suggestedKeywords)) {
          currentArticle.value.keywords = suggestedKeywords;
        }
      } catch (keywordError) {
        console.warn('Failed to generate keywords:', keywordError);
        currentArticle.value.keywords = [];
      }
    }
    
    // 计算阅读时间
    if (currentArticle.value.content) {
      const wordCount = currentArticle.value.content.trim().split(/\s+/).length;
      currentArticle.value.readTime = Math.ceil(wordCount / 200); // 假设200字/分钟
    } else {
      currentArticle.value.readTime = 1; // 默认阅读时间
    }
    
    // 确保必要字段存在
    if (!currentArticle.value.title) {
      throw new Error(t('articles.errors.titleRequired'));
    }
    
    await currentArticle.value.save();
    
    ElMessage.success(t('articles.saveSuccess'));
    isEditing.value = false;
    await loadArticles();
  } catch (error) {
    console.error('Failed to save article:', error);
    ElMessage.error(error.message || t('articles.errors.saveFailed'));
  }
}

// 发布文章
const validateArticle = (article) => {
  if (!article.get('title')) {
    ElMessage.error(t('articles.errors.titleRequired'))
    return false
  }
  
  if (!article.get('content')) {
    ElMessage.error(t('articles.errors.contentRequired'))
    return false
  }
  
  if (!article.get('category')) {
    ElMessage.error(t('articles.errors.categoryRequired'))
    return false
  }
  
  if (!article.get('summary')) {
    ElMessage.error(t('articles.errors.summaryRequired'))
    return false
  }

  // 确保有标签
  if (!article.get('tags') || article.get('tags').length === 0) {
    ElMessage.error(t('articles.errors.tagsRequired'))
    return false
  }

  // 确保有关键词
  if (!article.get('keywords') || article.get('keywords').length === 0) {
    ElMessage.error(t('articles.errors.keywordsRequired'))
    return false
  }

  return true
}

const handlePublish = async () => {
  if (!validateArticle(currentArticle.value)) {
    return
  }

  try {
    loading.value = true
    
    // 设置发布状态和时间
    currentArticle.value.set('status', 'published')
    currentArticle.value.set('publishedAt', new Date())
    
    // 如果没有设置 slug，根据标题生成
    if (!currentArticle.value.get('slug')) {
      const slug = generateSlug(currentArticle.value.get('title'))
      currentArticle.value.set('slug', slug)
    }
    
    // 如果没有设置阅读时间，计算一个
    if (!currentArticle.value.get('readTime')) {
      const readTime = calculateReadTime(currentArticle.value.get('content'))
      currentArticle.value.set('readTime', readTime)
    }
    
    await currentArticle.value.save()
    ElMessage.success(t('articles.publishSuccess'))
    await loadArticles()
  } catch (error) {
      console.error('Failed to publish article:', error)
    ElMessage.error(t('articles.errors.publishFailed'))
  } finally {
    loading.value = false
  }
}

// 归档文章
const archiveArticle = async (article) => {
  try {
    await ElMessageBox.confirm(t('articles.confirmArchive'))
    
    article.status = ArticleStatus.ARCHIVED
    await article.save()
    
    ElMessage.success(t('articles.archiveSuccess'))
    await loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to archive article:', error)
      ElMessage.error(t('errors.archiveFailed'))
    }
  }
}

// 删除文章
const deleteArticle = async (article) => {
  try {
    await ElMessageBox.confirm(t('articles.confirmDelete'))
    
    await article.destroy()
    
    ElMessage.success(t('articles.deleteSuccess'))
    await loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete article:', error)
      ElMessage.error(t('errors.deleteFailed'))
    }
  }
}

// AI generation functions
const generateContent = async () => {
  // Implementation of generateContent function
}

const optimizeContent = async () => {
  // Implementation of optimizeContent function
}

const generateSummary = async () => {
  // Implementation of generateSummary function
}

// 封面图片上传前的验证
const beforeCoverUpload = (file) => {
  const isValidFormat = ['image/jpeg', 'image/png'].includes(file.type)
  const isValidSize = file.size / 1024 / 1024 < 5

  if (!isValidFormat) {
    ElMessage.error(t('articles.imageUpload.invalidFormat'))
    return false
  }
  if (!isValidSize) {
    ElMessage.error(t('articles.imageUpload.invalidSize'))
    return false
  }

  return true
}

// 上传图片函数
const uploadImage = async (file) => {
  try {
    // 使用 LeanCloud 上传图片
    const avFile = new AV.File(file.name, file)
    const savedFile = await avFile.save()
    return savedFile.url()
  } catch (error) {
    console.error('Image upload failed:', error)
    throw new Error(t('articles.imageUpload.error'))
  }
}

// 上传封面图片
const uploadCover = async ({ file }) => {
  try {
    const url = await uploadImage(file)
    currentArticle.value.coverImage = url
    ElMessage.success(t('articles.imageUpload.success'))
  } catch (error) {
    console.error('Failed to upload cover:', error)
    ElMessage.error(error.message || t('articles.imageUpload.error'))
  }
}

// 打开生成对话框
const openGenerateDialog = () => {
  showGenerateDialog.value = true
  generateConfig.value = {
    strategy: 'professional',
    keywords: '',
    tone: 'professional',
    length: 'medium',
    language: 'chinese',
    autoKeywords: true,
    keywordCount: 5,
    useTitle: true,
    useSummary: true,
    batchGenerate: false,
    batchCount: 1,
    seoOptimize: true,
    generateMeta: true,
    structuredData: true,
    targetKeywords: '',
    competitorAnalysis: false,
    autoInternalLinks: true,
    mediaGeneration: false,
    generateImage: false,
    imageStyle: 'photo',
    imagePrompt: '',
    draftSaving: false,
    draftInterval: 30,
    editAfterGeneration: true,
    coverImage: {
      enabled: true,
      selectedCover: defaultCovers[0],
      useAIGenerated: false
    }
  }
}

// 替换原有的 generateArticle 函数
const generateArticle = async () => {
  if (!generateConfig.value.keywords && !generateConfig.value.autoKeywords) {
    ElMessage.warning(t('articles.keywordsRequired'))
    return
  }

  aiGenerating.value = true
  isStreaming.value = true
  streamContent.value = ''
  showStreamDialog.value = true
  
  try {
    const strategy = generationStrategies[generateConfig.value.strategy]
    const seoPrompt = generateConfig.value.seoOptimize ? `
      要求：
      1. 文章结构完整，包含标题、引言、正文（多个主要章节）和总结
      2. 内容专业准确，观点明确，数据支持
      3. 使用 Markdown 格式
      4. ${strategy.prompt}
      5. 标题要求：
         - 使用一级标题格式：# 标题
         - 标题要简洁有力，突出主题
         - 避免使用技术术语和行业黑话
         - 使用吸引人的动词和形容词，但不要过度营销
         - 标题长度控制在15-25个字之间
      6. 内容要求：
         - 每个主要章节使用二级标题，子章节使用三级标题
         - 重要内容使用加粗或列表格式
         - 适当添加代码示例、表格或引用
         - 使用专业术语并配合图示说明
         - 你需要在文章中添加图片，图片可以是设计的 SVG 图片或从网络获取的图片
      7. 写作风格：
         - 使用专业、权威的语气
         - 避免过度口语化表达
         - 保持客观中立的立场
         - 使用数据和案例支持观点
         - 适当引用权威来源
      8. 确保生成内容的原创性和独特性
      9. 针对目标读者优化专业术语使用
    ` : ''

    const prompt = `
      请基于以下配置生成一篇文章：
      - 关键词：${generateConfig.value.keywords }
      - 文章类型：${strategy.label}
      - 语言：${languageOptions[generateConfig.value.language]}
      - 语气风格：${toneOptions[generateConfig.value.tone]}
      - 文章长度：${lengthOptions[generateConfig.value.length]}
      
      要求：
      1. 文章结构完整，包含标题、引言、正文（多个主要章节）和总结
      2. 内容专业准确，观点明确，数据支持
      3. 使用 Markdown 格式
      4. ${strategy.prompt}
      5. 标题要求：
         - 使用一级标题格式：# 标题
         - 标题要简洁有力，突出主题
         - 避免使用技术术语和行业黑话
         - 使用吸引人的动词和形容词，但不要过度营销
         - 标题长度控制在15-25个字之间
      6. 内容要求：
         - 每个主要章节使用二级标题，子章节使用三级标题
         - 重要内容使用加粗或列表格式
         - 适当添加代码示例、表格或引用
         - 使用专业术语并配合图示说明
         - 你需要在文章中添加图片，图片可以是设计的 SVG 图片或从网络获取的图片
      7. 写作风格：
         - 使用专业、权威的语气
         - 避免过度口语化表达
         - 保持客观中立的立场
         - 使用数据和案例支持观点
         - 适当引用权威来源
      8. 确保生成内容的原创性和独特性
      9. 针对目标读者优化专业术语使用
      ${seoPrompt}
    `

    // 处理批量生成
    if (generateConfig.value.batchGenerate) {
      const articles = []
      for (let i = 0; i < generateConfig.value.batchCount; i++) {
        streamProgress.value = (i / generateConfig.value.batchCount) * 100
        
        const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey.value}`
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [{
              role: "user",
              content: prompt
            }],
            temperature: 0.7,
            max_tokens: 4000,
            stream: true
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('OpenAI API error:', errorData)
          throw new Error('生成文章失败')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let articleContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const json = JSON.parse(data)
                if (json.choices && json.choices[0] && json.choices[0].delta) {
                  const content = json.choices[0].delta.content || ''
                  if (content) {
                    articleContent += content
                    await appendWithTypewriterEffect(content)
                  }
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e)
                continue
              }
            }
          }
        }
        
        articles.push(articleContent)
      }
      
      // 批量创建文章
      for (const content of articles) {
        await createArticleFromContent(content)
      }
    } else {
      const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiApiKey.value}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "user",
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('OpenAI API error:', errorData)
        throw new Error('生成文章失败')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let articleContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const json = JSON.parse(data)
              if (json.choices && json.choices[0] && json.choices[0].delta) {
                const content = json.choices[0].delta.content || ''
                if (content) {
                  articleContent += content
                  await appendWithTypewriterEffect(content)
                }
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e)
              continue
            }
          }
        }
      }

      const article = await createArticleFromContent(articleContent)
      if (article) {
        currentArticle.value = article
      }
    }

    showGenerateDialog.value = false
    isEditing.value = true
    ElMessage.success(t('articles.generationSuccess'))
  } catch (error) {
    console.error('Failed to generate article:', error)
    ElMessage.error(error.message || t('articles.generationFailed'))
  } finally {
    aiGenerating.value = false
    isStreaming.value = false
    streamProgress.value = 100
    // 等待用户查看生成的内容
    await new Promise(resolve => setTimeout(resolve, 2000))
    showStreamDialog.value = false
  }
}

// 新增：从生成内容创建文章的辅助函数
const createArticleFromContent = async (content) => {
  try {
    // 创建新文章
    const article = new Article()
    
    // 解析标题（必需）
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (!titleMatch) {
      throw new Error(t('articles.errors.titleRequired'))
    }
    article.set('title', titleMatch[1])
    
    // 设置内容（必需）
    article.set('content', content)
    
    // 设置分类（必需）
    article.set('category', generateConfig.value.strategy)
    
    // 设置封面图片
    if (generateConfig.value.coverImage.enabled) {
      if (generateConfig.value.coverImage.useAIGenerated && generateConfig.value.generateImage) {
        try {
          await article.generateCoverImage()
        } catch (imageError) {
          console.error('Failed to generate cover image:', imageError)
          // 如果AI生成失败，使用选中的预设封面
          article.set('coverImage', generateConfig.value.coverImage.selectedCover.url)
        }
      } else {
        // 使用选中的预设封面
        article.set('coverImage', generateConfig.value.coverImage.selectedCover.url)
      }
    } else {
      // 默认使用第一个封面
      article.set('coverImage', defaultCovers[0].url)
    }
    
    // 生成摘要（自动获取前100字或AI生成）
    const summary = await article.generateSummary()
    if (!summary) {
      throw new Error(t('articles.errors.summaryRequired'))
    }
    
    // 生成标签（使用AI生成）
    const tags = await article.generateTags()
    if (!tags || tags.length === 0) {
      throw new Error(t('articles.errors.tagsRequired'))
    }
    
    // 生成关键词（必需）
    let keywords = []
    if (generateConfig.value.autoKeywords) {
      keywords = await generateKeywords(content)
    } else {
      keywords = generateConfig.value.keywords.split(/[,，\s]+/).filter(Boolean)
    }
    if (!keywords || keywords.length === 0) {
      throw new Error(t('articles.errors.keywordsRequired'))
    }
    article.set('keywords', keywords)
    
    // 设置作者（必需）
    article.set('author', userStore.currentUser)
    
    // 设置状态为草稿
    article.set('status', ArticleStatus.DRAFT)
    
    // 计算阅读时间
    const readTime = calculateReadTime(content)
    article.set('readTime', readTime)
    
    // 生成 slug
    const slug = generateSlug(titleMatch[1])
    article.set('slug', slug)
    
    // 如果启用了SEO优化，生成额外的SEO相关字段
    if (generateConfig.value.seoOptimize) {
      const [metaTitle, metaDescription] = await Promise.all([
        generateSEOTitle(content),
        generateSEODescription(content)
      ])
      
      article.set('metaTitle', metaTitle)
      article.set('metaDescription', metaDescription)
      
      if (generateConfig.value.structuredData) {
        const structuredData = await generateStructuredData(article)
        if (structuredData) {
          article.set('structuredData', structuredData)
        }
      }
    }
    
    // 保存文章以获取 ID
    await article.save()
    
    // 如果启用了图片生成
    if (generateConfig.value.generateImage) {
      try {
        await article.generateCoverImage()
      } catch (imageError) {
        console.error('Failed to generate cover image:', imageError)
        ElMessage.warning(t('articles.imageGeneration.failed'))
      }
    }
    
    // 如果配置为直接发布
    if (!generateConfig.value.editAfterGeneration) {
      if (!validateArticle(article)) {
        throw new Error(t('articles.errors.validationFailed'))
      }
      article.set('status', ArticleStatus.PUBLISHED)
      article.set('publishedAt', new Date())
      await article.save()
    }
    
    ElMessage.success(t('articles.generationSuccess'))
    return article
  } catch (error) {
    console.error('Failed to create article:', error)
    ElMessage.error(error.message || t('articles.errors.creationFailed'))
    throw error
  }
}

// 添加辅助函数
const calculateReadTime = (content) => {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / 200) // 假设阅读速度为每分钟200字
}

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// 在 generateArticle 函数之前添加这些辅助函数
const generateArticleSummary = async (content) => {
  try {
    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey.value}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: `请为以下文章生成一个简短的摘要（100-200字）：\n\n${content}`
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error('生成摘要失败')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return ''
  }
}

const generateKeywords = async (content) => {
  try {
    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey.value}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: `请为以下文章提取${generateConfig.value.keywordCount}个关键词（以数组形式返回）：\n\n${content}`
        }],
        temperature: 0.7,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      throw new Error('生成关键词失败')
    }

    const data = await response.json()
    const keywordsText = data.choices[0].message.content.trim()
    // 尝试解析返回的文本为数组
    try {
      return JSON.parse(keywordsText)
    } catch {
      // 如果解析失败，按逗号分隔
      return keywordsText.split(/[,，、]/).map(k => k.trim()).filter(Boolean)
    }
  } catch (error) {
    console.error('Failed to generate keywords:', error)
    return []
  }
}

const generateSEOTitle = async (content) => {
  try {
    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey.value}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: `请为以下文章生成一个SEO优化的标题（50-60字以内）：\n\n${content}`
        }],
        temperature: 0.7,
        max_tokens: 100
      })
    })

    if (!response.ok) {
      throw new Error('生成SEO标题失败')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Failed to generate SEO title:', error)
    return ''
  }
}

const generateSEODescription = async (content) => {
  try {
    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey.value}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: `请为以下文章生成一个SEO优化的Meta描述（150-160字）：\n\n${content}`
        }],
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error('生成Meta描述失败')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Failed to generate SEO description:', error)
    return ''
  }
}

const generateStructuredData = async (article) => {
  try {
    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey.value}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: '你是一个结构化数据专家。请生成符合 Schema.org 规范的 Article 类型 JSON-LD 数据。确保输出是有效的 JSON 格式。'
        }, {
          role: 'user',
          content: `请为以下文章生成 Schema.org Article 结构化数据，要求：
1. 使用 JSON-LD 格式
2. 包含所有必要的 Article 属性
3. 确保生成的是有效的 JSON 格式
4. 使用 @context 和 @type 属性

文章信息：
标题：${article.title}
作者：${article.author?.username || 'Anonymous'}
发布时间：${article.publishedAt?.toISOString() || new Date().toISOString()}
修改时间：${article.updatedAt?.toISOString() || new Date().toISOString()}
描述：${article.summary || ''}
关键词：${(article.keywords || []).join(', ')}
图片：${article.coverImage || ''}`
        }],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate structured data')
    }

    const data = await response.json()
    const structuredDataText = data.choices[0].message.content.trim()
    
    // 尝试解析返回的 JSON 字符串
    try {
      // 移除可能的 Markdown 代码块标记
      const jsonString = structuredDataText.replace(/```json\n?|\n?```/g, '').trim()
      const parsedData = JSON.parse(jsonString)
      
      // 验证必要的字段
      if (!parsedData['@context'] || !parsedData['@type']) {
        throw new Error('Invalid Schema.org format')
      }
      
      return parsedData
    } catch (parseError) {
      console.error('Invalid JSON format:', parseError)
      // 如果解析失败，返回基本的结构化数据
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.title,
        'author': {
          '@type': 'Person',
          'name': article.author?.username || 'Anonymous'
        },
        'datePublished': article.publishedAt?.toISOString() || new Date().toISOString(),
        'dateModified': article.updatedAt?.toISOString() || new Date().toISOString(),
        'description': article.summary || '',
        'keywords': (article.keywords || []).join(', '),
        'image': article.coverImage || ''
      }
    }
  } catch (error) {
    console.error('Failed to generate structured data:', error)
    // 返回基本的结构化数据
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.title,
      'author': {
        '@type': 'Person',
        'name': article.author?.username || 'Anonymous'
      },
      'datePublished': article.publishedAt?.toISOString() || new Date().toISOString(),
      'dateModified': article.updatedAt?.toISOString() || new Date().toISOString(),
      'description': article.summary || '',
      'keywords': (article.keywords || []).join(', '),
      'image': article.coverImage || ''
    }
  }
}

// 新增：处理文章优化
const enhanceDialogVisible = ref(false)
const selectedArticle = ref(null)

const handleEnhance = (article) => {
  selectedArticle.value = article
  enhanceDialogVisible.value = true
}

const handleEnhanceSuccess = (updatedArticle) => {
  if (!updatedArticle?._id) return;
  
  // 更新文章列表中的对应文章
  const index = articles.value.findIndex(a => a._id === updatedArticle._id);
  if (index !== -1) {
    articles.value[index] = {
      ...articles.value[index],
      ...updatedArticle,
      updatedAt: new Date(updatedArticle.updatedAt)
    };
  }
  
  enhanceDialogVisible.value = false;
  selectedArticle.value = null;
};

// 新增：处理文章仿写
const rewriteDialogVisible = ref(false)

const handleRewrite = (article) => {
  selectedArticle.value = article
  rewriteDialogVisible.value = true
}

const handleRewriteSuccess = (newArticle) => {
  ElMessage.success(t('articles.rewrite.success'))
  rewriteDialogVisible.value = false
  // 将新文章添加到列表
  articles.value.unshift(newArticle)
}

// Add the handleStatusChange function in the script section
const handleStatusChange = async (article, newStatus) => {
  try {
    await ElMessageBox.confirm(
      t('articles.confirmStatusChange', { 
        status: t(`articles.status.${newStatus}`) 
      })
    )
    
    article.status = newStatus
    if (newStatus === ArticleStatus.PUBLISHED) {
      article.publishedAt = new Date()
    }
    await article.save()
    
    ElMessage.success(t('articles.statusChangeSuccess'))
    await loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to change article status:', error)
      ElMessage.error(t('errors.statusChangeFailed'))
    }
  }
}

const getArticleStatus = (status) => {
  return status || ArticleStatus.DRAFT; // 默认为草稿状态
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleString() : '-';
}

// Replace plugins configuration
const editorConfig = {
  height: 500,
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount'
  ],
  toolbar: 'undo redo | styles | bold italic forecolor backcolor | ' +
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
    'link image media table | fullscreen | ' +
    'searchreplace visualblocks code | help',
  images_upload_handler: async (blobInfo, progress) => {
    try {
      const file = blobInfo.blob()
      const avFile = new AV.File(file.name, file)
      await avFile.save({
        onprogress: ({ percent }) => {
          progress(percent)
        }
      })
      return avFile.url()
    } catch (error) {
      console.error('Failed to upload image:', error)
      throw new Error(t('articles.imageUpload.error'))
    }
  },
  content_style: `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
    img { max-width: 100%; height: auto; }
    pre { background-color: #f4f4f4; padding: 1em; border-radius: 4px; }
    blockquote { border-left: 3px solid #ccc; margin-left: 1.5em; padding-left: 1em; }
  `,
  language: 'zh_CN',
  skin: 'oxide',
  content_css: 'default',
  branding: false,
  promotion: false,
  resize: true,
  min_height: 400,
  max_height: 800,
  paste_data_images: true,
  convert_urls: false,
  relative_urls: false,
  remove_script_host: false,
  readonly: false,
  apiKey: import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'
}

// Add this near the top of the script section after other refs
const tinymceApiKey = ref('no-api-key')

// Add this near the top of the script section after tinymceApiKey
const openAiApiKey = ref(import.meta.env.VITE_OPENAI_API_KEY || '')

// 封面选择相关的响应式变量
const showCoverSelector = ref(false)
const selectedCover = ref(defaultCovers[0])
const coverFilter = ref('')
const coverCategory = ref('all')

// 封面分类
const coverCategories = [
  { value: 'all', label: '全部' },
  { value: 'technology', label: '科技' },
  { value: 'music', label: '音乐' },
  { value: 'gradient', label: '渐变' },
  { value: 'abstract', label: '抽象' }
]

// 过滤后的封面列表
const filteredCovers = computed(() => {
  let covers = defaultCovers
  
  if (coverCategory.value !== 'all') {
    covers = covers.filter(cover => cover.category === coverCategory.value)
  }
  
  if (coverFilter.value) {
    const searchText = coverFilter.value.toLowerCase()
    covers = covers.filter(cover => 
      cover.name.toLowerCase().includes(searchText) ||
      cover.category.toLowerCase().includes(searchText)
    )
  }
  
  return covers
})

// 打开封面选择器
const openCoverSelector = () => {
  showCoverSelector.value = true
}

// 选择封面
const handleCoverSelect = (cover) => {
  selectedCover.value = cover
  showCoverSelector.value = false
  
  // 如果当前正在编辑文章，更新文章封面
  if (currentArticle.value) {
    currentArticle.value.set('coverImage', cover.url)
  }
}

// 添加计算属性
const coverEnabled = computed({
  get: () => generateConfig.value?.coverImage?.enabled ?? true,
  set: (value) => {
    if (!generateConfig.value.coverImage) {
      generateConfig.value.coverImage = {}
    }
    generateConfig.value.coverImage.enabled = value
  }
})

const useAIGeneratedCover = computed({
  get: () => generateConfig.value?.coverImage?.useAIGenerated ?? false,
  set: (value) => {
    if (!generateConfig.value.coverImage) {
      generateConfig.value.coverImage = {}
    }
    generateConfig.value.coverImage.useAIGenerated = value
  }
})
</script>

<template>
  <div class="article-manager">
    <!-- 顶部操作栏 -->
    <el-card class="header-card">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
      <el-button type="primary" @click="createArticle">
            <el-icon class="mr-2"><Plus /></el-icon>
        {{ t('articles.create') }}
      </el-button>
          <el-button type="success" @click="openGenerateDialog" v-if="hasPermission('articles.generate')">
            <el-icon class="mr-2"><Cpu /></el-icon>
            {{ t('articles.aiGenerate') }}
      </el-button>
    </div>
      </div>
    </el-card>
    
    <!-- 筛选器区域 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="8">
      <el-input
        v-model="searchKeyword"
        :placeholder="t('articles.searchPlaceholder')"
        @keyup.enter="loadArticles"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
        </template>
      </el-input>
        </el-col>
        <el-col :span="6">
          <el-select 
            v-model="filterCategory" 
            @change="loadArticles"
            :placeholder="t('articles.selectCategory')"
            clearable
            style="width: 100%"
          >
        <el-option
          v-for="(value, key) in ArticleCategory"
          :key="value"
          :label="t(`articles.categories.${key}`)"
          :value="value"
        />
      </el-select>
        </el-col>
        <el-col :span="6">
          <el-select 
            v-model="filterStatus" 
            @change="loadArticles"
            :placeholder="t('articles.selectStatus')"
            clearable
            style="width: 100%"
          >
        <el-option
              v-for="status in Object.values(ArticleStatus)"
              :key="status"
              :label="t(`articles.status.${status}`)"
              :value="status"
        />
      </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadArticles" style="width: 100%">
            {{ t('common.search') }}
          </el-button>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 文章列表 -->
    <el-card class="list-card" v-loading="loading">
      <el-table :data="articles" style="width: 100%">
      <el-table-column prop="title" :label="t('articles.title')" min-width="200">
        <template #default="{ row }">
            <div class="article-title">
              <el-icon><Document /></el-icon>
              <span>{{ row.title }}</span>
            </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="category" :label="t('articles.category')" width="120">
        <template #default="{ row }">
            <el-tag size="small">{{ t(`articles.categories.${row.category?.toLowerCase()}`) }}</el-tag>
        </template>
      </el-table-column>
      
        <el-table-column
          prop="status"
          :label="t('articles.status.label')"
          width="100"
        >
        <template #default="{ row }">
            <el-tag
              :type="getStatusType(getArticleStatus(row.status))"
              size="small"
            >
            {{ t(`articles.status.${getArticleStatus(row.status)}`) }}
          </el-tag>
        </template>
      </el-table-column>
      
        <el-table-column prop="updatedAt" :label="t('articles.lastUpdated')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="coverImage" :label="t('articles.cover')" width="120">
        <template #default="{ row }">
            <el-image
              :src="row instanceof Article ? row.getCoverImage() : (row.get('coverImage') || '/images/default-article-cover.jpg')"
              fit="cover"
              class="article-cover-thumbnail"
              :preview-src-list="[row instanceof Article ? row.getCoverImage() : (row.get('coverImage') || '/images/default-article-cover.jpg')]"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
        </template>
      </el-table-column>
      
      <el-table-column :label="t('common.actions')" width="280" fixed="right">
        <template #default="{ row }">
            <div class="flex items-center space-x-2">
              <el-button-group class="mr-2">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="editArticle(row)"
                  :title="t('common.edit')"
                >
                  <el-icon><Edit /></el-icon>
            </el-button>
            
            <el-button
              size="small"
              type="success"
                  @click="handleEnhance(row)"
                  :title="t('articles.enhance.title')"
            >
                  <el-icon><Cpu /></el-icon>
            </el-button>
            
            <el-button
              size="small"
              type="warning"
                  @click="handleRewrite(row)"
                  :title="t('articles.rewrite.title')"
            >
                  <el-icon><Document /></el-icon>
            </el-button>
            
            <el-button
              size="small"
              type="danger"
              @click="deleteArticle(row)"
                  :title="t('common.delete')"
            >
                  <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>

              <el-dropdown @command="(command) => handleStatusChange(row, command)">
                <el-button size="small">
                  {{ t('articles.changeStatus') }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      v-for="status in Object.values(ArticleStatus)"
                      :key="status"
                      :command="status"
                      :disabled="row.status === status"
                    >
                      {{ t(`articles.status.${status}`) }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
      <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadArticles"
        @current-change="loadArticles"
      />
    </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="isEditing"
      :title="currentArticle?.id ? t('articles.edit') : t('articles.create')"
      width="95%"
      :before-close="() => isEditing = false"
      class="article-editor-dialog"
    >
      <el-form v-if="currentArticle" label-position="top">
        <el-row :gutter="20">
          <el-col :span="18">
            <el-form-item :label="t('articles.title')" required>
          <el-input v-model="currentArticle.title" />
        </el-form-item>
        
            <el-form-item :label="t('articles.content')" required class="content-editor">
              <Editor
                v-model="currentArticle.content"
                :placeholder="t('articles.contentPlaceholder')"
                :editable="true"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item :label="t('articles.cover')" required>
              <div class="cover-uploader">
                <div class="cover-preview">
                  <img
                    v-if="currentArticle?.coverImage"
                    :src="currentArticle.coverImage"
                    class="cover-image"
                  />
                  <div v-else class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>
                <div class="cover-actions">
                  <div class="cover-buttons">
                    <el-button type="primary" @click="openCoverSelector">
                      选择预设封面
                    </el-button>
                    <el-upload
                      class="cover-upload"
                      :show-file-list="false"
                      accept="image/*"
                      :before-upload="beforeCoverUpload"
                      :http-request="uploadCover"
                    >
                      <el-button>上传封面</el-button>
                    </el-upload>
                  </div>
                  <div class="cover-tip">建议尺寸 1200x630，支持 jpg、png 格式</div>
                </div>
              </div>
            </el-form-item>

            <el-form-item :label="t('articles.category')" required>
              <el-select v-model="currentArticle.category" style="width: 100%">
            <el-option
              v-for="(value, key) in ArticleCategory"
              :key="value"
              :label="t(`articles.categories.${key}`)"
              :value="value"
            />
          </el-select>
        </el-form-item>
        
            <el-form-item :label="t('articles.tags')">
              <el-select
                v-model="currentArticle.tags"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="t('articles.tagsPlaceholder')"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in currentArticle.get('tags') || []"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('articles.excerpt')">
          <el-input
                v-model="currentArticle.excerpt"
            type="textarea"
                :rows="4"
                :placeholder="t('articles.excerptPlaceholder')"
          />
        </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="isEditing = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveArticle">
            {{ t('common.save') }}
              </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreview"
      :title="currentArticle?.title"
      width="70%"
      :before-close="() => showPreview = false"
    >
      <div class="preview-content" v-if="currentArticle">
        <div class="article-meta">
          <el-tag size="small">{{ t(`articles.categories.${currentArticle.category}`) }}</el-tag>
          <span class="read-time">{{ currentArticle.readTime }} {{ t('articles.minutesToRead') }}</span>
          </div>
        <div class="article-content" v-html="marked(currentArticle.content)" />
      </div>
    </el-dialog>

    <!-- AI 生成对话框 -->
    <el-dialog
      v-model="showGenerateDialog"
      :title="t('articles.generateArticle')"
      width="70%"
      :before-close="() => showGenerateDialog = false"
      class="generate-dialog"
    >
      <el-form v-if="generateConfig" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('articles.strategy')" required>
              <el-select
                v-model="generateConfig.strategy"
                :placeholder="t('articles.selectStrategy')"
                style="width: 100%"
              >
                <el-option
                  v-for="(value, key) in generationStrategies"
                  :key="key"
                  :label="value.label"
                  :value="key"
                />
              </el-select>
        </el-form-item>
        
            <el-form-item 
              v-if="generateConfig.strategy === 'custom'"
              :label="t('articles.customIndustry')"
              required
            >
              <el-input
                v-model="generateConfig.customIndustry"
                :placeholder="t('articles.enterCustomIndustry')"
              />
            </el-form-item>
            
            <el-form-item :label="t('articles.language')" required>
          <el-select
                v-model="generateConfig.language"
                :placeholder="t('articles.selectLanguage')"
                style="width: 100%"
              >
                <el-option
                  v-for="(value, key) in languageOptions"
                  :key="key"
                  :label="value"
                  :value="key"
                />
              </el-select>
        </el-form-item>
        
        <el-form-item :label="t('articles.keywords')">
              <div class="keywords-input">
                <el-input
                  v-model="generateConfig.keywords"
                  :placeholder="t('articles.enterKeywords')"
                  :disabled="generateConfig.autoKeywords"
                />
                <el-checkbox v-model="generateConfig.autoKeywords" class="auto-keywords">
                  {{ t('articles.autoKeywords') }}
                </el-checkbox>
              </div>
              <div v-if="generateConfig.autoKeywords" class="keyword-count">
                <el-input-number
                  v-model="generateConfig.keywordCount"
                  :min="3"
                  :max="10"
                  size="small"
                />
                <span class="keyword-count-label">{{ t('articles.keywordCount') }}</span>
              </div>
            </el-form-item>

            <el-form-item :label="t('articles.batchGenerate')">
              <div class="batch-generate">
                <el-checkbox v-model="generateConfig.batchGenerate">
                  {{ t('articles.enableBatchGenerate') }}
                </el-checkbox>
                <el-input-number
                  v-if="generateConfig.batchGenerate"
                  v-model="generateConfig.batchCount"
                  :min="1"
                  :max="10"
                  size="small"
                  style="margin-left: 10px"
                />
              </div>
            </el-form-item>

            <el-form-item :label="t('articles.imageGeneration')">
              <div class="image-generation-options">
                <el-checkbox v-model="generateConfig.generateImage">
                  {{ t('articles.enableImageGeneration') }}
                </el-checkbox>
                <template v-if="generateConfig.generateImage">
          <el-select
                    v-model="generateConfig.imageStyle"
                    :placeholder="t('articles.selectImageStyle')"
                    style="width: 100%; margin-top: 10px"
                  >
                    <el-option label="照片风格" value="photo" />
                    <el-option label="插画风格" value="illustration" />
                    <el-option label="SVG图标" value="svg" />
                  </el-select>
                  <el-input
                    v-model="generateConfig.imagePrompt"
                    type="textarea"
                    :rows="2"
                    :placeholder="t('articles.imagePromptPlaceholder')"
                    style="margin-top: 10px"
                  />
                </template>
              </div>
        </el-form-item>
        
            <el-form-item :label="t('articles.draftSaving')">
              <div class="draft-saving-options">
                <el-checkbox v-model="generateConfig.draftSaving">
                  {{ t('articles.enableDraftSaving') }}
                </el-checkbox>
                <template v-if="generateConfig.draftSaving">
                  <el-input-number
                    v-model="generateConfig.draftInterval"
                    :min="10"
                    :max="300"
                    style="margin-top: 10px; width: 100%"
                  />
                  <div class="text-sm text-gray-500 mt-1">
                    {{ t('articles.draftIntervalDescription') }}
                  </div>
                </template>
              </div>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item :label="t('articles.tone')" required>
              <el-select
                v-model="generateConfig.tone"
                :placeholder="t('articles.selectTone')"
                style="width: 100%"
              >
                <el-option
                  v-for="(value, key) in toneOptions"
                  :key="key"
                  :label="value"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item :label="t('articles.length')" required>
              <el-select
                v-model="generateConfig.length"
                :placeholder="t('articles.selectLength')"
                style="width: 100%"
              >
                <el-option
                  v-for="(value, key) in lengthOptions"
                  :key="key"
                  :label="value"
                  :value="key"
                />
              </el-select>
        </el-form-item>

            <el-form-item :label="t('articles.afterGeneration')">
              <div class="after-generation-options">
                <el-radio-group v-model="generateConfig.editAfterGeneration">
                  <el-radio :value="true" :label="t('articles.editAfterGeneration')">{{ t('articles.editAfterGeneration') }}</el-radio>
                  <el-radio :value="false" :label="t('articles.publishDirectly')">{{ t('articles.publishDirectly') }}</el-radio>
                </el-radio-group>
              </div>
            </el-form-item>

            <!-- 添加封面选择部分 -->
            <el-form-item :label="t('articles.cover')" required>
              <div class="cover-options">
                <el-checkbox v-model="coverEnabled">
                  {{ t('articles.enableCover') }}
                </el-checkbox>
                
                <template v-if="coverEnabled">
                  <div class="cover-preview-container">
                    <div class="cover-preview">
                      <img
                        v-if="generateConfig.value?.coverImage?.selectedCover"
                        :src="generateConfig.value?.coverImage?.selectedCover?.url"
                        :alt="generateConfig.value?.coverImage?.selectedCover?.name"
                        class="preview-image"
                      />
                      <div v-else class="cover-placeholder">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </div>
                    
                    <div class="cover-info">
                      <span class="cover-name">{{ generateConfig.value?.coverImage?.selectedCover?.name }}</span>
                      <p class="cover-description">{{ generateConfig.value?.coverImage?.selectedCover?.description }}</p>
                    </div>
                  </div>
                  
                  <div class="cover-actions">
                    <el-button type="primary" @click="openCoverSelector">
                      选择预设封面
                    </el-button>
                    
                    <el-checkbox 
                      v-if="generateConfig.value?.generateImage"
                      v-model="useAIGeneratedCover"
                      class="ai-cover-option"
                    >
                      使用AI生成的封面
                    </el-checkbox>
                  </div>
                </template>
              </div>
            </el-form-item>

            <el-form-item :label="t('articles.seoOptions')">
              <div class="seo-options">
                <el-checkbox v-model="generateConfig.seoOptimize">
                  {{ t('articles.enableSEO') }}
                </el-checkbox>
                <template v-if="generateConfig.seoOptimize">
                  <el-checkbox v-model="generateConfig.generateMeta">
                    {{ t('articles.generateMeta') }}
                  </el-checkbox>
                  <el-checkbox v-model="generateConfig.structuredData">
                    {{ t('articles.structuredData') }}
                  </el-checkbox>
                  <el-checkbox v-model="generateConfig.autoInternalLinks">
                    {{ t('articles.autoInternalLinks') }}
                  </el-checkbox>
                  <el-input
                    v-model="generateConfig.targetKeywords"
                    :placeholder="t('articles.targetKeywords')"
                    type="textarea"
                    :rows="2"
                    style="margin-top: 10px"
                  />
                </template>
              </div>
            </el-form-item>
            
            <el-form-item>
              <div class="generation-options">
                <el-checkbox v-model="generateConfig.useTitle">
                  {{ t('articles.useGeneratedTitle') }}
                </el-checkbox>
                <el-checkbox v-model="generateConfig.useSummary">
                  {{ t('articles.useGeneratedSummary') }}
                </el-checkbox>
                <el-checkbox v-model="generateConfig.mediaGeneration">
                  {{ t('articles.mediaGeneration') }}
                </el-checkbox>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showGenerateDialog = false">
          {{ t('common.cancel') }}
        </el-button>
          <el-button type="primary" @click="generateArticle" :loading="aiGenerating">
            {{ aiGenerating ? t('articles.generating') : t('articles.generate') }}
        </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 流式输出对话框 -->
    <el-dialog
      v-model="showStreamDialog"
      :title="t('articles.streamOutput')"
      width="70%"
      :before-close="() => showStreamDialog = false"
      class="stream-dialog"
    >
      <div class="stream-content" v-if="streamContent">
        <div class="stream-progress">
          <el-progress :percentage="streamProgress" />
        </div>
        <div class="stream-text" v-html="marked(streamContent)" />
      </div>
    </el-dialog>

    <!-- 优化对话框 -->
    <el-dialog
      :title="t('articles.enhance.title')"
      v-model="enhanceDialogVisible"
      width="600px"
    >
      <article-enhance
        :article="selectedArticle"
        @success="handleEnhanceSuccess"
        @cancel="enhanceDialogVisible = false"
      />
    </el-dialog>

    <!-- 仿写对话框 -->
    <el-dialog
      :title="t('articles.rewrite.title')"
      v-model="rewriteDialogVisible"
      width="600px"
    >
      <article-rewrite
        @success="handleRewriteSuccess"
        @cancel="rewriteDialogVisible = false"
      />
    </el-dialog>

    <!-- 封面选择对话框 -->
    <el-dialog
      v-model="showCoverSelector"
      title="选择封面"
      width="70%"
      class="cover-selector-dialog"
    >
      <div class="cover-selector">
        <div class="cover-selector-header">
          <el-input
            v-model="coverFilter"
            placeholder="搜索封面"
            prefix-icon="Search"
            clearable
            class="cover-search"
          />
          <el-radio-group v-model="coverCategory" class="cover-categories">
            <el-radio-button
              v-for="category in coverCategories"
              :key="category.value"
              :label="category.value"
            >
              {{ category.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="cover-grid">
          <div
            v-for="cover in filteredCovers"
            :key="cover.id"
            class="cover-item"
            :class="{ active: selectedCover?.id === cover.id }"
            @click="handleCoverSelect(cover)"
          >
            <div class="cover-preview">
              <img :src="cover.url" :alt="cover.name" />
            </div>
            <div class="cover-info">
              <span class="cover-name">{{ cover.name }}</span>
              <el-button
                type="primary"
                size="small"
                :class="{ 'is-selected': selectedCover?.id === cover.id }"
              >
                {{ selectedCover?.id === cover.id ? '已选择' : '选择' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.article-manager {
  padding: 20px;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.header-card {
  margin-bottom: 20px;
  
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
  
  .el-button {
    display: inline-flex;
    align-items: center;
    
    .el-icon {
      margin-right: 8px;
    }
  }
}

.filter-card {
  margin-bottom: 20px;
}

.list-card {
  margin-bottom: 20px;
}

.article-title {
    display: flex;
  align-items: center;
  gap: 8px;
  }
  
.pagination-container {
  margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

.preview-content {
  padding: 20px;
}

.article-meta {
  margin-bottom: 20px;
    display: flex;
  gap: 12px;
  align-items: center;
}

.read-time {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.article-content {
  line-height: 1.6;
}

.text-red {
  color: var(--el-color-danger);
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
}

.article-editor-dialog :deep(.el-dialog__body) {
  padding: 20px;
  height: calc(100vh - 150px);
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.content-editor {
  margin-bottom: 20px;
  
  :deep(.editor-wrapper) {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    min-height: calc(100vh - 350px);
  }
  
  :deep(.editor-content) {
    min-height: calc(100vh - 400px);
    max-height: none;
  }
}

.cover-uploader {
  text-align: center;
}

.cover-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration);
}
    
.cover-upload:hover {
      border-color: var(--el-color-primary);
  }
  
  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  width: 100%;
    height: 178px;
    text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  }
  
  .cover-image {
  width: 100%;
    height: 178px;
    object-fit: cover;
  display: block;
}

.cover-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

.right {
  display: flex;
  gap: 12px;
}

.right :deep(.el-button-group) {
  display: flex;
  gap: 4px;
}

.generate-dialog :deep(.el-form-item__label) {
  font-weight: 500;
}

.generate-dialog :deep(.el-select) {
    width: 100%;
}

.generate-dialog :deep(.el-input) {
  width: 100%;
}

.generate-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

.keywords-input {
    display: flex;
  gap: 10px;
    align-items: center;
}

.keyword-count {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.seo-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.batch-generate {
  display: flex;
  align-items: center;
  gap: 10px;
}

.generation-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stream-dialog :deep(.el-dialog__body) {
  padding: 20px;
  height: calc(100vh - 150px);
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

.stream-content {
  padding: 20px;
  position: relative;
}

.stream-progress {
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--el-bg-color);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stream-text {
  line-height: 1.8;
  font-size: 16px;
  color: var(--el-text-color-primary);
  
  :deep(h1) {
    font-size: 28px;
    margin-bottom: 24px;
    color: var(--el-color-primary);
    border-bottom: 2px solid var(--el-border-color-light);
    padding-bottom: 12px;
  }
  
  :deep(h2) {
    font-size: 24px;
    margin: 24px 0 16px;
    color: var(--el-text-color-primary);
  }
  
  :deep(h3) {
    font-size: 20px;
    margin: 20px 0 12px;
    color: var(--el-text-color-regular);
  }
  
  :deep(p) {
    margin: 16px 0;
    text-align: justify;
  }
  
  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 16px 0;
  }
  
  :deep(li) {
    margin: 8px 0;
  }
  
  :deep(code) {
    background-color: var(--el-bg-color);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--el-color-danger);
    font-family: monospace;
  }
  
  :deep(pre) {
    background-color: var(--el-bg-color);
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 16px 0;
  }
  
  :deep(blockquote) {
    border-left: 4px solid var(--el-color-primary);
    padding-left: 16px;
    margin: 16px 0;
    color: var(--el-text-color-regular);
    font-style: italic;
  }
  
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    
    th, td {
      border: 1px solid var(--el-border-color);
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background-color: var(--el-bg-color);
      font-weight: bold;
    }
  }
    
    :deep(img) {
      max-width: 100%;
      height: auto;
    border-radius: 4px;
    margin: 16px 0;
  }
  
  :deep(hr) {
    border: none;
    border-top: 1px solid var(--el-border-color);
    margin: 24px 0;
  }
  
  :deep(strong) {
    color: var(--el-color-primary);
    font-weight: 600;
  }
  
  :deep(em) {
    color: var(--el-color-success);
  }
  
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stream-dialog :deep(.el-progress-bar__inner) {
  transition: width 0.3s ease-in-out;
}

.stream-dialog :deep(.el-progress) {
  margin-bottom: 0;
}

.stream-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.stream-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

.stream-dialog :deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

.article-cover-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.cover-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cover-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.cover-selector {
  padding: 20px;
}

.cover-selector-header {
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.cover-categories {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.cover-item {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    .cover-overlay {
      opacity: 1;
    }
  }
  
  &.active {
    border-color: var(--el-color-primary);
    
    .cover-overlay {
      opacity: 1;
      background-color: rgba(var(--el-color-primary-rgb), 0.1);
    }
  }
}

.cover-preview {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.cover-info {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color);
}

.cover-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  flex-grow: 1;
  margin-right: 8px;
}

.cover-selector-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
}

/* 封面选择器样式 */
.cover-selector {
  padding: 20px;
}

.cover-selector-header {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.cover-search {
  width: 300px;
}

.cover-categories {
  flex-grow: 1;
}

.cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.cover-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
  }
  
  &.active {
    border: 2px solid var(--el-color-primary);
  }
}

.cover-item .cover-preview {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-info {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
}

.cover-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.cover-placeholder {
  width: 100%;
  height: 178px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 24px;
}

.cover-preview {
  margin-bottom: 12px;
}

.cover-actions {
  text-align: center;
}

.cover-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 8px;
}

.cover-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.is-selected {
  background-color: var(--el-color-success);
  border-color: var(--el-color-success);
}

/* 添加新的样式 */
.cover-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cover-preview-container {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background-color: var(--el-bg-color-page);
}

.cover-preview {
  width: 200px;
  height: 112px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.cover-description {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.cover-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.ai-cover-option {
  margin-left: auto;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 24px;
}
</style> 