<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Upload, Edit } from '@element-plus/icons-vue'
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

// 添加积分扣除状态
const pointsDeducted = ref(false)

const styles = [
  {
    value: 'pop',
    label: '流行 Pop',
    description: '现代流行音乐风格，富有感染力的旋律和节奏',
    tags: 'pop, modern, melodic, catchy',
    icon: 'Headset'
  },
  {
    value: 'rock',
    label: '摇滚 Rock',
    description: '充满能量的摇滚风格，强劲的吉他和鼓点',
    tags: 'rock, electric guitar, drums, energetic',
    icon: 'Lightning'
  },
  {
    value: 'electronic',
    label: '电子 Electronic',
    description: '现代电子音乐，包含合成器和电子节拍',
    tags: 'electronic, synth, edm, dance',
    icon: 'Monitor'
  },
  {
    value: 'jazz',
    label: '爵士 Jazz',
    description: '优雅的爵士风格，即兴演奏和复杂和声',
    tags: 'jazz, smooth, improvisation, sophisticated',
    icon: 'Mic'
  },
  {
    value: 'classical',
    label: '古典 Classical',
    description: '优美的古典音乐风格，优雅的管弦乐编排',
    tags: 'classical, orchestral, elegant, instrumental',
    icon: 'Music'
  },
  {
    value: 'folk',
    label: '民谣 Folk',
    description: '温暖的民谣风格，真挚的歌词和原声乐器',
    tags: 'folk, acoustic, storytelling, warm',
    icon: 'Guitar'
  },
  {
    value: 'rnb',
    label: 'R&B',
    description: '富有灵魂的节奏布鲁斯，感性的声线和律动',
    tags: 'rnb, soul, groove, emotional',
    icon: 'Microphone'
  },
  {
    value: 'hiphop',
    label: '嘻哈 Hip-Hop',
    description: '节奏感强的嘻哈风格，富有韵律的说唱',
    tags: 'hiphop, rap, beats, rhythmic',
    icon: 'Mic'
  },
  {
    value: 'ambient',
    label: '氛围 Ambient',
    description: '空灵的氛围音乐，营造沉浸式体验',
    tags: 'ambient, atmospheric, peaceful, ethereal',
    icon: 'Cloudy'
  },
  {
    value: 'edm',
    label: '电子舞曲 EDM',
    description: '充满活力的电子舞曲，强劲的节奏和drop',
    tags: 'edm, dance, energetic, party',
    icon: 'Lightning'
  },
  {
    value: 'metal',
    label: '金属 Metal',
    description: '重型金属音乐，强劲的失真吉他和双踩',
    tags: 'metal, heavy, distortion, intense',
    icon: 'Lightning'
  },
  {
    value: 'indie',
    label: '独立 Indie',
    description: '独立音乐风格，独特的创作理念和表达',
    tags: 'indie, alternative, unique, creative',
    icon: 'Star'
  },
  {
    value: 'soul',
    label: '灵魂 Soul',
    description: '充满感染力的灵魂乐，深情的演绎',
    tags: 'soul, emotional, powerful, expressive',
    icon: 'Mic'
  },
  {
    value: 'blues',
    label: '蓝调 Blues',
    description: '传统蓝调音乐，深沉的情感表达',
    tags: 'blues, emotional, traditional, soulful',
    icon: 'Guitar'
  },
  {
    value: 'funk',
    label: '放克 Funk',
    description: '富有节奏感的放克音乐，强调bass和律动',
    tags: 'funk, groovy, rhythmic, bass',
    icon: 'Headset'
  }
]

const languages = [
  {
    value: 'zh',
    icon: '🇨🇳',
    description: '中文（普通话）'
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
    label: '简短',
    description: '1-2节，适合简单表达',
    icon: 'Crop'
  },
  {
    value: 'medium',
    label: '中等',
    description: '2-3节，标准流行歌曲长度',
    icon: 'Document'
  },
  {
    value: 'long',
    label: '较长',
    description: '3-4节，适合复杂故事',
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
    ElMessage.warning('请上传 jpg 或 png 格式的图片')
    return
  }
  
  // 检查文件大小（5MB）
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }

  // 检查积分是否足够
  if (!await hasEnoughPoints(POINTS_CONFIG.CREATE_MUSIC)) {
    ElMessage({
      type: 'warning',
      message: `创建音乐需要 ${POINTS_CONFIG.CREATE_MUSIC} 积分，当前积分不足`,
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
      ElMessage.success(`已扣除 ${POINTS_CONFIG.CREATE_MUSIC} 积分`)
    }

    // 上传图片到 LeanCloud
    const data = { base64: '' }
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      data.base64 = e.target.result
      
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
    
    // 使用 Suno 生成音乐
    currentTaskId.value = await generateMusic(visionResult)
    
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
    
    if (result.status === 'SUCCESS') {
      musicUrl.value = result.data[0].audio_url
    } else if (result.status === 'FAILED') {
      throw new Error('Music generation failed')
    } else {
      // 继续轮询
      setTimeout(() => pollMusicTask(), 5000)
    }
  } catch (error) {
    console.error('Task polling error:', error)
    errorMessage.value = error.message
  }
}

const initAudioContext = () => {
  try {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
    return true
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error)
    ElMessage.error(t('errors.audioInit'))
    return false
  }
}

const handleUserInteraction = () => {
  if (!isAudioInitialized.value) {
    isAudioInitialized.value = initAudioContext()
  }
}

const handlePlay = async () => {
  if (!isAudioInitialized.value) {
    isAudioInitialized.value = initAudioContext()
  }
  if (!isAudioInitialized.value) return
  
  // 其他播放逻辑...
}

// 修改检查任务状态的函数
const checkTaskStatus = async (taskId, workId) => {
  try {
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
    
    // 获取作品记录
    const work = AV.Object.createWithoutData('Work', workId)
    
    // 根据任务状态更新作品状态
    if (data.code === 'success' && data.data) {
      if (data.data.status === 'SUCCESS') {
        // 更新作品状态为已完成
        work.set('status', 'completed')
        if (data.data.data && data.data.data.length > 0) {
          const musicData = data.data.data[0]
          work.set('audioUrl', musicData.audio_url)
          work.set('videoUrl', musicData.video_url || '')
          work.set('modelName', musicData.model_name)
          work.set('metadata', musicData.metadata)
        }
        work.set('progress', 100)
        work.set('completedTime', new Date())
        work.set('finishTime', data.data.finish_time)
        
        // 清除定时器
        if (checkInterval.value) {
          clearInterval(checkInterval.value)
          checkInterval.value = null
        }
        
        ElMessage.success('音乐生成成功！')
      } else if (data.data.status === 'FAILED') {
        // 更新作品状态为失败
        work.set('status', 'failed')
        work.set('error', data.data.fail_reason || '音乐生成失败')
        work.set('progress', 0)
        
        // 清除定时器
        if (checkInterval.value) {
          clearInterval(checkInterval.value)
          checkInterval.value = null
        }
        
        // 如果是生成失败且积分已扣除,退还积分
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
        
        ElMessage.error('音乐生成失败：' + (data.data.fail_reason || '未知错误'))
      } else if (data.data.status === 'IN_PROGRESS') {
        // 更新进度
        const progress = parseInt(data.data.progress) || 0
        work.set('progress', progress)
        work.set('lastCheckTime', new Date())
        work.set('startTime', data.data.start_time)
      }
    } else {
      throw new Error(data.message || '检查任务状态失败')
    }
    
    // 保存更新
    await work.save()
    
  } catch (error) {
    console.error('Check task status failed:', error)
    // 增加重试次数
    const work = AV.Object.createWithoutData('Work', workId)
    const retryCount = work.get('retryCount') || 0
    work.set('retryCount', retryCount + 1)
    
    // 如果重试次数超过限制，标记为失败并退还积分
    if (retryCount >= 5) {
      work.set('status', 'failed')
      work.set('error', '检查任务状态失败次数过多')
      
      // 清除定时器
      if (checkInterval.value) {
        clearInterval(checkInterval.value)
        checkInterval.value = null
      }
      
      // 退还积分
      if (pointsDeducted.value) {
        try {
          await updateUserPoints(POINTS_CONFIG.CREATE_MUSIC, '任务失败退还')
          userPoints.value = await getUserPoints()
          pointsDeducted.value = false
          ElMessage.info('已退还积分')
        } catch (refundError) {
          console.error('Points refund failed:', refundError)
          ElMessage.error('积分退还失败,请联系客服')
        }
      }
      
      ElMessage.error('音乐生成失败：检查任务状态失败次数过多')
    }
    
    await work.save()
  }
}

// 修改生成歌词的函数
const generateLyrics = async () => {
  if (!imageUrl.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  if (!selectedStyle.value) {
    ElMessage.warning('请选择音乐风格')
    return
  }

  if (!selectedLanguages.value.length) {
    ElMessage.warning('请至少选择一种语言')
    return
  }

  try {
    loading.value = true
    currentStep.value = 3

    // 构建提示词
    const prompt = {
      role: "user",
      content: [
        {
          type: "text",
          text: `请根据这张图片创作一首歌词。要求：
1. 歌词语言：${selectedLanguages.value.join('、')}
2. 音乐风格：${selectedStyle.value}
3. 歌词要求：
   - 要有完整的主题和情感表达
   - 要有押韵和音乐性
   - 要有清晰的结构（如：主歌、副歌）
   - 要与图片的内容和氛围相匹配
请直接返回歌词内容，不要包含任何其他说明文字。`
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
        model: "gpt-4-vision-preview",
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
    ElMessage.success('歌词生成成功')
    
  } catch (error) {
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
        model: "gpt-4",
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
  if (!imageUrl.value || !selectedStyle.value || !title.value || !lyrics.value) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    loading.value = true
    currentStep.value = 4
    
    const selectedStyleObj = styles.find(s => s.value === selectedStyle.value)
    
    // 构建请求体
    const requestBody = {
      title: title.value,
      tags: selectedStyleObj.tags,
      generation_type: 'TEXT',
      prompt: lyrics.value,
      negative_tags: '',
      mv: 'chirp-v4'
    }
    
    console.log('Suno API Request:', {
      url: import.meta.env.VITE_SUNO_API_URL,
      body: requestBody
    })
    
    const sunoResponse = await fetch(import.meta.env.VITE_SUNO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUNO_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    let errorText
    if (!sunoResponse.ok) {
      try {
        errorText = await sunoResponse.text()
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error?.message || '音乐生成失败')
      } catch (parseError) {
        console.error('Suno API error response:', {
          status: sunoResponse.status,
          statusText: sunoResponse.statusText,
          headers: Object.fromEntries(sunoResponse.headers.entries()),
          body: errorText,
          url: import.meta.env.VITE_SUNO_API_URL
        })
        throw new Error(`音乐生成失败 (${sunoResponse.status})`)
      }
    }

    const sunoData = await sunoResponse.json()
    console.log('Suno API response:', sunoData)
    
    if (!sunoData.data) {
      throw new Error('音乐生成失败：服务器返回数据格式错误')
    }
    
    // 创建新的作品记录
    const work = new WorkClass()
    work.set('status', 'generating')
    work.set('taskId', sunoData.data)
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
    
    // 设置 ACL
    const acl = new AV.ACL()
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(false)
    acl.setWriteAccess(AV.User.current(), true)
    work.setACL(acl)
    
    const savedWork = await work.save()
    
    // 开始定时检查任务状态
    checkInterval.value = setInterval(() => {
      checkTaskStatus(sunoData.data, savedWork.id)
    }, 10000)
    
    ElMessage.success({
      message: '已提交生成请求，正在跳转到个人作品页面查看进度...',
      duration: 2000
    })
    
    setTimeout(() => {
      router.push({
        path: '/profile',
        query: { 
          taskId: sunoData.data,
          highlight: 'true'
        }
      })
    }, 2000)
    
  } catch (error) {
    console.error('Creation failed:', error)
    
    let errorMessage = '创作失败，请重试'
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = '网络请求失败，请检查网络连接'
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
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
  
  return () => {
    document.removeEventListener('click', handleUserInteraction)
    document.removeEventListener('keydown', handleUserInteraction)
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
  { value: 'soul', label: '灵魂 Soul' }
]

// 语言选项
const languageOptions = [
  { value: 'chinese', label: '中文' },
  { value: 'english', label: '英语' },
  { value: 'japanese', label: '日语' },
  { value: 'korean', label: '韩语' },
  { value: 'french', label: '法语' },
  { value: 'spanish', label: '西班牙语' },
  { value: 'german', label: '德语' },
  { value: 'italian', label: '意大利语' },
  { value: 'russian', label: '俄语' },
  { value: 'instrumental', label: '纯音乐' }
]

// 表单数据
const form = ref({
  title: '',
  description: '',
  style: '',
  languages: [],
  relevance: 'medium'
})

// 在 styles 数组后添加
const relevanceOptions = [
  {
    value: 'high',
    label: '高度相关',
    description: '歌词将紧密围绕图片内容，直接描述或诠释图片中的场景、情感和故事',
    icon: 'Connection'
  },
  {
    value: 'medium',
    label: '中度相关',
    description: '歌词将部分基于图片内容，同时加入更多创意和想象',
    icon: 'Link'
  },
  {
    value: 'low',
    label: '自由发挥',
    description: '歌词将以图片为灵感，但更注重创意表达和艺术发挥',
    icon: 'Magic'
  }
]

const languageMode = ref('single')
const relevanceLevels = [
  { value: 'high', label: '高度相关' },
  { value: 'medium', label: '中度相关' },
  { value: 'low', label: '自由发挥' }
]
const selectedRelevance = ref('medium')
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
                    <el-icon class="style-icon">
                      <component :is="style.icon" />
                    </el-icon>
                    <div class="style-info">
                      <h4>{{ t(`create.style.${style.value}`) }}</h4>
                      <p>{{ style.description }}</p>
                      <div class="style-tags">
                        <el-tag 
                          v-for="tag in style.tags.split(', ')" 
                          :key="tag"
                          size="small"
                          class="tag"
                        >
                          {{ tag }}
                        </el-tag>
                      </div>
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
                  maxlength="10"
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
                      <span class="length-label">{{ t(`create.length.${option.value}.label`) }}</span>
                      <span class="length-desc">{{ t(`create.length.${option.value}.description`) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <el-button 
              type="primary"
              class="create-btn"
              :loading="loading"
              :disabled="!selectedStyle || !title || selectedLanguages.length === 0"
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
                class="lyrics-editor"
              />
              <div v-else class="lyrics-preview">
                {{ lyrics }}
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
            <div class="generating-content">
              <el-icon class="generating-icon"><Loading /></el-icon>
              <h3>{{ t('create.generating.title') }}</h3>
              <p>{{ t('create.generating.description') }}</p>
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
  }
  
  .style-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
    
    .tag {
      background: rgba(var(--primary-color-rgb), 0.1);
      border: none;
      color: var(--text-color);
      font-size: 0.75rem;
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
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.15);
    background: linear-gradient(135deg, 
      rgba(var(--primary-color-rgb), 0.1),
      rgba(var(--accent-color-rgb), 0.1)
    );
    
    .style-icon {
      color: var(--accent-color);
    }
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
  border: 1px solid var(--border-color);
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
      display: block;
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
  }
}

.title-input {
  margin-top: 1rem;
  
  :deep(.el-input__wrapper) {
    padding-left: 1rem;
    background: var(--glass-background);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color-10);
    }
    
    &.is-focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px var(--primary-color-10);
    }
  }
  
  :deep(.el-input__prefix) {
    color: var(--text-color-secondary);
  }
  
  :deep(.el-input__count) {
    background: transparent;
    color: var(--text-color-light);
    font-size: 0.75rem;
  }
  
  label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-color-light);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
}

@media (max-width: 640px) {
  .style-grid {
    grid-template-columns: 1fr;
  }
  
  .language-options {
    justify-content: center;
  }
  
  .language-option {
    flex: 0 0 calc(50% - 0.5rem);
    justify-content: center;
  }
}

.settings-item {
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-color-light);
    margin-bottom: 0.5rem;
  }
}

.glass-input {
  width: 100%;
  
  :deep(.el-input__wrapper) {
    background: var(--glass-background);
    border: var(--glass-border);
    box-shadow: none;
    
    &:hover, &.is-focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
  }
  
  :deep(.el-input__prefix) {
    color: var(--text-color-secondary);
  }
}

.create-btn {
  width: 100%;
  height: 48px;
  font-size: 1.125rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border: none;
  border-radius: 0.75rem;
  margin-top: 2rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  span {
    position: relative;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .create-content {
    gap: 1.5rem;
  }
  
  .style-card {
    padding: 1.25rem;
    
    h4 {
      font-size: 1rem;
    }
  }
  
  .language-option {
    padding: 0.5rem 1rem;
    
    .language-icon {
      font-size: 1.25rem;
    }
    
    .language-label {
      font-size: 0.8125rem;
    }
  }
}

.hidden-upload {
  display: none;
}

.generating-section {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.generating-content {
  .generating-icon {
    font-size: 48px;
    color: var(--primary-color);
    animation: rotate 2s linear infinite;
  }
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1rem 0;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
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

.upload-progress {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: var(--glass-background);
  padding: 10px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  
  :deep(.el-progress-bar__outer) {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  :deep(.el-progress-bar__inner) {
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  }
  
  :deep(.el-progress__text) {
    color: var(--text-color);
  }
}

.lyrics-section {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop-filter);
  border: var(--glass-border);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
}

.lyrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
  }
}

.lyrics-actions {
  display: flex;
  gap: 1rem;
}

.lyrics-content {
  margin-bottom: 2rem;
}

.lyrics-editor {
  :deep(.el-textarea__inner) {
    background: var(--glass-background);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    font-family: monospace;
    line-height: 1.6;
    
    &:focus {
      border-color: var(--primary-color);
    }
  }
}

.lyrics-preview {
  background: var(--glass-background);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 300px;
  white-space: pre-wrap;
  color: var(--text-color);
  font-family: monospace;
  line-height: 1.6;
}

.language-section {
  margin: 2rem 0;
}

.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
}

.language-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--glass-background);
  border: 1px solid var(--border-color);
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
      display: block;
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
    color: var(--text-color-light);
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
  border: 1px solid var(--border-color);
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
      display: block;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .length-desc {
      display: block;
      font-size: 0.75rem;
      color: var(--text-color-light);
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
    border: 1px solid rgba(var(--warning-color-rgb), 0.2);
    
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
</style> 