<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Upload, Edit, Check, Warning } from '@element-plus/icons-vue'
import TheNavbar from '../components/TheNavbar.vue'
import AV from 'leancloud-storage'
import { analyzeImageWithVision, generateMusic, checkMusicTask } from '../utils/ai'
import { WorkClass } from '../utils/leancloud'
import { 
  getUserPoints, 
  hasEnoughPoints, 
  updateUserPoints,
  POINTS_CONFIG 
} from '../utils/points'

// 导入价格配置
import pricingConfig from '../config/pricing.json'

const { t } = useI18n()
const router = useRouter()
const fileInputRef = ref(null)
const imageUrl = ref('')
const selectedStyle = ref('')
const title = ref('')
const loading = ref(false)
const dragover = ref(false)
const currentStep = ref(1) // 1: 上传图片, 2: 选择风格和标题, 3: 生成/编辑歌词, 4: 生成音乐
const imageFile = ref(null)
const imagePreview = ref('')
const generatingMusic = ref(false)
const currentTaskId = ref('')
const musicUrl = ref('')
const errorMessage = ref('')
const uploadProgress = ref(0)
const isUploading = ref(false)
const audioContext = ref(null)
const isAudioInitialized = ref(false)
const checkInterval = ref(null)
const lyrics = ref('')
const isEditingLyrics = ref(false)
const userPoints = ref(0)

// 添加缺失的响应式变量
const generationStatus = ref('PROCESSING') // 可能的值: 'PROCESSING', 'COMPLETED', 'FAILED'
const currentWork = ref(null)

// 添加积分扣除状态
const pointsDeducted = ref(false)

// 音乐风格配置
const styles = [
  { value: 'pop', icon: 'musical-note' },
  { value: 'rock', icon: 'guitar' },
  { value: 'electronic', icon: 'synthesizer' },
  { value: 'jazz', icon: 'saxophone' },
  { value: 'classical', icon: 'orchestra' },
  { value: 'folk', icon: 'acoustic-guitar' },
  { value: 'rnb', icon: 'microphone' },
  { value: 'hiphop', icon: 'turntable' },
  { value: 'ambient', icon: 'waves' },
  { value: 'edm', icon: 'headphones' },
  { value: 'metal', icon: 'electric-guitar' },
  { value: 'indie', icon: 'vinyl' },
  { value: 'soul', icon: 'heart-music' },
  { value: 'blues', icon: 'blues-guitar' },
  { value: 'funk', icon: 'bass-guitar' },
  { value: 'chinese', icon: 'chinese-music' },
  { value: 'chineseClassical', icon: 'traditional-chinese' },
  { value: 'country', icon: 'country-guitar' },
  { value: 'postRock', icon: 'post-rock' },
  { value: 'acidJazz', icon: 'acid-jazz' },
  { value: 'reggae', icon: 'reggae' },
  { value: 'latin', icon: 'latin' },
  { value: 'world', icon: 'world-music' },
  { value: 'newage', icon: 'new-age' },
  { value: 'orchestral', icon: 'orchestral' },
  { value: 'experimental', icon: 'experimental' },
  { value: 'acoustic', icon: 'acoustic' },
  { value: 'soundtrack', icon: 'soundtrack' },
  { value: 'lofi', icon: 'lofi' }
]

const languages = [
  {
    value: 'zh',
    icon: '🇨🇳',
    description: '中文'
  },
  {
    value: 'en',
    icon: '🇺🇸',
    description: 'English'
  },
  {
    value: 'ja',
    icon: '🇯🇵',
    description: '日本語'
  },
  {
    value: 'ko',
    icon: '🇰🇷',
    description: '한국어'
  },
  {
    value: 'fr',
    icon: '🇫🇷',
    description: 'Français'
  },
  {
    value: 'es',
    icon: '🇪🇸',
    description: 'Español'
  },
  {
    value: 'de',
    icon: '🇩🇪',
    description: 'Deutsch'
  },
  {
    value: 'it',
    icon: '🇮🇹',
    description: 'Italiano'
  },
  {
    value: 'ru',
    icon: '🇷🇺',
    description: 'Русский'
  },
  {
    value: 'th',
    icon: '🇹🇭',
    description: 'ภาษาไทย'
  },
  {
    value: 'pt',
    icon: '🇵🇹',
    description: 'Português'
  },
  {
    value: 'ar',
    icon: '🇸🇦',
    description: 'العربية'
  },
  {
    value: 'hi',
    icon: '🇮🇳',
    description: 'हिंदी'
  },
  {
    value: 'vi',
    icon: '🇻🇳',
    description: 'Tiếng Việt'
  },
  {
    value: 'tr',
    icon: '🇹🇷',
    description: 'Türkçe'
  }
]

const mixModes = [
  {
    value: 'single',
    label: '单语言',
    description: '仅使用选定的语言'
  },
  {
    value: 'mixed',
    label: '混合模式',
    description: '在歌词中混合使用多种语言'
  }
]

const selectedLanguages = ref([])
const mixMode = ref('single')

const lengthOptions = [
  {
    value: 'short',
    label: t('create.length.options.short.label'),
    description: t('create.length.options.short.description'),
    icon: 'Crop'
  },
  {
    value: 'medium',
    label: t('create.length.options.medium.label'),
    description: t('create.length.options.medium.description'),
    icon: 'Document'
  },
  {
    value: 'long',
    label: t('create.length.options.long.label'),
    description: t('create.length.options.long.description'),
    icon: 'DocumentAdd'
  }
]

const selectedLength = ref('medium')

const triggerUpload = () => {
  const fileInput = fileInputRef.value
  if (fileInput && fileInput.$el) {
    const input = fileInput.$el.querySelector('input[type="file"]')
    if (input) {
      input.click()
    }
  }
}

const handleDrop = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  dragover.value = false
  
  const file = e.dataTransfer.files[0]
  if (file) {
    await handleImageUpload({ raw: file })
  }
}

const handleDragOver = (e) => {
  e.preventDefault()
  dragover.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  dragover.value = false
}

const handleImageUpload = async (file) => {
  const rawFile = file.raw || file
  
  // 检查文件类型
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(rawFile.type)) {
    ElMessage.warning(t('create.upload.invalidFormat'))
    return
  }
  
  // 检查文件大小（25MB）
  if (rawFile.size > 25 * 1024 * 1024) {
    ElMessage.warning(t('create.upload.maxSize'))
    return
  }

  // 检查积分是否足够
  if (!await hasEnoughPoints(POINTS_CONFIG.CREATE_MUSIC)) {
    ElMessage({
      type: 'warning',
      message: t('points.insufficient', { points: POINTS_CONFIG.CREATE_MUSIC }),
      duration: 5000,
      showClose: true,
      customClass: 'points-warning'
    })
    router.push('/pricing')
    return
  }
  
  try {
    isUploading.value = true
    uploadProgress.value = 0
    loading.value = true

    // 扣除积分
    if (!pointsDeducted.value) {
      await updateUserPoints(-POINTS_CONFIG.CREATE_MUSIC, '创建音乐')
      userPoints.value = await getUserPoints()
      pointsDeducted.value = true
      ElMessage.success(t('points.success.deducted', { points: POINTS_CONFIG.CREATE_MUSIC }))
    }

    // 上传图片到 LeanCloud
    const data = { base64: '' }
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      data.base64 = e.target.result.split(',')[1]
      
      try {
        const file = new AV.File('image.jpg', { base64: data.base64 })
        const savedFile = await file.save({
          onprogress: (progress) => {
            uploadProgress.value = Math.round(progress.percent)
          }
        })
        
        imageUrl.value = savedFile.url()
        imageFile.value = savedFile
        currentStep.value = 2
        ElMessage.success(t('success.upload'))
      } catch (error) {
        console.error('Upload failed:', error)
        ElMessage.error(t('errors.upload'))
      } finally {
        isUploading.value = false
        loading.value = false
      }
    }
    
    reader.readAsDataURL(rawFile)
  } catch (error) {
    console.error('Handle image upload failed:', error)
    ElMessage.error(t('errors.upload'))
    isUploading.value = false
    loading.value = false
  }
}

async function startMusicGeneration() {
  try {
    generatingMusic.value = true
    errorMessage.value = ''
    
    // 验证必需的参数
    if (!selectedStyle.value) {
      throw new Error('请选择音乐风格')
    }

    if (!title.value) {
      throw new Error('请输入作品标题')
    }
    
    // 将图片转换为 base64
    const reader = new FileReader()
    const base64Promise = new Promise((resolve) => {
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
    })
    reader.readAsDataURL(imageFile.value)
    const imageBase64 = await base64Promise
    
    // 使用 GPT-4 Vision 分析图片
    const visionResult = await analyzeImageWithVision(imageBase64)
    console.log('Vision Analysis Result:', visionResult)
    
    // 构建音乐生成参数
    const musicParams = {
      title: title.value,
      tags: selectedStyle.value,
      generation_type: 'TEXT',
      prompt: visionResult.prompt || lyrics.value || '',
      negative_tags: visionResult.negative_tags || '',
      mv: 'chirp-v3-5'
    }
    
    console.log('Music Generation Params:', musicParams)
    
    // 使用 Suno 生成音乐
    currentTaskId.value = await generateMusic(musicParams)
    console.log('Generated Task ID:', currentTaskId.value)
    
    if (!currentTaskId.value) {
      throw new Error('No task ID returned')
    }
    
    // 开始轮询任务状态
    await pollMusicTask()
  } catch (error) {
    console.error('Music generation error:', error)
    errorMessage.value = error.message

    // 如果生成失败且积分已扣除,退还积分
    if (pointsDeducted.value) {
      try {
        await updateUserPoints(POINTS_CONFIG.CREATE_MUSIC, '生成失败退还')
        userPoints.value = await getUserPoints()
        pointsDeducted.value = false
        ElMessage.info('已退还积分')
      } catch (refundError) {
        console.error('Points refund failed:', refundError)
        ElMessage.error('积分退还失败,请联系客服')
      }
    }
  } finally {
    generatingMusic.value = false
  }
}

async function pollMusicTask() {
  if (!currentTaskId.value) return
  
  try {
    const result = await checkMusicTask(currentTaskId.value)
    
    switch(result.status) {
      case 'SUCCESS':
        musicUrl.value = result.data[0].audio_url
        generationStatus.value = 'COMPLETED'
        clearInterval(checkInterval.value)
        
        // 跳转到用户个人页面
        router.push({ 
          name: `${locale.value}-Profile`,
          query: {
            highlight: currentTaskId.value
          }
        })
        break
        
      case 'FAILED':
        generationStatus.value = 'FAILED'
        clearInterval(checkInterval.value)
        throw new Error(result.fail_reason || '音乐生成失败')
        
      case 'IN_PROGRESS':
        generationStatus.value = 'PROCESSING'
        // 更新进度
        if (result.progress) {
          progress.value = parseInt(result.progress)
        }
        break
        
      default:
        console.warn('Unknown task status:', result.status)
    }
  } catch (error) {
    console.error('Task polling error:', error)
    errorMessage.value = error.message
    generationStatus.value = 'FAILED'
    clearInterval(checkInterval.value)
  }
}

// 开始轮询
function startPolling() {
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
  }
  checkInterval.value = setInterval(pollMusicTask, 3000)
}

// 音频上下文初始化
const initAudioContext = () => {
  if (!audioContext.value) {
    try {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
      if (audioContext.value.state === 'suspended') {
        audioContext.value.resume()
      }
      isAudioInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }
}

// 用户交互处理
const handleUserInteraction = () => {
  if (!isAudioInitialized.value) {
    initAudioContext()
  }
}

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('click', handleUserInteraction)
  document.addEventListener('keydown', handleUserInteraction)
  document.addEventListener('touchstart', handleUserInteraction)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleUserInteraction)
  document.removeEventListener('keydown', handleUserInteraction)
  document.removeEventListener('touchstart', handleUserInteraction)
  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
})

// 修改检查任务状态的函数
const checkTaskStatus = async (taskId, workId) => {
  try {
    // 获取作品记录
    const work = await new AV.Query('Work')
      .get(workId)
    
    if (!work) {
      throw new Error('作品不存在')
    }

    // 检查任务状态
    const response = await fetch(`https://api.whatai.cc/suno/fetch/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUNO_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('检查任务状态失败')
    }

    const data = await response.json()
    console.log('Task status:', data)
    
    // 根据任务状态更新作品状态
    if (data.code === 'success' && data.data) {
      if (data.data.status === 'SUCCESS') {
        // 更新作品状态为已完成
        work.set('status', 'COMPLETED')
        if (data.data.data && data.data.data.length > 0) {
          const musicData = data.data.data[0]
          work.set('audioUrl', musicData.audio_url)
          work.set('videoUrl', musicData.video_url || '')
          work.set('modelName', musicData.model_name)
          work.set('metadata', musicData.metadata)
        }
        work.set('progress', 100)
        work.set('completedTime', new Date())
      } else if (data.data.status === 'FAILED') {
        // 更新作品状态为失败
        work.set('status', 'FAILED')
        work.set('error', data.data.error || '生成失败')
      } else if (data.data.status === 'PROCESSING') {
        // 更新进度
        const progress = data.data.progress || 0
        work.set('progress', progress)
      }
      
      // 保存更新
      await work.save()
      
      // 更新本地状态
      currentWork.value = work
      generationStatus.value = work.get('status')
      
      // 如果还在处理中，继续轮询
      if (data.data.status === 'PROCESSING') {
        setTimeout(() => checkTaskStatus(taskId, workId), 3000)
      }
    }
  } catch (error) {
    console.error('检查任务状态失败:', error)
    
    try {
      // 获取作品记录
      const work = await new AV.Query('Work')
        .get(workId)
      
      if (work) {
        // 更新作品状态为失败
        work.set('status', 'FAILED')
        work.set('error', error.message)
        await work.save()
        
        // 更新本地状态
        currentWork.value = work
        generationStatus.value = 'FAILED'
      }
    } catch (saveError) {
      console.error('更新失败状态失败:', saveError)
    }
    
    ElMessage.error('生成音乐失败，请稍后重试')
  }
}

// 修改生成歌词的函数
const generateLyrics = async () => {
  // 检查所有必填选项
  if (!selectedStyle.value) {
    ElMessage.warning(t('create.errors.styleRequired'))
    return
  }

  if (!title.value.trim()) {
    ElMessage.warning(t('create.errors.titleRequired'))
    return
  }

  if (selectedLanguages.value.length === 0) {
    ElMessage.warning(t('create.errors.languageRequired'))
    return
  }

  if (!selectedLength.value) {
    ElMessage.warning(t('create.errors.lengthRequired'))
    return
  }

  if (!selectedRelevance.value) {
    ElMessage.warning(t('create.errors.relevanceRequired'))
    return
  }

  try {
    loading.value = true
    currentStep.value = 3

    // 添加终端提示
    ElMessage({
      type: 'info',
      message: t('create.generating.lyrics'),
      duration: 0,
      showClose: true,
      customClass: 'generating-message'
    })

    // 构建更详细的提示词
    const prompt = {
      role: "user",
      content: [
        {
          type: "text",
          text: `作为一位专业的作词人，请根据这张图片创作一首歌词。要求：

1. 歌词语言：${selectedLanguages.value.join('、')}
2. 音乐风格：${selectedStyle.value}
3. 歌词长度：${selectedLength.value === 'short' ? '简短（2-3段）' : selectedLength.value === 'medium' ? '中等（3-4段）' : '较长（4-5段）'}
4. 与图片的相关度：${selectedRelevance.value === 'low' ? '低（可以有较多发挥空间）' : selectedRelevance.value === 'medium' ? '中等（部分基于图片内容）' : '高（紧密贴合图片内容）'}

创作要求：
1. 主题和情感：
   - 深入分析图片中的视觉元素、场景、氛围
   - 捕捉并表达图片中的情感和故事
   - 创造鲜明的意象和比喻

2. 结构和形式：
   - 清晰的歌曲结构（主歌、副歌、间奏、尾奏、乐器独奏演奏等，要符合选定音乐风格的节奏感）
   - 注重押韵和音乐性
   - 符合选定音乐风格的节奏感

3. 创作指导：
   - 即使图片信息有限，也要发挥创意想象
   - 可以从图片的细节延伸出更丰富的故事
   - 结合所选风格的特点进行创作

4. 质量要求：
   - 歌词要朗朗上口
   - 意境要优美动人
   - 情感要真挚自然
   - 用词要精准贴切

请根据以上要求，创作一首完整的歌词。即使图片信息看起来有限，也请发挥创意，创作出富有感染力的作品。`
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl.value
          }
        }
      ]
    }

    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [prompt],
        max_tokens: 1000,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error('生成歌词失败')
    }

    const data = await response.json()
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('无效的API响应')
    }

    lyrics.value = data.choices[0].message.content.trim()
    
    // 关闭所有消息提示
    ElMessage.closeAll()
    ElMessage.success('歌词生成成功')
    
  } catch (error) {
    // 关闭所有消息提示
    ElMessage.closeAll()
    console.error('Generate lyrics failed:', error)
    ElMessage.error(error.message || '生成歌词失败')
  } finally {
    loading.value = false
  }
}

// 修改优化歌词的函数
const optimizeLyrics = async () => {
  if (!lyrics.value) {
    ElMessage.warning('请先生成歌词')
    return
  }
  
  try {
    loading.value = true
    
    const response = await fetch('https://api.whatai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `请优化以下歌词，使其更加优美、押韵，但要符合原本的含义，同时保持${selectedStyle.value}风格：\n\n${lyrics.value}`
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error('歌词优化失败')
    }

    const data = await response.json()
    lyrics.value = data.choices[0].message.content
    
    ElMessage.success('歌词优化成功')
  } catch (error) {
    console.error('Lyrics optimization failed:', error)
    ElMessage.error(error.message || '歌词优化失败')
  } finally {
    loading.value = false
  }
}

// 修改 handleCreate 函数
const handleCreate = async () => {
  // 添加参数检查日志
  console.log('Create Parameters:', {
    imageUrl: imageUrl.value,
    selectedStyle: selectedStyle.value,
    title: title.value,
    lyricsLength: lyrics.value?.length,
    env: {
      SUNO_API_URL: import.meta.env.VITE_SUNO_API_URL,
      hasApiKey: !!import.meta.env.VITE_SUNO_API_KEY
    }
  })

  if (!imageUrl.value || !selectedStyle.value || !title.value || !lyrics.value) {
    console.warn('Missing required parameters:', {
      hasImage: !!imageUrl.value,
      hasStyle: !!selectedStyle.value,
      hasTitle: !!title.value,
      hasLyrics: !!lyrics.value
    })
    ElMessage.warning(t('create.errors.incomplete'))
    return
  }
  
  try {
    loading.value = true
    currentStep.value = 4
    
    // 构建请求体
    const requestBody = {
      title: title.value.trim(),
      tags: Array.isArray(selectedStyle.value) ? selectedStyle.value.join(',') : selectedStyle.value,
      generation_type: 'TEXT',
      prompt: lyrics.value.trim(),
      negative_tags: '',
      mv: 'chirp-v3-5'
    }
    
    console.log('Music Generation Request:', {
      body: requestBody,
      apiUrl: import.meta.env.VITE_SUNO_API_URL
    })
    
    // 使用 generateMusic 函数而不是直接调用 API
    try {
      currentTaskId.value = await generateMusic(requestBody)
      console.log('Generated Task ID:', currentTaskId.value)
      
      if (!currentTaskId.value) {
        console.error('No task ID returned from generateMusic')
        throw new Error('No task ID returned')
      }
      
      // 创建新的作品记录
      const work = new WorkClass()
      work.set('status', 'generating')
      work.set('taskId', currentTaskId.value)
      work.set('platform', 'suno')
      work.set('submitTime', new Date())
      work.set('action', 'MUSIC')
      work.set('title', title.value)
      work.set('imageUrl', imageUrl.value)
      work.set('style', selectedStyle.value)
      work.set('lyrics', lyrics.value)
      work.set('user', AV.User.current())
      work.set('progress', 0)
      work.set('retryCount', 0)
      work.set('lastCheckTime', new Date())
      
      console.log('Saving work to LeanCloud...')
      const savedWork = await work.save()
      console.log('Work saved:', savedWork.id)
      
      // 开始定时检查任务状态
      checkInterval.value = setInterval(() => {
        checkTaskStatus(currentTaskId.value, savedWork.id)
      }, 10000)
      
      ElMessage.success(t('create.success.submitted'))
      
      // 延迟跳转到个人页面
      setTimeout(() => {
        router.push({
          path: '/profile',
          query: { 
            taskId: currentTaskId.value,
            highlight: 'true'
          }
        })
      }, 2000)
      
    } catch (error) {
      console.error('Music generation failed:', {
        error,
        requestBody,
        apiUrl: import.meta.env.VITE_SUNO_API_URL
      })
      throw error
    }
    
  } catch (error) {
    console.error('Creation failed:', error)
    
    let errorMessage = t('create.errors.generation')
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = t('create.errors.networkError')
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    ElMessage.error({
      message: errorMessage,
      duration: 5000
    })
    
    currentStep.value = 2
  } finally {
    loading.value = false
  }
}

// 添加加载积分的函数
const loadUserPoints = async () => {
  try {
    userPoints.value = await getUserPoints()
  } catch (error) {
    console.error('Failed to load user points:', error)
    ElMessage.error(t('errors.points.load'))
  }
}

// 修改组件挂载逻辑
onMounted(() => {
  // 加载用户积分
  loadUserPoints()
  
  // 添加用户交互事件监听
  document.addEventListener('click', handleUserInteraction)
  document.addEventListener('keydown', handleUserInteraction)
  document.addEventListener('touchstart', handleUserInteraction)
  
  // 初始检查时间彩蛋
  checkTimeEasterEgg()
  
  // 每分钟检查一次
  setInterval(checkTimeEasterEgg, 60000)
  
  return () => {
    document.removeEventListener('click', handleUserInteraction)
    document.removeEventListener('keydown', handleUserInteraction)
    document.removeEventListener('touchstart', handleUserInteraction)
  }
})

// 修改组件卸载逻辑
onUnmounted(() => {
  // 如果组件卸载时积分已扣除但未完成创作,退还积分
  if (pointsDeducted.value && currentStep.value < 4) {
    updateUserPoints(POINTS_CONFIG.CREATE_MUSIC, '未完成创作退还')
      .then(() => {
        console.log('Points refunded on unmount')
      })
      .catch(error => {
        console.error('Points refund failed on unmount:', error)
      })
  }

  if (checkInterval.value) {
    clearInterval(checkInterval.value)
    checkInterval.value = null
  }
  
  if (audioContext.value) {
    audioContext.value.close().catch(console.error)
  }
})

// 修改语言选择函数
const toggleLanguage = (langValue) => {
  const index = selectedLanguages.value.indexOf(langValue)
  if (index === -1) {
    selectedLanguages.value.push(langValue)
  } else {
    selectedLanguages.value.splice(index, 1)
  }
  
  // 如果只剩一种语言，自动设置为单语言模式
  if (selectedLanguages.value.length <= 1) {
    mixMode.value = 'single'
  }
}

// 修改头像更新逻辑
const updateUserAvatar = async (avatarUrl) => {
  try {
    loading.value = true
    
    // 从 URL 获取图片数据
    const response = await fetch(avatarUrl)
    if (!response.ok) {
      throw new Error('获取图片失败')
    }
    
    const blob = await response.blob()
    const fileName = avatarUrl.split('/').pop() || 'avatar.jpg'
    
    // 创建 LeanCloud File 对象
    const avFile = new AV.File(fileName, {
      blob,
      mimeType: blob.type || 'image/jpeg'
    }, {
      keepFileName: true
    })
    
    // 先保存文件
    const savedFile = await avFile.save({
      onprogress: (progress) => {
        console.log('Avatar upload progress:', progress.percent)
      }
    })
    
    // 更新用户头像
    const currentUser = AV.User.current()
    if (currentUser) {
      currentUser.set('avatar', savedFile)
      await currentUser.save(null, {
        fetchWhenSave: true
      })
      ElMessage.success('头像更新成功')
    }
  } catch (error) {
    console.error('Update avatar failed:', error)
    ElMessage.error(error.message || '头像更新失败')
    throw error
  } finally {
    loading.value = false
  }
}

// 音乐风格选项
const styleOptions = [
  { value: 'pop', label: '流行音乐 Pop' },
  { value: 'rock', label: '摇滚 Rock' },
  { value: 'electronic', label: '电子 Electronic' },
  { value: 'classical', label: '古典 Classical' },
  { value: 'jazz', label: '爵士 Jazz' },
  { value: 'folk', label: '民谣 Folk' },
  { value: 'hiphop', label: '嘻哈 Hip-Hop' },
  { value: 'rnb', label: 'R&B' },
  { value: 'country', label: '乡村 Country' },
  { value: 'blues', label: '蓝调 Blues' },
  { value: 'ambient', label: '氛围 Ambient' },
  { value: 'edm', label: '电子舞曲 EDM' },
  { value: 'metal', label: '金属 Metal' },
  { value: 'indie', label: '独立 Indie' },
  { value: 'soul', label: '灵魂 Soul' },
  { value: 'reggae', label: '雷鬼 Reggae' },
  { value: 'funk', label: '放克 Funk' },
  { value: 'latin', label: '拉丁 Latin' },
  { value: 'world', label: '世界音乐 World Music' },
  { value: 'newage', label: '新世纪 New Age' },
  { value: 'orchestral', label: '管弦乐 Orchestral' },
  { value: 'experimental', label: '实验 Experimental' },
  { value: 'acoustic', label: '原声 Acoustic' },
  { value: 'soundtrack', label: '电影配乐 Soundtrack' },
  { value: 'lofi', label: 'Lo-Fi' }
]

// 语言选项
const languageOptions = [
  { value: 'chinese', label: t('create.language.options.chinese') },
  { value: 'english', label: t('create.language.options.english') },
  { value: 'japanese', label: t('create.language.options.japanese') },
  { value: 'korean', label: t('create.language.options.korean') },
  { value: 'french', label: t('create.language.options.french') },
  { value: 'spanish', label: t('create.language.options.spanish') },
  { value: 'german', label: t('create.language.options.german') },
  { value: 'italian', label: t('create.language.options.italian') },
  { value: 'russian', label: t('create.language.options.russian') },
  { value: 'portuguese', label: t('create.language.options.portuguese') },
  { value: 'arabic', label: t('create.language.options.arabic') },
  { value: 'hindi', label: t('create.language.options.hindi') },
  { value: 'thai', label: t('create.language.options.thai') },
  { value: 'vietnamese', label: t('create.language.options.vietnamese') },
  { value: 'turkish', label: t('create.language.options.turkish') }
]

const languageMode = ref('single')
const relevanceLevels = [
  { value: 'high', label: '高度相关' },
  { value: 'medium', label: '中度相关' },
  { value: 'low', label: '自由发挥' }
]
const selectedRelevance = ref('medium')

// 时间彩蛋
const checkTimeEasterEgg = () => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  // 在午夜(00:00)或正午(12:00)触发
  if ((hours === 0 || hours === 12) && minutes === 0) {
    triggerTimeEasterEgg()
  }
}

const triggerTimeEasterEgg = () => {
  const container = document.querySelector('.create-container')
  if (!container) return
  
  // 添加星空背景
  container.classList.add('starry-background')
  
  // 创建流星
  for (let i = 0; i < 5; i++) {
    const meteor = document.createElement('div')
    meteor.className = 'meteor'
    meteor.style.left = `${Math.random() * 100}%`
    meteor.style.animationDelay = `${Math.random() * 2}s`
    container.appendChild(meteor)
    
    // 移除流星
    setTimeout(() => {
      meteor.remove()
    }, 2000)
  }
  
  // 30秒后移除效果
  setTimeout(() => {
    container.classList.remove('starry-background')
  }, 30000)
}
</script>

<template>
  <div class="create-page" @click="handleUserInteraction" @keydown="handleUserInteraction">
    <TheNavbar />
    
    <div class="main-content">
      <div class="container">
        <!-- 添加积分展示到页面顶部 -->
        <div class="page-header">
          <div class="header-left">
            <h1 class="gradient-text">{{ t('create.title') }}</h1>
            <p class="subtitle">{{ t('create.subtitle') }}</p>
          </div>
          <div class="header-right">
            <div class="points-info">
              <el-icon><Star /></el-icon>
              <span class="points-value">{{ userPoints }}</span>
              <span class="points-label">{{ t('create.points.label') }}</span>
              <el-button
                v-if="userPoints === 0"
                type="primary"
                size="small"
                class="buy-points-btn"
                @click="router.push('/pricing')"
              >
                {{ t('create.points.buy') }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 创作提示 -->
        <div class="creation-notice" v-if="currentStep === 1">
          <el-alert
            type="warning"
            :closable="false"
            show-icon
          >
            <template #title>
              {{ t('create.notice.title') }}
            </template>
            <template #default>
              <p v-for="(tip, index) in $tm('create.notice.tips')" :key="index">{{ tip }}</p>
            </template>
          </el-alert>
        </div>

        <div class="create-content">
          <!-- 步骤指示器 -->
          <el-steps :active="currentStep" finish-status="success" class="create-steps">
            <el-step :title="t('create.steps.upload')" />
            <el-step :title="t('create.steps.style')" />
            <el-step :title="t('create.steps.lyrics')" />
            <el-step :title="t('create.steps.music')" />
          </el-steps>

          <!-- 上传区域 -->
          <div v-if="currentStep === 1" class="upload-section">
            <el-upload
              ref="fileInputRef"
              class="hidden-upload"
              :auto-upload="false"
              :show-file-list="false"
              accept=".jpg,.jpeg,.png"
              @change="handleImageUpload"
            >
              <template #trigger>
                <div style="display: none;"></div>
              </template>
            </el-upload>
            
            <div 
              class="upload-area"
              :class="{ 'dragover': dragover, 'loading': loading }"
              @click="triggerUpload"
              @drop.prevent="handleDrop"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              v-if="!imageUrl"
            >
              <el-icon class="upload-icon" :class="{ 'loading': loading }">
                <Upload v-if="!loading" />
                <i v-else class="el-icon-loading"></i>
              </el-icon>
              <div class="upload-text">
                <h3>{{ t('create.upload.title') }}</h3>
                <p>{{ t('create.upload.description') }}</p>
              </div>
              
              <!-- 添加上传进度条 -->
              <div v-if="isUploading" class="upload-progress">
                <el-progress 
                  :percentage="uploadProgress"
                  :show-text="true"
                  :stroke-width="8"
                  status="success"
                />
              </div>
            </div>
            
            <div class="preview-area" v-else>
              <img :src="imageUrl" alt="预览图片" />
              <div class="preview-overlay">
                <el-button 
                  type="primary" 
                  @click="triggerUpload"
                  :loading="loading"
                >
                  {{ t('create.upload.reupload') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 设置区域 -->
          <div v-if="currentStep === 2" class="settings-section">
            <div class="settings-grid">
              <!-- 风格选择 -->
              <div class="settings-item style-selection">
                <h3 class="gradient-text">{{ t('create.style.title') }}</h3>
                <div class="style-grid">
                  <div
                    v-for="style in styles"
                    :key="style.value"
                    class="style-card"
                    :class="{ active: selectedStyle === style.value }"
                    @click="selectedStyle = style.value"
                  >
                    <div class="style-icon">
                      <component :is="style.icon" />
                    </div>
                    <div class="style-info">
                      <h4>{{ t(`create.style.${style.value}`) }}</h4>
                      <p>{{ t(`create.style.descriptions.${style.value}`) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 语言选择 -->
              <div class="settings-item language-selection">
                <h3 class="gradient-text">{{ t('create.language.title') }}</h3>
                <div class="language-mode">
                  <el-radio-group v-model="languageMode">
                    <el-radio value="single">{{ t('create.language.single') }}</el-radio>
                    <el-radio value="mixed">{{ t('create.language.mixed') }}</el-radio>
                  </el-radio-group>
                  <p class="mode-description">
                    {{ t(`create.language.${languageMode}Desc`) }}
                  </p>
                </div>
                <div class="language-options">
                  <div
                    v-for="lang in languages"
                    :key="lang.value"
                    class="language-option"
                    :class="{ active: selectedLanguages.includes(lang.value) }"
                    @click="toggleLanguage(lang.value)"
                  >
                    <span class="language-icon">{{ lang.icon }}</span>
                    <div class="language-info">
                      <span class="language-label">{{ lang.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 歌词相关度选择 -->
              <div class="settings-item relevance-selection">
                <h3 class="gradient-text">{{ t('create.lyrics.relevance.title') }}</h3>
                <div class="relevance-options">
                  <div
                    v-for="level in relevanceLevels"
                    :key="level.value"
                    class="relevance-option"
                    :class="{ active: selectedRelevance === level.value }"
                    @click="selectedRelevance = level.value"
                  >
                    <div class="relevance-info">
                      <span class="relevance-label">{{ t(`create.lyrics.relevance.${level.value}.label`) }}</span>
                      <span class="relevance-desc">{{ t(`create.lyrics.relevance.${level.value}.description`) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 标题输入 -->
              <div class="settings-item title-input">
                <h3 class="gradient-text">{{ t('create.title') }}</h3>
                <el-input
                  v-model="title"
                  maxlength="30"
                  show-word-limit
                  :placeholder="t('create.upload.placeholder')"
                  class="glass-input"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Edit /></el-icon>
                  </template>
                </el-input>
              </div>

              <!-- 歌词长度选择 -->
              <div class="settings-item length-selection">
                <h3 class="gradient-text">{{ t('create.length.title') }}</h3>
                <div class="length-options">
                  <div
                    v-for="option in lengthOptions"
                    :key="option.value"
                    class="length-option"
                    :class="{ active: selectedLength === option.value }"
                    @click="selectedLength = option.value"
                  >
                    <el-icon class="length-icon">
                      <component :is="option.icon" />
                    </el-icon>
                    <div class="length-info">
                      <span class="length-label">{{ t(`create.length.options.${option.value}.label`) }}</span>
                      <span class="length-desc">{{ t(`create.length.options.${option.value}.description`) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <el-button 
              type="primary"
              class="create-btn"
              :loading="loading"
              @click="generateLyrics"
            >
              {{ t('create.buttons.generate.lyrics') }}
            </el-button>
          </div>

          <!-- 歌词编辑区域 -->
          <div v-if="currentStep === 3" class="lyrics-section">
            <div class="lyrics-header">
              <h3>{{ t('create.lyrics.title') }}</h3>
              <div class="lyrics-actions">
                <el-button 
                  type="primary" 
                  plain
                  @click="optimizeLyrics"
                  :loading="loading"
                >
                  {{ t('create.lyrics.optimize') }}
                </el-button>
                <el-button 
                  type="primary"
                  @click="isEditingLyrics = !isEditingLyrics"
                >
                  {{ isEditingLyrics ? t('create.lyrics.finish') : t('create.lyrics.edit') }}
                </el-button>
              </div>
            </div>
            
            <div class="lyrics-content">
              <el-input
                v-if="isEditingLyrics"
                v-model="lyrics"
                type="textarea"
                :rows="15"
                :placeholder="t('create.lyrics.placeholder')"
                class="lyrics-editor glass-input"
              />
              <div v-else class="lyrics-preview">
                <pre>{{ lyrics }}</pre>
              </div>
            </div>
            
            <el-button 
              type="primary"
              class="create-btn"
              :loading="loading"
              @click="handleCreate"
            >
              {{ t('create.buttons.generate.music') }}
            </el-button>
          </div>

          <!-- 生成中状态 -->
          <div v-if="currentStep === 4" class="generating-section">
            <div class="generating-container">
              <div class="generating-content" :class="generationStatus">
                <!-- 生成中状态 -->
                <div v-if="generationStatus === 'PROCESSING'" class="generating-state">
                  <div class="loading-animation">
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                  </div>
                  <h3 class="generating-title">{{ t('create.generating.title') }}</h3>
                  <p class="generating-description">{{ t('create.generating.description') }}</p>
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div class="progress-inner" :style="{ width: `${currentWork?.progress || 0}%` }"></div>
                    </div>
                    <span class="progress-text">{{ currentWork?.progress || 0 }}%</span>
                  </div>
                </div>

                <!-- 生成成功状态 -->
                <div v-else-if="generationStatus === 'COMPLETED'" class="success-state">
                  <div class="success-icon">
                    <el-icon><Check /></el-icon>
                  </div>
                  <h3 class="status-title">{{ t('create.complete.title') }}</h3>
                  <p class="status-description">{{ t('create.complete.description') }}</p>
                  <el-button type="primary" class="result-btn" @click="viewResult">
                    {{ t('create.complete.viewResult') }}
                  </el-button>
                </div>

                <!-- 生成失败状态 -->
                <div v-else-if="generationStatus === 'FAILED'" class="failed-state">
                  <div class="failed-icon">
                    <el-icon><Warning /></el-icon>
                  </div>
                  <h3 class="status-title">{{ t('create.failed.title') }}</h3>
                  <p class="status-description">{{ t('create.failed.description') }}</p>
                  <div v-if="currentWork?.error" class="error-message">
                    {{ currentWork.error }}
                  </div>
                  <el-button type="primary" class="retry-btn" @click="retryGeneration">
                    {{ t('create.failed.retry') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.create-page {
  min-height: 100vh;
  background: var(--background-color);
  background-image: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1), rgba(var(--accent-color-rgb), 0.1));
}

.main-content {
  padding-top: 80px; // 增加顶部间距，避免与导航栏重叠
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.create-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  
  .create-steps {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--glass-background);
    backdrop-filter: var(--glass-backdrop-filter);
    border: var(--glass-border);
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
    
    :deep(.el-step__title) {
      font-size: 1rem;
      font-weight: 500;
      
      &.is-success {
        color: var(--primary-color);
      }
      
      &.is-process {
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 600;
      }
    }
    
    :deep(.el-step__line) {
      background-color: var(--border-color);
    }
    
    :deep(.el-step__head.is-success) {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    
    :deep(.el-step__head.is-process) {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
}

.upload-section {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
}

.upload-area {
  position: relative;
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.dragover {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, 0.1);
    
    .upload-icon {
      color: var(--primary-color);
      transform: scale(1.1);
    }
  }
  
  &:hover {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, 0.1);
    
    .upload-icon {
      color: var(--primary-color);
      transform: scale(1.1);
    }
  }

  &.loading {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.upload-icon {
  font-size: 48px;
  color: var(--text-color-light);
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &.loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.upload-text {
  h3 {
    font-size: 1.25rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }
  
  p {
    font-size: 0.875rem;
    color: var(--text-color-light);
  }
}

.preview-area {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover .preview-overlay {
    opacity: 1;
  }
}

.settings-section {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
}

.settings-grid {
  display: grid;
  gap: 2rem;
}

.style-selection {
  margin-bottom: 2rem;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.style-card {
  background: var(--glass-background);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  
  .style-icon {
    font-size: 2rem;
    color: var(--primary-color);
    transition: transform 0.3s ease;
  }
  
  .style-info {
    flex: 1;
    min-width: 0;
    
    h4 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    p {
      font-size: 0.875rem;
      color: var(--text-color-light);
      margin: 0;
      line-height: 1.5;
    }
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.1);
    
    .style-icon {
      transform: scale(1.1);
    }
  }
  
  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-10);
    background: linear-gradient(135deg, 
      var(--glass-background), 
      rgba(var(--primary-color-rgb), 0.1)
    );
    
    .style-icon {
      color: var(--accent-color);
    }
  }
}

@media (max-width: 768px) {
  .style-grid {
    grid-template-columns: 1fr;
  }
  
  .style-card {
    padding: 1.25rem;
  }
}

.language-selection {
  margin-bottom: 2rem;
}

.language-mode {
  margin-bottom: 1rem;
}

.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.language-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--glass-background);
  border: var(--glass-border);
  cursor: pointer;
  transition: all 0.3s ease;
  width: calc(50% - 0.5rem);
  
  .language-icon {
    font-size: 2rem;
    transition: transform 0.3s ease;
  }
  
  .language-info {
    flex: 1;
    min-width: 0;
    
    .language-label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .language-desc {
      font-size: 0.875rem;
      color: var(--text-color-light);
      margin-bottom: 0.5rem;
    }
    
    .language-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
      .tag {
        background: rgba(var(--primary-color-rgb), 0.1);
        border: none;
        color: var(--text-color);
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        display: inline-flex;
        align-items: center;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(var(--primary-color-rgb), 0.2);
          transform: translateY(-1px);
        }
      }
    }
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.1);
    
    .language-icon {
      transform: scale(1.1);
    }
  }
  
  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.15);
    background: linear-gradient(135deg, 
      rgba(var(--primary-color-rgb), 0.1),
      rgba(var(--accent-color-rgb), 0.1)
    );
    
    .language-icon {
      color: var(--accent-color);
    }
  }
}

@media (max-width: 768px) {
  .language-option {
    width: 100%;
  }
}

.mix-mode-options {
  margin: 1rem 0;
  
  .mode-description {
    margin-top: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .language-options {
    justify-content: center;
  }
  
  .language-option {
    width: calc(50% - 0.5rem);
  }
}

.length-selection {
  margin-bottom: 2rem;
}

.length-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.length-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--glass-background);
  border: var(--glass-border);
  cursor: pointer;
  transition: all 0.3s ease;
  
  .length-icon {
    font-size: 1.5rem;
    color: var(--primary-color);
    transition: transform 0.3s ease;
  }
  
  .length-info {
    flex: 1;
    min-width: 0;
    
    .length-label {
      font-weight: 600;
      color: var(--text-color);
    }
    
    .length-desc {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  }
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.1);
    
    .length-icon {
      transform: scale(1.1);
    }
  }
  
  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.15);
    background: linear-gradient(135deg, 
      rgba(var(--primary-color-rgb), 0.1),
      rgba(var(--accent-color-rgb), 0.1)
    );
    
    .length-icon {
      color: var(--accent-color);
    }
  }
}

@media (max-width: 768px) {
  .length-options {
    grid-template-columns: 1fr;
  }
  
  .length-option {
    padding: 0.75rem;
  }
}

.points-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--glass-background);
  border-radius: 2rem;
  position: fixed;
  top: 85px;
  right: 2rem;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .points-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .el-icon {
      color: var(--primary-color);
      font-size: 1.25rem;
    }
    
    .points-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-color);
      min-width: 3ch;
      text-align: right;
    }
    
    .points-label {
      font-size: 0.875rem;
      color: var(--text-color-light);
    }
  }

  .warning-icon {
    color: var(--warning-color);
    font-size: 1.25rem;
    cursor: help;
  }

  .buy-points-btn {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    border: none;
    padding: 0.5rem 1rem;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
    }
  }
}

// 移除旧的样式
.points-warning {
  display: none;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 0;

  .header-left {
    h1.gradient-text {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-color-light);
      font-size: 1rem;
    }
  }

  .header-right {
    .points-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--glass-background);
      border-radius: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      .el-icon {
        color: var(--primary-color);
        font-size: 1.25rem;
      }
      
      .points-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-color);
        min-width: 3ch;
        text-align: right;
      }
      
      .points-label {
        font-size: 0.875rem;
        color: var(--text-color-light);
      }

      .buy-points-btn {
        margin-left: 0.5rem;
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        border: none;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
        }
      }
    }
  }
}

.creation-notice {
  margin-bottom: 2rem;

  :deep(.el-alert) {
    background: var(--glass-background);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .el-alert__title {
      font-size: 1rem;
      font-weight: 600;
    }
    
    p {
      margin: 0.25rem 0;
      color: var(--text-color);
    }
  }
}

// 移除旧的积分显示样式
.points-display {
  display: none;
}

.mode-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
}

.relevance-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.relevance-option {
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--glass-background);
  border: var(--glass-border);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
  }
  
  &.active {
    border-color: var(--primary-color);
    background: rgba(var(--primary-color-rgb), 0.1);
  }
}

.relevance-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.relevance-label {
  font-weight: 600;
  color: var(--text-color);
}

.relevance-desc {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.starry-background {
  position: relative;
  background: linear-gradient(to bottom, #0a0a2a, #1a1a3a);
  overflow: hidden;
}

.starry-background::before {
  content: '';
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  box-shadow: 0 0 50px 1px white;
  animation: twinkle 1s infinite;
}

.meteor {
  position: absolute;
  top: 0;
  width: 2px;
  height: 50px;
  background: linear-gradient(to bottom, transparent, white);
  animation: meteor 2s linear;
  transform: rotate(45deg);
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes meteor {
  0% {
    transform: translateY(-100%) rotate(45deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(45deg);
    opacity: 0;
  }
}

.lyrics-section {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-md);

  .lyrics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
      margin: 0;
      font-size: 1.5rem;
    }

    .lyrics-actions {
      display: flex;
      gap: 1rem;
    }
  }

  .lyrics-content {
    margin-bottom: 2rem;
    
    .lyrics-editor {
      width: 100%;
      
      :deep(.el-textarea__inner) {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-color);
        font-size: 1rem;
        line-height: 1.6;
        padding: 1rem;
        
        &:focus {
          border-color: var(--primary-color);
        }
      }
    }
    
    .lyrics-preview {
      background: rgba(var(--background-color-rgb), 0.5);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      padding: 1.5rem;
      min-height: 300px;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 1rem;
      line-height: 1.6;
      color: var(--text-color);
      max-width: 100%;
      overflow-x: auto;

      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
        margin: 0;
      }
    }
  }
}

.generating-section {
  width: 100%;
  padding: 2rem;
  
  .generating-container {
    max-width: 600px;
    margin: 0 auto;
    background: var(--surface-primary);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
  }
  
  .generating-content {
    text-align: center;
    
    &.PROCESSING {
      animation: pulse 2s infinite;
    }
    
    &.COMPLETED {
      animation: fadeIn 0.5s ease-out;
    }
    
    &.FAILED {
      animation: shake 0.5s ease-in-out;
    }
  }
}

.generating-state {
  .loading-animation {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
    height: 60px;
    
    .wave {
      width: 8px;
      height: 40px;
      background: var(--primary-color);
      border-radius: 4px;
      animation: wave 1s ease-in-out infinite;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

.generating-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.generating-description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.progress-container {
  width: 100%;
  margin-top: 2rem;
  
  .progress-bar {
    width: 100%;
    height: 6px;
    background: var(--surface-secondary);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
    
    .progress-inner {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }
  
  .progress-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

.success-state, .failed-state {
  padding: 2rem;
  
  .success-icon, .failed-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  
  .success-icon {
    background: var(--success-color-light);
    color: var(--success-color);
    animation: zoomIn 0.5s ease-out;
  }
  
  .failed-icon {
    background: var(--danger-color-light);
    color: var(--danger-color);
    animation: zoomIn 0.5s ease-out;
  }
}

.status-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.error-message {
  padding: 1rem;
  background: var(--danger-color-light);
  border-radius: 0.5rem;
  color: var(--danger-color);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.result-btn, .retry-btn {
  min-width: 160px;
  height: 44px;
  font-size: 1rem;
}

@keyframes wave {
  0%, 100% {
    height: 20px;
  }
  50% {
    height: 40px;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .generating-section {
    padding: 1rem;
    
    .generating-container {
      padding: 1.5rem;
    }
  }
  
  .generating-title {
    font-size: 1.25rem;
  }
  
  .status-title {
    font-size: 1.25rem;
  }
  
  .loading-animation {
    height: 50px;
    
    .wave {
      width: 6px;
      height: 30px;
    }
  }
}
</style>